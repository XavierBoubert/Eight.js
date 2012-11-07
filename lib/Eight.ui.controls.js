(function(window) {
	'use strict';

	var $8 = window.$8,
		_isEmpty = $8.Utilities.isEmpty,
		_isArray = $8.Utilities.isArray;

	var Controls = function() {

		var _root = this,
			_events = [],
			_controls = [],
			_stopProcessAll = false;

		this.addEventListener = function(eventName, job) {
			if(_isEmpty(_events[eventName])) {
				_events[eventName] = [];
			}

			_events[eventName].push(job);
		};

		this.fireEvent = function( /* eventName, [arguments] */) {
			if(arguments.length < 1) {
				return;
			}

			var eventObj = {
				name: arguments[0],
				detail: !_isEmpty(arguments[1]) ? arguments[1] : {}
			};

			if(!_isEmpty(_events[eventObj.name])) {
				for(var i = 0; i < _events[eventObj.name].length; i++) {
					_events[eventObj.name][i](eventObj);
				}
			}
		};

		this.stopProcessAll = function() {
			_stopProcessAll = true;
		};

		this.processAll = function() {

			var controlsEl = $8.UI.elByAttribute('data-control');

			if(controlsEl.length === 0) {
				_root.fireEvent('processAll');
			}
			else {
				$8.Worker(function(worker) {
					var controlEl = controlsEl[0],
						controlType = controlEl.getAttribute('data-control'),
						controlParams = controlEl.getAttribute('data-params');

					controlParams = !_isEmpty(controlParams) ? $8.Utilities.decodeJson(controlParams) : {} ;

					for(var i = 0; i < _controls.length; i++) {
						if(_controls[i].type == controlType) {
							if(_isEmpty(controlEl.id) || controlEl.id === '') {
								controlEl.id = $8.id();
							}

							var el = $8.UI.el(controlEl);

							_controls[i].items.push({
								id: controlEl.id,
								el: el,
								params: controlParams
							});

							el.DOM.removeAttribute('data-control');
							el.DOM.removeAttribute('data-params');

							_controls[i].constructor(el, controlParams);
						}
					}

					controlsEl = $8.UI.elByAttribute('data-control');
					if(controlsEl.length > 0) {
						worker.next();
					}
					else {
						worker.complete();
					}

				}).then(function complete() {
					_root.fireEvent('processAll');
				});
			}
		};

		this.afterProcessAll = function(job) {
			_root.addEventListener('processAll', job);
		};

		this.register = function(type, constructor, methods) {
			methods = methods || {};

			_controls.push({
				type: type,
				constructor: constructor,
				methods: methods,
				items: []
			});

			_root[type] = {
				define: constructor
			};

			var item;
			for(item in methods) {
				_root[type][item] = methods[item];
			}
		};

		this.setParams = function(type, id, params) {
			var found = false;

			for(var i = 0; i < _controls.length; i++) {
				if(_controls[i].type == type) {
					for(var j = 0; j < _controls[i].items.length; j++) {
						if(_controls[i].items[j].el.DOM.id == id) {
							_controls[i].items[j].params = params;
							found = true;
							break;
						}
					}
					if(!found) {
						_controls[i].items.push({
							id: id,
							el: $8.UI.el(id),
							params: params
						});
					}
					break;
				}
			}
		};

		this.getParams = function(id) {
			for(var i = 0; i < _controls.length; i++) {
				for(var j = 0; j < _controls[i].items.length; j++) {
					if(_controls[i].items[j].el.DOM.id == id) {
						return _controls[i].items[j].params;
					}
				}
			}
		};

		$8.Utilities.DOMReady(function() {
			if(!_stopProcessAll) {
				_root.processAll();
			}
		});
	};

	var _Controls = new Controls();

	$8.UI.Controls = _Controls;

})(window);



/*
 * SCROLLER
 */

