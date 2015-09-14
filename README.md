Classy, (yet another) object-oriented framework for Javascript
========
_&copy; 2011-2013, Michel Beaudouin-Lafon, mbl@lri.fr_  
_Open-sourced under the MIT License_


A taste of how it's used:
--------

Classy is a lightweight framework to program with classes in Javascript. 
Here is a quick overview of its features.

### Declaring a class ###

Define a class `Shape` with two properties (`x` and `y`), a default constructor and some methods:

	var Shape = Classy.newClass();
	Shape.fields({x: 0, y: 0});
	Shape.constructor(function(x, y) {
		this.x = x; this.y = y;
	});
	Shape.methods({
		moveby: function (dx, dy) { this.x += dx; this.y += dy; },
		moveto: function (x, y) { this.x = x; this.y = y; },
	});

Create a shape, call a method and print its properties:

	var s = Shape.create(5, 5);
	s.moveby(10, 15);
	console.log(s.x,',',s.y);	// 15,20

### Declaring a subclass ###

Create a `Circle` subclass, with a new field, two constructors and some methods.
Note that we can use a chain of calls instead of a sequence as above.
Note also that it is possible to call the redefined method with `this._super()`:

	var Circle = Shape.subclass()
		.fields({radius: 1})			// this could also be written .field('radius', 1)
		.constructor(function (x, y, r) {
			this._super(x, y);	// call to super, i.e. the Shape constructor
			this.radius = r;
		})
		.constructor('withradius', function(r) {	// this is a named constructor
			this.radius = r;	// no need to call super, x and y will be inited to 0
		})
		.methods({
			area: function() { return this.radius * this.radius * 3.14; },
			// as with constructors, we can call this._super(...) in a method
		});

Create a circle with the named constructor and play with it:

	var c = Circle.withradius(12).moveby(10, 15);
	print (c.area());

Add an active field for the diameter.
This uses the Javascript syntax for getter/setter for properties:

	Circle.fields({
		get diameter() {return this.radius * 2},
		set diameter(val) {this.radius = val / 2},
	});
	var c2 = Circle.create();
	c2.diameter = 20;
	print (c2.radius);	// 10

In addition to these basic object-oriented features, Classy supports various ways 
of modifying an existing class: wrapping methods, using mixins, and wrapping fields.

### Wrappers and Mixins ###

First, let's create a **method wrapper**, a function that will be called
instead of an existing method. The special call `this._inner()`
calls the original method (you can think of it as `super` working
backwards):

	function traceWrapper() {
		log('calling traced method ')
		return this._inner();	// calls the wrapped method
	}
	// add the wrapper to a couple methods
	Shape.wrap('moveby', traceWrapper);
	Circle.wrap('area', traceWrapper);
	c.area();	// will print 'calling traced method'
	// remove the wrapper
	Circle.unwrap('area', traceWrapper);

**Mixins** allow us to inject code into an existing class.
Here we define a mixin that calls a redisplay method
when some of the methods of the original class are called:

	// define a mixin for redisplaying a shape when it is changed
	function redisplayWrapper() {
		this._inner.apply(this, arguments);		// call original function with same arguments
		this.redisplay();						// call the mixin method
	}

	var displayMixin = {
		constructor: function() { this.redisplay(); },	// constructor called for each new object
		fields: {},										// additional fields (none here)
		methods: {										// additional methods
			redisplay: function() { ... redisplay shape ...}
		},
		wrappers: { 									// wrappers for existing methods
			moveto: redisplayWrapper, 
			moveby: redisplayWrapper
		}
	};
	// add the mixin to a class
	Shape.mixin(displayMixin);
	var c = Circle.create();
	c.moveby(10, 12); // calls redisplay

Finally, we can also create **field wrappers**, i.e. wrap the fields of an existing class to
add side effects when they are read and/or written.
Here we wrap the `radius` field so that the circle gets redisplayed 
when assigning its radius:

	Shape.wrapFields({
		set radius(r) { this._set(r); this.redisplay(); }
			// this._set() and this._get(val) invoke the original setter/getter
	});

Wrapped fields can also be specified in a mixin, as described in the user manual below.

What's different between Classy and other OO frameworks
--------

### Declaring classes ###
Classes are objects, _not_ constructors in the Javascript sense.
This means that we can't use `new MyClass(...)` to create an object.
Instead, a class is instantiated using `MyClass.create(...)`.

