(function(window) {
	'use strict';

	var $8 = window.$8,
		_isEmpty = $8.Utilities.isEmpty,
		document = window.document;

	$8.Templates.define('h8_page_container',
		'<h1>{{ title }}</h1>' +
		'<div id="{{ id_content }}" class="h8-page-content" style="width: {{ content_width }}px; height: {{ content_height }}px;">' +
		'</div>'
	);

	var Page = function() {
		var _root = this,
			_events = [],
			_els = {};

		this.addEventListener = function(eventName, job) {
			if(_isEmpty(_events[eventName])) {
				_events[eventName] = [];
			}

			_events[eventName].push(job);
		};

		function fireEvent( /* eventName, [arguments] */) {
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
		}

		this.define = function(name, options) {
			options = options || {};
			var item;

			if(!$8.Utilities.isDOMReady) {
				$8.Utilities.DOMReady(function() {
					$8.UI.Page.define(name, options);
				});
			}
			else {
				options = $8.Class.mix({
					showGrid: false,
					title: '',
					cls: '',
					events: []
				}, options);

				var _body = $8.UI.El(document.body);

				_body.addClass('h8-page');
				if(options.cls !== '') {
					_body.addClass(options.cls);
				}
				if(options.showGrid) {
					$8.UI.Grid.define(document.body);
				}

				var screenSize = $8.UI.screenSize();
				var idContent = $8.id();

				_body.DOM.innerHTML += $8.Templates.h8_page_container({
					title: options.title,
					id_content: idContent,
					content_width: screenSize.width - (6 * $8.UI.Unit.width),
					content_height: screenSize.height - (9.5 * $8.UI.Unit.height)
				});

				_els.content = $8.UI.El(idContent);

				for(item in options.events) {
					_root.addEventListener(item, options.events[item]);
				}

				window.addEventListener('resize', onresize);
			}
		};

		function onresize(e) {
			_root.refresh();
			fireEvent('resize', e);
		}

		this.refresh = function() {
			var screenSize = $8.UI.screenSize();
			_els.content.DOM.style.width = (screenSize.width - (6 * $8.UI.Unit.width)) + 'px';
			_els.content.DOM.style.height = (screenSize.height - (9.5 * $8.UI.Unit.height)) + 'px';
		};
	};

	var _Page = new Page();

	$8.Class.mix($8.UI, {
		Page: _Page
	});


})(window);