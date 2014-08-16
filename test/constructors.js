
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
	});

    it('empty constructor', function() {
		var t1 = Thing.create();
		t1.should.be.an('object');
		t1._name.should.equal('unknown');

		t1.name('t1');
		t1._name.should.equal('t1');
		t1.name().should.equal('t1(Thing)');
    });

    it('literal object init', function() {
		var t2 = Thing.create({_name: 't2'});

		t2._name.should.equal('t2');
		t2.name().should.equal('t2(Thing)');
    });

    it('constructor with argument', function() {
    	Thing.constructor(function(name) {this._name = name;});
		var t4 = Thing.create('t4');

		t4._name.should.equal('t4');
		t4.name().should.equal('t4(Thing)');
    });

    it('named constructor', function() {
    	Thing.constructor('withName', function(name) {this._name = name;});
		var t3 = Thing.withName('t3');
		t3._name.should.equal('t3');
		t3.name().should.equal('t3(Thing)');
    });
});

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
	});

	it('a constructor', function() { A.create().trace().should.equal("A"); });
	it('b constructor', function() { B.create().trace().should.equal("A"); });
	it('c constructor', function() { C.create().trace().should.equal("C<A>"); });

	describe('two super:', function () {
		beforeEach(function() {
			A.constructor(function() {this.trace('A');});
			C.constructor(function() {this.trace('C<'); this._super(); this.trace('>');});
			B.constructor(function() {this.trace('B<'); this._super(); this.trace('>');});
		});
		it('b constructor', function() { B.create().trace().should.equal("B<A>"); });
		it('c constructor', function() { C.create().trace().should.equal("C<B<A>>"); });
	});
});

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
	
	describe('two super:', function() {
		beforeEach(function() {
			B.constructor('myCreate', function() {this.trace('B<'); this._super(); this.trace('>');});
		});
		it('b constructor', function () { B.myCreate().trace().should.equal("B<A>"); });
		it('c constructor', function () { C.myCreate().trace().should.equal("C<B<A>>"); });
	});

	describe('calling other parent constructor', function() {
		beforeEach(function() {
			A.constructor(function() {this.trace('[A]');});
			B.constructor('myCreate', function() {this.trace('B>'); A.getConstructor().call(this); });
		});
		it('call A:create', function() {B.myCreate().trace().should.equal("B>[A]"); });
	});
});

describe('Inspect constructors:', function() {
	var A, B;
	var createA  = function() { this.acons = 'A'; };
	var createAB = function() { this.acons = 'AB'; };
	var createB  = function() { this.bcons = 'B'; };
	var createBA = function() { this.bcons = 'BA'; };

	beforeEach(function() {
		A = OO.newClass().name('A')
			.constructor('createA', createA)
			.constructor('createAB', createAB);
		B = A.subclass().name('B')
			.constructor('createB', createB)
			.constructor('createAB', createBA);
	});

	it('A hasConstructor', function() {
		/*jshint expr:true */
		A.hasConstructor('createA').should.be.true;
		A.hasConstructor('createAB').should.be.true;
		A.hasConstructor('createB').should.be.false;
	});

	it('A hasOwnConstructor', function() {
		/*jshint expr:true */
		A.hasOwnConstructor('createA').should.be.true;
		A.hasOwnConstructor('createAB').should.be.true;
		A.hasOwnConstructor('createB').should.be.false;
	});

	it('B hasConstructor', function() {
		/*jshint expr:true */
		B.hasConstructor('createA').should.be.true;
		B.hasConstructor('createAB').should.be.true;
		B.hasConstructor('createB').should.be.true;
	});

	it('B hasOwnConstructor', function() {
		/*jshint expr:true */
		B.hasOwnConstructor('createA').should.be.false;
		B.hasOwnConstructor('createAB').should.be.true;
		B.hasOwnConstructor('createB').should.be.true;
	});

	it('A getConstructor', function() {
		var fa  = A.getConstructor('createA'); var a = new fa(); a.acons.should.equal('A');
		var fab = A.getConstructor('createAB'); a = new fab(); a.acons.should.equal('AB');
	});

	it('B getConstructor', function() {
		var fb  = B.getConstructor('createB'); var b = new fb(); b.bcons.should.equal('B');
		var fab = B.getConstructor('createAB'); b = new fab(); b.bcons.should.equal('BA');
	});

	it('A listConstructors', function() {
		A.listConstructors().should.deep.equal(['create', 'createA', 'createAB']);
		B.listConstructors().should.deep.equal(['create', 'createB', 'createAB', 'createA']);
	});

	it('B listOwnConstructors', function() {
		A.listOwnConstructors().should.deep.equal(['createA', 'createAB']);
		B.listOwnConstructors().should.deep.equal(['createB', 'createAB']);
	});
});
