Eight.js
=======

Parts implementation of the WinJS & WinRT (UI) from Windows 8.

Live examples of the latest version here: http://xavierboubert.fr/eightjs/examples/


Installation
--------

Copy the "lib" folder into your project and rename it to "eightjs".
Add these lines into your `<head>` tags of your pages:

	<link rel="stylesheet" type="text/css" href="eightjs/css/Eight.all.min.css" />
	<script type="text/javascript" src="eightjs/Eight.all.min.js"></script>

Creating page
--------

TODO



Namespaces
--------

**StructJS.Namespace**

*   define() Make a new namespace. You can add a tree with dots: 'Users.Groups.Search'
*   defineInParent() Make a new namespace inside a parent. Dots works again.


Classes
--------

**StructJS.Class**

*   define() Make a new class
*   mix() Mix two classes or objects
*   clone() Make a new class from another
*   inherit() Inherit class in a new one


Property
--------

**StructJS.Property**

You can make a Property in your classes with getter and setter fonctions


Promise
--------

**StructJS.Promise**

Light integration of http://wiki.commonjs.org/wiki/Promises


Templates
--------

**StructJS.Template**

Add templates in text/HTML scripts an use these by

`StructJS.Template.mytemplate();`

