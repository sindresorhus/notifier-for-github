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

	t.context.getDefaultResponse = overrides => {
		const headersGet = sinon.stub();
		headersGet.withArgs('X-Poll-Interval').returns('60');
		headersGet.withArgs('Last-Modified').returns(null);
		headersGet.withArgs('Link').returns(null);
		return Object.assign({
			headers: {
				get: headersGet
			},
			json: () => Promise.resolve([])
		}, overrides);
	};
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

test('#getTabUrl method uses default page if rootUrl matches GitHub', t => {
	const service = new global.window.API(t.context.persistence, t.context.networking, t.context.permissions, t.context.defaults);

	t.context.persistence.get = sinon.stub();
	t.context.persistence.get.withArgs('rootUrl').returns('https://api.github.com/');
	t.context.persistence.get.withArgs('useParticipatingCount').returns(false);

	t.is(service.getTabUrl(), 'https://github.com/notifications');
});

test('#getTabUrl method uses uses custom page if rootUrl is something other than GitHub', t => {
	const service = new global.window.API(t.context.persistence, t.context.networking, t.context.permissions, t.context.defaults);

	t.context.persistence.get = sinon.stub();
	t.context.persistence.get.withArgs('rootUrl').returns('https://something.com/');
	t.context.persistence.get.withArgs('useParticipatingCount').returns(false);

	t.is(service.getTabUrl(), 'https://something.com/notifications');
});

test('#getTabUrl method respects useParticipatingCount setting', t => {
	const service = new global.window.API(t.context.persistence, t.context.networking, t.context.permissions, t.context.defaults);

	t.context.persistence.get = sinon.stub();
	t.context.persistence.get.withArgs('rootUrl').returns('https://api.github.com/');
	t.context.persistence.get.withArgs('useParticipatingCount').returns(true);

	t.is(service.getTabUrl(), 'https://github.com/notifications/participating');
});

test('#parseApiResponse method promise resolves response of 0 notifications if Link header is null', t => {
	const service = new global.window.API(t.context.persistence, t.context.networking, t.context.permissions, t.context.defaults);

	const resp = t.context.getDefaultResponse();
	return service.parseApiResponse(resp).then(response => {
		t.deepEqual(response, {count: 0, interval: 60, lastModifed: null});
	});
});

test('#parseApiResponse method promise resolves response of N notifications according to Link header', t => {
	const service = new global.window.API(t.context.persistence, t.context.networking, t.context.permissions, t.context.defaults);

	const resp = t.context.getDefaultResponse();
	resp.headers.get.withArgs('Link').returns(`<https://api.github.com/resource?page=1>; rel="next"
    																				 <https://api.github.com/resource?page=2>; rel="last"`);
	return service.parseApiResponse(resp).then(response => {
		t.deepEqual(response, {count: 2, interval: 60, lastModifed: null});
		resp.headers.get.withArgs('Link').returns(`<https://api.github.com/resource?page=1>; rel="next"
																							 <https://api.github.com/resource?page=2>; rel="next"
	    																				 <https://api.github.com/resource?page=3>; rel="last"`);
		return service.parseApiResponse(resp);
	}).then(response => {
		t.deepEqual(response, {count: 3, interval: 60, lastModifed: null});
	});
});