While the syntax is a matter of taste, this means that we have a real metaclass (the class's prototype)
and that we can easily add fields, methods, constructors and subclasses to the class using
method chaining: 

	var A = Classy.newClass().fields(...).constructors(...).methods(...);

These can be called in any order, as many times as you want.
Note however that if you add fields after having created objects, the existing objects
will not get these fields.

### Fields ###

A class can declare a set of fields, which are object properties that are automatically 
initialized in every new object. This makes constructors easier to write, sometimes even unecessary.
Note that the constructor can still create properties in the usual way (`this.a = 1`).

If the default value of a field is a function, it is called each time a new object is created.

Fields can also be defined as "active" by specifying a getter and/or setter function.
This supports dynamically computed fields, or fields with side effects.

Note that the default constructor of every class (`create`) can take a literal object with property values
that are copied to the fields of the new object. These properties are copied as is (no special treatment
of properties whose value is a function or which have setters and/or getters).

### Constructors ###

You are not stuck with a single constructor and complex parsing of its arguments
when you want different possible sets of parameters for your constructor.

Not only can you overload the default constructor (`create`) with your own,
you can also create other constructors with different names, each with their own parameters.

Because of the call to `_super` (see below), constructor chaining is very simple.

### Call to super ###

Constructors and methods can call-to-super, i.e. call the constructor or method that they
are overriding in a parent class.

Call-to-super is simple: just use `this._super(...)` in a constructor or method.

In my opinion, this is cleaner that, e.g., `prototype.js` use of `$super` or David Flanagan's
use of `arguments.callee` in his `DefineClass` method from his book.

### Method wrappers ###

Wrappers and mixins make it possible to modify a class in a reversible way. 
This goes beyond redefining or adding methods using subclassing:

A _method wrapper_ redefines a method in a class in such a way that the original method can be called
using `this._inner(...)`. This is similar to a call to super but within a class.

Wrappers can be stacked (a wrapper can be added to a method that already has a wrapper)
and removed dynamically.

### Mixins ###

A _mixin_ is similar to a class that is 'merged' into an existing class: it can define fields
to be added to (future) objects of the class, new methods and wrappers, and a default constructor.
(One current limitation is that changes to a mixin after it is added to a class do not affect the class.)

Mixins provide some of the effects of multiple inheritance without many of the drawbacks.
Note that fields added by a mixin override fields with the same name in the orignal class, if they exist.
This can be useful, for example to change the default value, but it can also be dangerous 
if the collision was unexpected.

### Field wrappers ###

A field of an existing object or class can be wrapped with a getter and/or setter.
This makes it possible to add side effects to every access (get or set) to a field.

A given field can be wrapped only once per class or per mixin, but if several mixins
wrap the same field, the wrappers will be nested.

Field wrappers can be added on a per-object basis, with the methods `wrapField`, `wrapFields`, 
`unwrapField` and `unwrapFields`, defined for every object. 

They can also be specified at the class-level, in the `fieldWrappers` property of a mixin.

Note that `o.unwrapField(s)` is the only way to remove field wrappers from an existing object.
If a mixin that has wrapped fields is removed from a class, the existing objects are unaffected.

### Disclaimer ###

I am not claiming this is a better framework than what's already out there.
It's just different, with a different set of tradeoffs. And it was a good exercise
for playing (and sometimes fighting with) Javascript's object model!

Comments and suggestions welcome!

User Manual
--------

There are two versions of the package, `oo.js` and `classy.js`:

- `oo.js` implements the basic class-based model, but not the mixins and wrappers;
- `classy.js` implements the complete model, including mixins and wrappers.

The scripts are self-contained and can be used both in a browser, using a &lt;script> tag:

	<script src="oo.js"></script><!-- defines global variable OO -->
	<script src="classy.js"></script><!-- defines global variable Classy -->

or with node.js, using require:

	var OO = require('./oo');
	var Classy = require('./classy');

In the rest of this documentation, we use `Classy` as the global name exported by the package.

The script exports three objects:

- `Classy.newClass`, the function to create new classes. This is all you need to use Classy;
- `Classy.Metaclass`, the metaclass object, if you want to add new methods to it;
- `Classy.object`, the constructor of all Classy objects: `o instanceof Classy.object` is true for all Classy objects.

### Defining classes ###

To create a class, use the exported `newClass` function. It is customary to also give a name to the class, which is used by the default `toString` function of Classy objects:

	var A = Classy.newClass().name('A');
	var a = A.create();			// create an instance of A
	console.log(a.toString());	// "instance of class A"

To create a subclass of an existing class, use the `subclass` method of the parent class:

	var B = A.subclass().name('B')

#### Fields ####

To define fields, use the `field`, `activeField` and `fields` methods on the class object:

	A.field('x', 0)		// field name and default value
	A.activeField('', <getter>, <setter>)	// active field, <getter> and <setter> are functions (or null)
	A.fields({			// define multiple fields at once
		radius: 0,
		position: [0, 0],				// a copy of the array is created for each new object
		color: {r: 100, g: 20, b: 30},	// a copy of the literal is created for every new object
		created: function() { return new Date(); }	// the function is called for every new object
		// an active field
		get diameter: function() { return this.radius * 2;}
		set diameter: function(d) { this.radius = d/2;}
	})

Note that initial values are copied for each new object. This is usually what is wanted, so that each
object gets a fresh copy of the initial values.
If however you want to share the object specified as initial value instead of copying it, you can either:

- Use as initializer a function that returns the shared object
- Pass an object with the property `__immutable` set to true

Here is an example:

	// first solution: use a function returning the object
	A.field('color', function() { return {r: 100, g: 0, b: 0}; });
	// alternative:
	function shared(v) { return function(v) { return v}};
	A.field('color', shared({r: 100, g: 0, b: 0}));

	// second solution: use __immutable
	A.field('color', {r: 0, g: 0, b: 100, __immutable: true });
	// alternative:
	function immutable(v) { v._immutable = true; return v}
	A.field('color', immutable({r: 100, g: 0, b: 0}));

In the full version of Classy, fields can be wrapped with or without the use of mixins.
See the description of field wrappers and mixins below.

#### Constructors and object instantiation ####

Constructors are used to create new objects. The body of the constructor
is called after the object has been created and the properties corresponding to 
the fields declared in the class have been initialized.

Each class has a predefined constructor called `create`.
This constructor can be redefined, and other constructors (with different names)
can be defined. The class methods to define constructors are as follows:

	A.constructor(<function>)			// define the default constructor
	A.constructor('name', <function>)	// define a named constructor
	A.constructors({			// define multiple constructors at once
		create: <function>,				// default constructor
		createWithSize: <function>,		// named constructor
	})

As with all class methods, these can be chained.

The expression `A.create()` creates a new object of class `A`, initializes it,
and calls the default constructor, if defined. The default constructor takes
an optional argument, which is a literal object used to intialize the fields
of the object. Only the properties of this literal objects that are also declared
as fields of the class being instantiated or one of its parent classes are initialized.
So for example :

	var A = Classy.newClass().field('x', 0);
	var a = A.create({x: 0, y: 0});
	a.y;	// undefined

In the following example, `createWithSize` is a constructor that takes a size.
The expression `A.createWithSize(20)` creates a new object of class `A`, initializes it,
and calls the constructor `createWithSize`.

	var A = Classy.newClass().name('A')
		.fields({width: 0, height:0})
		.constructors({ createWithSize: function(size) { this.width = size; this.height = size; } })
		.methods({ area: function() { return this.width*this.height; } });
	A.createWithSize(20).area();	// 400

For subclasses, constructors can call the constructor of the parent class using 
the _call-to-super_ described below. Note that if the `create` default constructor
is not defined in the subclass, but is defined in the parent class, the parent's
constructor is _not_ called.

	var A = Classy.newClass().name('A')
		.constructor( function() { console.log('inited and A') });
	var B = A.subclass().name('B')
		.constructor( function() { this._super(); console.log('inited and B') });
	var b = B.create();	// prints "inited an A" then "inited a B"

#### Methods ####

Methods applicable to instances of a class are defined in a way similar to constructors:

	A.method('m', <function>)	// define a single method
	A.methods({					// define multiple methods at once
		m1: <function>,
		m2: <function>,
	})

These calls can be chained, like those defining fields and constructors.

Methods are called as usual in Javascript:

	var a = A.create();
	a.m();
	a.m1(...);

Methods in a subclass can call the corresponding method of the parent class using 
the _call-to-super_ described below.

In the full version of Classy, methods can be wrapped with or without the use of mixins.
See the description of method wrappers and mixins below.

#### Calls to super ####

When class `B` inherits from class `A`, constructors and methods in `B` can
call the corresponding constructor or method in class `A` using the expression

	this._super(<arguments>)

This is particularly useful in constructors in order to chain them together.
Note that this works _only_ when the call to `_super` is in the body of the
constructor or method itself. So for example, the following will _not_ work:

	function doesNotWork(o) { return o._super();}
	var A = Classy.newClass()
				.method('m', function() { return 'Hello'; });
	var B = A.subclass()
				.method('m', function() { return doesNotWork(this); });

_A note about performance: the implementation of `_super` requires that the
constructors and methods that call to super be wrapped in a function.
This has a slight performance impact since a call to `o.m()` is not a direct
call anymore, but a call to a function that calls the method `m`. In practice,
the overhead is negligible._

It is sometimes necessary to call a method of the parent class that is _not_
of the same name. For example, a named constructor wants to call the default
constructor of the parent class. The best way to achieve this is to use the
methods `getConstructor` and `getMethod` of the parent class. These methods
return the function implementing the constructor or method (if it exists):

	var A = Classy.newClass()
				.constructor('create', function() {...});
	var B = A.subclass()
				.constructor('createWithSize', function(s) { 
					... 
					A.getConstructor('create').call(this, ...);
					// alternative: 
					//   this.class().superclass().getConstructor().call(this, ...)
				})

#### Instance methods ####

In addition to the standard Javascript methods of Object,
all Classy objects have the following methods:

	o.toString()	// return a simple string "instance of <class name>"
	o.className()	// return the name of the class of object o
	o.classs()		// return the class object used to create o
	o.set(...)		// set values of object fields - see below
	o.get(...)		// get values of object fields - see below

Note that `toString` and `className` are really useful only when the class has been given a name with, e.g., `A.name('A')`. 

Note also that the method `classs` has 3 's's. This is not an error and is due to the fact that the word `class` is reserved in Javascript. If an object is created with `o = A.create()`, then `o.classs() === A`.

`set` and `get` allow you to set and get the values of one or more fields at once. Of course, fields can also be accessed with the usual Javascript dot notation, i.e. `o.x` and `o['x']`.

Setting fields with `o.set` can use a list of field names and values, an array of field names plus an array of field values, a literal object, or another Classy object. Whichever syntax you use, only fields that are declared in the object's class or one of its parent classes are assigned. Here are the four version of `set`:

	o.set('field1', value1, 'field2', value2, ...)
	o.set(['field1', 'field2', ...], [value1, value2, ...])
	o.set({ field1: value, field2: value2, ...})
	o.set(o2)

Getting field values with `get` follows the same pattern, with the addition of a call without arguments, which simply retrieves all defined fields of the object, and a call with a single field name, which simply returns its value:

	o.get()  		// return all the fields and their values in a literal object
	o.get('field')  // return the value of the field
	o.get('field1', 'field2', ...)		// return an array 'field1', value, 'field2', value, ...
	o.get(['field1', 'field2', ...])	// same as above
	o.get({ field1: v1, field2: v2, ...})	// return a literal object
	o.get(o2)		// return a literal object with the fields of o2 present in o

Note that in the last two cases (using a literal object or Classy object), the existing values are ignored and the resulting object only contains the fields that are defined in the receiving object's class. By constrast, the calls that return an array include all the fields listed in the arguments, with a value of `undefined` for those fields that are not defined in the receiving object's class.

`set` and `get` are designed to play nice together. For example, one can write:

	o2.set(o1.get('x', 'y', 'z'));	// copy the values of o1.x, o1.y, o1.z to o2
	var rgb = ['r', 'g', 'b'];
	o2.set(o1.get(rgb));			// copy the values of o1.r, o1.g, o1.b to o2

While these calls are more expensive that directly accessing the object's properties, they provide the added security of only setting and getting fields that are declared in the object's classes. This makes it possible to treat other properties of objects as private:

	var A = Classy.newClass().field('x', 0).constructor(function() { this.hidden = 1; });
	var a = A.create(), b = B.create();
	a.x = 10; a.hidden = 2;
	b.set(a);	// b.x is 10, but b.hidden is still 1

One last point about instance methods: the version of Classy that supports mixins defines additional instance methods (`wrapField`, `unwrapField` and `unwrapFields`), described below in the section on Field wrappers.

#### Class fields and Class methods ####

Since a Classy class is an object, it can have its own fields and methods.
These are called _class fields_ and _class methods_ (other languages sometimes call them 
static fields or methods). They are declared in a similar way as instance fields and methods:

	classField('name', value)
	classFields({ f1: v1, f2: v2, ...})

	classMethod('name', <function>)
	classMethods({ m1: <function>, m2: <function>, ...})

Here is an example of use, to assign unique ids to instances of a class:

	var A = Classy.newClass()
			.field('id', 0)
			.classField('count', 0)
			.classMethod('nextId', function() { return ++this.count; })
			.constructor(function() { this.id = A.nextId(); })

#### Chaining calls ####

As shown in many of the examples above, the methods that define a class return the class itself, 
so they can be chained.

Here is a typical example of a class definition:

	var A = Classy.newClass().name('A')
		.fields({
			x: 0,
			y: 0,
			...
		})
		.classField('count', 0)
		.constructors({
			createAt: function(x, y) { this.x = x; this.y = y; },
			...
		})
		.methods({
			moveBy: function(dx, dy) { this.x += dx; this.y += dy; },
			...
		});

Note that every call to these methods _add_ to the class definition.
In case of a redefinition of a field or method, the old definition is simply replaced.

When fields are added to a class _after_ some objects of that class have been created, 
the changes do not affect these objects.

### Method wrappers ###

Wrapping a method consists of replacing it with a new function that can (and usually does) 
call the original one. The wrapped method can be restored to its original value (unwrapping).
A method can be wrapped multiple times, in which case the wrappers stack and can call each other
from the most recent one down to the original method.

In this example, a wrapper is added to method `m` of class `A` to trace it:

	var A = Classy.newClass();
	A.method('m', function() { return 'Hello'; });
	A.wrap('m', function() { 
		console.log('tracing A.m');
		return this._inner();
	})

The expression `this._inner()` calls the original function, in a similar spirit as `_super`.
It is called "inner" because the original method is "inside" the wrapper.

The following methods can be used with a class to managed method wrappers:

	A.wrap('m', <function>)	// define a method wrapper
	A.wrappers({			// define multipled wrappers at once
		'm': <function>,
		...
	})
	A.wrapped('m')			// true if method m is wrapped in class A
	A.wrapped('m', fun)		// true if method m is wrapped by function fun in class A
	A.unwrap('m')			// unwrap the topmost wrapper of method m in class A (if any)
	A.unwrap('m', fun)		// unwrap the wrapper of method m in class A defined by fun
	A.unwrapAll()			// unwrap all wrappers of method m in class A

If a method has multiple wrappers, it is safer to remove them using `A.unwrap('m', fun)`
so that you don't remove a wrapper set by someone else. For this to work, you need to keep
the wrapper function around. Here is an example

	var mTracer = function() { 
		console.log('calling m of '+this.name());
		return this._inner();
	})
	A.wrap('m', mTracer);
	...
	A.unwrap('m', mTracer);

