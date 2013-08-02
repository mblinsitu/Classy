
describe('Simple constructors:', function(){
	var Thing;

	beforeEach(function() {
		Thing = OO.newClass().name('Thing');
		Thing.field('_name', 'unknown');
		Thing.method('name', function(name) {
			if (name)
				this._name = name;
			return this._name+'(Thing)';
		});
	})

    it('empty constructor', function() {
		var t1 = Thing.create();
		t1.should.be.an('object');
		t1._name.should.equal('unknown');

		t1.name('t1');
		t1._name.should.equal('t1');
		t1.name().should.equal('t1(Thing)');
    })

    it('literal object init', function() {
		var t2 = Thing.create({_name: 't2'});

		t2._name.should.equal('t2');
		t2.name().should.equal('t2(Thing)');
    })

    it('constructor with argument', function() {
    	Thing.constructor(function(name) {this._name = name;})
		var t4 = Thing.create('t4');

		t4._name.should.equal('t4');
		t4.name().should.equal('t4(Thing)');
    })

    it('named constructor', function() {
    	Thing.constructor('withName', function(name) {this._name = name;});
		var t3 = Thing.withName('t3');
		t3._name.should.equal('t3');
		t3.name().should.equal('t3(Thing)');
    })
})

describe('Constructor chaining:', function() {
	var A, B, C;

	beforeEach(function() {
		A = OO.newClass().name('A');
		A.field('_trace', '');
		A.method('trace', function (msg) {if (msg) this._trace += msg; return this._trace; });

		B = A.subclass().name('B');
		C = B.subclass().name('C');		

		A.constructor(function() {this.trace('A');});
		C.constructor(function() {this.trace('C<'); this._super(); this.trace('>');});
	})

	it('a constructor', function() { A.create().trace().should.equal("A"); });
	it('b constructor', function() { B.create().trace().should.equal("A"); });
	it('c constructor', function() { C.create().trace().should.equal("C<A>"); });

	describe('two super:', function () {
		beforeEach(function() {
			A.constructor(function() {this.trace('A');});
			C.constructor(function() {this.trace('C<'); this._super(); this.trace('>');});
			B.constructor(function() {this.trace('B<'); this._super(); this.trace('>');});
		})
		it('b constructor', function() { B.create().trace().should.equal("B<A>"); });
		it('c constructor', function() { C.create().trace().should.equal("C<B<A>>"); });
	})
})

describe('Named constructors:', function() {
	var A, B, C;

	beforeEach(function() {
		A = OO.newClass().name('A');
		A.field('_trace', '');
		A.method('trace', function (msg) {if (msg) this._trace += msg; return this._trace; });
		B = A.subclass().name('B');
		C = B.subclass().name('C');

		A.constructor('myCreate', function() {this.trace('A');});
		C.constructor('myCreate', function() {this.trace('C<'); this._super(); this.trace('>');});
	});

	it('a constructor', function () { A.myCreate().trace().should.equal("A"); });
	it('b constructor', function () { B.myCreate().trace().should.equal("A"); });
	it('c constructor', function () { C.myCreate().trace().should.equal("C<A>"); });
	
	it('A hasOwnConstructor', function () { A.hasOwnConstructor('myCreate').should.be.true });
	it('B hasOwnConstructor', function () { B.hasOwnConstructor('myCreate').should.be.false });
	it('B hasConstructor', function () { B.hasConstructor('myCreate').should.be.true });
	
	describe('two super:', function() {
		beforeEach(function() {
			B.constructor('myCreate', function() {this.trace('B<'); this._super(); this.trace('>');});
		})
		it('b constructor', function () { B.myCreate().trace().should.equal("B<A>"); });
		it('c constructor', function () { C.myCreate().trace().should.equal("C<B<A>>"); });
	})

	describe('calling other parent constructor', function() {
		beforeEach(function() {
			A.constructor(function() {this.trace('[A]');});
			B.constructor('myCreate', function() {this.trace('B>'); A.getConstructor().call(this); });
		})
		it('call A:create', function() {B.myCreate().trace().should.equal("B>[A]"); });
	})
})

