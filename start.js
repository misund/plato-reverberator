// Use Babel
require('babel-core/register');

// Use Bluebird for promises
global.Promise = require('bluebird');

// Finally run the beast!
require('./src/index');
