(function ($, Handlebars, TweenMax) {

	var shopData = {};	// will contain the shop items' data.
	var cartData = {};	// will contain the cart items' data.
	var totalCartItems = 0;
	var totalPriceNum = 0;
	
	// ------- Handlebars Templates & Helpers ------- //

	var shopTemplateHTML = $('#shop-template').html();
	var shopTemplate = Handlebars.compile(shopTemplateHTML);

	var cartTemplateHTML = $('#cart-template').html();
	var cartTemplate = Handlebars.compile(cartTemplateHTML);

	var detailsTemplateHTML = $('#item-details-template').html();
	var detailsTemplate = Handlebars.compile(detailsTemplateHTML);

	// ------- jQuery Elements ------- //

	var $totalPriceElem = $('#total-price');
	var $shop = $('#shop');
	var $shopList = $('#shop-list');
	var $cart = $('#cart');
	var $cartList = $('#cart-list');
	var $overlay = $('#modal-overlay');
	var $cartNumElm = $('#cart-num');
	var $cartIcon = $('#cart-icon');
	var $loadingModal = $('#loading-modal');
	var $loader = $('#loader');
	var $detailsModal = $('#item-details-modal');


	// Retrieve cart element's from local storage (if any) and update the cart listing.
	if (localStorage.getItem('cartData')) {

		cartData = JSON.parse(localStorage.getItem('cartData'));
		updateCartList();

	}
	else {
		cartData = {
			items: []
		}
	}

	// Read the shop listing item's data and produce the HTML
	$.getJSON("shopdata.json", function(data) {

		shopData = data;
		let shopHTML = shopTemplate(shopData);
		$shopList.html(shopHTML);

		// Just for the thrills.
		setInterval(function() {
			$loader.addClass('success');
			$shop.removeClass('hidden');
			let loaderAnimation = new TimelineMax();
			loaderAnimation
			.to($loader, .5, { 
				border: '0px', 
				backgroundColor: 'black', 
				animation: 'none', 
				rotate: 0})
			.to($loader, .8, {
				height: '0px', 
				width: '0px', 
				display: 'none', 
				top: '50%', 
				left: '50%', 
				ease: Back.easeIn.config(5) })
			.to($loadingModal, .3, {
				opacity: 0, 
				display: 'none',
			})
			.to($shop, .3, {display: 'block', autoAlpha: 1});
		}, 1000);
		
		// ------- Event Handlers ------- //

		// Open/Close Cart view.
		$('body').on('click', '.cart-toggle', toggleCart);

		$shopList.on('click', '.shop-item__add-btn', function(e) {

			if (!TweenMax.isTweening($cartIcon)) {
				TweenMax.from($cartIcon, .7, {scale: 1.5, ease: Bounce.easeOut });
			}

			var shopItem = $(e.target).closest('.shop-item');
			var shopItemId = shopItem.attr('id');
			var idNum = parseInt(shopItemId.replace(/[^0-9]/gi, ''));


			// Check if item exists in cart. If not, create it.
			// Else just increase item's qty.
			// Finally, update cart list.

			var itemInCart = false;

			for (let item of cartData.items) {
				if (item.id == idNum) {
					item.qty++;
					itemInCart = true;
					break;
				}
			}

			if(!itemInCart) {

				for (let item of shopData.items) {
					if (item.id == idNum) {
						item.qty = 1;
						cartData.items.unshift(item);
						break;
					}
				}	
			}

			updateCartList();
			localStorage.setItem('cartData', JSON.stringify(cartData));
		});

		$shopList.on('click', '.shop-item__details', function(e) {

			let detailsAnimation = new TimelineMax();

			$('body').addClass('no-scroll');

			detailsAnimation
			.to($overlay, .5, { 
				display: 'block',
				autoAlpha: .8 })
			.to($detailsModal, .5, {
				display: 'block',
				y: '-=75px',
				autoAlpha: 1
			});

		});

		$cart.on('click', '.cart-item__less', function(e) {	

			var itemElm = $(e.target).closest('.cart-item');
			var itemId = itemElm.attr('id');
			var idNum = parseInt(itemId.replace(/[^0-9]/gi, ''));

			for (let item of cartData.items) {
				if (item.id == idNum) {
					if (item.qty > 1) {
						item.qty--;

						updateCartList();

						localStorage.setItem('cartData', JSON.stringify(cartData));
					}
					else if (confirm('Do you want to remove ' + item.title + ' from the cart?')) {
						let index = cartData.items.indexOf(item);
						cartData.items.splice(index, 1);

						updateCartList();

						localStorage.setItem('cartData', JSON.stringify(cartData));
					}

					break;
				}
			}
		});

		$cart.on('click', '.cart-item__plus', function(e) {
			var idNum = getItemIdNum($(e.target).closest('.cart-item'));

			for (let item of cartData.items) {
				if (item.id == idNum) {
					item.qty++;
					updateCartList();
					localStorage.setItem('cartData', JSON.stringify(cartData));
					break;
				}
			}
		});

		$cart.on('click', '.cart-item__remove', function(e) {
		
			var idNum = getItemIdNum($(e.target).closest('.cart-item'));

			for (let item of cartData.items) {
				if (item.id == idNum) {
					if (confirm('Do you want to remove ' + item.title + ' from the cart?')) {
						let index = cartData.items.indexOf(item);
						cartData.items.splice(index, 1);

						updateCartList();
						localStorage.setItem('cartData', JSON.stringify(cartData));
					}
					break;
				}
			}
		});

	});


	// ---------  Functions --------- //

	function toggleCart(e) {

		let cartDuration = .7;
		let overlayDuration = .5;

		if ($cart.hasClass('visible')) {
			if (!TweenMax.isTweening($cart)) {
				TweenMax.to($cart, cartDuration, {right: '-650px', ease: Back.easeIn.config(1.2)});
				$cart.removeClass('visible');
				$overlay.removeClass('cart-toggle');

				TweenMax.to($overlay, overlayDuration, {display: 'none', opacity: 0});
				$('body').removeClass('no-scroll');
			}
			
		}
		else {
			if (!TweenMax.isTweening($cart)) {
				TweenMax.to($cart, cartDuration, {right: '-50px', ease: Back.easeOut.config(1.2)});
				$cart.addClass('visible');
				$overlay.addClass('cart-toggle');

				TweenMax.to($overlay, overlayDuration, {display: 'block', opacity: .8, autoAlpha: 1});
				$('body').addClass('no-scroll');
			}
		}
	}

	// Update cart 
	function updateCartList() {

		// Calculate total price and total number of items in cart
		totalPriceNum = 0;
		totalCartItems = 0;

		for (var i = 0, len = cartData.items.length; i < len; i++) {
			var cartItem = cartData.items[i];
			totalPriceNum += cartItem.price * cartItem.qty;
			totalCartItems += cartItem.qty;	
		}

		$cartNumElm.text(totalCartItems);
		$totalPriceElem.text(totalPriceNum.toFixed(2));

		var cartHTML = cartTemplate(cartData);
		$cartList.html(cartHTML);
	}

	function getItemIdNum(element) {
		var itemId = element.attr('id');
		var idNum = parseInt(itemId.replace(/[^0-9]/gi, ''));

		return idNum;
	}

	
})(jQuery, Handlebars, TweenMax);