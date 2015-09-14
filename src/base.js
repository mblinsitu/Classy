/*
	(c) 2011-2013, Michel Beaudouin-Lafon, mbl@lri.fr
	Open sourced under the MIT License

	Basic OO features of Classy.
	The Metaclass object is defined in metaclass.js.
*/

var Metaclass;

/*
 *	The constructor function for new objects.
 *	An object remembers its class and is inited first with its class (and the class's superclass) fields,
 *	then with the optional 'init' parameter, which is expected to be a literal object.
 */
function object(myClass, init) {
	//this.__class = myClass;
	Object.defineProperty(this, "__class", {
		value: myClass,
		writable: false,
		enumerable: false,
		configurable: false,
	});
	myClass.__init(this);

	// if there is a parameter, it is expected to be a list of field/values
	if (init)
		copyFields(init, this);
}

/*
 *	Create and return a copy of a value.
 *	Literal values are returned as is.
 *	Objects are recursively copied _except_ if they are:
 *		- a Classy object or class
 *		- an immutable object, recognized because it has a property '__immutable' that evaluates to true
 *	The deep copy takes proper care of shared objects and cycles.
 *	objectmap is an optional mapping of objects to their copies
 */
function copyValue(obj, /*opt*/ objectmap) {
	// simple case: objects that are simple values or objects that are immutable
    if (obj === null || typeof(obj) != 'object' || obj.__class || obj.__metaclass || obj.__immutable)
        return obj;
	
	// initialize the object map if undefined
	if (objectmap) {
		// lookup the object in the map and return the recorded copy if any
		var i = objectmap.objects.indexOf(obj);
		if (i >= 0)
			return objectmap.copies[i];
	}
	
    var newobj = new obj.constructor();	// this assumes the constructor does not need parameters
	if (objectmap) {
		// remember object mapping for cycles and shared subobjects
		objectmap.objects.push(obj);
		objectmap.copies.push(newobj);
	}
	
	// recursive copy
    for (var key in obj)
       newobj[key] = copyValue(obj[key], objectmap);
	return newobj;
}

/*
 *	copy a list of (non-active) fields into an object
 */
function copyFields(fields, obj) {
	var objectmap = { objects: [], copies: []};
	for (var f in fields) {
		var value = fields[f];
		if (typeof(value) == "function")
			obj[f] = value.apply(obj);	// dynamic value: call the function
		else
			obj[f] = copyValue(value, objectmap);	// smart copy of the value
	}
}

/*
 *	If field is an active field of obj (i.e., field has a getter and/or setter),
 *	copy that field to target and return true, otherwise do nothing and return false.
 */
function copyActiveField(obj, field, target) {
	var d = Object.getOwnPropertyDescriptor(obj, field);
	if (d.get || d.set)
		Object.defineProperty(target, field, d);
	return (d.get || d.set);
	/*
	if (getter)
		target.__defineGetter__(field, getter);
	if (setter)
		target.__defineSetter__(field, setter);
	return (getter || setter);
	*/
}

/*
 *	copy a list of active fields into an object
 */
function copyActiveFields(fields, obj) {
	for (var f in fields)
		copyActiveField(fields, f, obj);
}

/*
 *	Implement call to super in constructors.
 *	'constructorWithSuper' wraps the constructor 'fun' in a function that defines
 *	this._super(), as well as calling the mixins' constructors, if any.
 */

function noSuper() {}

function constructorWithSuper(myClass, name, fun) {
	var superclass = myClass.__superclass;
	
	// if there is no call to super, simply call the constructor function and the mixins constructors
	if (fun.toString().search(/\W_super\W/m) < 0) {
#ifdef MIXIN
		return function() {
			fun.apply(this, arguments);
			for (var m = 0; m < myClass.__mixins.length; m++)
				myClass.__mixins[m].constructor.apply(this);
			return this;
		};
#else
		return fun;
#endif
	}

	// general case
	return function() {
		// create the _super function and store it in this._super.
		// save any previous value so we can restore it at the end
		var savedsuper = this._super;
		this._super = (superclass == Object) ? noSuper : (superclass.__constructors[name] || noSuper);
		try {
			var res = fun.apply(this, arguments);
#ifdef MIXIN
			for (var m = 0; m < myClass.__mixins.length; m++)
				myClass.__mixins[m].constructor.apply(this);
#endif
		} finally {
			if (savedsuper) this._super = savedsuper; else delete this._super;
		}
		return this;
	};
}

