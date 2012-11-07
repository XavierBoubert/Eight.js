(function(window) {
	'use strict';

	var $8 = window.$8,
		_isEmpty = $8.Utilities.isEmpty,
		document = window.document;

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

		this.el = function(el) {
			if(typeof el == 'string') {
				el = document.getElementById(el);
			}

			if(_isEmpty(el)) {
				$8.Console.warning('Eight.UI.el(): Element undefined');
				return false;
			}

			return {
				DOM: el,

				hasClass: function(className) {
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

		function getElementsByAttribute(attribute, parent, result) {
			result = result || [];
			parent = parent || window.document.body;
			var elements = parent.children;
			if(!_isEmpty(elements)) {
				for(var i = 0; i < elements.length; i++) {
					var elAttribute = elements[i].getAttribute && elements[i].getAttribute(attribute);
					if(typeof elAttribute == "string" && elAttribute.length > 0){
						result.push(elements[i]);
					}
					result = getElementsByAttribute(attribute, elements[i], result);
				}
			}
			return result;

		}

		this.elByAttribute = function(attribute, parent) {
			return getElementsByAttribute(attribute, parent);
		};

		this.sizeToStyle = function(size) {
			size = size || 0;
			size = ''+size;
			size = $8.Utilities.trim(size);

			if(size.substr(size.length-1, 1) == '%') {
				return size;
			}

			return size + 'px';
		};

		this.screenSize = function() {
			var size = { width: 0, height: 0 };

			if( typeof( window.innerWidth ) == 'number' ) {
				//Non-IE
				size.width = window.innerWidth;
				size.height = window.innerHeight;
			}
			else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
				//IE 6+ in 'standards compliant mode'
				size.width = document.documentElement.clientWidth;
				size.height = document.documentElement.clientHeight;
			}
			else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
				//IE 4 compatible
				size.width = document.body.clientWidth;
				size.height = document.body.clientHeight;
			}

			return size;
		};

		this.Unit = unitObject(20, 20);

		this.Subunit = unitObject(5, 5);

		this.Grid = {
			define: function(element) {
				element = _root.el(element);

				if(element) {
					element.addClass('h8-grid');
					return element;
				}

				return false;
			}
		};

		var shortcuts = [];

		window.addEventListener('keyup', function(e) {
			e = window.event || e;

			for(var i = 0; i < shortcuts.length; i++) {
				var s = shortcuts[i];

				if(e.ctrlKey == s.ctrlActivated && e.shiftKey == s.shiftActivated && e.altKey == s.altActivated && e.keyCode == s.keyCode) {
					s.action(e);
				}
			}
		});

		this.Shortcuts = {
			define: function(keyCode, action, ctrlActivated, shiftActivated, altActivated) {
				ctrlActivated = ctrlActivated || false;
				shiftActivated = shiftActivated || false;
				altActivated = altActivated || false;

				shortcuts.push({
					keyCode: keyCode,
					action: action,
					ctrlActivated: ctrlActivated,
					shiftActivated: shiftActivated,
					altActivated: altActivated
				});
			}
		};

		this.Animations = {
			define: function(name, options, action) {
				options = options || {};

				if(!_isEmpty(animations[name])) {
					$8.Console.warning('Eight.UI.Animations.define(): Animation "' + name + '" already defined');
					return false;
				}

				if(_isEmpty(options.from)) {
					$8.Console.warning('Eight.UI.Animations.define(): Animation "' + name + '" need a "from" parameter');
					return false;
				}

				if(_isEmpty(options.to)) {
					$8.Console.warning('Eight.UI.Animations.define(): Animation "' + name + '" need a "to" parameter');
					return false;
				}

				if(_isEmpty(options.duration)) {
					$8.Console.warning('Eight.UI.Animations.define(): Animation "' + name + '" need a "duration" parameter');
					return false;
				}

				if(_isEmpty(options.easing)) {
					options.easing = _root.Animations.Easing.linear;
				}

				animations[name] = {
					options: options,
					action: action
				};

				return true;
			},

			animate: function(name, options) {
				if(!_isEmpty(animations[name])) {

					var action = animations[name].action;
					options = options || {};
					var defaultOptions = $8.Class.clone(animations[name].options);
					options = $8.Class.mix(defaultOptions, options);
					options.loop = 0;

					if(_isEmpty(options.el)) {
						options.el = ['none'];
					}
					else {
						if(!$8.Utilities.isArray(options.el)) {
							options.el = [options.el];
						}
						for(var i = 0; i < options.el.length; i++) {
							options.el[i] = _root.el(options.el[i]);
						}
					}

					var _worker = $8.Worker(function(worker) {
						options.loop++;
						var currentTime = options.loop / 10;
						var changeValue = options.from - options.to;
						if(options.to >= options.from) {
							changeValue = options.to - options.from;
						}

						options.current = options.easing(currentTime, options.from, changeValue, options.duration);

						if(_isEmpty(options.el)) {
							action(name, options);
						}
						else {
							for(var i = 0; i < options.el.length; i++) {
								var sendOptions = $8.Class.clone(options);
								sendOptions.el = options.el[i];
								action(name, sendOptions);
							}
						}

						if(currentTime < options.duration) {
							worker.next();
						}
						else {
							worker.complete(name);
						}
					});

					return _worker;
				}

				$8.Console.warning('Eight.UI.Animations.animate: Animation "' + name + '" undefined');

				return false;
			},

			Easing: {
				// t: current time, b: beginning value, c: change in value, d: duration

				linear: function(t, b, c, d) {
					return c * t / d + b;
				},
				easeInQuad: function (t, b, c, d) {
					return c*(t/=d)*t + b;
				},
				easeOutQuad: function (t, b, c, d) {
					return -c *(t/=d)*(t-2) + b;
				},
				easeInOutQuad: function (t, b, c, d) {
					if ((t /= d/2) < 1) {
						return c/2*t*t + b;
					}
					return -c/2 * ((--t)*(t-2) - 1) + b;
				},
				easeInCubic: function (t, b, c, d) {
					return c*(t/=d)*t*t + b;
				},
				easeOutCubic: function (t, b, c, d) {
					return c*((t=t/d-1)*t*t + 1) + b;
				},
				easeInOutCubic: function (t, b, c, d) {
					if ((t /= d/2) < 1) {
						return c/2*t*t*t + b;
					}
					return c/2*((t-=2)*t*t + 2) + b;
				},
				easeInQuart: function (t, b, c, d) {
					return c*(t/=d)*t*t*t + b;
				},
				easeOutQuart: function (t, b, c, d) {
					return -c * ((t=t/d-1)*t*t*t - 1) + b;
				},
				easeInOutQuart: function (t, b, c, d) {
					if ((t /= d/2) < 1) {
						return c/2*t*t*t*t + b;
					}
					return -c/2 * ((t-=2)*t*t*t - 2) + b;
				},
				easeInQuint: function (t, b, c, d) {
					return c*(t/=d)*t*t*t*t + b;
				},
				easeOutQuint: function (t, b, c, d) {
					return c*((t=t/d-1)*t*t*t*t + 1) + b;
				},
				easeInOutQuint: function (t, b, c, d) {
					if (( t/= d/2) < 1) {
						return c/2*t*t*t*t*t + b;
					}
					return c/2*((t-=2)*t*t*t*t + 2) + b;
				},
				easeInSine: function (t, b, c, d) {
					return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
				},
				easeOutSine: function (t, b, c, d) {
					return c * Math.sin(t/d * (Math.PI/2)) + b;
				},
				easeInOutSine: function (t, b, c, d) {
					return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
				},
				easeInExpo: function (t, b, c, d) {
					return (t===0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
				},
				easeOutExpo: function (t, b, c, d) {
					return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
				},
				easeInOutExpo: function (t, b, c, d) {
					if (t === 0) {
						return b;
					}
					if (t==d) {
						return b+c;
					}
					if ((t /= d/2) < 1) {
						return c/2 * Math.pow(2, 10 * (t - 1)) + b;
					}
					return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
				},
				easeInCirc: function (t, b, c, d) {
					return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
				},
				easeOutCirc: function (t, b, c, d) {
					return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
				},
				easeInOutCirc: function (t, b, c, d) {
					if ((t /= d/2) < 1) {
						return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
					}
					return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
				},
				easeInElastic: function (t, b, c, d) {
					var s=1.70158,
						p=0,
						a=c;
					if (t===0) {
						return b;
					}
					if ((t /= d)==1) {
						return b+c;
					}
					if (!p) {
						p=d*0.3;
					}
					if (a < Math.abs(c)) {
						a=c;
						s=p/4;
					}
					else {
						s = p/(2*Math.PI) * Math.asin (c/a);
					}
					return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
				},
				easeOutElastic: function (t, b, c, d) {
					var s=1.70158,
						p=0,
						a=c;
					if (t===0) {
						return b;
					}
					if ((t /= d)==1) {
						return b+c;
					}
					if (!p) {
						p=d*0.3;
					}
					if (a < Math.abs(c)) {
						a=c;
						s=p/4;
					}
					else {
						s = p/(2*Math.PI) * Math.asin (c/a);
					}
					return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
				},
				easeInOutElastic: function (t, b, c, d) {
					var s=1.70158,
						p=0,
						a=c;
					if (t===0) {
						return b;
					}
					if ((t /= d/2)==2) {
						return b+c;
					}
					if (!p) {
						p=d*(0.3*1.5);
					}
					if (a < Math.abs(c)) {
						a=c;
						s=p/4;
					}
					else {
						s = p/(2*Math.PI) * Math.asin (c/a);
					}
					if (t < 1) {
						return -0.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
					}
					return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*0.5 + c + b;
				},
				easeInBack: function (t, b, c, d, s) {
					if (s === undefined) {
						s = 1.70158;
					}
					return c*(t/=d)*t*((s+1)*t - s) + b;
				},
				easeOutBack: function (t, b, c, d, s) {
					if (s === undefined) {
						s = 1.70158;
					}
					return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
				},
				easeInOutBack: function (t, b, c, d, s) {
					if (s === undefined) {
						s = 1.70158;
					}
					if ((t /= d/2) < 1) {
						return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
					}
					return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
				},
				easeInBounce: function (t, b, c, d) {
					return c - _root.Animations.Easing.easeOutBounce (d-t, 0, c, d) + b;
				},
				easeOutBounce: function (t, b, c, d) {
					if ((t/=d) < (1/2.75)) {
						return c*(7.5625*t*t) + b;
					} else if (t < (2/2.75)) {
						return c*(7.5625*(t-=(1.5/2.75))*t + 0.75) + b;
					} else if (t < (2.5/2.75)) {
						return c*(7.5625*(t-=(2.25/2.75))*t + 0.9375) + b;
					}
					return c*(7.5625*(t-=(2.625/2.75))*t + 0.984375) + b;
				},
				easeInOutBounce: function (t, b, c, d) {
					if (t < d/2) {
						return _root.Animations.Easing.easeInBounce (t*2, 0, c, d) * 0.5 + b;
					}
					return _root.Animations.Easing.easeOutBounce (t*2-d, 0, c, d) * 0.5 + c*0.5 + b;
				}

			}
		};
	};

	var _UI = new UI();

	$8.extend({
		UI: _UI
	});

})(window);