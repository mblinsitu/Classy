/*
	(c) 2011-2013, Michel Beaudouin-Lafon, mbl@lri.fr
	Open sourced under the MIT License

	The advanced features of Classy:
		method wrappers
		field wrappers
		mixins
*/

// ======== MIXINS ========

/*
 *	Implement call to super in a method for wrappers.
 *	Takes care of _inner in a similar way as _super.	
 */
function wrapMixinMethod(fun, name, superclass) {
	// optimization: no need to wrap if fun does not contain _super or _inner
	if (fun.toString().search(/\W_super\W/m) < 0) {
		if (fun.toString().search(/\W_inner\W/m) < 0 )
			// simple case where there is no _inner or _super: return the function itself
			return fun;
		else
			// we just need to support _inner
			return function() {
				var savedinner = this._inner;
				this._inner = arguments.callee.__inner;
				try {
					return fun.apply(this, arguments);
				} finally {
					// restore state
					if (savedinner) this._inner = savedinner; else delete this._inner;
				}
			};
	}

	// this is the general case where we support both _inner and _super
	return function() {
		// save _super and _inner and set them to the proper values
		var savedsuper = this._super;
		this._super = (superclass == Object) ? noSuper : (superclass.__methods[name] || noSuper);
		var savedinner = this._inner;
		this._inner = arguments.callee.__inner;
		// call the original method
		try {
			return fun.apply(this, arguments);
		} finally {
			// restore _super and _inner
			if (savedsuper) this._super = savedsuper; else delete this._super;
			if (savedinner) this._inner = savedinner; else delete this._inner;
		}
	};
}

/*
 *	Add / remove mixin methods.
 *	Mixins are only allowed to define methods that are not already defined in the class.
 *	(Methods that are already defined are silently skipped).
 */
function defineMixinMethods(myClass, mixin) {
	// do not override methods (use wrappers for that)
	for (var m in mixin.methods)
		if (! myClass.getOwnMethod(m)) {
			var method = mixin.methods[m];
			myClass.method(m, method);
			// we need to mark that this method was added by the mixin so we can remove it later
			// 'method' either stores the method itself or the method wrapped for super
			// in the first case, we will be able to recognize the function later,
			// in the latter we need to decorate it.
			// note that if we decorated it in both cases, we would have the problem of decorating 
			// a mixin method that is used in several classes.
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
			delete myClass.__methods[m];	// *** note that if the method had wrappers, they are destroyed too
	}
}

/*
 *	Functions used to redefine a method that has wrappers:
 *	'unwrapWrappers' removes wrappers and returns them in an array
 *	if upto is undefined, all wrappers are removed and returned
 *	if upto is defined, all wrappers up to it are removed and all of them but 'upto' itself are returned
 *	'wrapWrapper' adds a list of wrappers returned by 'unwrapWrappers'	
 */
function unwrapWrappers(myClass, name, upto) {
	var fun = myClass.getOwnMethod(name);
	var wrappers = [];
	while (fun && fun.__inner) {
		var wrapper = myClass.__popWrapper(name);
		// stop if it's the one we're looking for, store it for later rewrapping otherwise
		if (upto && wrapper === upto)
			break;
		wrappers.push(wrapper);
		// walk down the stack of wrappers
		fun = fun.__inner;
	}
	return wrappers;
}

function wrapWrappers(theClass, name, wrappers) {
	for (var i = wrappers.length-1; i >= 0; i--)
		theClass.wrap (name, wrappers[i]);
}

// ======== WRAPPED FIELDS ========

/*
 *	Wrap an existing field with getter and setter functions.
 *	The 'getter' and 'setter' functions can access the original field with this._get() and this._set(val).
 *	(Note that referring to the original field, say f, as this.f will cause an infinite recursion.)
 *	Multiple wrappers can be nested.
 *	'owner' is an arbitrary value that identifies the wrapper so it can be removed with unwrapField.
 */

