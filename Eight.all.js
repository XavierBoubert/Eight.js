(function(window) {
	'use strict';

	var i,
		document = window.document;

	function _isEmpty(obj) {
		if(typeof obj == 'undefined' || obj === null || obj === false)
			return true;

		return false;
	}

	function _isArray(obj) {
		if(!_isEmpty(obj) && Object.prototype.toString.call( obj ) === '[object Array]') {
			return true;
		}
		return false;
	}

	function _isObject(obj) {
		if(!_isEmpty(obj) && Object.prototype.toString.call( obj ) === '[object Object]') {
			return true;
		}
		return false;
	}

	function _inArray(value, obj) {
		if(_isArray(obj)) {
			for(var i = 0; i < obj.length; i++) {
				if(obj[i] == value) {
					return true;
				}
			}
		}
		return false;
	}

	function _trim (value) {
		if (''.trim)
			return value.trim();

		return value.replace(/^\s+/, '').replace(/\s+$/, '');
	}

	function _decodeJson(text) {
		if(!_isEmpty(text)) {
			return eval('(' + text + ')');
		}

		return {};
	}

	function _DOMReady(callback) {
		if (document.addEventListener) {
			document.addEventListener('DOMContentLoaded', callback, false);
		}
		/* Safari, iCab, Konqueror */
		else {
			var DOMLoadTimer = setInterval(function () {
				if (window.document.readyState == 'loaded' || window.document.readyState == 'complete') {
					callback();
					clearInterval(DOMLoadTimer);
				}
			}, 10);
		}
	}

	function _addEvent(obj, eventName, callback) {
		if (obj.addEventListener) {
			obj.addEventListener(eventName, callback);
		}
		else {
			obj.attachEvent('on' + eventName, callback);
		}
	}

	function _removeEvent(obj, eventName, callback) {
		if (obj.removeEventListener) {
			obj.removeEventListener(eventName, callback);
		}
		else {
			obj.detachEvent(eventName, callback);
		}
	}

	function namespaceDefine (name, objects, parentNamespace) {
		if(_isEmpty(parentNamespace)) {
			parentNamespace = window;
		}
		else {
			var namespaces = parentNamespace.split('.');

			var searchNamespace = window;
			for(i = 0; i < namespaces.length; i++) {
				var namespace = namespaces[i];

				if(typeof searchNamespace[namespace] == 'undefined') {
					break;
				}

				searchNamespace = searchNamespace[namespace];
			}

			parentNamespace = searchNamespace;
		}

		var names = name.split('.');
		for(i = 0; i < names.length; i++) {
			name = names[i];

			if(typeof parentNamespace[name] == 'undefined')
				parentNamespace[name] = {};

			if(i == names.length - 1)
				parentNamespace[name] = objects;

			parentNamespace = parentNamespace[name];
		}

		return parentNamespace;
	}

	function classDefine(init, publicObjects, staticObjects, proto) {
		var classObj = init,
			item;

		if(!_isEmpty(proto)) {
			for(item in proto) {
				classObj[item] = proto[item];
			}
			for(item in proto.prototype) {
				classObj.prototype[item] = proto.prototype[item];
			}
		}

		for(item in publicObjects) {
			classObj.prototype[item] = publicObjects[item];
		}
		for(item in staticObjects) {
			classObj[item] = staticObjects[item];
		}

		return classObj;
	}

	var Eight = function() {

		var _root = this,
			_events = [],
			_logs = [],
			_ids = 0;

		this.id = function() {
			return 'h8_' + (++_ids);
		};

		this.extend = function(properties) {
			for (var key in properties) {
				_root[key] = properties[key];
			}

			return _root;
		};

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

		function consoleQuery(type) {
			var result = [];
			for(var i = 0; i < _events.length; i++) {
				if(_events[i].type == type) {
					result.push(_events[i]);
				}
			}

			return result;
		}

		this.Console = {
			LogTypes: {
				Undefined: 0,
				Information: 1,
				Warning: 2,
				Error: 3
			},

			log: function(value, type) {
				type = type || this.LogTypes.Undefined;
				var item,
					inList = false;
				for(item in this.LogTypes) {
					if(type == this.LogTypes[item]) {
						inList = true;
						break;
					}
				}
				if(!inList) {
					type = this.LogTypes.Undefined;
				}

				_logs.push({
					type: type,
					value: value
				});

				return _logs[_logs.length - 1];
			},

			information: function(value) {
				var log = this.log(value, this.LogTypes.Information);

				_root.fireEvent('log_information', { log: log });
			},

			warning: function(value) {
				var log = this.log(value, this.LogTypes.Warning);

				_root.fireEvent('log_warning', { log: log });
			},

			error: function(value) {
				var log = this.log(value, this.LogTypes.Error);

				_root.fireEvent('log_error', { log: log });
			},

			allInformations: function() {
				return consoleQuery(this.LogTypes.Information);
			},

			allWarnings: function() {
				return consoleQuery(this.LogTypes.Warning);
			},

			allErrors: function() {
				return consoleQuery(this.LogTypes.Error);
			}
		};

		this.Utilities = {
			isEmpty: _isEmpty,
			isArray: _isArray,
			inArray: _inArray,
			isObject: _isObject,
			trim: _trim,
			decodeJson: _decodeJson,
			isDOMReady: false,
			DOMReady: _DOMReady,
			addEvent: _addEvent,
			removeEvent: _removeEvent
		};

		this.Namespace = {
			define: function(name, objects) {
				return namespaceDefine(name, objects);
			},

			defineInParent: function(parent, name, objects) {
				return namespaceDefine(name, objects, parent);
			}
		};

		this.Class = {
			define: function(init, publicObjects, staticObjects) {
				return classDefine(init, publicObjects, staticObjects);
			},

			mix: function(objHost, properties) {
				for (var key in properties) {
					objHost[key] = properties[key];
				}

				return objHost;
			},

			clone: function (obj){
				return this.mix({}, obj);
			},

			inherit: function (proto, init, publicObjects, staticObjects) {
				return classDefine(init, publicObjects, staticObjects, proto);
			}
		};

		this.Property = function(get, set) {
			return function(value) {
				if(_isEmpty(value)) {
					if(!_isEmpty(get)) {
						return get(this);
					}
				}
				else {
					if(!_isEmpty(set)) {
						return set(this, value);
					}
				}
			};
		};

		this.Promise = function(job) {
			var _thenTable = [];

			var PromiseObj = function () {

				var promiseSelf = this;

				this.then = function(complete, error, progress) {
					_thenTable.push({
						complete: complete || function() { },
						error: error || function() { },
						progress: progress || function() { }
					});

					return promiseSelf;
				};
			};

			function doJob () {
				setTimeout(function() {

					if(_thenTable.length > 0) {
						job(
							_thenTable[0].complete,
							_thenTable[0].error,
							_thenTable[0].progress
						);

						_thenTable.splice(0, 1);
					}

					if(_thenTable.length > 0) {
						doJob();
					}

				}, 0);
			}

			doJob();

			return new PromiseObj();
		};

		this.Templates = {
			_templates: {},

			define: function(name, templateString) {
				if(_isArray(name)) {
					for(var i = 0; i < name.length; i++) {
						_root.Templates.define(name[i][0], name[i][1]);
					}
				}
				else {
					_root.Templates._templates[name] = templateString;
					_root.Templates[name] = function (replaces, increment) {
						replaces = replaces || {};
						increment = increment || 0;

						var text = _root.Templates._templates[name], finalText = '', item;

						if(typeof replaces == 'object' && (replaces instanceof Array)) {
							for(var i = 0; i < replaces.length; i++) {
								finalText += _root.Templates[name](replaces[i], i);
							}
						}
						else {
							replaces['%INCREMENT%'] = increment;

							finalText = text;
							for(item in replaces) {
								finalText = finalText.replace(new RegExp('({{ '+item+' }})', 'g'), replaces[item]);
							}
						}

						return finalText;
					};
				}
			},

			grabTemplates: function() {
				var i,
					l,
					scripts = document.getElementsByTagName('script'),
					trash = [];

				for (i = 0, l = scripts.length; i < l; i++) {
					var script = scripts[i];
					if (script && script.innerHTML && script.id && script.type === "text/html") {
						_root.Templates.define(script.id, _trim(script.innerHTML));
						trash.unshift(script);
					}
				}
				for (i = 0, l = trash.length; i < l; i++) {
					trash[i].parentNode.removeChild(trash[i]);
				}
			}
		};

		this.Worker = function (job) {

			var WorkerObj = function() {
				var _workerSelf = this;

				var _complete = function() {};
				var _error = function() {};
				var _progress = function() {};

				this.next = function() {
					setTimeout(function() {
						job(_workerSelf);
					}, 0);
				};

				this.complete = function(value) {
					if(!_isEmpty(_complete)) {
						_complete(value);
					}
				};

				this.error = function(error) {
					if(!_isEmpty(_error)) {
						_error(error);
					}
				};

				this.progress = function(value) {
					if(!_isEmpty(_progress)) {
						_progress(value);
					}
				};

				this.then = function(onComplete, onError, onProgress) {
					_complete = onComplete || function() {};
					_error = onError || function() {};
					_progress = onProgress || function() {};
				};
			};

			var _worker = new WorkerObj();

			setTimeout(function() {
				job(_worker);
			}, 0);

			return _worker;
		};

	};

	var _eight = new Eight();

	_eight.Utilities.DOMReady(function() {
		_eight.Utilities.isDOMReady = true;
		_eight.Templates.grabTemplates();
	});

	window.Eight = window.$8 = _eight;

})(window);

