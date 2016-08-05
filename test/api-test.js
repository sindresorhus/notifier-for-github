import test from 'ava';
import sinon from 'sinon';
import utils from './utils';

global.URLSearchParams = require('url-search-params');

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

test('#buildQuery method respects per_page option', t => {
	const service = new global.window.API(t.context.persistence, t.context.networking, t.context.permissions, t.context.defaults);
	t.is(service.buildQuery({perPage: 1}), 'per_page=1');
});

test('#buildQuery method respects useParticipatingCount setting', t => {
	const service = new global.window.API(t.context.persistence, t.context.networking, t.context.permissions, t.context.defaults);
	t.context.persistence.get = sinon.stub().returns(true);
	t.is(service.buildQuery({perPage: 1}), 'per_page=1&participating=true');
});

test('#getApiUrl method uses default endpoint if rootUrl matches GitHub', t => {
	const service = new global.window.API(t.context.persistence, t.context.networking, t.context.permissions, t.context.defaults);
	t.context.persistence.get = sinon.stub().returns('https://api.github.com/');
	t.is(service.getApiUrl(), 'https://api.github.com/notifications');
});

test('#getApiUrl method uses custom endpoint if rootUrl is something other than GitHub', t => {
	const service = new global.window.API(t.context.persistence, t.context.networking, t.context.permissions, t.context.defaults);
	t.context.persistence.get = sinon.stub().returns('https://something.com/');
	t.is(service.getApiUrl(), 'https://something.com/api/v3/notifications');
});

test('#getApiUrl method uses query if passed', t => {
	const service = new global.window.API(t.context.persistence, t.context.networking, t.context.permissions, t.context.defaults);
	t.context.persistence.get = sinon.stub();

	t.context.persistence.get.withArgs('rootUrl').returns('https://api.github.com/');
	t.context.persistence.get.withArgs('useParticipatingCount').returns(false);

	t.is(service.getApiUrl({perPage: 123}), 'https://api.github.com/notifications?per_page=123');
});
