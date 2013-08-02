
// run the tests from the parent directory with either
//	% mocha
//		runs in node
//	% karma start
//		runs in browser

if (typeof require != 'undefined') {	// node environment
	//global.sinon = require('sinon');
	global.chai = require('chai');
	global.should = require('chai').should();

	//var sinonChai = require('sinon-chai');
	//chai.use(sinonChai);

	global.OO = require('../oo');

} else {	// browser environment
	should = chai.should();

}