### Field wrappers ###

Wrapping a field consists of wrapping the methods used to set and get the field,
i.e. turning the field into an active field.

Unlike method wrappers which can only be set on classes, field wrappers can be set
on individual objects or at the class level.

#### Wrapping fields at the object level ####

To wrap a field of an object `o`, use the following:

	o.wrapField(field, <getter>, <setter>, /*opt*/ owner)

Where `field` is the name of the field, `getter` and `setter` are the functions to get and set the value,
and `owner` is an arbitrary object (defaults to the object itself) used to identify the wrapper when unwrapping the field (see below).

The getter and setter functions have the same profiles as for active fields.
In addition, they can call `this._get()` and `this._set(val)` to access the original field.
(Note that using `this.f` in a field wrapper of the field `f` will cause an infinite recursion).

Here is an example, again for tracing access to a field:
	
	o.wrapField('x',
		function()    { console.log('getting x'); return this._get(); },
		function(val) { console.log('setting x'); this._set(val); },
	);

Note that the getter or the setter can be `null`, in which case the original definition stands.

As for methods wrappers, field wrappers can be nested: a field can be wrapped multiple times.
A wrapped field can be unwrapped as follows (`owner` defaults to the object `o`):

	o.unwrapField(field, /*opt*/ owner)	// remove the wrapper of field f owned by owner
	o.unwrapFields(/*opt*/ owner)		// remove all wrappers of all fields of o owned by owner

