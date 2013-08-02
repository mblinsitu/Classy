# the module names when used in the browser
BASEMODULE=OO
CLASSYMODULE=Classy

# where is the markdown->html generator
GMD=/Users/mbl/Dev/Tools/More\ Web\ dev\ tools/Markdown/markdown-styles-master/bin/
STYLE=mbl-bootstrap
MARKDOWN=$(GMD)/generate-md --output ./ --layout $(STYLE) --input 

ALL=classy.js oo.js README.html

BASE=src/template.js src/base.js src/metaclass.js
MIXIN=src/mixin.js src/mixin-metaclass.js

BASETESTS=test/constructors.js test/fields.js test/methods.js test/activefields.js test/class.js
MIXINTESTS=test/mixins.js test/wrapfields.js

all: $(ALL)

classy.js: $(BASE) $(MIXIN)
	echo "// Classy - Yet another Javascript OO-framework (complete)" > classy.js
	echo "// (c) 2011-2013, Michel Beaudouin-Lafon, mbl@lri.fr" >> classy.js
	echo "// Open sourced under the MIT License" >> classy.js
	./jspp -DMIXIN -DMODULE=\"$(CLASSYMODULE)\" src/template.js >> classy.js

oo.js: $(BASE)
	echo "// Classy - Yet another Javascript OO-framework (basic)" > oo.js
	echo "// (c) 2011-2013, Michel Beaudouin-Lafon, mbl@lri.fr" >> oo.js
	echo "// Open sourced under the MIT License" >> oo.js
	./jspp -DMODULE=\"$(BASEMODULE)\" src/template.js >> oo.js

docs: README.html

README.html: README.md
	$(MARKDOWN) README.md
	rm -f assets/css/bootstrap-responsive.css assets/css/bootstrap.css assets/js/bootstrap.js

tests: test webtest karma

test: $(ALL)
	mocha -r test/test-classy.js $(BASETESTS) $(MIXINTESTS)
	mocha -r test/test-oo.js $(BASETESTS)

webtest: $(ALL)
	cat $(BASETESTS) $(MIXINTESTS) > test/web/tests-classy.js; open test/web/test-classy.html
	cat $(BASETESTS) > test/web/tests-oo.js; open test/web/test-oo.html

karma: $(ALL)
	karma start test/karma.conf.oo.js --single-run
	karma start test/karma.conf.classy.js --single-run

clean:
	rm -f $(ALL)

.PHONY: test webtest karma tests docs clean
