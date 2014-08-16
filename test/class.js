
describe ('Class methods and fields:', function () {
	var A;

	beforeEach(function() {
		A = OO.newClass().name('A');
		A.classField('count', 10);
		A.classMethod('oneMore', function() { this.count++; });
		A.classMethod('numInstances', function() { return this.count; });
		A.constructor(function() { this._super(); this.classs().oneMore(); });
		
	});

	it("class field and method", function() { 
		A.numInstances().should.equal(10); 
		var a1 = A.create();
		A.numInstances().should.equal(11); 
		var a2 = A.create();
		A.numInstances().should.equal(12); 
	});
	
	describe('subclass:', function() {
		var B, a1, b1;
		beforeEach(function() {
			B = A.subclass().name('B');
			B.classField('count', 100);
			a1 = A.create();
			b1 = B.create();
		});
		// note: creates a count property in B (use A.count instead of this.count and this.classs().count above to share the counter)
		
		it("inherited class field and method", function() { 
			A.numInstances().should.equal(11); 
			B.numInstances().should.equal(101); 
		});
		it("explicit call to super in class method", function() {
			B.classMethod('numInstances', function() {
				return this.count + this.superclass().numInstances();
			});
			B.numInstances().should.equal(112); // 11 + 101
		});
	});
});
