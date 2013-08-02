
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
