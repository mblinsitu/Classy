
describe('Fields:', function () {
	var Color, red, black;

	beforeEach(function() {
		Color = OO.newClass().name('Color').fields({r: 0 , g: 0, b: 0});
		black = Color.create();
		red = Color.create({r: 1});
	});
	
	it('default values:', function() {
		black.r.should.equal(0);
		black.g.should.equal(0);
		
		red.r.should.equal(1);
		red.g.should.equal(0);
	});
	
	describe('field types:', function () {
		var A;
		var a1, a2;

		beforeEach(function() {
			function shared(obj) { return function() {return obj; }; }

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
		});
		
		it('scalar:', function() {
			a1.x = 1;
			a2.x = 2;
			a1.x.should.not.equal(a2.x);	// not shared
		});
		
		if('array', function() {
			a1.a[0] = 5;
			a2.a[0].should.equal(1);	// not shared
		})
		
		it('shared array', function() {
			a1.sa[0] = 5;
			a2.sa[0].should.equal(5);
		});

		it('literal object', function() {
			a1.l.r = 0.5;
			a2.l.r.should.equal(0);	// not shared
		});

		it('shared literal object', function() {
			a1.sl.r = 0.5;
			a2.sl.r.should.equal(0.5);
		});

		it('(shared) object', function() {
			a1.c.should.equal(red);
			a1.c.r = 0.5;
			a2.c.r.should.equal(0.5);
		});

		it('functional field', function() {
			a1.f.should.equal('dynamic');
		});
		
		it('inherited field', function() {
			var B = A.subclass().name('B');
			var b1 = B.create();
			b1.x.should.equal(0);
		});

	});
	
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

	});
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
	});

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
	it('.get undefined fields', function() { /*jshint expr:true */ t1.get('z', 't').should.be.empty; });
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
	});
});

describe('listFields:', function() {
	var A, B;

	beforeEach(function() {
		A = OO.newClass().name('A').fields({
			foo: 1,
			bar: 2
		});

		B = A.subclass().name(B).fields({
			toto: 3,
			tutu: 4,
		});
	});

	it('hasField', function() {
		/*jshint expr:true*/
		A.hasField('foo').should.be.true;
		A.hasField('toto').should.be.false;
		A.hasField('dummy').should.be.false;

		B.hasField('foo').should.be.true;
		B.hasField('toto').should.be.true;
		B.hasField('dummy').should.be.false;
	});

	if('hasOwnField', function() {
		/*jshint expr:true*/
		A.hasOwnField('foo').should.be.true;
		A.hasOwnField('toto').should.be.false;
		A.hasOwnField('dummy').should.be.false;

		B.hasOwnField('foo').should.be.false;
		B.hasOwnField('toto').should.be.true;
		B.hasOwnField('dummy').should.be.false;
	});

	it('listfields', function() {
		A.listFields().should.deep.equal(['foo', 'bar']);
		B.listFields().should.deep.equal(['toto', 'tutu', 'foo', 'bar']);
	});

	if('listOwnFields', function() {
		A.listOwnFields().should.deep.equal(['foo', 'bar']);
		B.listOwnFields().should.deep.equal(['toto', 'tutu']);
	});
});