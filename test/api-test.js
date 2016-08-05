import test from 'ava';
// import sinon from 'sinon';
import utils from './utils';

global.window = utils.setupWindow();
require('../extension/src/defaults-service.js');
require('../extension/src/persistence-service.js');
require('../extension/src/permissions-service.js');
require('../extension/src/network-service.js');
require('../extension/src/api.js');

test.beforeEach(t => {
	t.context.defaults = new global.window.DefaultsService();
	t.context.persistence = new global.window.PersistenceService(t.context.defaults);
	t.context.permissions = new global.window.PermissionsService(t.context.persistence);
	t.context.networking = new global.window.NetworkService(t.context.persistence);
});

test('installs API constructor', t => {
	t.is(typeof global.window.API, 'function');
});

test('API constructor sets its deps', t => {
	const service = new global.window.API(t.context.persistence, t.context.networking, t.context.permissions, t.context.defaults);
	t.true(service.DefaultsService instanceof global.window.DefaultsService);
	t.true(service.PersistenceService instanceof global.window.PersistenceService);
	t.true(service.NetworkService instanceof global.window.NetworkService);
	t.true(service.PermissionsService instanceof global.window.PermissionsService);
});
