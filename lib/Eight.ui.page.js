(function(window) {
	'use strict';

	var $8 = window.$8,
		_isEmpty = $8.Utilities.isEmpty,
		_isArray = $8.Utilities.isArray,
		_inArray = $8.Utilities.inArray,
		document = window.document;

	$8.Templates.define('h8_page_container',
		'<div id="{{ id }}_title" class="h8-title">' +
			'<h1></h1>' +
		'</div>' +
		'<div id="{{ id }}_scroller" class="h8-page-content" data-control="scroller" data-params="{orientation: \'{{ content_orientation }}\', scrollspeed: 40}" style="width: {{ content_width }}px; height: {{ content_height }}px;">' +
			'{{ content }}' +
		'</div>' +
		'<div id="{{ idPopup }}" class="h8-popup">' +
			'<div  id="{{ idPopup }}_container" class="h8-popup-container">' +
				'<div  id="{{ idPopup }}_content" class="h8-popup-content"></div>' +
				'<div class="h8-clear"></div>' +
			'</div>' +
		'</div>'
	);

	$8.UI.Animations.define([
		['h8_show_title_1', { duration: 1, from: 0, to: 60, easing: $8.UI.Animations.Easing.easeOutQuad },
			function(animation, detail) {
				detail.el.style('opacity', detail.current / detail.to)
					.style('font-size', detail.current + 'px')
					.style('visibility', 'visible');
			}
		], ['h8_show_title_2', { duration: 2, from: 300, to: 0, easing: $8.UI.Animations.Easing.easeOutCirc },
			function(animation, detail) {
				detail.el.style('left', detail.current + 'px');
			}
		]
	]);

	var _events = [],
		_params = [],
		_els = [],
		_layoutTypes = ['hub', 'section', 'detail'];

	$8.UI.Controls.register(
		'page',
		function constructor(el, params) {
			el = $8.UI.el(el);
			if(_isEmpty(el.DOM.id) || el.DOM.id === '') {
				el.DOM.id = $8.id();
			}
			var id = el.DOM.id;
			_events[id] = [];

			_params[id] = $8.Class.mix({
				showGrid: false,
				layout: 'hub',
				orientation: 'horizontal',
				title: '',
				animElements: []
			}, params);

			if(!_isArray(_params[id].animElements)) {
				_params[id].animElements = [ _params[id].animElements ];
			}

			if(!_inArray(_params[id].layout, _layoutTypes)) {
				_params[id].layout = 'hub';
			}

			// force
			if(_params[id].layout == 'hub' || _params[id].layout == 'section') {
				_params[id].orientation = 'horizontal';
			}

			params = _params[id];

			var html = '',
				content = el.html(),
				idPopup = $8.id(),
				screenSize = $8.UI.screenSize();

			el.addClass('h8-page');

			if(params.showGrid) {
				$8.UI.Grid.define(el);
			}

			var contentWidth = screenSize.width - (6 * $8.UI.Unit.width);
			var contentHeight = screenSize.height - (7 * $8.UI.Unit.height);
			if(params.orientation == 'horizontal') {
				contentHeight = screenSize.height - (9.5 * $8.UI.Unit.height);
			}

			html += $8.Templates.h8_page_container({
				id: id,
				content_orientation: params.orientation,
				content_width: contentWidth,
				content_height: contentHeight,
				content: content,
				idPopup: idPopup
			});

			el.html(html);

			_els.popup = $8.UI.el(idPopup);

			window.addEventListener('resize', function(e) {
				$8.UI.Controls.page.refresh(el);
				$8.UI.Controls.page.fireEvent(el, 'resize', e);
			});

			$8.UI.Controls.afterProcessAll(function() {
				var i, j;

				if(params.orientation == 'horizontal') {
					var columns = $8.UI.Controls.get('column');

					var width = 0;
					for (i = 0; i < columns.length; i++) {
						if(!_isEmpty(columns[i].el) && !_isEmpty(columns[i].params.width)) {
							width += columns[i].params.width + 40;
						}
					}
					width += 120;
					$8.UI.el(el.DOM.id + '_scroller_content').style('width', width + 'px');
					$8.UI.Controls.scroller.refresh($8.UI.el(el.DOM.id + '_scroller'));
				}

				el.style('visibility', 'visible');

				$8.UI.Controls.page.setTitle(el, params.title);

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

				$8.UI.Controls.page.fireEvent(el, 'loaded');
			});

		},
		// Methods
		{
			addEventListener: function(el, eventName, job) {
				el = $8.UI.el(el);
				var id = el.DOM.id;

				if(_isEmpty(_events[id][eventName])) {
					_events[id][eventName] = [];
				}

				_events[id][eventName].push(job);
			},

			fireEvent: function( /* el, eventName, [arguments] */) {
				if(arguments.length < 2) {
					return;
				}

				var eventObj = {
					el: $8.UI.el(arguments[0]),
					name: arguments[1],
					detail: !_isEmpty(arguments[2]) ? arguments[2] : {}
				};

				var id = eventObj.el.DOM.id;

				if(!_isEmpty(_events[id][eventObj.name])) {
					for(var i = 0; i < _events[id][eventObj.name].length; i++) {
						_events[id][eventObj.name][i](eventObj);
					}
				}
			},

			refresh: function(el) {
				el = $8.UI.el(el);
				var params = _params[el.DOM.id];

				var screenSize = $8.UI.screenSize(),
					width = 0,
					height = 0;

				if(params._orientation == 'horizontal') {
					width = screenSize.width - (6 * $8.UI.Unit.width);
					height = screenSize.height - (9.5 * $8.UI.Unit.height);
				}
				else {
					width = screenSize.width - (6 * $8.UI.Unit.width);
					height = screenSize.height - (7 * $8.UI.Unit.height);
				}

				$8.UI.el(el.DOM.id + '_scroller').style('width', width + 'px')
							.style('height', height + 'px');
			},

			setTitle: function(el, title) {
				el = $8.UI.el(el);
				var titleEl = $8.UI.el(el.DOM.id + '_title');

				if(!_isEmpty(titleEl)) {
					var h1 = $8.UI.el(titleEl.DOM.childNodes[0]);
					h1.html('')
						.style('visibility', 'hidden')
						.style('left', '300px')
						.html(title);

					$8.UI.Animations.animate('h8_show_title_1', { el: h1 });
					$8.UI.Animations.animate('h8_show_title_2', { el: h1 });
				}
			},

			isPopup: function() {
				return _els.popup.style('display') == 'block';
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

			closePopup: function() {
				if($8.UI.Controls.page.isPopup()) {
					_els.popup.style('display', 'none');
					$8.UI.el(_els.popup.DOM.id + '_els.popup.DOM.id').html('');
				}
			}
		}
	);

	$8.UI.Shortcuts.define(27, function() {
		$8.UI.Controls.page.closePopup();
	});

})(window);