function makeGetterSetter(obj, field, getter, setter, owner) {
	// the functions that implement _get and _set for use in the setter and getter
	var getWrapped = function() { return obj[field]; };
	var setWrapped = function(val) { obj[field] = val; };
	
	// the function that wraps the getter so that this._get() is defined
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
	} else // *** this is to have a default getter in case none is defined. I thought we could do away with this
		realGetter = function() { return obj[field]; };
	
	// the function that wraps the setter so that this._set() is defined
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
	} else // *** this is to have a default setter in case none is defined. I thought we could do away with this
		realSetter = function(val) { obj[field] = val; };
	
	return {
		getter: realGetter,
		setter: realSetter
	};
}

function wrapField(obj, field, getter, setter, owner) {
	// the wrapped field will be renamed $<field>
	var wrappedField = '$'+field;
	var d = Object.getOwnPropertyDescriptor(obj, field);
	var oldGetter = d ? d.get : undefined; //obj.__lookupGetter__(field);
	var oldSetter = d ? d.set : undefined; //obj.__lookupSetter__(field);
	
	// rename the wrapped field into $<field>
	if (obj.hasOwnProperty(wrappedField)) {
		// the field was already wrapped as $<field>, so wrap the original field (which becomes $$<field>, etc.) 
		var origGetter = oldGetter ? oldGetter.__orig : undefined;
		var origSetter = oldSetter ? oldSetter.__orig : undefined;
		var origOwner = oldGetter ? oldGetter.__owner : oldSetter.__owner;
		wrapField(obj, wrappedField, origGetter, origSetter, origOwner);
	} else if (oldGetter || oldSetter) {
		// the field was active: copy the getter and setter
		d = { enumerable: true, configurable: true };
		if (oldGetter)
			d.get = oldGetter;
		if (oldSetter)
			d.set = oldSetter;
		Object.defineProperty(obj, wrappedField, d);
	} else {
		// normal case: copy value
		obj[wrappedField] = obj[field];
	}
	
	// define the getter and setter for the wrapped field
	var wrapped = makeGetterSetter(obj, wrappedField, getter, setter, owner);
	
	// *** it seems that if we define one, we need to define both. I thought we could do away with this
	d = { enumerable: true, configurable: true };
	//if (getter)
		d.get = wrapped.getter;
	//if (setter)
		d.set = wrapped.setter;
	if (getter || setter)
		Object.defineProperty(obj, field, d);
}

function wrapFields(fields, obj, owner) {
	var d;
	for (var field in fields) {
		d = Object.getOwnPropertyDescriptor(fields, field);
		if (d.get || d.set)
			wrapField(obj, field, d.get, d.set, owner);
		else {
			// it's not defined as an active field but as a special case
			// we consider it as such if it is defined with a literal object 
			// with properties set and/or get
			// *** this works ONLY for mixin.fieldWrappers, NOT for aClass.wrapFields(...)
			var f = fields[field];
			if (f.set || f.get)
				wrapField(obj, field, f.get, f.set, owner);
		}
	}
}

/*
 *	unwrap a field
 *	'owner' specifies which wrapper to remove.
 */
function unwrapField(obj, field, owner) {
	var wrappedField = '$' + field;
	var found = !owner;
	
	var d = Object.getOwnPropertyDescriptor(obj, field);
	var getter = d ? d.get : undefined;
	var setter = d ? d.set : undefined;
	
	while (obj.hasOwnProperty(wrappedField)) {
		// retrieve getter and setter from wrapped field
		
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
			// copy wrapped field into current field
			if (getter || setter) {
				var origGetter = getter ? getter.__orig : undefined;
				var origSetter = setter ? setter.__orig : undefined;
				var origOwner = getter ? getter.__owner : (setter ? setter.__owner : undefined);

				var wrapped = makeGetterSetter(obj, wrappedField, origGetter, origSetter, origOwner);
				
				d = { enumerable: true, configurable: true };
				if (getter)
					d.get = wrapped.getter || getter;
				if (setter)
					d.set = wrapped.setter || setter;
				Object.defineProperty(obj, field, d);
			} else
				obj[field] = obj[wrappedField];
			
			// remove the wrapped field since it is now copied into the current field
			delete obj[wrappedField];
		}
		
		// continue down the chain of wrapped fields
		field = wrappedField;
		wrappedField = '$' + field;
	}
}

/*
 *	unwrap all fields of the object that are wrapped by a given owner.
 */
function unwrapFields(obj, owner) {
	for (var field in obj)
		unwrapField(obj, field, owner);
}

