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
				},
				i;

			if(!_isEmpty(_events[eventObj.name])) {
				for(i = 0; i < _events[eventObj.name].length; i++) {
					_events[eventObj.name][i](eventObj);
				}
			}
		};

		this.stopProcessAll = function() {
			_stopProcessAll = true;
		};

		this.processAll = function() {

			var i, j,
				item,
				jobs = [],
				controlsEl = $8.UI.elByAttribute('data-control');

			if(_isArray(controlsEl)) {
				for(i = 0; i < controlsEl.length; i++) {
					var controlType = controlsEl[i].getAttribute('data-control');
					var controlParams = controlsEl[i].getAttribute('data-params');
					if(!_isEmpty(controlParams)) {
						controlParams = $8.Utilities.decodeJson(controlParams);
					}
					else {
						controlParams = {};
					}

					for(j = 0; j < _controls.length; j++) {
						if(_controls[j].type == controlType) {
							if(_isEmpty(controlsEl[i].id) || controlsEl[i].id === '') {
								controlsEl[i].id = $8.id();
							}

							var el = $8.UI.el(controlsEl[i]);

							_controls[j].items.push({
								id: controlsEl[i].id,
								el: el,
								params: controlParams
							});

							jobs.push({
								type: _controls[j].type,
								constructor: _controls[j].constructor,
								el: el,
								params: controlParams
							});
						}
					}
				}
			}

			for(i = 0; i < _controls.length; i++) {
				_root[_controls[i].type] = {
					define: _controls[i].constructor
				};

				for(item in _controls[i].methods) {
					_root[_controls[i].type][item] = _controls[i].methods[item];
				}
			}

			if(jobs.length > 0) {
				i = 0;

				$8.Worker(function(worker) {
					jobs[i].el.DOM.removeAttribute('data-control');
					jobs[i].el.DOM.removeAttribute('data-params');

					jobs[i].constructor(jobs[i].el, jobs[i].params);

					i++;
					if(i < jobs.length) {
						worker.next();
					}
					else {
						worker.complete();
					}
				}).then(function complete() {
					_root.fireEvent('processAll');
				});
			}
			else {
				_root.fireEvent('processAll');
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
			if(_isEmpty(el.DOM)) {
				el = $8.UI.el(el);
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
				content = el.DOM.innerHTML,
				verticalAction = { active: false, yOffset: 0 },
				horizontalAction = { active: false, xOffset: 0 };

			if(!_isEmpty(params.width)) {
				el.DOM.style.width = $8.UI.sizeToStyle(params.width);
			}
			if(!_isEmpty(params.height)) {
				el.DOM.style.height = $8.UI.sizeToStyle(params.height);
			}

			html = $8.Templates.control_scroller_container({
				id: id,
				baseClass: baseClass,
				content: content
			});

			el.DOM.innerHTML = html;

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
				var top = elVerticalTicker.DOM.style.top || 0;
				top = top !== 0 ? parseInt(top.replace('px', ''), 10) : top;
				verticalAction.yOffset = eventMouse.clientY - top;
				verticalAction.active = true;
			});

			elHorizontalTicker.DOM.addEventListener('mousedown', function(eventMouse) {
				var left = elHorizontalTicker.DOM.style.left || 0;
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
					elHorizontal.DOM.style.visibility = 'visible';
					elVertical.DOM.style.visibility = 'visible';
				});

				el.DOM.addEventListener('mouseout', function() {
					elHorizontal.DOM.style.visibility = 'hidden';
					elVertical.DOM.style.visibility = 'hidden';
				});
			}
			else {
				elHorizontal.DOM.style.visibility = 'visible';
				elVertical.DOM.style.visibility = 'visible';
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
					elVertical.DOM.style.display = 'block';
					elVerticalTicker.DOM.style.height = (elHeight * elHeight / elContentHeight) + 'px';
				}
				else {
					elVertical.DOM.style.display = 'none';
				}

				if(params.orientation == 'horizontal' && elWidth < elContentWidth) {
					elHorizontal.DOM.style.display = 'block';
					elHorizontalTicker.DOM.style.width = (elWidth * elWidth / elContentWidth) + 'px';
				}
				else {
					elHorizontal.DOM.style.display = 'none';
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

					elVerticalTicker.DOM.style.top = position + 'px';
					elContent.DOM.style.top = '-' + position + 'px';
				}
				else if(params.orientation == 'horizontal') {
					var elHorizontalTicker = $8.UI.el(id + '_horizontal_ticker');
					var maxLeft = el.DOM.offsetWidth - elHorizontalTicker.DOM.offsetWidth;
					position = position < 0 ? 0 : position;
					position = position > maxLeft ? maxLeft : position;

					elHorizontalTicker.DOM.style.left = position + 'px';
					elContent.DOM.style.left = '-' + position + 'px';
				}
			},

			scrollBy: function(el, increment) {
				var id = el.DOM.id,
					params = $8.UI.Controls.getParams(id);

				if(params.orientation == 'vertical') {
					var elVerticalTicker = $8.UI.el(id + '_vertical_ticker');
					var top = elVerticalTicker.DOM.style.top || 0;
					top = top !== 0 ? parseInt(top.replace('px', ''), 10) : top;
					top += increment;

					$8.UI.Controls.scroller.position(el, top);
				}
				else if(params.orientation == 'horizontal') {
					var elHorizontalTicker = $8.UI.el(id + '_horizontal_ticker');
					var left = elHorizontalTicker.DOM.style.left || 0;
					left = left !== 0 ? parseInt(left.replace('px', ''), 10) : left;
					left += increment;

					$8.UI.Controls.scroller.position(el, left);
				}
			}
		}
	);

})(window);