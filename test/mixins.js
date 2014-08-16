
// [begin mixin]
describe('Method wrappers:', function() {
	var A, a;
	beforeEach(function() {
		A = OO.newClass().name('A');
		A.field('_trace', '');
		A.method('trace', function (msg) {if (msg) this._trace += msg; var res = this._trace; if (! msg) this._trace = ''; return res; });
		A.method('m', function() { this.trace('A::m'); });
		a = A.create();
	});

	it('simple wrapping', function() { 
		a.m();
		a.trace().should.equal('A::m'); 

		A.wrap('m', function() { this.trace('A before - '); this._inner(); this.trace(' - A after'); });
		a.m();
		a.trace().should.equal('A before - A::m - A after'); 
	});
	
	describe('inheritance:', function() {
		var B, b;

		beforeEach(function() {
			A.wrap('m', function() { this.trace('A before - '); this._inner(); this.trace(' - A after'); });
			B = A.subclass().name('B');
			B.wrap('m', function() { this.trace('B before - '); this._inner(); this.trace(' - B after'); });
			b = B.create();
		});

		it('wrapping inherited method', function() {
			b.m();
			b.trace().should.equal('B before - A before - A::m - A after - B after');
		});

		// super in the method
		it('call to super', function() {
			B.method('m', null); // since m is wrapped, we want to undefine it first
			B.method('m', function() { this._super(); this.trace(' - B::m'); });
			b.m();
			b.trace().should.equal('A before - A::m - A after - B::m');

			B.wrap('m', function() { this.trace('B before - '); this._inner();  this.trace(' - B after'); });
			b.m();
			b.trace().should.equal('B before - A before - A::m - A after - B::m - B after');
		});

		// super in the wrapper
		it('wrapping with call to super', function() {
			B.method('m', null); // since m is wrapped, we want to undefine it first
			B.method('m', function() { this.trace(' - B::m'); });
			B.wrap('m', function() { this._super(); });
			b.m();
			b.trace().should.equal('A before - A::m - A after');
		})
	;
		// super and inner in the wrap
		it('wrapping with call to super and inner', function() {
			B.method('m', null); // since m is wrapped, we want to undefine it first
			B.method('m', function() { this.trace(' - B::m'); });
			B.wrap('m', function() { this._super(); this._inner(); });
			b.m();
			b.trace().should.equal('A before - A::m - A after - B::m');
		});
	});
	
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
	});

	it('wrapping unexistent method', function() {
		/*jshint expr:true */
		A.wrap('m3', function() { this.trace('A::m3'); this._inner(); });
		A.hasOwnMethod('m3').should.be.true;		//wrapper exists

		A.unwrap('m3');
		A.hasOwnMethod('m3').should.be.false;		//undefined after unwrap
	});
	
	it('wrapping with inner', function() {
		function w1() { this.trace('w1>'); this._inner(); this.trace('<w1'); }
		function w2() { this.trace('w2>'); this._inner(); this.trace('<w2'); }
		function w3() { this.trace('w3>'); this._inner(); this.trace('<w3'); }
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
		/*jshint expr:true */
		A.hasOwnMethod('m3').should.be.false;
	});
	
	it('shared wrappers', function() {
		function wrapit() { this.trace('w> '); this.trace(this.nm); this.trace(' <w'); }
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

	});

});

describe('Mixins:', function() {
	var A, mix, a;

	beforeEach(function() {
		A = OO.newClass().name('A');
		A.fields({ x: 0, y: 0, color: 'red' });
		A.field('_trace', '');
		A.constructor(function() { this.trace('new A'); });
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
				w: function() { this.trace('mixin::w> '); this._inner(); this.trace(' <mixin::w'); },
				
			},
		};
		
		a = A.create();
	});

	it('before mixin', function() {
		a.trace().should.equal('new A');
		a.m(); a.trace().should.equal('A::m');
		a.w(); a.trace().should.equal('A::w');		
	});
	
	it('after mixin', function() {
		a.trace().should.equal('new A');
		A.mixin(mix);
		var b = A.create(); b.trace().should.equal('new A (add mixin)');
		a.m(); a.trace().should.equal('A::m');
		a.mm(); a.trace().should.equal('mixin::mm');
		a.w(); a.trace().should.equal('mixin::w> A::w <mixin::w');
	});

	it('redefined wrapped method', function() {
		a.trace().should.equal('new A');
		A.mixin(mix);
		A.method('w', function() { this.trace("new A::w"); });
		a.w(); a.trace().should.equal('mixin::w> new A::w <mixin::w');
	});
	
	it('after mixin removed', function() {
		a.trace().should.equal('new A');
		A.mixin(mix);
		A.method('w', function() { this.trace("new A::w"); });
		A.unmix(mix);
		a.m(); a.trace().should.equal('A::m');
		a.w(); a.trace().should.equal('new A::w');
		/*jshint expr:true */
		A.hasOwnMethod('mm').should.be.false;
	});
	
});
// [end mixin]
