// Classy - Yet another Javascript OO-framework (basic)
// (c) 2011-2015, Michel Beaudouin-Lafon, mbl@lri.fr
// Open sourced under the MIT License
(function(exports) {
var Metaclass;
function object(myClass, init) {
	Object.defineProperty(this, "__class", {
		value: myClass,
		writable: false,
		enumerable: false,
		configurable: false,
	});
	myClass.__init(this);
	if (init)
		copyFields(init, this);
}
function copyValue(obj,  objectmap) {
    if (obj === null || typeof(obj) != 'object' || obj.__class || obj.__metaclass || obj.__immutable)
        return obj;
	if (objectmap) {
		var i = objectmap.objects.indexOf(obj);
		if (i >= 0)
			return objectmap.copies[i];
	}
    var newobj = new obj.constructor();	
	if (objectmap) {
		objectmap.objects.push(obj);
		objectmap.copies.push(newobj);
	}
    for (var key in obj)
       newobj[key] = copyValue(obj[key], objectmap);
	return newobj;
}
function copyFields(fields, obj) {
	var objectmap = { objects: [], copies: []};
	for (var f in fields) {
		var value = fields[f];
		if (typeof(value) == "function")
			obj[f] = value.apply(obj);	
		else
			obj[f] = copyValue(value, objectmap);	
	}
}
function copyActiveField(obj, field, target) {
	var d = Object.getOwnPropertyDescriptor(obj, field);
	if (d.get || d.set)
		Object.defineProperty(target, field, d);
	return (d.get || d.set);
}
function copyActiveFields(fields, obj) {
	for (var f in fields)
		copyActiveField(fields, f, obj);
}
function noSuper() {}
function constructorWithSuper(myClass, name, fun) {
	var superclass = myClass.__superclass;
	if (fun.toString().search(/\W_super\W/m) < 0) {
		return fun;
	}
	return function() {
		var savedsuper = this._super;
		this._super = (superclass == Object) ? noSuper : (superclass.__constructors[name] || noSuper);
		try {
			var res = fun.apply(this, arguments);
		} finally {
			if (savedsuper) this._super = savedsuper; else delete this._super;
		}
		return this;
	};
}
function methodWithSuper(fun, name, superclass) {
	if (fun.toString().search(/\W_super\W/m) < 0)
		return fun;
	return function() {
		var savedsuper = this._super;
		this._super = (superclass == Object) ? noSuper : (superclass.__methods[name] || noSuper);
		try {
		 	return fun.apply(this, arguments);
		} finally {
			if (savedsuper) this._super = savedsuper; else delete this._super;
		}
	};
}
var objectMethods = {
	toString: function() { return this.__class ? 'instance of ' + this.__class : '[unknown Classy Object]';},
	className: function() { return this.__class.__name; },
	classs: function() { return this.__class; },
	set: function(field, value ) {
		var i, name;
		switch(arguments.length) {
			case 0:
				return this;
			case 1:
				var obj = field;
				if (!obj)
					return this;
				if (obj.__class) {	
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
				if (field instanceof Array && value instanceof Array) {
					for (i = 0; i < field.length; i++) {
						name = field[i];
						if (this.__class.hasField(name))
							this[name] = value[i];
					}
					return this;
				}
			default:
				for (i = 0; i < arguments.length; i+= 2) {
					name = arguments[i];
					value = arguments[i+1];
					if (this.__class.hasField(field))
						this[name] = value;
				}
				return this;
		}
	},
	get: function(field ) {
		var obj, fields;
		var i, name;
		switch (arguments.length) {
			case 0:
				fields = this.__class.listAllFields();
				obj = {};
				for (i = 0; i < fields.length; i++) {
					name = fields[i];
					obj[name] = this[name];
				}
				return obj;
			case 1:
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
				if (typeof field == 'string' || field instanceof String) {
					if (this.__class.hasField(field))
						return this[field];
					return undefined;
				}
				if (typeof field == 'object') {
					obj = {};
					if (field.__class) {	
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
				var result = [];
				for (i = 0; i < arguments.length; i++) {
					name = arguments[i];
					if (this.__class.hasField(name))
						result.push(name, this[name]);
				}
				return result;
		}
	},
};
function newClass(superclass) {
	if (! superclass) 
		superclass = Object;
	var metaclass, constructors, methods;
	function classProto() {}
	if (superclass === Object) { 
		classProto.prototype = Metaclass;
		constructors = {};
		function methodTable() {}
	    methodTable.prototype = objectMethods; 
	    methods = new methodTable(); 
	} else { 
		classProto.prototype = superclass.__metaclass;
		var ctorTable = new Function(); 
		ctorTable.prototype = superclass.__constructors;
		constructors = new ctorTable();
		var methodTable = new Function(); 
	    methodTable.prototype = superclass.__methods; 
	    methods = new methodTable(); 
	}
	metaclass = new classProto();
	var cls = function() {
		this.__metaclass = metaclass;
		this.__superclass = superclass;
		this.__constructors = constructors;
		this.__methods = methods;
		this.__fields = {};
		this.__activeFields = {};
	};
	cls.prototype = metaclass;
	return new cls();
}
Metaclass = {
	name: function(name) {
		this.__name = name;
		return this;
	},
	className: function() {
		return this.__name;
	},
	toString: function() {
		return 'class '+ (this.__name || "");
	},
	inspect: function() {
		return this.toString();
	},
	__init: function(obj) {
		if (this.__superclass !== Object)
			this.__superclass.__init(obj);
		copyFields(this.__fields, obj);
		copyActiveFields(this.__activeFields, obj);
	},
	__alloc: function(init) {
		object.prototype = this.__methods;
		return new object(this, init);
	},
	create: function(init) {
		var newobj = this.__alloc(init);
		return newobj;
	},
	field: function(name, value) {
		this.__fields[name] = value;
		return this;
	},
	fields: function(list) {
		for (var item in list)
			if (! copyActiveField(list, item, this.__activeFields))
				this.field(item, list[item]);
		return this;
	},
	activeField: function(name, getter, setter) {
		var d = { enumerable: true, configurable: true };
		if (getter)
			d.get = getter;
		if (setter)
			d.set = setter;
		Object.defineProperty(this.__activeFields, name, d);
		return this;
	},
	hasOwnField: function(name) {
		return this.__fields.hasOwnProperty(name) || this.__activeFields.hasOwnProperty(name);
	},
	hasField: function(name) {
		var cl = this;
		do {
			if (cl.hasOwnField(name))
				return true;
			cl = cl.__superclass;
		} while (cl != Object);
		return false;
	},
	listOwnFields: function() {
		var result = [];
		for (var field in this.__fields)
			result.push(field);
		for (field in this.__activeFields)
			result.push(field);
		return result;
	},
	listAllFields: function() {
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
	listFields: function(spec) {
		if (!spec || spec === 'all')
			return this.listAllFields();
		if (spec === 'own')
			return this.listOwnFields();
		if (typeof spec === 'string')
			spec = spec.split(' ');
		var res = null;
		if (spec[0] === 'all-')
			res = this.listAllFields();
		else if (spec[0] === 'own-')
			res = this.listOwnFields();
		if (res) {
			for (var i = 1; i < spec.length; i++) {
				var j = res.indexOf(spec[i]);
				if (j <= 0)
					res.splice(j, 1);
			}
			return res;			
		}
		res = [];
		for (var i = 0; i < spec.length; i++)
			if (this.hasField(spec[i]))
				res.push(spec[i]);
		return res;
	},
	constructor: function(name, fun) {
		if (! fun && typeof(name) == 'function') {
			fun = name;
			name = 'create';
		}
		fun = constructorWithSuper(this, name, fun);		
		this.__constructors[name] = fun;
		this.__metaclass[name] = function() {
			var obj = this.__alloc();
			fun.apply(obj, arguments);
			return obj;
		};
		return this;
	},
	constructors: function(list) {
		for (var item in list)
			this.constructor(item, list[item]);
		return this;
	},
	method: function(name, fun) {
		if (! fun) {	
			delete this.__methods[name];
			return this;
		}
		fun = methodWithSuper(fun, name, this.__superclass);
		this.__methods[name] = fun;
		return this;
	},
	methods: function(list) {
		for (var item in list)
			this.method(item, list[item]);
		return this;
	},
	hasOwnConstructor: function(name) {
		return name == 'create' || this.__constructors.hasOwnProperty(name);
	},
	hasOwnMethod: function(name) {
		return this.__methods.hasOwnProperty(name);
	},
	getOwnConstructor: function(name) {
		return this.__constructors.hasOwnProperty(name || 'create');
	},
	getOwnMethod: function(name) {
		return this.__methods.hasOwnProperty(name) ? this.__methods[name] : undefined;
	},
	listOwnConstructors: function() {
		var result = Object.keys(this.__constructors);
		if (result.length === 0)
			return ['create'];
		return result;
	},
	listOwnMethods: function() {
		return Object.keys(this.__methods);
	},
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
	listConstructors: function() {
		var cl = this;
		var result = ['create'];
		for (var constructor in cl.__constructors) 
			result.push(constructor);
		return result;
	},
	listAllMethods: function() {
		var cl = this;
		var result = [];
		do {
			var methods = cl.listOwnMethods();
			for (var i = 0; i < methods.length; i++) {
				var method = methods[i];
				if (result.indexOf(method) < 0)
					result.push(method);
			}
			cl = cl.__superclass;
		} while (cl != Object);
		return result;
	},
	listMethods: function(spec) {
		if (!spec || spec === 'all')
			return this.listAllMethods();
		if (spec === 'own')
			return this.listOwnMethods();
		if (typeof spec === 'string')
			spec = spec.split(' ');
		var res = null;
		if (spec[0] === 'all-')
			res = this.listAllMethods();
		else if (spec[0] === 'own-')
			res = this.listOwnMethods();
		if (res) {
			for (var i = 1; i < spec.length; i++) {
				var j = res.indexOf(spec[i]);
				if (j <= 0)
					res.splice(j, 1);
			}
			return res;			
		}
		res = [];
		for (var i = 0; i < spec.length; i++)
			if (this.hasMethod(spec[i]))
				res.push(spec[i]);
		return res;
	},
	subclass: function() {
		return newClass(this);
	},
	superclass: function() {
		return this.__superclass;
	},
	classMethod: function(name, fun) {
		if (! fun) {	
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
exports.newClass = newClass;	
exports.metaclass = Metaclass;	
exports.object = object;		
})(typeof exports === 'undefined' ? this["OO"] = {} : exports);