describe('Fields:', function () {
	var Color, red, black;

	beforeEach(function() {
		Color = OO.newClass().name('Color').fields({r: 0 , g: 0, b: 0});
		black = Color.create();
		red = Color.create({r: 1});
	})
	
	it('default values:', function() {
		black.r.should.equal(0);
		black.g.should.equal(0);
		
		red.r.should.equal(1);
		red.g.should.equal(0);
	})
	
	describe('field types:', function () {
		var A;
		var a1, a2;

		beforeEach(function() {
			function shared(obj) { return function() {return obj; }};

			A = OO.newClass().name('A');
			A.field('x', 0);
			A.field('a', [1, 2, 3]);
			A.field('sa', shared([1, 2, 3]));
			A.field('l', { r: 0, g: 1, b:0.5});
			A.field('sl', shared({ r: 0, g: 1, b:0.5}));
			A.field('c', red);
			A.field('f', function() { return 'dynamic'; });
			a1 = A.create();
			a2 = A.create();
		})
		
		it('scalar:', function() {
			a1.x = 1;
			a2.x = 2;
			a1.x.should.not.equal(a2.x);	// not shared
		})
		
		if('array', function() {
			a1.a[0] = 5;
			a2.a[0].should.equal(1);	// not shared
		})
		
		it('shared array', function() {
			a1.sa[0] = 5;
			a2.sa[0].should.equal(5);
		})

		it('literal object', function() {
			a1.l.r = 0.5;
			a2.l.r.should.equal(0);	// not shared
		})

		it('shared literal object', function() {
			a1.sl.r = 0.5;
			a2.sl.r.should.equal(0.5);
		})

		it('(shared) object', function() {
			a1.c.should.equal(red);
			a1.c.r = 0.5;
			a2.c.r.should.equal(0.5);
		})

		it('functional field', function() {
			a1.f.should.equal('dynamic');
		})
		
		it('inherited field', function() {
			var B = A.subclass().name('B');
			var b1 = B.create();
			b1.x.should.equal(0);
		})

	})
	
	describe('object fields', function() {
		var style1 = {
			border: {r: 1, g: 0, b:0},
			fill: {r: 0 , g:1, b: 0},
			gradient: {
				start: {r: 1, g: 1, b:0},
				stop: {r: 0, g: 1, b:1},
			}
		};
		var blue = {r: 0, g: 0, b: 1};
		var style2 = {
			border: blue,
			fill: blue,
			gradient: {
				start: blue,
				stop: blue,
			}
		};
		var C = OO.newClass();
		var c1 = C.create(style1);
		var c2 = C.create(style2);
		it('copy init value', function() {c1.border.should.not.equal(style1.border); });
		it('deep copy init value', function() {c1.border.should.not.equal(c1.fill); });
		it('deep copy init value with subobjects', function() {c1.gradient.start.should.not.equal(c1.gradient.stop); });
		it('deep copy init value with shared fields', function() {c2.border.should.equal(c2.fill); });
		it('deep copy init value with shared fields in subobjects', function() {c2.gradient.start.should.equal(c2.gradient.stop); });

	})
});

