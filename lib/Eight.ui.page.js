(function(window) {
	'use strict';

	var $8 = window.$8,
		_isEmpty = $8.Utilities.isEmpty,
		document = window.document;

	$8.Templates.define([[
		'h8_page_container',
		'<div id="{{ id_title }}" class="h8-title">' +
			'<h1></h1>' +
		'</div>' +
		'<div id="{{ id_content }}" class="h8-page-content" data-control="scroller" data-params="{orientation: \'horizontal\'}" style="width: {{ content_width }}px; height: {{ content_height }}px;">' +
			'{{ content }}' +
		'</div>'
	],[
		'h8_page_splashscreen',
		'<div class="h8-splashscreen" id="{{ id }}" style="background: {{ color }};">' +
			'<img id="{{ id }}_picture" src="{{ picture }}" style="display: {{ picture_display }}" />' +
		'</div>'
	]]);

	$8.UI.Animations.define([
		['h8_show_title_1', { duration: 3, from: 0, to: 60, easing: $8.UI.Animations.Easing.easeOutQuad },
			function(animation, detail) {
				detail.el.style('opacity', detail.current / detail.to)
					.style('font-size', detail.current + 'px')
					.style('visibility', 'visible');
			}
		], ['h8_show_title_2', { duration: 6, from: 300, to: 0, easing: $8.UI.Animations.Easing.easeOutCirc },
			function(animation, detail) {
				detail.el.style('left', detail.current + 'px');
			}
		]
	]);

	$8.UI.Animations.define();

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

		this.define = function(name, options) {
			options = options || {};
			var item;

			$8.UI.Controls.stopProcessAll();

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
					content: '',
					splashscreen: false,
					events: []
				}, options);

				var _body = $8.UI.el(document.body),
					html = '',
					idTitle = $8.id(),
					idContent = $8.id(),
					idSplashscreen = $8.id(),
					screenSize = $8.UI.screenSize();

				_body.addClass('h8-page');
				if(options.cls !== '') {
					_body.addClass(options.cls);
				}
				if(options.showGrid) {
					$8.UI.Grid.define(document.body);
				}

				html += $8.Templates.h8_page_container({
					id_title: idTitle,
					id_content: idContent,
					content_width: screenSize.width - (6 * $8.UI.Unit.width),
					content_height: screenSize.height - (9.5 * $8.UI.Unit.height),
					content: options.content
				});

				if(options.splashscreen) {
					options.splashscreen = options.splashscreen || false;
					options.splashscreen.color = options.splashscreen.color || 'black';
					options.splashscreen.picture = options.splashscreen.picture || '';

					html += $8.Templates.h8_page_splashscreen({
						id: idSplashscreen,
						color: options.splashscreen.color,
						picture: options.splashscreen.picture,
						picture_display: options.splashscreen.picture === '' ? 'none' : 'inline'
					});
				}

				_body.html(html);

				_els.title = $8.UI.el(idTitle);
				_els.content = $8.UI.el(idContent);

				if(options.splashscreen) {
					_els.splashscreen = $8.UI.el(idSplashscreen);
					var splashscreenPicture = $8.UI.el(idSplashscreen + '_picture');

					splashscreenPicture.DOM.addEventListener('load', function() {
						var height = splashscreenPicture.DOM.offsetHeight;
						var width = splashscreenPicture.DOM.offsetWidth;

						splashscreenPicture.style('width', width + 'px')
											.style('height', height + 'px')
											.style('left', ((screenSize.width - width) / 2) + 'px')
											.style('top', ((screenSize.height - height) / 2) + 'px')
											.style('visibility', 'visible');

					});
				}

				for(item in options.events) {
					_root.addEventListener(item, options.events[item]);
				}

				window.addEventListener('resize', onresize);

				$8.UI.Controls.afterProcessAll(function() {
					if(!_isEmpty(_els.splashscreen)) {
						setTimeout(function() {
							$8.UI.removeEl(_els.splashscreen);
							afterProcessAll(options);
						}, 1000);
					}
					else {
						afterProcessAll(options);
					}
				});

				$8.UI.Controls.processAll();
			}
		};

		function afterProcessAll(options) {
			_root.setTitle(options.title);

			_root.fireEvent('loaded');
		}

		function onresize(e) {
			_root.refresh();
			_root.fireEvent('resize', e);
		}

		this.refresh = function() {
			var screenSize = $8.UI.screenSize();
			_els.content.style('width', (screenSize.width - (6 * $8.UI.Unit.width)) + 'px')
						.style('height', (screenSize.height - (9.5 * $8.UI.Unit.height)) + 'px');
		};

		this.setTitle = function(title) {
			if(!_isEmpty(_els.title)) {
				var h1 = $8.UI.el(_els.title.DOM.childNodes[0]);
				h1.html('')
					.style('visibility', 'hidden')
					.style('left', '300px')
					.html(title);

				$8.UI.Animations.animate('h8_show_title_1', { el: h1 });
				$8.UI.Animations.animate('h8_show_title_2', { el: h1 });
			}
		};
	};

	var _Page = new Page();

	$8.Class.mix($8.UI, {
		Page: _Page
	});


})(window);