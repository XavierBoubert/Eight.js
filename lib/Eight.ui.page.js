/*
 * This file is part of the Eight.js library.
 *
 * (c) 2012 Xavier Boubert
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
(function(window) {
	'use strict';

	var $8 = window.$8,
		_isEmpty = $8.Utilities.isEmpty,
		_isArray = $8.Utilities.isArray,
		_inArray = $8.Utilities.inArray,
		document = window.document;

	$8.Templates.define([[
		'h8_page_container',
		'<div id="{{ id }}_title" class="h8-title">' +
			'{{ backButton }}' +
			'<h1 id="{{ id }}_title_h1"></h1>' +
		'</div>' +
		'<div id="{{ id }}_scroller" class="h8-page-content" data-control="scroller" data-params="{orientation: \'{{ content_orientation }}\', visible: {{ scroller_visible }}, scrollspeed: 40}" style="width: {{ content_width }}px; height: {{ content_height }}px;">' +
			'{{ content }}' +
		'</div>' +
		'{{ parameters }}' +
		'{{ appbar }}' +
		'<div id="{{ idPopup }}" class="h8-popup">' +
			'<div id="{{ idPopup }}_container" class="h8-popup-container">' +
				'<div id="{{ idPopup }}_content" class="h8-popup-content"></div>' +
				'<div class="h8-clear"></div>' +
			'</div>' +
		'</div>' +
		'<div id="{{ idNotification }}" class="h8-notification">' +
			'<img id="{{ idNotification }}_picture" src="" class="h8-notification-picture" />' +
			'<div id="{{ idNotification }}_container" class="h8-notification-container">' +
				'<div  id="{{ idNotification }}_content" class="h8-notification-content"></div>' +
			'</div>' +
		'</div>'
	], [
		'h8_page_back_button',
		'<div id="{{ id }}_back_button" class="h8-title-back-button"></div>'
	]]);

	$8.UI.Animations.define([
		['h8_show_title_1', { duration: 1, from: 0, to: 60, easing: $8.UI.Animations.Easing.easeOutQuad },
			function(animation, detail) {
				detail.el.style('opacity', detail.current / detail.to)
					.style('font-size', detail.current + 'px')
					.style('visibility', 'visible');
			}
		], ['h8_show_title_2', { duration: 2, from: 380, to: 80, easing: $8.UI.Animations.Easing.easeOutCirc },
			function(animation, detail) {
				detail.el.style('left', detail.current + 'px');
			}
		], ['h8_show_notification', { duration: 1, from: -10, to: 20, easing: $8.UI.Animations.Easing.easeOutCirc },
			function(animation, detail) {
				detail.el.style('opacity', detail.percent / 100)
					.style('right', detail.current + 'px')
					.style('visibility', 'visible');
			}
		], ['h8_hide_notification', { duration: 1, from: 20, to: -10, easing: $8.UI.Animations.Easing.easeOutCirc },
			function(animation, detail) {
				detail.el.style('opacity', (100 - detail.percent) / 100)
					.style('right', detail.current + 'px');
			}
		]
	]);

	var _events = [],
		_els = [],
		_cacheEvents = [],
		_layoutTypes = ['hub', 'section', 'detail'];

	$8.UI.Controls.register('page',

		// Params
		{
			showGrid: false,
			layout: 'hub',
			orientation: 'horizontal', // horizontal, vertical, both
			title: '',
			scrollerVisible: true,
			backButton: true,
			animElements: []
		},

		function constructor(page, el, params) {
			var id = el.DOM.id;
			_events[id] = [];

			if(!_isArray(params.animElements)) {
				params.animElements = [ params.animElements ];
			}

			if(!_inArray(params.layout, _layoutTypes)) {
				params.layout = 'hub';
			}

			// force
			if(params.layout == 'hub' || params.layout == 'section') {
				params.orientation = 'horizontal';
			}

			$8.UI.Controls.setParams('page', id, params);

			var parameters = '',
				appbar = '',
				controls = $8.UI.elByAttribute('data-control');

			for(var i = 0; i < controls.length; i++) {
				if(controls[i].getAttribute('data-control') == 'parameters') {
					parameters = controls[i].outerHTML;
					$8.UI.removeEl(controls[i]);
				}
				if(controls[i].getAttribute('data-control') == 'appbar') {
					appbar = controls[i].outerHTML;
					$8.UI.removeEl(controls[i]);
				}
			}

			var html = '',
				content = el.html(),
				idPopup = $8.id(),
				idNotification = $8.id(),
				screenSize = $8.UI.screenSize();

			el.addClass('h8-page');

			if(params.showGrid) {
				$8.UI.Grid.define(el);
			}

			var contentWidth = screenSize.width;
			var contentHeight = screenSize.height - (7 * $8.UI.Unit.height);
			if(params.orientation == 'horizontal' || params.orientation == 'both') {
				contentHeight = screenSize.height - (9.5 * $8.UI.Unit.height);
			}
			if(params.orientation == 'vertical' || params.orientation == 'both') {
				contentWidth = screenSize.width - (2 * $8.UI.Unit.width);
			}

			html += $8.Templates.h8_page_container({
				id: id,
				backButton: params.layout != 'hub' && params.backButton ? $8.Templates.h8_page_back_button({
					id: id
				}) : '',
				content_orientation: params.orientation,
				scroller_visible: params.scrollerVisible,
				content_width: contentWidth,
				content_height: contentHeight,
				content: content,
				idPopup: idPopup,
				idNotification: idNotification,
				parameters: parameters,
				appbar: appbar
			});

			el.html(html);

			if(params.layout != 'hub') {
				var backButtonEl = $8.UI.el(id + '_back_button');

				$8.Utilities.addEvent(backButtonEl.DOM, 'click', function(e) {
					window.history.back();
				});
			}

			_els.page = $8.UI.el(id);
			_els.popup = $8.UI.el(idPopup);
			_els.notification = $8.UI.el(idNotification);
			_els.notification.click = false;

			$8.Utilities.addEvent(_els.notification.DOM, 'click', function(e) {
				page.closeNotification();

				if(_els.notification.click) {
					_els.notification.click(e);
				}
			});

			$8.Utilities.addEvent(window, 'resize', function(e) {
				page.refresh();
				page.fireEvent('resize', e);
			});

			for(var cacheIndex = 0; cacheIndex < _cacheEvents.length; cacheIndex++) {
				page.addEventListener(_cacheEvents[cacheIndex][0], _cacheEvents[cacheIndex][1]);
			}

			$8.UI.Controls.afterProcessAll(function() {
				var i, j;

				var scrollerContent = $8.UI.el(id + '_scroller_content');
				scrollerContent.addClass('h8-page-scroller-content');

				page.refresh();

				el.style('visibility', 'visible');

				var splashscreens = $8.UI.Controls.get('splashscreen');
				for(i = 0; i < splashscreens.length; i++) {
					$8.UI.Controls['splashscreen'].remove(splashscreens[i].el);
				}

				page.setTitle(params.title);

				var interval = 250;
				for(i = 0; i < params.animElements.length; i++) {
					var type = params.animElements[i];

					if($8.UI.Controls[type].show) {
						var controls = $8.UI.Controls.get(type);
						for(j = 0; j < controls.length; j++) {
							$8.UI.Controls[type].show(controls[j].el, interval);
							if(type != 'category') {
								interval += 100;
							}
						}
					}
				}

				page.fireEvent('loaded');
			});

		},
		// Methods
		{
			el: function() {
				return _els.page;
			},

			addEventListener: function(eventName, job) {
				var el = _els.page;
				if(!el) {
					_cacheEvents.push([eventName, job]);
				}
				else {
					var id = el.DOM.id;

					if(_isEmpty(_events[id][eventName])) {
						_events[id][eventName] = [];
					}

					_events[id][eventName].push(job);
				}
			},

			fireEvent: function( /* el, eventName, [arguments] */) {
				if(arguments.length < 1) {
					return;
				}
				var el = _els.page;


				var eventObj = {
					el: el,
					name: arguments[0],
					detail: !_isEmpty(arguments[1]) ? arguments[1] : {}
				};

				var id = el.DOM.id;

				if(!_isEmpty(_events[id][eventObj.name])) {
					for(var i = 0; i < _events[id][eventObj.name].length; i++) {
						_events[id][eventObj.name][i](eventObj);
					}
				}
			},

			afterLoaded: function(job) {
				$8.UI.Controls.page.addEventListener('loaded', job);
			},

			refresh: function() {
				var el = _els.page;
				var params = $8.UI.Controls.getParams(el.DOM.id),
					screenSize = $8.UI.screenSize(),
					width = 0,
					height = 0,
					scrollerEl = $8.UI.el(el.DOM.id + '_scroller'),
					scrollerContent = $8.UI.el(el.DOM.id + '_scroller_content');

				width = screenSize.width;
				height = screenSize.height - (7 * $8.UI.Unit.height);
				if(params.orientation == 'horizontal' || params.orientation == 'both') {
					height = screenSize.height - (9.5 * $8.UI.Unit.height);
				}
				if(params.orientation == 'vertical' || params.orientation == 'both') {
					width = screenSize.width - (2 * $8.UI.Unit.width);
				}

				scrollerEl.style('width', width + 'px')
					.style('height', height + 'px');

				if(params.orientation == 'horizontal' || params.orientation == 'both') {
					var columns = $8.UI.Controls.get('column');

					width = 0;
					for (var i = 0; i < columns.length; i++) {
						if(!_isEmpty(columns[i].el) && !_isEmpty(columns[i].params.width)) {
							width += columns[i].params.width + 40;
						}
					}
					scrollerContent.style('width', width + 'px');
					$8.UI.Controls.scroller.refresh($8.UI.el(el.DOM.id + '_scroller'));
				}
			},

			setTitle: function(title) {
				var el = _els.page;
				var titleH1El = $8.UI.el(el.DOM.id + '_title_h1');

				if(!_isEmpty(titleH1El)) {
					titleH1El.html('')
						.style('visibility', 'hidden')
						.style('left', '380px')
						.html(title);

					$8.UI.Animations.animate('h8_show_title_1', { el: titleH1El });
					$8.UI.Animations.animate('h8_show_title_2', { el: titleH1El });
				}
			},

			popup: function(content) {
				var id = _els.popup.DOM.id,
					containerEl = $8.UI.el(id + '_container'),
					contentEl = $8.UI.el(id + '_content'),
					screenSize = $8.UI.screenSize();

				contentEl.html(content);

				_els.popup.style('visibility', 'hidden');
				_els.popup.style('display', 'block');
				containerEl.style('top', ((screenSize.height - containerEl.DOM.offsetHeight) / 2) + 'px');
				_els.popup.style('visibility', 'visible');
			},

			hasPopup: function() {
				return _els.popup.style('display') == 'block';
			},

			closePopup: function() {
				if($8.UI.Controls.page.hasPopup()) {
					_els.popup.style('display', 'none');
					$8.UI.el(_els.popup.DOM.id + '_content').html('');
				}
			},

			notification: function(content, picture, clickAction) {
				picture = picture || '';
				clickAction = clickAction || false;

				var id = _els.notification.DOM.id,
					pictureEl = $8.UI.el(id + '_picture'),
					containerEl = $8.UI.el(id + '_container'),
					contentEl = $8.UI.el(id + '_content'),
					screenSize = $8.UI.screenSize();

				_els.notification.click = clickAction;

				contentEl.html(content);

				if(picture !== '') {
					pictureEl.DOM.src = picture;
					pictureEl.style('display', 'block');
					containerEl.removeClass('h8-notification-container-nopicture');
				}
				else {
					pictureEl.style('display', 'none');
					containerEl.addClass('h8-notification-container-nopicture');
				}

				contentEl.html(content);

				_els.notification.style('visibility', 'hidden');
				_els.notification.style('display', 'block');
				$8.UI.Animations.animate('h8_show_notification', { el: _els.notification });

				setTimeout(function() {
					$8.UI.Controls.page.closeNotification();
				}, 5000);
			},

			hasNotification: function() {
				return _els.notification.style('display') == 'block';
			},

			closeNotification: function() {
				if($8.UI.Controls.page.hasNotification()) {
					$8.UI.Animations.animate('h8_hide_notification', { el: _els.notification })
						.then(function() {
							_els.notification.style('display', 'none');
							$8.UI.el(_els.notification.DOM.id + '_content').html('');
						});
				}
			}
		}
	);

	$8.UI.Shortcuts.define(27, function() {
		$8.UI.Controls.page.closePopup();
	});

})(window);