describe('Set/get fields:', function() {
	var Thing;
	var t1;

	beforeEach(function() {
		Thing = OO.newClass().name('Thing');
		Thing.fields({
			x: 0,
			y: 0,
			width: 800,
			height: 600,
		});

		t1 = Thing.create();
	})

	it('default field', function() { t1.width.should.equal(800); });
	it('undef field', function() { should.not.exist(t1.left); });

	it('.get', function() { t1.get().should.deep.equal({x: 0, y: 0, width: 800, height: 600}); });
	it('.get x', function() { t1.get('x').should.equal(0); });
	it('.get x width', function() { t1.get('x', 'width').should.deep.equal(['x', 0, 'width', 800]); });
	it('.get [width,height]', function() { t1.get(['width', 'height']).should.deep.equal([800, 600]); });
	it('.get {x,width}', function() { t1.get({x:10, width:0}).should.deep.equal({x:0, width:800}); });

	it('.set x', function() { t1.set('x', 10); t1.x.should.equal(10); });
	it('.set x y', function() { t1.set('x', 15, 'y', 20); (t1.x+t1.y).should.equal(35); });
	it('.set {x,y}', function() { t1.set({x: 20, y: 50}); (t1.x+t1.y).should.equal(70); });
	it('.set [x,y]', function() { t1.set(['x', 'y'], [200, 500]); (t1.x+t1.y).should.equal(700); });

	it('.get undefined field', function() { should.not.exist(t1.get('z')); });
	it('.get undefined fields', function() { t1.get('z', 't').should.be.empty; });
	it('.get [undefined fields]', function() { t1.get(['x', 'z']).should.deep.equal([0, undefined]); });
	it('.get {undefined fields}', function() { t1.get({x: 100, z: 10}).should.deep.equal({x: 0}); });

	it('.set undefined field', function() { t1.set('z', 100); should.not.exist(t1.z); });
	it('.set {undefined field}', function() { t1.set({z: 100, width: 1000}); should.not.exist(t1.z); t1.width.should.equal(1000); });

	it('object field:', function() {
		var Point = OO.newClass().name('Point');
		Point.fields({x: 0, y: 0, z: 0});
		var p1 = Point.create();
		p1.set({x: 123, y: 456, z: 789});
		it('.get obj', function() { t1.get(p1).should.equal({x: 200, y: 500});} );
		it('.set obj', function() { t1.set(p1); (t1.x+t1.y).should.equal(579); should.not.exist(t1.z);} );
	})
});

describe('Method calls:', function() {
	var A, B, C;

	beforeEach(function() {
		A = OO.newClass()//.name('A');
		A.method('m', function() {return 'm in A';});
		B = A.subclass()//.name('B');
		C = B.subclass()//.name('C');
		C.method('m', function() {return '('+this._super()+') '+'m in C';});
	});
	
	it('local method', function() { A.create().m().should.equal("m in A"); });
	it('non-local method', function() { B.create().m().should.equal("m in A"); });
	it('super in grandparent', function() { C.create().m().should.equal("(m in A) m in C"); });
	
	it('hasOwnMethod', function() { A.hasOwnMethod('m').should.be.true; });
	it('hasOwnMethod', function() { B.hasOwnMethod('m').should.be.false; });
	it('hasMethod', function() { B.hasMethod('m').should.be.true; });
	
	describe('super:', function() {
		beforeEach(function() {
			B.method('m', function() {return '('+this._super()+') '+'m in B';});			
		})
		it('in parent', function() { B.create().m().should.equal("(m in A) m in B"); });
		it('chain', function() { C.create().m().should.equal("((m in A) m in B) m in C"); });

		describe('super:', function() {
			beforeEach(function() {
				A.method('m2', function() {return 'm2 in A';});
				B.method('m2', function() {return '('+this.m()+') '+'m2 in B';});
				C.method('m2', function() {return '('+this._super()+') '+'m2 in C';});
			})
			it('chain', function() {
				C.create().m2().should.equal("((((m in A) m in B) m in C) m2 in B) m2 in C");
			})
		
			describe('super:', function() {
				beforeEach(function() {
					A.method('m1', function() {return 'm1 in A'; });
					B.method('m1', function() {return '('+this._super()+') '+'m1 in B';});
					B.method('m2', function() {return '('+this.m1()+') '+'m2 in B';});
					C.method('m2', function() {return '('+this._super()+') '+'m2 in C';});
				})
				it('two chains', function() {
					C.create().m2().should.equal("(((m1 in A) m1 in B) m2 in B) m2 in C");
				})
			})
		})
	})
});

