
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
