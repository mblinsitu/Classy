
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