// [begin activefield]
describe ('activeField:', function () {

	describe('simple field:', function() {
		var Temp, t;

		beforeEach( function() {
			Temp = OO.newClass().name('Temp').field('celsius', 0);
			Temp.activeField('farenheit',
				function() { return this.celsius * 9 / 5 + 32},
				function(t) { this.celsius = (t - 32) * 5/9}
			);
			
			t = Temp.create();
		})

		it('get active field', function() { t.celsius = 10; t.farenheit.should.equal(50); })
		it('set active field', function() { t.farenheit = 95; t.celsius.should.equal(35); })
	})
	
	describe('get only field:', function() {
		var GetOnly, o;

		beforeEach(function() {
			GetOnly = OO.newClass().name('GetOnly')
				.activeField('count', function() { 
					if (! this._cnt)
						this._cnt = 0;
					this._cnt++; 
					return this._cnt;
				});
			o = GetOnly.create();
		})
		
		it('get only field', function() {
			o.count.should.equal(1); 
			o.count.should.equal(2); 
		})

		it('cannot set', function() {
			o.count.should.equal(1);
			var error = "";
			try {
				o.count = 10; 
			} catch(err) {
				error = "set error";
			}
			error.should.be.empty;	// note: on modern javascript interpreters, undefined setter is just ignored
			o.count.should.equal(2);
		})
	})
});

describe ('active property:', function () {
	describe('simple field:', function() {
		var Temp, t;

		beforeEach( function() {
			Temp = OO.newClass().name('Temp').fields({
				celsius: 0,
				get farenheit() { return this.celsius * 9 / 5 + 32},
				set farenheit(t) { this.celsius = (t - 32) * 5/9},
			});
			t = Temp.create();
		})
		
		it('get active field', function() { t.celsius = 10; t.farenheit.should.equal(50); })
		it('set active field', function() { t.farenheit = 95; t.celsius.should.equal(35); })
	})

	describe('get only field:', function() {
		var GetOnly, o;

		beforeEach(function() {
			GetOnly = OO.newClass().name('GetOnly').fields({
				get count() { if (! this._cnt) this._cnt = 0; this._cnt++; return this._cnt;}
			});

			o = GetOnly.create();
		})

		it('get only field', function() { o.count.should.equal(1); o.count.should.equal(2); })

		it('cannot set', function() {			
			o.count.should.equal(1);
			var error = "";
			try {
				o.count = 10; 
			} catch(err) {
				error = "set error";
			}
			error.should.be.empty; // note: on modern javascript interpreters, undefined setter is just ignored })
			o.count.should.equal(2); 
		})
	})
});
// [end activefield]

describe ('Class methods and fields:', function () {
	var A;

	beforeEach(function() {
		A = OO.newClass().name('A');
		A.classField('count', 10);
		A.classMethod('oneMore', function() { this.count++; });
		A.classMethod('numInstances', function() { return this.count; });
		A.constructor(function() { this._super(); this.classs().oneMore(); });
		
	})

	it("class field and method", function() { 
		A.numInstances().should.equal(10); 
		var a1 = A.create();
		A.numInstances().should.equal(11); 
		var a2 = A.create();
		A.numInstances().should.equal(12); 
	})
	
	describe('subclass:', function() {
		var B, a1, b1;
		beforeEach(function() {
			B = A.subclass().name('B');
			B.classField('count', 100);
			a1 = A.create();
			b1 = B.create();
		})
		// note: creates a count property in B (use A.count instead of this.count and this.classs().count above to share the counter)
		
		it("inherited class field and method", function() { 
			A.numInstances().should.equal(11); 
			B.numInstances().should.equal(101); 
		})
		it("explicit call to super in class method", function() {
			B.classMethod('numInstances', function() {
				return this.count + this.superclass().numInstances();
			});
			B.numInstances().should.equal(112); // 11 + 101
		})
	})
});

