
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
