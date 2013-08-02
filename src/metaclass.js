/*
	(c) 2011-2013, Michel Beaudouin-Lafon, mbl@lri.fr
	Open sourced under the MIT License

	The metaclass object for the basic OO features
*/

/*
 *	Metaclass is the prototype for class objects.
 *	It contains the methods that can be called on a class:
 *		- name and toString, to give the class a name and print a simple text description ("class X")
 *		- __init and __alloc, for object creation, which are private (hence the __ prefix)
 *		- create, the default constructor for objects of this class
 *		- field, activField and fields, to declare fields
 *		- hasField, hasOwnField to test existence of a declared field (active or not)
 *		- constructor and constructors, to declare constructors
 *		- method and methods, to declare methods
 *		- subclass, to create a new subclass
 *		- superclass, to return the superclass
 *		- hasOwnMethod, hasOwnConstructor to test the existence of a method or constructor in that specific class
 *		- hasMethod, hasConstructor to test the existence of a method or constructor along the inheritance chain
 *		- classMethod, classMethods, classField, classFields to add class methods and fields
 *		- wrap, unwrap, unwrapAll, wrappers, wrapped to manage method wrappers		[mixin]
 *		- wrapField, wrapFields to wrap fields with getter/setter					[wrapfield]
 *		- mixin, unmix, hasMixin to manage mixins									[mixin]
 *
 *	A few points worth noting:
 *		- default values: when creating a new object, the fields described in its class (and its superclasses)
 *		  are copied before the constructor itself is called.
 *		  If a default value is:
 *				- a scalar, a Classy object or class, its value is simply assigned to the object property
 *				- a litteral object or array, a (deep) copy is made and assigned to the object property
 *				- a function, the result of calling the function is assigned to the object property
 *				- an active field, i.e. a field with a getter and/or setter, the getter and/or setter are copied as is
 *		  In case you want a literal object to not be cloned but instead shared by the various instances,
 *		  you can do one of two things:
 *				- mark it as immutable by setting its __immutable property to true
 *				- define the following function:
 *					function shared(obj) { return function() {return obj; }};
 *				  and use it for the default value:
 *					field('color', shared({r: 0, g: 1, b:0.5}));
 *		
 */