/*
 *	Implement call to super in a method.
 *	'methodWithSuper' wraps the method 'fun' in a function that defines this._super().
 */
function methodWithSuper(fun, name, superclass) {
	// optimization: no need to wrap if fun does not contain _super
	if (fun.toString().search(/\W_super\W/m) < 0)
		return fun;
	
	return function() {
		// create the _super function and store it in this._super.
		// save any previous value so we can restore it at the end
		var savedsuper = this._super;
		this._super = (superclass == Object) ? noSuper : (superclass.__methods[name] || noSuper);
		try {
			// call the original method
		 	return fun.apply(this, arguments);
		} finally {
			// restore state
			if (savedsuper) this._super = savedsuper; else delete this._super;
		}
	};
}

/*
 *	Each base class has a few object methods (in addition to those in Object, of course)
 *		set can be used to set multiple field values at once
 *		get can be used to get multiple field values at once
 *		wrapField can be used to immediately wrap a field of this object
 *		unwrapField can be used to remove it. 
 *			Use a class as 'owner' to remove a field wrapped by a class,
 *			and a mixin to remove a field wrapped by the mixin.
 */
var objectMethods = {
	toString: function() { return this.__class ? 'instance of ' + this.__class : '[unknown Classy Object]';},
	className: function() { return this.__class.__name; },
	// classs (with 3ss because 'class' is reserved)
	classs: function() { return this.__class; },
	// Set one or more fields at once. 3 possible syntax:
	//	obj.set('field1', value1, 'field2', value2, ...)
	//	obj.set(['field1', 'field2', ...], [value1, value2, ...])
	//	obj.set({ field1: value, fields2: value2, ...})  - works also with one of our objects (use its declared fields)
	// Fields that are not defined as such are ignored
	// set always returns the this object
	set: function(field, value /*varargs*/) {
		var i, name;
		switch(arguments.length) {
			case 0:
				return this;

			case 1:
				// obj.set({f1: v1, f2: v2, ...})  - sets multiple values
				var obj = field;
				if (!obj)
					return this;
				if (obj.__class) {	// this is one of our objects - use its fields
					var fields = obj.__class.listAllFields();
					for (i = 0; i < fields.length; i++) {
						name = fields[i];
						if (this.__class.hasField(name))
							this[name] = obj[name];
					}
				} else {
					for (name in obj)
						if (this.__class.hasField(name))
							this[name] = obj[name];
				}
				return this;

			case 2:
				// obj.set(["f1", "f2", "f3"], [v1, v2,v3])  - sets multiple values
				if (field instanceof Array && value instanceof Array) {
					for (i = 0; i < field.length; i++) {
						name = field[i];
						if (this.__class.hasField(name))
							this[name] = value[i];
					}
					return this;
				}
				// fallthrough to catch the case obj.set('field', value)
				/*fall through*/
			default:
				// obj.set("field", value, ...)
				for (i = 0; i < arguments.length; i+= 2) {
					name = arguments[i];
					value = arguments[i+1];
					if (this.__class.hasField(field))
						this[name] = value;
				}
				return this;
		}
	},
	// get the value of one or more fields. 5 possible syntax:
	//	obj.get()  - returns all the fields and their values in a literal object
	//	obj.get('field')  - returns value
	//	obj.get('field1', 'field2', ...)  - returns a flat field, value, ... list
	//	obj.get(['field1', 'field2', ...])  - returns an array of values
	//	obj.get({ field: v1, field2: v2, ...})  - values of existing fields are ignored, returns an object (works with one of our objects too)
	get: function(field /*varargs*/) {
		var obj, fields;
		var i, name;
		switch (arguments.length) {
			case 0:
				//	obj.get()  - returns all the fields
				fields = this.__class.listAllFields();
				obj = {};
				for (i = 0; i < fields.length; i++) {
					name = fields[i];
					obj[name] = this[name];
				}
				return obj;

			case 1:
				// obj.get(["f1", "f2", "f3"])  - returns array of values
				if (field instanceof Array) {
					var values = [];
					for (i = 0; i < field.length; i++) {
						name = field[i];
						if (this.__class.hasField(name))
							values.push(this[name]);
						else
							values.push(undefined);
					}
					return values;
				}

				// obj.get("field")  - returns single value
				if (typeof field == 'string' || field instanceof String) {
					if (this.__class.hasField(field))
						return this[field];
					return undefined;
				}

				// obj.get({f1: v1, f2: v2, ...})  - values are ignored
				if (typeof field == 'object') {
					obj = {};
					if (field.__class) {	// this is one of our objects
						fields = field.__class.listAllFields();
						for (i = 0; i < fields.length; i++) {
							name = fields[i];
							if (this.__class.hasField(name))
								obj[name] = this[name];
						}
					} else {
						for (name in field)
							if (this.__class.hasField(name))
								obj[name] = this[name];
					}
					return obj;					
				}
				return null;

			default:
				//	obj.get('field1', 'field2', ...)  - returns a flat field, value list
				var result = [];
				for (i = 0; i < arguments.length; i++) {
					name = arguments[i];
					if (this.__class.hasField(name))
						result.push(name, this[name]);
				}
				return result;
		}
	},
#ifdef MIXIN
	wrapField: function(field, getter, setter, /*opt*/ owner) { wrapField(this, field, getter, setter, owner || this); return this; },
	wrapFields: function(fields, /*opt*/ owner) { wrapFields(fields, this, owner || this); },
	unwrapField: function(field, /*opt*/ owner) { unwrapField(this, field, owner || this); return this; },
	unwrapFields: function(/*opt*/ owner) { unwrapFields(this, owner || this); return this; },
#endif
};