// [begin mixin]
describe('Method wrappers:', function() {
	var A, a;
	beforeEach(function() {
		A = OO.newClass().name('A');
		A.field('_trace', '');
		A.method('trace', function (msg) {if (msg) this._trace += msg; var res = this._trace; if (! msg) this._trace = ''; return res; });
		A.method('m', function() { this.trace('A::m'); });
		a = A.create();
	})

	it('simple wrapping', function() { 
		a.m();
		a.trace().should.equal('A::m'); 

		A.wrap('m', function() { this.trace('A before - '); this._inner(); this.trace(' - A after') });
		a.m();
		a.trace().should.equal('A before - A::m - A after'); 
	})
	
	describe('inheritance:', function() {
		var B, b;

		beforeEach(function() {
			A.wrap('m', function() { this.trace('A before - '); this._inner(); this.trace(' - A after') });
			B = A.subclass().name('B');
			B.wrap('m', function() { this.trace('B before - '); this._inner(); this.trace(' - B after') });
			b = B.create();
		})

		it('wrapping inherited method', function() {
			b.m();
			b.trace().should.equal('B before - A before - A::m - A after - B after');
		})

		// super in the method
		it('call to super', function() {
			B.method('m', null); // since m is wrapped, we want to undefine it first
			B.method('m', function() { this._super(); this.trace(' - B::m'); });
			b.m();
			b.trace().should.equal('A before - A::m - A after - B::m');

			B.wrap('m', function() { this.trace('B before - '); this._inner();  this.trace(' - B after') });
			b.m();
			b.trace().should.equal('B before - A before - A::m - A after - B::m - B after');
		})

		// super in the wrapper
		it('wrapping with call to super', function() {
			B.method('m', null); // since m is wrapped, we want to undefine it first
			B.method('m', function() { this.trace(' - B::m'); });
			B.wrap('m', function() { this._super(); });
			b.m();
			b.trace().should.equal('A before - A::m - A after');
		})
	
		// super and inner in the wrap
		it('wrapping with call to super and inner', function() {
			B.method('m', null); // since m is wrapped, we want to undefine it first
			B.method('m', function() { this.trace(' - B::m'); });
			B.wrap('m', function() { this._super(); this._inner(); });
			b.m();
			b.trace().should.equal('A before - A::m - A after - B::m');
		})
	})
	
	// double wrap
	it('double wrap', function() {
		A.method('m2', function() { this.trace('A::m2'); });
		var a2 = A.create();

		// not wrapped
		a2.m2(); 
		a2.trace().should.equal('A::m2');

		// wrapped once
		A.wrap('m2', function() { this.trace('w1>'); this._inner(); this.trace('<w1'); });
		a2.m2(); 
		a2.trace().should.equal('w1>A::m2<w1');

		// wrapped twice
		A.wrap('m2', function() { this.trace('w2>'); this._inner(); this.trace('<w2'); });
		a2.m2(); 
		a2.trace().should.equal('w2>w1>A::m2<w1<w2');

		// unwrap
		A.unwrap('m2');
		a2.m2(); 
		a2.trace().should.equal('w1>A::m2<w1');
		A.unwrap('m2');
		a2.m2(); 
		a2.trace().should.equal('A::m2');
		A.unwrap('m2');
		a2.m2(); 
		a2.trace().should.equal('A::m2');
	})

	it('wrapping unexistent method', function() {
		A.wrap('m3', function() { this.trace('A::m3'); this._inner(); });
		A.hasOwnMethod('m3').should.be.true;		//wrapper exists

		A.unwrap('m3');
		A.hasOwnMethod('m3').should.be.false;		//undefined after unwrap
	})
	
	it('wrapping with inner', function() {
		function w1() { this.trace('w1>'); this._inner(); this.trace('<w1'); };
		function w2() { this.trace('w2>'); this._inner(); this.trace('<w2'); };
		function w3() { this.trace('w3>'); this._inner(); this.trace('<w3'); };
		var a2 = A.create();

		// wrapped w1 w2 w3
		A.wrap('m3', w1).wrap('m3', w2).wrap('m3', w3);
		a2.m3();
		a2.trace().should.equal('w3>w2>w1><w1<w2<w3');

		// unwrap not wrapped
		A.unwrap('m3', function() { this.trace('unknown'); });
		a2.m3();
		a2.trace().should.equal('w3>w2>w1><w1<w2<w3');

		// unwrap w2
		A.unwrap('m3', w2);
		a2.m3();
		a2.trace().should.equal('w3>w1><w1<w3');

		// unwrap w1
		A.unwrap('m3', w1);
		a2.m3();
		a2.trace().should.equal('w3><w3');

		// undefined after unwrap
		A.unwrap('m3', w3);
		A.hasOwnMethod('m3').should.be.false;
	})
	
	it('shared wrappers', function() {
		function wrapit() { this.trace('w> '); this.trace(this.nm); this.trace(' <w')};
		var B1 = A.subclass().name('A1').field('nm', 'B1').method('m', function() { this.trace('B1::m'); }).wrap('m', wrapit);
		var B2 = A.subclass().name('A2').field('nm', 'B2').method('m', function() { this.trace('B2::m'); }).wrap('m', wrapit);
		var b1 = B1.create();
		var b2 = B2.create();

		// first use of wrapper
		b1.m();
		b1.trace().should.equal('w> B1 <w');

		// second use of wrapper
		b2.m();
		b2.trace().should.equal('w> B2 <w');

	})

});

