/*
	(c) 2011-2013, Michel Beaudouin-Lafon, mbl@lri.fr
	Open sourced under the MIT License

	The metaclass object for the advanced OO features
		method wrappers
		field wrappers
		mixins
*/

	// ======== MIXINS ========

	// add a wrapper to method 'name'
	wrap: function(name, fun) {
		// the method being wrapped
		var forig = this.getOwnMethod(name);
		// define the wrapping method in such a way that this._inner calls the method being wrapped
		var fnew = wrapMixinMethod(fun, name, this.__superclass);
		// store the original method in fnew.__inner so it can be accessed when it is called
		// optimization: this is not necessary when the wrapper does not call _super nor _inner
		// if there was no method being wrapped, create a dummy one that just calls _super and mark it as such
		if (fnew !== fun)
			fnew.__inner = forig || methodWithSuper(function() { this._super.apply(this, arguments); }, name, this.__superclass);
		if (! forig)
			fnew.__wasempty = true;
		fnew.__wrapper = fun; // remember the original wrapper so we can unwrap it
		this.__methods[name] = fnew;

		return this;
	},
	
	// define multiple wrappers at once, using a literal object
	wrappers: function(list) {
		for (var item in list)
			this.wrap(item, list[item]);
		return this;
	},
	
	// test if the method is wrapped by wrapper (if wrapper is not specified, test if method is wrapped)
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
	
	// internal method to remove the top wrapper
	__popWrapper: function(name) {
		var fun = this.getOwnMethod(name);
		if (fun.__wasempty)	// this is when we wrap a non-existing method
			delete this.__methods[name];
		else
			this.__methods[name] = fun.__inner;
		return fun.__wrapper;
	},
	
	// remove a wrapper (or the top one if it is not specified)
	unwrap: function(name, wrapper) {
		var fun = this.getOwnMethod(name);
		if (! wrapper && fun)
			wrapper = fun.__wrapper;
		var rewrap = unwrapWrappers(this, name, wrapper);
		wrapWrappers(this, name, rewrap);
		
		return this;
	},
	
	// unwrap all wrappers from method name
	unwrapAll: function(name) {
		unwrapWrappers(this, name);
		
		return this;
	},
	
	// add a mixin
	mixin: function(mixin) {
		this.__mixins.push(mixin);
		defineMixinMethods(this, mixin);
		this.wrappers(mixin.wrappers);
		
		return this;
	},
	
	// remove a mixin - *** wrapped fields are not unwrapped ***
	unmix: function(mixin) {
		var i = this.__mixins.indexOf(mixin);
		if (i < 0)
			return this;
		// remove mixin from array
		this.__mixins.splice(i, 1);	
		// remove wrappers
		for (var m in mixin.wrappers)
			this.unwrap(m, mixin.wrappers[m]);
		// remove methods (only those that were actually added)
		undefineMixinMethods(this, mixin);
		return this;
	},
	
	// test if a mixin is applied to the class
	hasMixin: function(mixin) {
		return this.__mixins.indexOf(mixin) >= 0;
	},

	// ======== WRAPPED FIELDS ========

	// wrap one field
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
	
	// wrap one or more fields defined in a property list with "set f() / get f(val)" syntax
	wrapFields: function(list) {
		for (var item in list)
			copyActiveField(list, item, this.__wrappedFields);
		// note: non active fields are ignored silently
		return this;
	},
	
	// test if a field is being wrapped
	wrappedField: function(field) {
		return this.__wrappedFields.hasOwnProperty(field);
	},
	
	// stop wrapping a field (note: this does _not_ remove it from existing objects)
	unwrapField: function(field) {
		delete this.__wrappedFields[field];
		return this;
	},