#### Wrapping fields at the class level ####

Wrapping fields at the class level means that all _future_ instances of that class
will feature the wrapped fields. The declarations are very similar to those used above,
except that they are applied to the class, not the object, and there is no notion of owner:

	A.wrapField(field, <getter>, <setter>)
	A.unwrapField(field)	// unwrap field
	A.wrappedField(field)	// true if field is wrapped

It is also possible to specify the wrappers using active fields, as follows:

	A.wrapFields({
		get f1: <getter>,
		set f1: <setter>,
		...
	})

Like object field wrappers, it is possible to defined multiple class field wrappers for a single field.

### Mixins ###

A mixin is a set of capabilities added to an existing class to modify its behavior.
It differs from inheritance in that it does not change the identity of the class.
It provides a flexible alternative to multiple inheritance in languages (like Javascript)
that do not support it.

In Classy, a mixin is defined by a literal object with the following (optional) properties:

	var mixin = {	// define a mixin
		constructor: function() {...},
		fields: { f1: v1, ...},
		methods: { m: <function>, ...},
		wrappers: { m1: <function>, ...}
	}

`constructor` is called for every object created by a class to which this mixin has been added.
There can be only one constructor and it cannot take arguments. It is called after all other initializations of the object have been performed: after initializing the fields defined in its class and those defined in the mixins (see below), and after calling the class constructor.

