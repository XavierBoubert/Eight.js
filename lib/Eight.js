(function(window) {
	'use strict';

	var i;

	function _isEmpty(obj) {
		if(typeof obj == 'undefined' || !obj)
			return true;

		return false;
	}

	function _trim (value) {
		if (''.trim)
			return value.trim();

		return value.replace(/^\s+/, '').replace(/\s+$/, '');
	}

	function _DOMReady(callback) {
		if (document.addEventListener) {
			document.addEventListener('DOMContentLoaded', callback, false);
		}
		/* Safari, iCab, Konqueror */
		if (/KHTML|WebKit|iCab/i.test(navigator.userAgent)) {
			var DOMLoadTimer = setInterval(function () {
				if (/loaded|complete/i.test(document.readyState)) {
					callback();
					clearInterval(DOMLoadTimer);
				}
			}, 10);
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

				if(typeof searchNamespace[namespace] == 'undefined')
					break;

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

		var _root = this;

		this.Utilities = {
			isEmpty: _isEmpty,
			trim: _trim,
			DOMReady: _DOMReady
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

			var _promise = function () {

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

				}, 0.01);
			}

			doJob();

			return new _promise();
		};

		this.Template = {
			_templates: {},

			addTemplate: function(name, templateString) {
				_root.Template._templates[name] = templateString;
				_root.Template[name] = function (replaces, increment) {
					replaces = replaces || {};
					increment = increment || 0;

					var text = _root.Template._templates[name], finalText = '', item;

					if(typeof replaces == 'object' && (replaces instanceof Array)) {
						for(var i = 0; i < replaces.length; i++) {
							finalText += _root.Template[name](replaces[i], i);
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
			},

			grabTemplates: function() {
				var i,
					l,
					scripts = document.getElementsByTagName('script'),
					trash = [];

				for (i = 0, l = scripts.length; i < l; i++) {
					var script = scripts[i];
					if (script && script.innerHTML && script.id && script.type === "text/html") {
						_root.Template.addTemplate(script.id, _trim(script.innerHTML));
						trash.unshift(script);
					}
				}
				for (i = 0, l = trash.length; i < l; i++) {
					trash[i].parentNode.removeChild(trash[i]);
				}
			}
		};

		this.Worker = function (job) {

			var worker = function() {
				var _workerSelf = this;

				var _complete = function() {};
				var _error = function() {};
				var _progress = function() {};

				this.next = function() {
					setTimeout(function() {
						job(_workerSelf);
					}, 0.01);
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

			var _worker = new worker();

			setTimeout(function() {
				job(_worker);
			}, 0.01);

			return _worker;
		};

	};

	var _eight = new Eight();

	_eight.Utilities.DOMReady(function() {
		_eight.Template.grabTemplates();
	});

	window.Eight = window.$8 = _eight;

})(window);