describe('Mixins:', function() {
	var A, mix, a;

	beforeEach(function() {
		A = OO.newClass().name('A');
		A.fields({ x: 0, y: 0, color: 'red' });
		A.field('_trace', '');
		A.constructor(function() { this.trace('new A') });
		A.method('trace', function (msg) {if (msg) this._trace += msg; var res = this._trace; if (! msg) this._trace = ''; return res; });
		A.method('m', function() { this.trace('A::m'); });
		A.method('w', function() { this.trace('A::w'); });

		mix = {
			constructor: function() {
				this.trace(" (add mixin)");
			},
			fields: {
				z: 0,
				color: 'white',
			},
			methods: {
				m: function() { this.trace('mixin::m'); },
				mm: function() { this.trace('mixin::mm'); },			
			},
			wrappers: {
				w: function() { this.trace('mixin::w> '); this._inner(); this.trace(' <mixin::w') },
				
			},
		};
		
		a = A.create();
	})

	it('before mixin', function() {
		a.trace().should.equal('new A');
		a.m(); a.trace().should.equal('A::m');
		a.w(); a.trace().should.equal('A::w');		
	})
	
	it('after mixin', function() {
		a.trace().should.equal('new A');
		A.mixin(mix);
		var b = A.create(); b.trace().should.equal('new A (add mixin)');
		a.m(); a.trace().should.equal('A::m');
		a.mm(); a.trace().should.equal('mixin::mm');
		a.w(); a.trace().should.equal('mixin::w> A::w <mixin::w');
	})

	it('redefined wrapped method', function() {
		a.trace().should.equal('new A');
		A.mixin(mix);
		A.method('w', function() { this.trace("new A::w"); });
		a.w(); a.trace().should.equal('mixin::w> new A::w <mixin::w');
	})
	
	it('after mixin removed', function() {
		a.trace().should.equal('new A');
		A.mixin(mix);
		A.method('w', function() { this.trace("new A::w"); });
		A.unmix(mix);
		a.m(); a.trace().should.equal('A::m');
		a.w(); a.trace().should.equal('new A::w');
		A.hasOwnMethod('mm').should.be.false;
	})
	
});
// [end mixin]

// [begin wrapfield]
describe('Wrapped fields:', function() {
	var A, a;

	beforeEach(function() {
		A = OO.newClass().name('A');
		A.fields({ x: 0, y: 0, color: 'red' });
		A.field('_trace', '');
		A.method('trace', function (msg) {if (msg) this._trace += msg; var res = this._trace; if (! msg) this._trace = ''; return res; });
		
		A.wrapField('x', 
			function() { this.trace('get x; '); return this._get(); }, 
			function(val) { this.trace('set x; '); this._set(val); }
		);
		
		a = A.create();
	})

	it('set/get', function() {
		a.x = 10; 
		a.trace().should.equal('set x; ');

		a.x; 
		a.trace().should.equal('get x; ');

		a.x += 10; 
		a.trace().should.equal('get x; set x; ');
		a.x.should.equal(20);

		a.trace()
	})
	
	it('single object', function() {
		// wrapping and unwrapping a field of a single object
		a.wrapField('y', 
			function() { this.trace('get y; '); return this._get(); }, 
			function(val) { this.trace('set y; '); this._set(val); }
		);

		a.y = a.y + 20;
		a.trace().should.equal('get y; set y; ');

		a.unwrapField('y');
		a.y = a.y + 20;
		a.trace().should.be.empty;
		
		// unwrapping a class field in an existing object
		a.unwrapField('x', A);
		a.x += 10;
		a.trace().should.be.empty;
	})
	
	it('unwrapping class-level field', function() {
		// unwrapping a field at the class level
		A.wrappedField('x').should.be.true;

		A.unwrapField('x');
		A.wrappedField('x').should.be.false;

		var a2 = A.create();
		a2.x = a2.x + 1; 
		a2.trace().should.be.empty;	
	})
	
	describe('read-only fields:', function() {
		var B, b, count;

		beforeEach(function() {
			B = OO.newClass().name('B');
			count = 0;
			B.fields({
				get ro() { return ++count;}
			});
			B.wrapField('x', 
				function() { return this._get(); }, 
				function(val) { this._set(val); }
			);
			
			// wrapping an undefined field
			b = B.create();
		})

		it('undefined field', function() {
			should.not.exist(b.x);
			b.x = 2;
			b.x.should.equal(2);

		})

		it('wrapping field with a getter or setter only', function() {
			b.ro; // 1
			b.ro.should.equal(2);
			var error = "";
			try {
				b.ro = 5;
			} catch(err) {
				error = "set error";
			}
			error.should.be.empty;	// note: fails on modern javascript interpreters: undefined setter is just ignored
			b.ro.should.equal(3);

			B.wrapField('ro', 
				undefined,
				function(val) { count = val; } 
			);
			b = B.create();
			b.ro = 10;
			b.ro.should.equal(11);
		})
	})	
});

