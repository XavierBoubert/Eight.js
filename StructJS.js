(function(window) {
	'use strict';

	var i;

	function isEmpty(obj) {
		if(typeof obj == 'undefined' || !obj)
			return true;

		return false;
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

	var StructJS = function() {

		this.Utilities = {
			isEmpty: isEmpty
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

			}

			// Properties
		};

		this.Promise = {

		};

		this.Template = {

		};

	};

	window.StructJS = new StructJS();

})(window);