`fields` is a set of fields to be added to the target class.
If the field is already defined in the target class, the mixin field will replace it.
However, if the mixin field is defined as an active field and there is a field with the same name
in the target class, then the mixin field will wrap the original field. For example, the following
mixin is designed to wrap the field `x` of the original class:

	var mixin = {
		fields: {
			get x: function() 	 { console.log('getting x'); return this._get(); },
			set x: function(val) { console.log('setting x'); this._set(val); },
		}
	}

`methods` is a set of methods to be added to the target class.
Methods that are already defined in the target class are silently ignored.
To redefine such methods, use `wrappers` instead (see below).

`wrappers` is a set of method wrappers. In the example below, the `setPosition` method is wrapped
to trigger a `redisplay`, which itself is defined as a method of the mixin:

	var mixin = {
		methods:  { redisplay: function() {...} },
		wrappers: { setPosition: function(x, y) { this._inner(x, y); this.redisplay(); } }
	}

Mixins can be added to and removed from a class as follows:

	A.mixin(mixin)		// add mixin to A
	A.unmix(mixin)		// remove mixin from A
	A.hasMixin(mixin)	// true if mixin has been added to A

### Introspection ###

All classes created with Classy have a single metaclass, called `Metaclass` and exported by the module.
This object holds all the methods applicable to a class, most of which have been introduced before: the `create` default constructor and the methods to define constructors, fields, methods and mixins.

