(function(window) {
	'use strict';

	var $8 = window.$8,
		_isEmpty = $8.Utilities.isEmpty;

	function unitObject(width, height) {
		return {
			width: width,
			height: height,

			getCSS: function() {
				return 'width: ' + width + 'px; ' + height + 'px;';
			}
		};
	}

	var UI = function() {

		var _root = this,
			animations = [];

		this.El = function(el) {
			if(typeof el == 'string') {
				el = document.getElementById(el);
			}

			if(_isEmpty(el)) {
				return false;
			}

			return {
				DOM: el,

				hasClass: function(className) {
					window.A1 = this;
					var classes = this.DOM.className.split(' ');
					for(var i = 0; i < classes.length; i++) {
						if(classes[i] == className) {
							return true;
						}
					}
					return false;
				},

				addClass: function(className) {
					if(!this.hasClass(className)) {
						this.DOM.className += (this.DOM.className !== '' ? ' ' : '') + className;
					}
				},

				removeClass: function(className) {
					var classes = this.DOM.className.split(' '),
						newClasses = '';
					for(var i = 0; i < classes.length; i++) {
						if(classes[i] != className) {
							newClasses += (newClasses !== '' ? ' ' : '') + classes[i];
						}
					}
					this.DOM.className = className;
				}
			};
		};

		this.Unit = unitObject(20, 20);

		this.Subunit = unitObject(5, 5);

		this.Grid = {
			define: function(element) {
				element = _root.El(element);

				if(element) {
					element.addClass('h8-grid');
					return element;
				}

				return false;
			}
		};

		this.Animations = {
			define: function(name, action) {
				animations[name] = action;
			},

			animate: function(name, properties) {

			}
		};

	};

	var _UI = new UI();

	$8.extend({
		UI: _UI
	});

})(window);