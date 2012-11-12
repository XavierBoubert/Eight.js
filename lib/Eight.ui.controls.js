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
				var indent = 0;
				$8.Worker(function(worker) {
					var controlEl = controlsEl[0],
						controlType = controlEl.getAttribute('data-control'),
						controlParams = controlEl.getAttribute('data-params');

					controlParams = !_isEmpty(controlParams) ? $8.Utilities.decodeJson(controlParams) : {} ;

					for(var i = 0; i < _controls.length; i++) {
						if(_controls[i].type == controlType) {
							createControl(controlType, controlEl, controlParams);
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

		this.register = function(type, params, constructor, methods) {
			methods = methods || {};

			_controls.push({
				type: type,
				params: params,
				constructor: constructor,
				methods: methods,
				items: []
			});

			_root[type] = {
				define: function(el, params) {
					return createControl(type, el, params);
				}
			};

			var item;
			for(item in methods) {
				_root[type][item] = methods[item];
			}
		};

		function createControl(type, el, params) {

			for(var i = 0; i < _controls.length; i++) {
				if(_controls[i].type == type) {

					el = $8.UI.el(el);
					if(_isEmpty(el.DOM.id) || el.DOM.id === '') {
						el.DOM.id = $8.id();
					}

					params = $8.Class.mix($8.Class.clone(_controls[i].params), params);
					params.baseCls = 'h8-control-' + type;

					el.addClass(params.baseCls);

					_controls[i].items.push({
						id: el.DOM.id,
						el: el,
						params: $8.Class.clone(params)
					});

					el.DOM.removeAttribute('data-control');
					el.DOM.removeAttribute('data-params');

					return _controls[i].constructor(_root[type], el, params);
				}
			}
		}

		this.setParams = function(type, id, params) {
			var found = false;

			for(var i = 0; i < _controls.length; i++) {
				if(_controls[i].type == type) {
					for(var j = 0; j < _controls[i].items.length; j++) {
						if(!_isEmpty(_controls[i].items[j].el) && _controls[i].items[j].id == id) {
							_controls[i].items[j].params = $8.Class.clone(params);
							found = true;
							break;
						}
					}
					if(!found) {
						_controls[i].items.push({
							id: id,
							el: $8.UI.el(id),
							params: $8.Class.clone(params)
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
						return $8.Class.clone(_controls[i].items[j].params);
					}
				}
			}
		};

		this.get = function(type) {
			type = type || false;

			if(!type) {
				return _controls;
			}
			else {
				for(var i = 0; i < _controls.length; i++) {
					if(_controls[i].type == type) {
						return _controls[i].items;
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
		'<div id="{{ id }}_content" class="{{ baseCls }}-content">' +
			'{{ content }}' +
		'</div>' +
		'<div id="{{ id }}_horizontal" class="{{ baseCls }}-horizontal h8-unselectable">' +
			'<div id="{{ id }}_horizontal_ticker" class="{{ baseCls }}-horizontal-ticker h8-unselectable"></div>' +
		'</div>' +
		'<div id="{{ id }}_vertical" class="{{ baseCls }}-vertical h8-unselectable">' +
			'<div id="{{ id }}_vertical_ticker" class="{{ baseCls }}-vertical-ticker h8-unselectable"></div>' +
		'</div>'
	);

	$8.UI.Controls.register('scroller',

		// Params
		{
			orientation: 'vertical', // vertical, horizontal
			hiddenScrolls: true,
			scrollspeed: 10,
			increment: 1
		},

		function constructor(scroller, el, params) {
			var id = el.DOM.id,
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
				baseCls: params.baseCls,
				content: content
			});

			el.html(html);

			var elHorizontal = $8.UI.el(id + '_horizontal'),
				elVertical = $8.UI.el(id + '_vertical'),
				elHorizontalTicker = $8.UI.el(id + '_horizontal_ticker'),
				elVerticalTicker = $8.UI.el(id + '_vertical_ticker');

			$8.Utilities.addEvent(window.document, 'mousemove', function(eventMouse) {
				if(verticalAction.active) {
					var top = eventMouse.clientY - verticalAction.yOffset;
					scroller.position(el, top);
				}

				if(horizontalAction.active) {
					var left = eventMouse.clientX - horizontalAction.xOffset;
					scroller.position(el, left);
				}
			});

			$8.Utilities.addEvent(elVerticalTicker.DOM, 'mousedown', function(eventMouse) {
				var top = elVerticalTicker.style('top') || 0;
				top = top !== 0 ? parseInt(top.replace('px', ''), 10) : top;
				verticalAction.yOffset = eventMouse.clientY - top;
				verticalAction.active = true;
			});

			$8.Utilities.addEvent(elHorizontalTicker.DOM, 'mousedown', function(eventMouse) {
				var left = elHorizontalTicker.style('left') || 0;
				left = left !== 0 ? parseInt(left.replace('px', ''), 10) : left;
				horizontalAction.xOffset = eventMouse.clientX - left;
				horizontalAction.active = true;
			});

			$8.Utilities.addEvent(window.document, 'mouseup', function(eventMouse) {
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
					scroller.scrollBy(el, (-delta) * params.scrollspeed);
				}
				if (event.preventDefault) {
					event.preventDefault();
				}
				event.returnValue = false;
			}

			$8.Utilities.addEvent(el.DOM, 'DOMMouseScroll', MouseWheelEvent); // Mozilla
			$8.Utilities.addEvent(el.DOM, 'mousewheel', MouseWheelEvent); // IE/Opera

			if(params.hiddenScrolls) {
				$8.Utilities.addEvent(el.DOM, 'mousemove', function() {
					elHorizontal.style('visibility', 'visible');
					elVertical.style('visibility', 'visible');
				});

				$8.Utilities.addEvent(el.DOM, 'mouseout', function() {
					elHorizontal.style('visibility', 'hidden');
					elVertical.style('visibility', 'hidden');
				});
			}
			else {
				elHorizontal.style('visibility', 'visible');
				elVertical.style('visibility', 'visible');
			}

			$8.Utilities.addEvent(el.DOM, 'resize', function() {
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
					var top = (elHeight * elHeight / elContentHeight);
					elVerticalTicker.style('height', top + 'px');
					params.increment = (elContentHeight - elHeight) / (elHeight - top);
					$8.UI.Controls.setParams('scroller', id, params);
				}
				else {
					elVertical.style('display', 'none');
				}

				if(params.orientation == 'horizontal' && elWidth < elContentWidth) {
					elHorizontal.style('display', 'block');
					var width = (elWidth * elWidth / elContentWidth);
					elHorizontalTicker.style('width', width + 'px');
					params.increment = (elContentWidth - elWidth) / (elWidth - width);
					$8.UI.Controls.setParams('scroller', id, params);
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
					elHorizontal = $8.UI.el(id + '_horizontal'),
					elVertical = $8.UI.el(id + '_vertical'),
					elContent = $8.UI.el(id + '_content');

				if(params.orientation == 'vertical' && elVertical.style('display') == 'block') {
					var elVerticalTicker = $8.UI.el(id + '_vertical_ticker');
					var maxTop = el.DOM.offsetHeight - elVerticalTicker.DOM.offsetHeight;
					position = Math.min(Math.max(0, position), maxTop);
					var top = position * params.increment;

					elVerticalTicker.style('top', position + 'px');
					elContent.style('top', '-' + top + 'px');
				}
				else if(params.orientation == 'horizontal' && elHorizontal.style('display') == 'block') {
					var elHorizontalTicker = $8.UI.el(id + '_horizontal_ticker');
					var maxLeft = el.DOM.offsetWidth - elHorizontalTicker.DOM.offsetWidth;
					position = Math.min(Math.max(0, position), maxLeft);
					var left = position * params.increment;

					elHorizontalTicker.style('left', position + 'px');
					elContent.style('left', '-' + left + 'px');
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
 * CATEGORY
 */

(function(window) {
	'use strict';

	var $8 = window.$8,
		_isEmpty = $8.Utilities.isEmpty,
		_isObject = $8.Utilities.isObject;

	$8.UI.Animations.define([
		['h8_control_category_show_1', { duration: 1, from: 0, to: 30, easing: $8.UI.Animations.Easing.easeOutQuad },
			function(animation, detail) {
				detail.el.style('opacity', detail.current / detail.to)
					.style('font-size', detail.current + 'px')
					.style('visibility', 'visible');
			}
		], ['h8_control_category_show_2', { duration: 2, from: 300, to: 0, easing: $8.UI.Animations.Easing.easeOutCirc },
			function(animation, detail) {
				detail.el.style('left', detail.current + 'px');
			}
		]
	]);

	$8.Templates.define('control_category_container',
		'<div id="{{ id }}_container" class="{{ baseCls }}-container">' +
			'<h2 id="{{ id }}_title" class="{{ baseCls }}-title"><a href="{{ link }}">{{ title }}</a></h2>' +
			'<div id="{{ id }}_content" class="{{ baseCls }}-content">' +
				'{{ content }}' +
			'</div>' +
		'</div>'
	);

	$8.UI.Controls.register('category',

		// Params
		{
			title: '',
			link: '',
			items: [],
			visible: true
		},

		function constructor(category, el, params) {
			var id = el.DOM.id,
				content = el.html(),
				html = '';

			html = $8.Templates.control_category_container({
				id: id,
				link: params.link,
				title: params.title,
				baseCls: params.baseCls,
				content: content
			});

			el.html(html);

			var titleEl = $8.UI.el(id + '_title');

			if(params.visible) {
				titleEl.style('visibility', 'visible');
			}
		},
		// Methods
		{
			show: function(el, timeout) {
				el = $8.UI.el(el);
				el = $8.UI.el(el.DOM.id + '_title');
				timeout = timeout || 0;

				if(!_isEmpty(el)) {
					el.style('visibility', 'hidden')
						.style('left', '300px');

					setTimeout(function() {
						$8.UI.Animations.animate('h8_control_category_show_1', { el: el });
						$8.UI.Animations.animate('h8_control_category_show_2', { el: el });
					}, timeout);
				}

			}
		}
	);

})(window);


/*
 * COLUMN
 */

(function(window) {
	'use strict';

	var $8 = window.$8,
		_isEmpty = $8.Utilities.isEmpty;

	$8.UI.Animations.define('h8_control_column_show', { duration: 2, from: 300, to: 0, easing: $8.UI.Animations.Easing.easeOutCirc },
		function(animation, detail) {
			detail.el.style('left', detail.current + 'px')
				.style('opacity', detail.percent / 100)
				.style('visibility', 'visible');
		}
	);

	$8.UI.Controls.register('column',

		// Params
		{
			visible: true,
			width: 0
		},

		function constructor(column, el, params) {
			params.width += 30;
			$8.UI.Controls.setParams('column', el.DOM.id, params);

			if(params.visible) {
				el.style('visibility', 'visible');
			}
		},
		// Methods
		{
			show: function(el, timeout) {
				el = $8.UI.el(el);
				timeout = timeout || 0;

				if(!_isEmpty(el)) {
					el.style('visibility', 'hidden')
						.style('left', '300px');

					setTimeout(function() {
						$8.UI.Animations.animate('h8_control_column_show', { el: el });
					}, timeout);
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

	$8.Templates.define([[
		'control_tile_container',
		'<a id="{{ id }}_container" class="{{ baseCls }}-container" href="{{ link }}">' +
			'<img id="{{ id }}_picture" class="{{ baseCls }}-picture" src="" />' +
			'<div class="{{ baseCls }}-content">' +
				'<div class="{{ baseCls }}-text">' +
					'{{ text }}' +
				'</div>' +
			'</div>' +
		'</a>'
	],[
		'control_tile_nopicture_container',
		'<a id="{{ id }}_container" class="{{ baseCls }}-container" href="{{ link }}">' +
			'<div class="{{ baseCls }}-nopicture-content">' +
				'<div class="{{ baseCls }}-nopicture-text">' +
					'{{ text }}' +
				'</div>' +
			'</div>' +
		'</a>'
	]]);

	$8.UI.Animations.define([
		['h8_control_tile_show_1', { duration: 1, from: 60, to: 100, easing: $8.UI.Animations.Easing.easeOutQuad },
			function(animation, detail) {
				detail.el.style('opacity', detail.current / detail.to)
					.style('width', detail.current + '%')
					.style('height', detail.current + '%')
					.style('visibility', 'visible');

				var h = detail.el.DOM.parentNode.offsetHeight - detail.el.DOM.offsetHeight;
				h = h - (detail.percent * h / 100);

				detail.el.style('top', h + 'px');
			}
		], ['h8_control_tile_show_2', { duration: 2, from: 300, to: 0, easing: $8.UI.Animations.Easing.easeOutCirc },
			function(animation, detail) {
				detail.el.style('left', detail.current + 'px');
			}
		]
	]);

	$8.UI.Controls.register('tile',

		// Params
		{
			width: 100,
			height: 100,
			picture: '',
			pictureHover: '',
			visible: true,
			link: '#'
		},

		function constructor(tile, el, params) {
			var id = el.DOM.id,
				content = el.html(),
				html = '';

			el.style('width', params.width + 'px')
				.style('height', params.height + 'px');

			if(params.picture !== '') {
				html = $8.Templates.control_tile_container({
					id: id,
					baseCls: params.baseCls,
					text: content,
					link: params.link
				});
			}
			else {
				html = $8.Templates.control_tile_nopicture_container({
					id: id,
					baseCls: params.baseCls,
					text: content,
					link: params.link
				});
			}

			el.html(html);

			var containerEl = $8.UI.el(id + '_container');

			if(params.picture !== '') {
				var picEl = $8.UI.el(id + '_picture');
				//$8.Utilities.addEvent(picEl.DOM, 'load', tile.updatePicture);
				picEl.DOM.onload = tile.updatePicture;
				picEl.DOM.src = params.picture;

				if(params.pictureHover !== '') {
					$8.Utilities.addEvent(containerEl.DOM, 'mouseover', function() {
						picEl.DOM.src = params.pictureHover;
					});
					$8.Utilities.addEvent(containerEl.DOM, 'mouseout', function() {
						picEl.DOM.src = params.picture;
					});
				}
			}

			if(params.visible) {
				containerEl.style('visibility', 'visible');
			}
		},
		// Methods
		{
			updatePicture: function(e) {
				var id = this.id.replace('_picture', ''),
					picEl = $8.UI.el(this),
					params = $8.UI.Controls.getParams(id);

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

				$8.Utilities.removeEvent(picEl.DOM, 'load', $8.UI.Controls.tile.updatePicture);
			},

			show: function(el, timeout) {
				el = $8.UI.el(el);
				el = $8.UI.el(el.DOM.id + '_container');
				timeout = timeout || 0;

				if(!_isEmpty(el)) {
					el.style('visibility', 'hidden')
						.style('left', '300px');

					setTimeout(function() {
						$8.UI.Animations.animate('h8_control_tile_show_1', { el: el });
						$8.UI.Animations.animate('h8_control_tile_show_2', { el: el });
					}, timeout);
				}

			}
		}
	);

})(window);


/*
 * APPBAR
 */

(function(window) {
	'use strict';

	var $8 = window.$8,
		_isEmpty = $8.Utilities.isEmpty;

	$8.Templates.define('control_appbar_container',
		'<div id="{{ id }}_container" class="{{ baseCls }}-container">' +
			'{{ content }}' +
			'<div class="h8-clear"></div>' +
		'</div>'
	);

	$8.UI.Animations.define([
		['h8_control_appbar_show', { duration: 2, from: -100, to: 0, easing: $8.UI.Animations.Easing.easeOutCirc },
			function(animation, detail) {
				var offset = detail.from + 30,
					containerEl = $8.UI.el(detail.el.DOM.id + '_container');

				if(detail.current >= offset) {
					detail.el.style('height', (30 + (detail.current - offset)) + 'px');
				}
				containerEl.style('bottom', detail.current + 'px');
			}
		], ['h8_control_appbar_hide', { duration: 2, from: 0, to: -100, easing: $8.UI.Animations.Easing.easeOutCirc },
			function(animation, detail) {
				var offset = detail.to + 30,
					containerEl = $8.UI.el(detail.el.DOM.id + '_container');

				if(detail.current >= offset) {
					detail.el.style('height', (30 + (detail.current - offset)) + 'px');
				}
				containerEl.style('bottom', detail.current + 'px');
			}
		]
	]);

	$8.UI.Controls.register('appbar',

		// Params
		{

		},

		function constructor(appbar, el, params) {
			var id = el.DOM.id,
				content = el.html(),
				html = '';

			html = $8.Templates.control_appbar_container({
				id: id,
				baseCls: params.baseCls,
				content: content
			});

			el.html(html);

			var containerEl = $8.UI.el(id + '_container'),
				capture = false,
				opened = false;

			function lostCapture() {
				capture = false;
				setTimeout(function() {
					if(!capture && opened) {
						opened = false;
						appbar.hide(el);
					}
				}, 1000);
			}

			$8.Utilities.addEvent(el.DOM, 'mouseover', function(e) {
				capture = true;
				if(!opened) {
					opened = true;
					appbar.show(el);
				}
			});
			$8.Utilities.addEvent(el.DOM, 'mouseout', function(e) {
				lostCapture();
			});
			$8.Utilities.addEvent(containerEl.DOM, 'mouseover', function(e) {
				capture = true;
			});
		},
		// Methods
		{
			show: function(el, timeout) {
				el = $8.UI.el(el);
				timeout = timeout || 0;

				if(!_isEmpty(el)) {
					setTimeout(function() {
						$8.UI.Animations.animate('h8_control_appbar_show', { el: el });
					}, timeout);
				}
			},

			hide: function(el, timeout) {
				el = $8.UI.el(el);
				timeout = timeout || 0;

				if(!_isEmpty(el)) {

					setTimeout(function() {
						$8.UI.Animations.animate('h8_control_appbar_hide', { el: el })
							.then(function() {
								el.style('height', '30px');
							});
					}, timeout);
				}

			}
		}
	);

})(window);


/*
 * COMMAND
 */

(function(window) {
	'use strict';

	var $8 = window.$8,
		_isEmpty = $8.Utilities.isEmpty;

	$8.Templates.define('control_command_container',
		'<img src="{{ picture }}" class="{{ baseCls }}-picture">' +
		'<div class="{{ baseCls }}-content">' +
			'{{ content }}' +
		'</div>'
	);

	$8.UI.Controls.register('command',

		// Params
		{
			picture: '',
			action: false
		},

		function constructor(command, el, params) {
			var id = el.DOM.id,
				content = el.html(),
				html = '';

			html = $8.Templates.control_command_container({
				id: id,
				baseCls: params.baseCls,
				picture: params.picture,
				content: content
			});

			el.html(html);

			$8.Utilities.addEvent(el.DOM, 'click', function(e) {
				if(params.action) {
					params.action(e);
				}
			});
		},
		// Methods
		{

		}
	);

})(window);


/*
 * PARAMETERS
 */

(function(window) {
	'use strict';

	var $8 = window.$8,
		_isEmpty = $8.Utilities.isEmpty;

	$8.Templates.define('control_parameters_container',
		'<div id="{{ id }}_container" class="{{ baseCls }}-container">' +
			'<div id="{{ id }}_content" class="{{ baseCls }}-content">' +
				'<h3>{{ title }}</h3>' +
				'<div id="{{ id }}_scroller" data-control="scroller" data-params="{orientation: \'vertical\', scrollspeed: 40}" style="width: 305px; height: {{ scroller_height }};">' +
					'{{ content }}' +
				'</div>' +
			'</div>' +
		'</div>'
	);

	$8.UI.Animations.define([
		['h8_control_parameters_show', { duration: 2, from: -345, to: 0, easing: $8.UI.Animations.Easing.easeOutCirc },
			function(animation, detail) {
				var offset = detail.from + 30,
					containerEl = $8.UI.el(detail.el.DOM.id + '_container');

				if(detail.current >= offset) {
					detail.el.style('width', (30 + (detail.current - offset)) + 'px');
				}
				containerEl.style('right', detail.current + 'px');
			}
		], ['h8_control_parameters_hide', { duration: 2, from: 0, to: -345, easing: $8.UI.Animations.Easing.easeOutCirc },
			function(animation, detail) {
				var offset = detail.to + 30,
					containerEl = $8.UI.el(detail.el.DOM.id + '_container');

				if(detail.current >= offset) {
					detail.el.style('width', (30 + (detail.current - offset)) + 'px');
				}
				containerEl.style('right', detail.current + 'px');
			}
		]
	]);

	$8.UI.Controls.register('parameters',

		// Params
		{
			title: ''
		},

		function constructor(parameters, el, params) {
			var id = el.DOM.id,
				content = el.html(),
				html = '',
				screenSize = $8.UI.screenSize();

			html = $8.Templates.control_parameters_container({
				id: id,
				baseCls: params.baseCls,
				title: params.title,
				scroller_height: (screenSize.height - 90) + 'px',
				content: content
			});

			el.html(html);

			var containerEl = $8.UI.el(id + '_container'),
				capture = false,
				opened = false;

			$8.Utilities.addEvent(window, 'resize', function(e) {
				parameters.refresh(el);
			});

			function lostCapture() {
				capture = false;
				setTimeout(function() {
					if(!capture && opened) {
						opened = false;
						parameters.hide(el);
					}
				}, 1000);
			}

			$8.Utilities.addEvent(el.DOM, 'mouseover', function(e) {
				capture = true;
				if(!opened) {
					opened = true;
					parameters.show(el);
				}
			});
			$8.Utilities.addEvent(el.DOM, 'mouseout', function(e) {
				lostCapture();
			});
			$8.Utilities.addEvent(containerEl.DOM, 'mouseover', function(e) {
				capture = true;
			});
		},
		// Methods
		{
			refresh: function(el) {
				var id = el.DOM.id,
					scrollerEl = $8.UI.el(id + '_scroller'),
					screenSize = $8.UI.screenSize();

				scrollerEl.style('height', (screenSize.height - 90) + 'px');
			},

			show: function(el, timeout) {
				el = $8.UI.el(el);
				timeout = timeout || 0;

				if(!_isEmpty(el)) {
					setTimeout(function() {
						$8.UI.Animations.animate('h8_control_parameters_show', { el: el });
					}, timeout);
				}
			},

			hide: function(el, timeout) {
				el = $8.UI.el(el);
				timeout = timeout || 0;

				if(!_isEmpty(el)) {
					setTimeout(function() {
						$8.UI.Animations.animate('h8_control_parameters_hide', { el: el })
							.then(function() {
								el.style('width', '30px');
							});
					}, timeout);
				}

			}
		}
	);

})(window);


/*
 * SPLASHSCREEN
 */

(function(window) {
	'use strict';

	var $8 = window.$8,
		_isEmpty = $8.Utilities.isEmpty;

	$8.UI.Controls.register('splashscreen',

		// Params
		{

		},

		function constructor(parameters, el, params) {

		},
		// Methods
		{
			remove: function(el) {
				el = $8.UI.el(el);
				if(!_isEmpty(el)) {
					$8.UI.removeEl(el);
				}

			}
		}
	);

})(window);