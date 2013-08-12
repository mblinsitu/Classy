// Classy - Yet another Javascript OO-framework (complete)
// (c) 2011-2013, Michel Beaudouin-Lafon, mbl@lri.fr
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
	if (fun.toString().search(/\W_super\W/m) < 0)
		return function() {
			fun.apply(this, arguments);
			for (var m = 0; m < myClass.__mixins.length; m++)
				myClass.__mixins[m].constructor.apply(this);
			return this;
		};
	return function() {
		var savedsuper = this._super;
		this._super = (superclass == Object) ? noSuper : (superclass.__constructors[name] || noSuper);
		try {
			var res = fun.apply(this, arguments);
			for (var m = 0; m < myClass.__mixins.length; m++)
				myClass.__mixins[m].constructor.apply(this);
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
function newClass(superclass) {
	if (! superclass) 
		superclass = Object;
	var metaclass, constructors, methods;
	function classProto() {}
	if (superclass === Object) { 
		classProto.prototype = Metaclass;
		constructors = {};
		methods = {
			toString: function() { return this.__class ? 'instance of ' + this.__class : '[unknown Classy Object]';},
			className: function() { return this.__class.__name; },
			classs: function() { return this.__class; },
			set: function(field, value ) {
				switch(arguments.length) {
					case 0:
						return this;
					case 1:
						var obj = field;
						if (!obj)
							return this;
						if (obj.__class) {	
							var fields = obj.__class.listFields();
							for (var i = 0; i < fields.length; i++) {
								var name = fields[i];
								if (this.__class.hasField(name))
									this[name] = obj[name];
							}
						} else {
							for (var name in obj)
								if (this.__class.hasField(name))
									this[name] = obj[name];
						}
						return this;
					case 2:
						if (field instanceof Array && value instanceof Array) {
							for (var i = 0; i < field.length; i++) {
								var name = field[i];
								if (this.__class.hasField(name))
									this[name] = value[i];
							}
							return this;
						}
					default:
						for (var i = 0; i < arguments.length; i+= 2) {
							var name = arguments[i], value = arguments[i+1];
							if (this.__class.hasField(field))
								this[name] = value;
						}
						return this;
				}
			},
			get: function(field ) {
				switch (arguments.length) {
					case 0:
						var fields = this.__class.listFields();
						var obj = {};
						for (var i = 0; i < fields.length; i++) {
							var name = fields[i];
							obj[name] = this[name];
						}
						return obj;
					case 1:
						if (field instanceof Array) {
							var values = [];
							for (var i = 0; i < field.length; i++) {
								var name = field[i];
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
							var obj = {};
							if (obj.__class) {	
								var fields = obj.__class.listFields();
								for (var i = 0; i < fields.length; i++) {
									var name = fields[i];
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
						for (var i = 0; i < arguments.length; i++) {
							var name = arguments[i];
							if (this.__class.hasField(name))
								result.push(name, this[name]);
						}
						return result;
				}
			},
			wrapField: function(field, getter, setter,  owner) { wrapField(this, field, getter, setter, owner || this); return this; },
			unwrapField: function(field,  owner) { unwrapField(this, field, owner || this); return this; },
			unwrapFields: function( owner) { unwrapFields(this, owner || this); return this; },
		};
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
		this.__mixins = [];
		this.__wrappedFields = {};
	};
	cls.prototype = metaclass;
	return new cls();
}
function wrapMixinMethod(fun, name, superclass) {
	if (fun.toString().search(/\W_super\W/m) < 0)
		if (fun.toString().search(/\W_inner\W/m) < 0 )
			return fun;
		else
			return function() {
				var savedinner = this._inner;
				this._inner = arguments.callee.__inner;
				try {
					return fun.apply(this, arguments);
				} finally {
					if (savedinner) this._inner = savedinner; else delete this._inner;
				}
			};
	return function() {
		var savedsuper = this._super;
		this._super = (superclass == Object) ? noSuper : (superclass.__methods[name] || noSuper);
		var savedinner = this._inner;
		this._inner = arguments.callee.__inner;
		try {
			return fun.apply(this, arguments);
		} finally {
			if (savedsuper) this._super = savedsuper; else delete this._super;
			if (savedinner) this._inner = savedinner; else delete this._inner;
		}
	};
}
function defineMixinMethods(myClass, mixin) {
	for (var m in mixin.methods)
		if (! myClass.getOwnMethod(m)) {
			var method = mixin.methods[m];
			myClass.method(m, method);
			var storedMethod = myClass.getOwnMethod(m);
			if (storedMethod != method)
				storedMethod.__owner = mixin;
		}
}
function undefineMixinMethods(myClass, mixin) {
	for (var m in mixin.methods) {
		var method = mixin.methods[m];
		var storedMethod = myClass.getOwnMethod(m);
		if (storedMethod && (storedMethod === method || storedMethod.__owner === mixin))
			delete myClass.__methods[m];	
	}
}
function unwrapWrappers(myClass, name, upto) {
	var fun = myClass.getOwnMethod(name);
	var wrappers = [];
	while (fun && fun.__inner) {
		var wrapper = myClass.__popWrapper(name);
		if (upto && wrapper === upto)
			break;
		wrappers.push(wrapper);
		fun = fun.__inner;
	}
	return wrappers;
}
function wrapWrappers(theClass, name, wrappers) {
	for (var i = wrappers.length-1; i >= 0; i--)
		theClass.wrap (name, wrappers[i]);
}
function makeGetterSetter(obj, field, getter, setter, owner) {
	var getWrapped = function() { return obj[field]; };
	var setWrapped = function(val) { obj[field] = val; };
	var realGetter = getter;
	if (getter) {
		realGetter = function() {
			var savedGet = this._get; this._get = getWrapped;
			var savedSet = this._set; this._set = setWrapped;
			try {
				return getter.call(this);
			} finally {
				if (savedGet) this._get = savedGet; else delete this._get;
				if (savedSet) this._set = savedSet; else delete this._set;			
			}
		};
		realGetter.__orig = getter;
		if (owner) realGetter.__owner = owner;
	} else 
		realGetter = function() { return obj[field]; }
	var realSetter = setter;
	if (setter) {
		realSetter = function(val) {
			var savedGet = this._get; this._get = getWrapped;
			var savedSet = this._set; this._set = setWrapped;
			try {
				setter.call(this, val);
			} finally {
				if (savedGet) this._get = savedGet; else delete this._get;
				if (savedSet) this._set = savedSet; else delete this._set;
			}
		};
		realSetter.__orig = setter;
		if (owner) realSetter.__owner = owner;
	} else 
		realSetter = function(val) { obj[field] = val; }
	return {
		getter: realGetter,
		setter: realSetter
	};
}
function wrapField(obj, field, getter, setter, owner) {
	var wrappedField = '$'+field;
	var d = Object.getOwnPropertyDescriptor(obj, field);
	var oldGetter = d ? d.get : undefined; 
	var oldSetter = d ? d.set : undefined; 
	if (obj.hasOwnProperty(wrappedField)) {
		var origGetter = oldGetter ? oldGetter.__orig : undefined;
		var origSetter = oldSetter ? oldSetter.__orig : undefined;
		var origOwner = oldGetter ? oldGetter.__owner : oldSetter.__owner;
		wrapField(obj, wrappedField, origGetter, origSetter, origOwner);
	} else if (oldGetter || oldSetter) {
		d = { enumerable: true, configurable: true };
		if (oldGetter)
			d.get = oldGetter;
		if (oldSetter)
			d.set = oldSetter;
		Object.defineProperty(obj, wrappedField, d);
	} else {
		obj[wrappedField] = obj[field];
	}
	var wrapped = makeGetterSetter(obj, wrappedField, getter, setter, owner);
	d = { enumerable: true, configurable: true };
		d.get = wrapped.getter;
		d.set = wrapped.setter;
	if (getter || setter)
		Object.defineProperty(obj, field, d);
}
function wrapFields(fields, obj, owner) {
	var d;
	for (var field in fields) {
		d = Object.getOwnPropertyDescriptor(fields, field);
		wrapField(obj, field, d.get, d.set, owner);
	}
}
function unwrapField(obj, field, owner) {
	var wrappedField = '$' + field;
	var found = !owner;
	var d = Object.getOwnPropertyDescriptor(obj, field);
	var getter = d ? d.get : undefined;
	var setter = d ? d.set : undefined;
	while (obj.hasOwnProperty(wrappedField)) {
		if (! found) {
			if (getter && getter.__owner === owner)
				found = true;
			else if (setter && setter.__owner === owner)
				found = true;
		}
		d = Object.getOwnPropertyDescriptor(obj, wrappedField);
		getter = d.get;
		setter = d.set;
		if (found) {
			delete obj[field];
			if (getter || setter) {
				var origGetter = getter ? getter.__orig : undefined;
				var origSetter = setter ? setter.__orig : undefined;
				var origOwner = getter ? getter.__owner : (setter ? setter.__owner : undefined);
				var wrapped = makeGetterSetter(obj, wrappedField, origGetter, origSetter, origOwner);
				d = { enumerable: true, configurable: true };
				if (getter)
					d.get = wrapped.getter || getter;
				if (setter)
					d.set = wrapped.setter || setter
				Object.defineProperty(obj, field, d);
			} else
				obj[field] = obj[wrappedField];
			delete obj[wrappedField];
		}
		field = wrappedField;
		wrappedField = '$' + field;
	}
}
function unwrapFields(obj, owner) {
	for (var field in obj)
		unwrapField(obj, field, owner);
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
		return 'class '+ (this.__name || '');
	},
	__init: function(obj) {
		if (this.__superclass !== Object)
			this.__superclass.__init(obj);
		copyFields(this.__fields, obj);
		copyActiveFields(this.__activeFields, obj);
		wrapFields(this.__wrappedFields, obj, this);
		for (var m = 0; m < this.__mixins.length; m++) {
			var mixin = this.__mixins[m]; 
			copyFields(mixin.fields, obj);
			wrapFields(mixin.fieldWrappers, obj, mixin);
		}
	},
	__alloc: function(init) {
		object.prototype = this.__methods;
		return new object(this, init);
	},
	create: function(init) {
		var newobj = this.__alloc(init);
		for (var m = 0; m < this.__mixins.length; m++)
			this.__mixins[m].constructor.apply(newobj);
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
		var wrappers = wrappers = unwrapWrappers(this, name);
		fun = methodWithSuper(fun, name, this.__superclass);
		this.__methods[name] = fun;
		wrapWrappers(this, name, wrappers);
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
		if (result.length == 0)
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
	wrap: function(name, fun) {
		var forig = this.getOwnMethod(name);
		var fnew = wrapMixinMethod(fun, name, this.__superclass);
		if (fnew !== fun)
			fnew.__inner = forig || methodWithSuper(function() { this._super.apply(this, arguments); }, name, this.__superclass);
		if (! forig)
			fnew.__wasempty = true;
		fnew.__wrapper = fun; 
		this.__methods[name] = fnew;
		return this;
	},
	wrappers: function(list) {
		for (var item in list)
			this.wrap(item, list[item]);
		return this;
	},
	wrapped: function(name, wrapper) {
		var fun = this.getOwnMethod(name);
		if (! wrapper)
			return fun && fun.__inner;
		while (fun && fun.__inner) {
			if (fun.__wrapper === wrapper)
				return true;
			fun = fun.__inner;
		}
		return false;
	},
	__popWrapper: function(name) {
		var fun = this.getOwnMethod(name);
		if (fun.__wasempty)	
			delete this.__methods[name];
		else
			this.__methods[name] = fun.__inner;
		return fun.__wrapper;
	},
	unwrap: function(name, wrapper) {
		var fun = this.getOwnMethod(name);
		if (! wrapper && fun)
			wrapper = fun.__wrapper;
		var rewrap = unwrapWrappers(this, name, wrapper);
		wrapWrappers(this, name, rewrap);
		return this;
	},
	unwrapAll: function(name) {
		unwrapWrappers(this, name);
		return this;
	},
	mixin: function(mixin) {
		this.__mixins.push(mixin);
		defineMixinMethods(this, mixin);
		this.wrappers(mixin.wrappers);
		return this;
	},
	unmix: function(mixin) {
		var i = this.__mixins.indexOf(mixin);
		if (i < 0)
			return this;
		this.__mixins.splice(i, 1);	
		for (var m in mixin.wrappers)
			this.unwrap(m, mixin.wrappers[m]);
		undefineMixinMethods(this, mixin);
		return this;
	},
	hasMixin: function(mixin) {
		return this.__mixins.indexOf(mixin) >= 0;
	},
	wrapField: function(field, getter, setter) {
		var d = { enumerable: true, configurable: true };
		if (getter)
			d.get = getter;
		if (setter)
			d.set = setter;
		if (getter || setter)
			Object.defineProperty(this.__wrappedFields, field, d);
		return this;
	},
	wrapFields: function(list) {
		for (var item in list)
			copyActiveField(list, item, this.__wrappedFields);
		return this;
	},
	wrappedField: function(field) {
		return this.__wrappedFields.hasOwnProperty(field);
	},
	unwrapField: function(field) {
		delete this.__wrappedFields[field];
		return this;
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
})(typeof exports === 'undefined' ? this["Classy"] = {} : exports);
