// Karma configuration
// Generated on Wed Jul 24 2013 10:47:37 GMT+0200 (CEST)


// base path, that will be used to resolve files and exclude
basePath = '';


// list of files / patterns to load in the browser
files = [
//  REQUIRE,
//  REQUIRE_ADAPTER,
  MOCHA,
  MOCHA_ADAPTER,
  '../node_modules/chai/chai.js',
  '../classy.js',
  'test-classy.js',
  'constructors.js',
  'fields.js',
  'methods.js',
  'activefields.js',
  'class.js',
  'mixins.js',
  'wrapfields.js',
];


// list of files to exclude
exclude = [
];


// test results reporter to use
// possible values: 'dots', 'progress', 'junit'
reporters = ['dots', 'progress', 'junit'];


// web server port
port = 9876;


// cli runner port
runnerPort = 9100;


// enable / disable colors in the output (reporters and logs)
colors = true;


// level of logging
// possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
logLevel = LOG_INFO;


// enable / disable watching file and executing tests whenever any file changes
autoWatch = true;


// Start these browsers, currently available:
// - Chrome
// - ChromeCanary
// - Firefox
// - Opera
// - Safari (only Mac)
// - PhantomJS
// - IE (only Windows)
browsers = ["Chrome"];


// If browser does not capture in given timeout [ms], kill it
captureTimeout = 60000;


// Continuous Integration mode
// if true, it capture browsers, run tests and exit
singleRun = false;