/*
 *	Create a new class
 */
function newClass(superclass) {
	if (! superclass) 
		superclass = Object;
	
	// the future prototypes in the delegation chains for class methods (including constructors),
	// constructors (in fact, initializers), and methods
	var metaclass, constructors, methods;
	
	// the constructor for the metaclass object
	function classProto() {}
	
	if (superclass === Object) { // it is a new base class
		// the tail of the metaclass delegation chain is the Metaclass object itself.
		classProto.prototype = Metaclass;
		
		// the tail of the constructors delegation chain.
		constructors = {};
		
		// the methods defined in every class
		function methodTable() {}
	    methodTable.prototype = objectMethods; 
	    methods = new methodTable(); 
	} else { // it is a new subclass
		// chain the metaclass to the superclass´s metaclass
		classProto.prototype = superclass.__metaclass;
		
		// create a constructor table that is chained to the superclass´s constructor table
		/*jshint supernew: true*/
		var ctorTable = new Function(); // function ctorTable() {}
		ctorTable.prototype = superclass.__constructors;
		constructors = new ctorTable();
		
		// similarly, create a method table thast is chained to the superclass´s method table
		var methodTable = new Function(); // function methodTable() {}
	    methodTable.prototype = superclass.__methods; 
	    methods = new methodTable(); 
	}
	
	// create the metaclass object. Its superclass is the metaclass of the superclass (!)
	metaclass = new classProto();
//	metaclass.superclass = classProto.prototype;
	
	// constructor for the class object itself
	// its prototype is the new metaclass
	// *** we could get rid of the '__' prefix now that all external methods are in other objects (metaclass, constructors, methods) ***
	var cls = function() {
		this.__metaclass = metaclass;
		this.__superclass = superclass;
		this.__constructors = constructors;
		this.__methods = methods;
		this.__fields = {};
		this.__activeFields = {};
#ifdef MIXIN
		this.__mixins = [];
		this.__wrappedFields = {};
#endif
	};
	cls.prototype = metaclass;
	
	// finally, create and return the class itself
	return new cls();
}
