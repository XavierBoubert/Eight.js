/*
 * This file is part of the Eight.js library.
 *
 * (c) 2012 Xavier Boubert
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
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
			obj.addEventListener(eventName, callback, false);
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