describe('Mixin with wrapped fields:', function() {
	var A, myMixin;

	beforeEach(function() {
		A = OO.newClass().name('A');
		A.fields({ x: 0, y: 0, color: 'red' });
		A.field('_trace', '');
		A.method('trace', function (msg) {if (msg) this._trace += msg; var res = this._trace; if (! msg) this._trace = ''; return res; });
		
		A.wrapField('x', 
			function() { this.trace('get x; '); return this._get(); }, 
			function(val) { this.trace('set x; '); this._set(val); }
		);
		
		myMixin = {
			__name: 'myMixin',
			toString: function() {return "myMixin"; },
			fieldWrappers: {
				get x() { this.trace('get x (2); '); return this._get(); }, 
				set x(val) { this.trace('set x (2); '); this._set(val); },
				get y() { this.trace('get y; '); return this._get(); },
				set y(val) { this.trace('set y; '); this._set(val); },
			}
		};
	})

	it('before mixin', function() {
		var a = A.create();

		a.x = 10;
		a.trace().should.equal('set x; ');

		a.x;
		a.trace().should.equal('get x; ');
	})

	it('after mixin', function() {
		A.mixin(myMixin);
		var a = A.create();

		// set double wrapped field
		a.x = 10;
		a.trace().should.equal('set x (2); set x; ');

		// get double wrapped field
		a.x;
		a.trace().should.equal('get x (2); get x; ');

		// set wrapped field
		a.y = 10;
		a.trace().should.equal('set y; ');

		// get wrapped field
		a.y;
		a.trace().should.equal('get y; ');

		// change wrapped field
		a.y += 10;
		a.trace().should.equal('get y; set y; ');
	})

	it('unwrapping class and mixin fields at the object level', function() {
		A.mixin(myMixin);
		var a = A.create();
		a.unwrapField('x', A);

		// unwrap class field
		a.x += 5;
		a.trace().should.equal('get x (2); set x (2); ');

		// unwrap mixin field
		a.unwrapField('y', myMixin);
		a.y += 15;
		a.trace().should.be.empty;

		// unwrap class field
		var a2 = A.create();
		a2.unwrapField('x', myMixin);
		a2.x += 25;
		a2.trace().should.equal('get x; set x; ');
	})
		
	it('unwrap all mixin fields', function() {
		A.mixin(myMixin);
		var a = A.create();

		// unwrap all mixin fields
		a.unwrapFields(myMixin);
		a.x += 5; a.trace().should.equal('get x; set x; ');
		a.y += 7; a.trace().should.be.empty;

		// unwrap all class fields
		a.unwrapFields(A);
		a.x += 5; a.trace().should.be.empty;
		a.y += 7; a.trace().should.be.empty;
	})
});