Metaclass = {
	// ======== CONVENIENCE METHODS ========

	name: function(name) {
		this.__name = name;
		return this;
	},
	className: function() {
		return this.__name;
	},

	// short text description: 'class X' if it has a name, 'class #nn' otherwise
	toString: function() {
		return 'class '+ (this.__name || '');
	},
	
	// ======== OBJECT CREATION ========

	// intialize the properties of a new object from the default values of the field
	__init: function(obj) {
		// walk up the inheritance chain to start at the top
		if (this.__superclass !== Object)
			this.__superclass.__init(obj);
		
		// 'intelligently' copy the default values:
		copyFields(this.__fields, obj);
		copyActiveFields(this.__activeFields, obj);
#ifdef MIXIN
		wrapFields(this.__wrappedFields, obj, this);
		for (var m = 0; m < this.__mixins.length; m++) {
			var mixin = this.__mixins[m]; 
			copyFields(mixin.fields, obj);
			wrapFields(mixin.fieldWrappers, obj, mixin);
		}
#endif
	},
	
	// allocate a new object and initialize its properties
	__alloc: function(init) {
		// set the proper prototype before calling the object constructor
		object.prototype = this.__methods;
		return new object(this, init);
	},
	
	create: function(init) {
		var newobj = this.__alloc(init);
#ifdef MIXIN
		for (var m = 0; m < this.__mixins.length; m++)
			this.__mixins[m].constructor.apply(newobj);
#endif
		return newobj;
	},
	
	// ======== FIELDS ========

	// define a field with its default value
	field: function(name, value) {
		this.__fields[name] = value;
		return this;
	},
	
	// define multiple fields at once, using a literal object of the form {x: 0, y: 0}
	// this form also supports active fields, i.e. fields with getter and/or setter, e.g. {get x() {...}, set x(val) {...}, ...}
	fields: function(list) {
		for (var item in list)
			if (! copyActiveField(list, item, this.__activeFields))
				this.field(item, list[item]);
		return this;
	},
	
	// define an active field with its getter and setter
	activeField: function(name, getter, setter) {
		var d = { enumerable: true, configurable: true };
		if (getter)
			d.get = getter;
		if (setter)
			d.set = setter;
		Object.defineProperty(this.__activeFields, name, d);
		return this;
	},
	
	// return true if field defined in this class
	hasOwnField: function(name) {
		return this.__fields.hasOwnProperty(name) || this.__activeFields.hasOwnProperty(name);
	},

	// return true if field defined in this class or a superclass
	hasField: function(name) {
		var cl = this;
		do {
			if (cl.hasOwnField(name))
				return true;
			cl = cl.__superclass;
		} while (cl != Object);
		return false;
	},

	// return array with names of local fields
	listOwnFields: function() {
		var result = [];
		for (var field in this.__fields)
			result.push(field);
		for (field in this.__activeFields)
			result.push(field);
		return result;
	},

	// return array with names of fields in this class and any superclass
	listFields: function() {
		var cl = this;
		var result = [];
		var field;
		do {
			for (field in cl.__fields)
				if (result.indexOf(field) < 0)
					result.push(field);
			for (field in cl.__activeFields)
				if (result.indexOf(field) < 0)
					result.push(field);
			cl = cl.__superclass;
		} while (cl != Object);
		return result;
	},

	// ======== CONSTRUCTORS and METHODS ========

	// define one constructor. Omit the name or use 'create' for the default constructor
	constructor: function(name, fun) {
		// define the default 'create' constructor if name is omitted
		if (! fun && typeof(name) == 'function') {
			fun = name;
			name = 'create';
		}
		
		// create the initialization function and store it in __constructors
		fun = constructorWithSuper(this, name, fun);		
		this.__constructors[name] = fun;
		
		// create the actual constructor function, which creates the object with __alloc and then calls the initializer
		// note that by storing this constructor in the metaclass, it is visible to this class and all its subclasses
		// through the delegation link established in newClass
		this.__metaclass[name] = function() {
			var obj = this.__alloc();
			fun.apply(obj, arguments);
			return obj;
		};
		return this;
	},
	
	// define multiple constructors at once, using a literal object
	constructors: function(list) {
		for (var item in list)
			this.constructor(item, list[item]);
		return this;
	},
	
	// define (or redefine) one method - *** note that if the method exists and has wrappers, they are all removed
	method: function(name, fun) {
		if (! fun) {	// undefine the method (and all its wrappers)
			delete this.__methods[name];
			return this;
		}
#ifdef MIXIN
		var wrappers = wrappers = unwrapWrappers(this, name);
#endif
		fun = methodWithSuper(fun, name, this.__superclass);
		this.__methods[name] = fun;
#ifdef MIXIN
		wrapWrappers(this, name, wrappers);
#endif
		return this;
	},

	// define multiple methods at once, using a literal object
	methods: function(list) {
		for (var item in list)
			this.method(item, list[item]);
		return this;
	},
	
	// test existence of methods and constructors in this class
	hasOwnConstructor: function(name) {
		return name == 'create' || this.__constructors.hasOwnProperty(name);
	},
	hasOwnMethod: function(name) {
		return this.__methods.hasOwnProperty(name);
	},
	
	// get constructor and method bodies
	getOwnConstructor: function(name) {
		return this.__constructors.hasOwnProperty(name || 'create');
	},
	getOwnMethod: function(name) {
		return this.__methods.hasOwnProperty(name) ? this.__methods[name] : undefined;
	},
	
	// return array with names of local constructors / methods
	listOwnConstructors: function() {
		var result = ['create'];
		for (var constructor in this.__constructors)
			if (constructor !== 'create')
				result.push(constructor);
		return result;
	},

	listOwnMethods: function() {
		var result = [];
		for (var method in this.__methods)
			result.push(method);
		return result;
	},

	// test existence of method and constructor in this class or one of its superclasses
	hasConstructor: function(name) {
		return name == 'create' || (this.__constructors[name] !== undefined);
	},
	hasMethod: function(name) {
		return this.__methods[name] !== undefined;
	},

	getConstructor: function(name) {
		if (!name)
			name = 'create';
		return this.__constructors[name];
	},

	getMethod: function(name) {
		return this.__methods[name];
	},

	// return array with names of constructors / methods in this class and any superclass
	listConstructors: function() {
		var cl = this;
		var result = ['create'];
		var constructor;
		do {
			for (constructor in cl.__constructors)
				if (result.indexOf(constructor) < 0)
					result.push(constructor);
			cl = cl.__superclass;
		} while (cl != Object);
		return result;
	},

	listMethods: function() {
		var cl = this;
		var result = [];
		var method;
		do {
			for (method in cl.__methods)
				if (result.indexOf(method) < 0)
					result.push(method);
			cl = cl.__superclass;
		} while (cl != Object);
		return result;
	},


#ifdef MIXIN
#include "mixin-metaclass.js"
#endif
	
	// ======== CLASS HIERARCHY ========

	// create a subclass of this class
	subclass: function() {
		return newClass(this);
	},
	
	// return the superclass of this class
	superclass: function() {
		return this.__superclass;
	},

	// ======== CLASS FIELDS and CLASS METHODS ========

	classMethod: function(name, fun) {
		if (! fun) {	// undefine the class method
			delete this.__metaclass[name];
			return this;
		}
		this.__metaclass[name] = fun;
		return this;
	},
	
	classMethods: function(list) {
		for (var item in list)
			this.classMethod(item, list[item]);
		return this;
	},
	
	classField: function(name, value) {
		this.__metaclass[name] = value;
		return this;
	},
	
	classFields: function(list) {
		for (var item in list)
			if (! copyActiveField(list, item, this.__metaclass))
				this.classField(item, list[item]);
		return this;
	},

};
