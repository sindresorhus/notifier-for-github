import test from 'ava';

global.window = {};
require('../extension/src/defaults-service.js');

test('installs DefaultsService constructor', t => {
	t.is(typeof global.window.DefaultsService, 'function');
});

test('#getDefaults method returns defaults objects', t => {
	const service = new global.window.DefaultsService();

	t.is(typeof service.getDefaults(), 'object');
});
