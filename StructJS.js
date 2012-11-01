(function(window) {
	'use strict';

	var i;

	function isEmpty(obj) {
		if(typeof obj == 'undefined' || !obj)
			return true;

		return false;
	}

	function trim (value) {
		if (''.trim)
			return value.trim();

		return value.replace(/^\s+/, '').replace(/\s+$/, '');
	}

	function DOMReady(callback) {
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


	var namespaceDefine = function(name, objects, parentNamespace) {
		if(isEmpty(parentNamespace)) {
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
	};

	function classDefine(init, publicObjects, staticObjects, proto) {
		var
			classObj = init,
			item;

		if(!isEmpty(proto)) {
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

	var StructJS = function() {

		var that = this;

		this.Utilities = {
			isEmpty: isEmpty,
			trim: trim,
			DOMReady: DOMReady
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
				if(isEmpty(value)) {
					if(!isEmpty(get))
						return get(this);
				}
				else {
					if(!isEmpty(set))
						return set(this, value);
				}
			};
		};

		this.Promise = function(job) {
			var thenTable = [];

			var promise = function () {

				var promiseSelf = this;

				this.then = function(complete, error, progress) {
					thenTable.push({
						complete: complete || function() { },
						error: error || function() { },
						progress: progress || function() { }
					});

					return promiseSelf;
				};
			};

			that.Worker(function (worker) {

				if(thenTable.length > 0) {
					job(
						thenTable[0].complete,
						thenTable[0].error,
						thenTable[0].progress
					);

					thenTable.splice(0, 1);
				}

				console.log(thenTable);

				if(thenTable.length > 0) {
					worker.next();
				}
			});

			return new promise();
		};

		this.Template = {
			templates: {},

			addTemplate: function(name, templateString) {
				that.Template.templates[name] = templateString;
				that.Template[name] = function (replaces, increment) {
					replaces = replaces || {};
					increment = increment || 0;

					var text = that.Template.templates[name], finalText = '', item;

					if(typeof replaces == 'object' && (replaces instanceof Array)) {
						for(var i = 0; i < replaces.length; i++) {
							finalText += that.Template[name](replaces[i], i);
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
				var
					i,
					l,
					scripts = document.getElementsByTagName('script'),
					trash = [];

				for (i = 0, l = scripts.length; i < l; i++) {
					var script = scripts[i];
					if (script && script.innerHTML && script.id && script.type === "text/html") {
						that.Template.addTemplate(script.id, trim(script.innerHTML));
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

				var workerSelf = this;

				this.next = function() {
					setTimeout(function() {
						job(workerSelf);
					}, 0.01);
				};
			}

			setTimeout(function() {
				job(new worker());
			}, 0.01);
		};

	};

	var structJS = new StructJS();

	structJS.Utilities.DOMReady(function() {
		structJS.Template.grabTemplates();
	});

	window.StructJS = structJS;

})(window);