(function(window) {
	'use strict';

	var $8 = window.$8,
		_isEmpty = $8.Utilities.isEmpty;


	$8.Templates.define('control_scroller_container',
		'<div id="{{ id }}_content" class="{{ baseClass }}-content">' +
			'{{ content }}' +
		'</div>' +
		'<div id="{{ id }}_horizontal" class="{{ baseClass }}-horizontal h8-unselectable">' +
			'<div id="{{ id }}_horizontal_ticker" class="{{ baseClass }}-horizontal-ticker h8-unselectable"></div>' +
		'</div>' +
		'<div id="{{ id }}_vertical" class="{{ baseClass }}-vertical h8-unselectable">' +
			'<div id="{{ id }}_vertical_ticker" class="{{ baseClass }}-vertical-ticker h8-unselectable"></div>' +
		'</div>'
	);

	$8.UI.Controls.register(
		'scroller',
		function constructor(el, params) {
			el = $8.UI.el(el);
			if(_isEmpty(el.DOM.id) || el.DOM.id === '') {
				el.DOM.id = $8.id();
			}

			params = $8.Class.mix({
				orientation: 'vertical', // vertical, horizontal
				hiddenScrolls: true
			}, params);

			el.addClass('h8-control-scroller');

			var baseClass = 'h8-control-scroller',
				scroller = $8.UI.Controls.scroller,
				id = el.DOM.id,
				html = '',
				content = el.html(),
				verticalAction = { active: false, yOffset: 0 },
				horizontalAction = { active: false, xOffset: 0 };

			if(!_isEmpty(params.width)) {
				el.style('width', $8.UI.sizeToStyle(params.width));
			}
			if(!_isEmpty(params.height)) {
				el.style('height', $8.UI.sizeToStyle(params.height));
			}

			html = $8.Templates.control_scroller_container({
				id: id,
				baseClass: baseClass,
				content: content
			});

			el.html(html);

			var elHorizontal = $8.UI.el(id + '_horizontal'),
				elVertical = $8.UI.el(id + '_vertical'),
				elHorizontalTicker = $8.UI.el(id + '_horizontal_ticker'),
				elVerticalTicker = $8.UI.el(id + '_vertical_ticker');

			window.addEventListener('mousemove', function(eventMouse) {
				if(verticalAction.active) {
					var top = eventMouse.clientY - verticalAction.yOffset;
					scroller.position(el, top);
				}

				if(horizontalAction.active) {
					var left = eventMouse.clientX - horizontalAction.xOffset;
					scroller.position(el, left);
				}
			});

			elVerticalTicker.DOM.addEventListener('mousedown', function(eventMouse) {
				var top = elVerticalTicker.style('top') || 0;
				top = top !== 0 ? parseInt(top.replace('px', ''), 10) : top;
				verticalAction.yOffset = eventMouse.clientY - top;
				verticalAction.active = true;
			});

			elHorizontalTicker.DOM.addEventListener('mousedown', function(eventMouse) {
				var left = elHorizontalTicker.style('left') || 0;
				left = left !== 0 ? parseInt(left.replace('px', ''), 10) : left;
				horizontalAction.xOffset = eventMouse.clientX - left;
				horizontalAction.active = true;
			});

			window.addEventListener('mouseup', function(eventMouse) {
				horizontalAction.active = false;
				verticalAction.active = false;
			});

			function MouseWheelEvent(event, slider) {
				var delta = 0;
				if (!event) { //For IE.
					event = window.event;
				}
				if (event.wheelDelta) { //IE/Opera.
					delta = event.wheelDelta / 120;
				}
				else if (event.detail) { //Mozilla case
					delta = -event.detail / 3;
				}
				if (delta) {
					scroller.scrollBy(el, (-delta) * 10);
				}
				if (event.preventDefault) {
					event.preventDefault();
				}
				event.returnValue = false;
			}

			el.DOM.addEventListener('DOMMouseScroll', MouseWheelEvent); // Mozilla
			el.DOM.addEventListener('mousewheel', MouseWheelEvent);// IE/Opera

			$8.UI.Controls.setParams('scroller', id, params);

			if(params.hiddenScrolls) {
				el.DOM.addEventListener('mousemove', function() {
					elHorizontal.style('visibility', 'visible');
					elVertical.style('visibility', 'visible');
				});

				el.DOM.addEventListener('mouseout', function() {
					elHorizontal.style('visibility', 'hidden');
					elVertical.style('visibility', 'hidden');
				});
			}
			else {
				elHorizontal.style('visibility', 'visible');
				elVertical.style('visibility', 'visible');
			}

			el.DOM.addEventListener('resize', function() {
				scroller.refresh(el);
			});

			scroller.refresh(el);
		},
		// Methods
		{
			refresh: function(el) {
				var id = el.DOM.id,
					elContent = $8.UI.el(id + '_content'),
					elHorizontal = $8.UI.el(id + '_horizontal'),
					elVertical = $8.UI.el(id + '_vertical'),
					elHorizontalTicker = $8.UI.el(id + '_horizontal_ticker'),
					elVerticalTicker = $8.UI.el(id + '_vertical_ticker'),
					elHeight = el.DOM.offsetHeight,
					elWidth = el.DOM.offsetWidth,
					elContentHeight = elContent.DOM.offsetHeight,
					elContentWidth = elContent.DOM.offsetWidth,
					params = $8.UI.Controls.getParams(id);

				if(params.orientation == 'vertical' && elHeight < elContentHeight) {
					elVertical.style('display', 'block');
					elVerticalTicker.style('height', (elHeight * elHeight / elContentHeight) + 'px');
				}
				else {
					elVertical.style('display', 'none');
				}

				if(params.orientation == 'horizontal' && elWidth < elContentWidth) {
					elHorizontal.style('display', 'block');
					elHorizontalTicker.style('width', (elWidth * elWidth / elContentWidth) + 'px');
				}
				else {
					elHorizontal.style('display', 'none');
				}

			},

			orientation: function(el, orientation) {
				var id = el.DOM.id,
					params = $8.UI.Controls.getParams(id);

				params.orientation = orientation;
				$8.UI.Controls.setParams('scroller', id, params);
				$8.UI.Controls.scroller.refresh(el);
			},

			position: function(el, position) {
				var id = el.DOM.id,
					params = $8.UI.Controls.getParams(id),
					elContent = $8.UI.el(id + '_content');

				if(params.orientation == 'vertical') {
					var elVerticalTicker = $8.UI.el(id + '_vertical_ticker');
					var maxTop = el.DOM.offsetHeight - elVerticalTicker.DOM.offsetHeight;
					position = position < 0 ? 0 : position;
					position = position > maxTop ? maxTop : position;

					elVerticalTicker.style('top', position + 'px');
					elContent.style('top', '-' + position + 'px');
				}
				else if(params.orientation == 'horizontal') {
					var elHorizontalTicker = $8.UI.el(id + '_horizontal_ticker');
					var maxLeft = el.DOM.offsetWidth - elHorizontalTicker.DOM.offsetWidth;
					position = position < 0 ? 0 : position;
					position = position > maxLeft ? maxLeft : position;

					elHorizontalTicker.style('left', position + 'px');
					elContent.style('left', '-' + position + 'px');
				}
			},

			scrollBy: function(el, increment) {
				var id = el.DOM.id,
					params = $8.UI.Controls.getParams(id);

				if(params.orientation == 'vertical') {
					var elVerticalTicker = $8.UI.el(id + '_vertical_ticker');
					var top = elVerticalTicker.style('top') || 0;
					top = top !== 0 ? parseInt(top.replace('px', ''), 10) : top;
					top += increment;

					$8.UI.Controls.scroller.position(el, top);
				}
				else if(params.orientation == 'horizontal') {
					var elHorizontalTicker = $8.UI.el(id + '_horizontal_ticker');
					var left = elHorizontalTicker.style('left') || 0;
					left = left !== 0 ? parseInt(left.replace('px', ''), 10) : left;
					left += increment;

					$8.UI.Controls.scroller.position(el, left);
				}
			}
		}
	);

})(window);


