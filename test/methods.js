
describe('Method calls:', function() {
	var A, B, C;

	beforeEach(function() {
		A = OO.newClass(); //.name('A');
		A.method('m', function() {return 'm in A';});
		B = A.subclass(); //.name('B');
		C = B.subclass(); //.name('C');
		C.method('m', function() {return '('+this._super()+') '+'m in C';});
	});
	
	it('local method', function() { A.create().m().should.equal("m in A"); });
	it('non-local method', function() { B.create().m().should.equal("m in A"); });
	it('super in grandparent', function() { C.create().m().should.equal("(m in A) m in C"); });
		
	describe('super:', function() {
		beforeEach(function() {
			B.method('m', function() {return '('+this._super()+') '+'m in B';});			
		});
		it('in parent', function() { B.create().m().should.equal("(m in A) m in B"); });
		it('chain', function() { C.create().m().should.equal("((m in A) m in B) m in C"); });

		describe('super:', function() {
			beforeEach(function() {
				A.method('m2', function() {return 'm2 in A';});
				B.method('m2', function() {return '('+this.m()+') '+'m2 in B';});
				C.method('m2', function() {return '('+this._super()+') '+'m2 in C';});
			});
			it('chain', function() {
				C.create().m2().should.equal("((((m in A) m in B) m in C) m2 in B) m2 in C");
			});
		
			describe('super:', function() {
				beforeEach(function() {
					A.method('m1', function() {return 'm1 in A'; });
					B.method('m1', function() {return '('+this._super()+') '+'m1 in B';});
					B.method('m2', function() {return '('+this.m1()+') '+'m2 in B';});
					C.method('m2', function() {return '('+this._super()+') '+'m2 in C';});
				});
				it('two chains', function() {
					C.create().m2().should.equal("(((m1 in A) m1 in B) m2 in B) m2 in C");
				});
			});
		});
	});
});

describe('Inspect methods:', function() {
	var A, B;
	var mA  = function() { this.acons = 'A'; };
	var mAB = function() { this.acons = 'AB'; };
	var mB  = function() { this.bcons = 'B'; };
	var mBA = function() { this.bcons = 'BA'; };

	beforeEach(function() {
		A = OO.newClass().name('A')
			.method('mA', mA)
			.method('mAB', mAB);
		B = A.subclass().name('B')
			.method('mB', mB)
			.method('mAB', mBA);
	});

	it('A hasMethod', function() {
		/*jshint expr:true */
		A.hasMethod('mA').should.be.true;
		A.hasMethod('mAB').should.be.true;
		A.hasMethod('mB').should.be.false;
	});

	it('A hasOwnMethod', function() {
		/*jshint expr:true */
		A.hasOwnMethod('mA').should.be.true;
		A.hasOwnMethod('mAB').should.be.true;
		A.hasOwnMethod('mB').should.be.false;
	});

	it('B hasMethod', function() {
		/*jshint expr:true */
		B.hasMethod('mA').should.be.true;
		B.hasMethod('mAB').should.be.true;
		B.hasMethod('mB').should.be.true;
	});

	it('B hasOwnMethod', function() {
		/*jshint expr:true */
		B.hasOwnMethod('mA').should.be.false;
		B.hasOwnMethod('mAB').should.be.true;
		B.hasOwnMethod('mB').should.be.true;
	});

	it('A getMethod', function() {
		var fa  = A.getMethod('mA'); var a = new fa(); a.acons.should.equal('A');
		var fab = A.getMethod('mAB'); a = new fab(); a.acons.should.equal('AB');
	});

	it('B getMethod', function() {
		var fb  = B.getMethod('mB'); var b = new fb(); b.bcons.should.equal('B');
		var fab = B.getMethod('mAB'); b = new fab(); b.bcons.should.equal('BA');
	});

	it('A listMethods', function() {
		A.listMethods().should.deep.equal(['mA', 'mAB']);
		B.listMethods().should.deep.equal(['mB', 'mAB', 'mA']);
	});

	it('B listOwnMethods', function() {
		A.listOwnMethods().should.deep.equal(['mA', 'mAB']);
		B.listOwnMethods().should.deep.equal(['mB', 'mAB']);
	});
});