(function(window) {
	'use strict';

	var $8 = window.$8,
		_isEmpty = $8.Utilities.isEmpty,
		_isArray = $8.Utilities.isArray,
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

			if(!_isEmpty(el.DOM)) {
				return el;
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
					this.DOM.className = newClasses;
				},

				style: function(name, value) {
					var trueName = '';
					for(var i = 0; i < name.length; i++) {
						if(name[i] == '-') {
							if(name.length > i + 1)	{
								trueName += name[i+1].toUpperCase();
								i++;
							}
						}
						else {
							trueName += name[i];
						}
					}

					if(_isEmpty(value)) {
						return this.DOM.style[trueName];
					}

					this.DOM.style[trueName] = value;
					return this;
				},

				html: function(html) {
					if(_isEmpty(html)) {
						return this.DOM.innerHTML;
					}

					this.DOM.innerHTML = html;
					return this;
				},

				append: function(html) {
					if(_isEmpty(html)) {
						return this.DOM.innerHTML;
					}

					this.DOM.innerHTML += html;
					return this;
				}
			};
		};

		function getElementsByAttribute(attribute, parent, result) {
			result = result || [];

			var elements = false;
			if(_isEmpty(parent)) {
				elements = [window.document.body];
			}
			else {
				elements = parent.children;
			}

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

		this.removeEl = function(el) {
			if(!_isEmpty(el.DOM)) {
				el = el.DOM;
			}
			el.parentNode.removeChild(el);
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

		var shortcuts = [],
			verboseMode = false;

		$8.Utilities.addEvent(window.document, 'keyup', function(e) {
			e = window.event || e;

			if(verboseMode) {
				window.console.log('[CTRL]: ' + e.ctrlKey + ', [SHIFT]: ' + e.shiftKey + ', [ALT]: ' + e.altKey + ', keyCode: ', e.keyCode);
			}

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
			},

			verbose: function(activation) {
				if(activation !== false) {
					activation = true;
				}

				verboseMode = activation;
			}
		};

		this.Animations = {
			define: function(name, options, action) {
				if(_isArray(name)) {
					for(var i = 0; i < name.length; i++) {
						if(!_root.Animations.define(name[i][0], name[i][1], name[i][2])) {
							return false;
						}
					}

					return true;
				}
				else {
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
				}
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
							if(_isEmpty(options.el[i].DOM)) {
								options.el[i] = _root.el(options.el[i]);
							}
						}
					}

					var changeValue = options.to - options.from;

					var _worker = $8.Worker(function(worker) {
						options.loop++;
						var currentTime = options.loop / 10;
						options.current = options.easing(currentTime, options.from, changeValue, options.duration);
						options.percent = (options.current - options.from) * 100 / (options.to - options.from);

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
		_layoutTypes = ['hub', 'section', 'detail'];

	$8.UI.Controls.register('page',

		// Params
		{
			showGrid: false,
			layout: 'hub',
			orientation: 'horizontal',
			title: '',
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
			if(params.orientation == 'horizontal') {
				contentHeight = screenSize.height - (9.5 * $8.UI.Unit.height);
			}

			html += $8.Templates.h8_page_container({
				id: id,
				content_orientation: params.orientation,
				content_width: contentWidth,
				content_height: contentHeight,
				content: content,
				idPopup: idPopup,
				idNotification: idNotification,
				parameters: parameters,
				appbar: appbar
			});

			el.html(html);

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
				page.refresh(el);
				page.fireEvent(el, 'resize', e);
			});

			$8.UI.Controls.afterProcessAll(function() {
				var i, j;

				var scrollerContent = $8.UI.el(id + '_scroller_content');
				scrollerContent.addClass('h8-page-scroller-content');

				page.refresh(el);

				el.style('visibility', 'visible');

				var splashscreens = $8.UI.Controls.get('splashscreen');
				for(i = 0; i < splashscreens.length; i++) {
					$8.UI.Controls['splashscreen'].remove(splashscreens[i].el);
				}

				page.setTitle(el, params.title);

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

				page.fireEvent(el, 'loaded');
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
				var params = $8.UI.Controls.getParams(el.DOM.id),
					screenSize = $8.UI.screenSize(),
					width = 0,
					height = 0,
					scrollerEl = $8.UI.el(el.DOM.id + '_scroller'),
					scrollerContent = $8.UI.el(el.DOM.id + '_scroller_content');

				width = screenSize.width;
				height = screenSize.height - (7 * $8.UI.Unit.height);
				if(params.orientation == 'horizontal') {
					height = screenSize.height - (9.5 * $8.UI.Unit.height);
				}

				scrollerEl.style('width', width + 'px')
					.style('height', height + 'px');

				if(params.orientation == 'horizontal') {
					var columns = $8.UI.Controls.get('column');

					width = 0;
					for (var i = 0; i < columns.length; i++) {
						if(!_isEmpty(columns[i].el) && !_isEmpty(columns[i].params.width)) {
							width += columns[i].params.width + 40;
						}
					}
					width += 120; // padding
					scrollerContent.style('width', width + 'px');
					$8.UI.Controls.scroller.refresh($8.UI.el(el.DOM.id + '_scroller'));
				}
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