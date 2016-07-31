import test from 'ava';
import sinon from 'sinon';

global.window = {
	localStorage: {}
};

require('../extension/src/persistence-service.js');
require('../extension/src/network-service.js');

test.beforeEach(t => {
	t.context.persistence = new global.window.PersistenceService({
		getDefaults: () => {}
	});
	t.context.endpoint = 'http://endpoint.net/foo';
});

test('installs NetworkService constructor', t => {
	t.is(typeof global.window.NetworkService, 'function');
});

test('NetworkService constructor sets PersistenceService', t => {
	const service = new global.window.NetworkService(t.context.persistence);
	t.true(service.PersistenceService instanceof global.window.PersistenceService);
});

test('#getHeaders method returns Object with oauthToken and empty If-Modified-Since header', t => {
	const service = new global.window.NetworkService(t.context.persistence);
	t.deepEqual(service.getHeaders('oauthToken'), {
		'Authorization': 'token oauthToken',
		'If-Modified-Since': ''
	});
});

test('#request returns Promise', t => {
	const service = new global.window.NetworkService(t.context.persistence);
	global.window.fetch = sinon.stub().returns(Promise.resolve('{}'));
	global.window.localStorage.getItem = sinon.stub().returns('oauthToken');
	t.true(service.request(t.context.endpoint) instanceof Promise);
});

test('#request method requests fetches given url with proper headers', t => {
	const service = new global.window.NetworkService(t.context.persistence);
	global.window.fetch = sinon.stub().returns(Promise.resolve('{}'));
	global.window.localStorage.getItem = sinon.stub().returns('oauthToken');
	service.request(t.context.endpoint);
	t.deepEqual(global.window.fetch.lastCall.args, [t.context.endpoint, {
		headers: {
			'Authorization': 'token oauthToken',
			'If-Modified-Since': ''
		}
	}]);
});

test('#request method returns rejected Promise if oauthToken is empty', t => {
	const service = new global.window.NetworkService(t.context.persistence);
	global.window.localStorage.getItem = sinon.stub().returns('');
	t.throws(service.request(t.context.endpoint), 'missing token');
});
