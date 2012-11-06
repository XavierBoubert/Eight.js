(function(window) {
	'use strict';

	var $8 = window.$8,
		_isEmpty = $8.Utilities.isEmpty,
		_isArray = $8.Utilities.isArray;

	var Controls = function() {

		var _root = this,
			_events = [],
			_controls = [];

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

		function processAll() {

			var i,
				j,
				jobs = [],
				controlsEl = $8.UI.ElByAttribute('data-control');

			if(_isArray(controlsEl)) {
				for(i = 0; i < controlsEl.length; i++) {
					var controlType = controlsEl[i].getAttribute('data-control');

					for(j = 0; j < _controls.length; j++) {
						if(_controls[j].type == controlType) {
							_controls[j].items.push(controlsEl[i]);
							jobs.push({
								type: _controls[j].type,
								constructor: _controls[j].constructor,
								el: $8.UI.El(controlsEl[i])
							});
						}
					}
				}
			}

			i = 0;
			$8.Worker(function(worker) {
				var params = jobs[i].el.DOM.getAttribute('data-params');
				if(!_isEmpty(params)) {
					params = $8.Utilities.decodeJson(params);
				}
				else {
					params = {};
				}


				jobs[i].el.addClass('h8-control-' + jobs[i].type);
				jobs[i].el.DOM.removeAttribute('data-control');
				jobs[i].el.DOM.removeAttribute('data-params');

				jobs[i].constructor(jobs[i].el, params);

				i++;
				if(i < jobs.length) {
					worker.next();
				}
			});

			_root.fireEvent('processAll');
		}

		this.register = function(type, constructor) {
			_controls.push({
				type: type,
				constructor: constructor,
				items: []
			});
		};

		$8.Utilities.DOMReady(function() {
			processAll();
		});
	};

	var _Controls = new Controls();

	_Controls.register('scroller', function(el, params) {
		var config = {
			orientation: 'both' // both, vertical, horizontal
		};

		params = $8.Class.mix(config, params);
	});

	$8.UI.Controls = _Controls;

})(window);