The `Metaclass` object also features a set of methods that are useful for introspection of the classes.

General class information :

	A.superclass()		// return parent class (Object for root classes)
	A.name('...')		// assign a name to the class
	A.className()		// return the class's name
	A.toString()		// return 'class <className>'

Information about fields:

	A.hasOwnField('x')	// true if x is a field of A
	A.listOwnFields()	// return the list of fields of A
	A.hasField('x')		// true if x is a field of A or one of its parent classes
	A.listAllFields()	// return the list of fields of A and its parent classes
	A.listFields(spec)	// return the list of fields of A and its parent classes matching the specification

Information about constructors defined in the class itself:

	A.hasOwnConstructor(name)	// true if 'name' is a constructor of class A
	A.getOwnConstructor(name)	// return the constructor 'name' if defined in class A
	A.listOwnConstructors()		// return the list of constructors defined in class A

Information about constructors defined in the class itself or one of its parent classes:

	A.hasConstructor(name)		// true if 'name' is a constructor available to class A
	A.getConstructor(name)		// return the constructor 'name' if it is available to class A
	A.listConstructors()		// return the list of constructors available to class A

Information about methods defined in the class itself:

	A.hasOwnMethod(name)		// true if 'name' is a method of class A
	A.getOwnMethod(name)		// return the method 'name' if defined in class A
	A.listOwnMethods()			// return the list of methods defined in class A

Information about methods defined in the class itself or one of its parent classes:

	A.hasMethod(name)			// true if 'name' is a method available to class A
	A.getMethod(name)			// return the method 'name' if it is available to class A
	A.listAllMethods()			// return the list of methods available to class A
	A.listMethods(spec)			// return the list of fields of A and its parent classes matching the specification

