/*
	(c) 2011-2013, Michel Beaudouin-Lafon, mbl@lri.fr
	Open sourced under the MIT License

	Master file to generate the two versions of Classy using cpp
*/

(function(exports) {

#include "base.js"

#ifdef MIXIN
#include "mixin.js"
#endif

#include "metaclass.js"

exports.newClass = newClass;	// this is all we need to use Classy
exports.metaclass = Metaclass;	// this is for those who want to fiddle with the metaclass, e.g. to add new methods
								// For any Classy class, "A instanceof Classy.metaclass" returns true
exports.object = object;		// this is the constructor of Classy objects, i.e. "o instanceof Classy.object" returns true

})(typeof exports === 'undefined' ? this[MODULE] = {} : exports);