/*
 * TILE
 */

(function(window) {
	'use strict';

	var $8 = window.$8,
		_isEmpty = $8.Utilities.isEmpty;


	$8.Templates.define('control_tile_container',
		'<div id="{{ id }}_container" class="{{ baseClass }}-container">' +
			'<img id="{{ id }}_picture" class="{{ baseClass }}-picture" src="{{ picture }}" />' +
			'<div class="{{ baseClass }}-content">' +
				'<div class="{{ baseClass }}-text">' +
					'{{ text }}' +
				'</div>' +
			'</div>' +
		'</div>'
	);

	$8.UI.Animations.define([
		['h8_control_tile_show_1', { duration: 3, from: 60, to: 100, easing: $8.UI.Animations.Easing.easeOutQuad },
			function(animation, detail) {
				detail.el.style('opacity', detail.current / detail.to)
					.style('width', detail.current + '%')
					.style('height', detail.current + '%')
					.style('visibility', 'visible');

				var h = detail.el.DOM.parentNode.offsetHeight - detail.el.DOM.offsetHeight;
				h = h - (detail.percent * h / 100);

				detail.el.style('top', h + 'px');
			}
		], ['h8_control_tile_show_2', { duration: 6, from: 300, to: 0, easing: $8.UI.Animations.Easing.easeOutCirc },
			function(animation, detail) {
				detail.el.style('left', detail.current + 'px');
			}
		]
	]);

	$8.UI.Controls.register(
		'tile',
		function constructor(el, params) {
			el = $8.UI.el(el);
			if(_isEmpty(el.DOM.id) || el.DOM.id === '') {
				el.DOM.id = $8.id();
			}

			params = $8.Class.mix({
				width: 100,
				height: 100,
				cls: '',
				picture: '',
				text: '',
				visible: true
			}, params);

			el.addClass('h8-control-tile');
			if(params.cls !== '') {
				el.addClass(params.cls);
			}
			el.style('width', params.width + 'px')
				.style('height', params.height + 'px');

			var baseClass = 'h8-control-tile',
				id = el.DOM.id,
				content = el.html(),
				html = '';

			html = $8.Templates.control_tile_container({
				id: id,
				baseClass: baseClass,
				text: content,
				picture: params.picture
			});

			el.html(html);

			var containerEl = $8.UI.el(id + '_container'),
				picEl = $8.UI.el(id + '_picture');

			if(params.visible) {
				containerEl.style('visibility', 'visible');
			}

			picEl.DOM.addEventListener('load', function() {
				if(picEl.DOM.offsetHeight >= params.height) {
					picEl.style('top', ((picEl.DOM.offsetHeight - params.height) / 2) + 'px');
				}
				else {
					picEl.style('top', ((params.height - picEl.DOM.offsetHeight) / 2) + 'px');
				}
				if(picEl.DOM.offsetWidth >= params.width) {
					picEl.style('left', ((picEl.DOM.offsetWidth - params.width) / 2) + 'px');
				}
				else {
					picEl.style('left', ((params.width - picEl.DOM.offsetWidth) / 2) + 'px');
				}
			});

		},
		// Methods
		{
			show: function(el) {
				el = $8.UI.el(el);
				el = $8.UI.el(el.DOM.id + '_container');

				if(!_isEmpty(el)) {
					el.style('visibility', 'hidden')
						.style('left', '300px');

					$8.UI.Animations.animate('h8_control_tile_show_1', { el: el });
					$8.UI.Animations.animate('h8_control_tile_show_2', { el: el });
				}

			}
		}
	);

})(window);