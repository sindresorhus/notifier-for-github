import test from 'ava';
import sinon from 'sinon';
import utils from './utils';

global.window = utils.setupWindow();

const NetworkService = require('../extension/src/network-service.js');

test.beforeEach(t => {
	t.context.endpoint = 'http://endpoint.net/foo';
});

test('#getHeaders returns Object with oauthToken and empty If-Modified-Since header', t => {
	t.deepEqual(NetworkService.getHeaders('oauthToken'), {
		'Authorization': 'token oauthToken',
		'If-Modified-Since': ''
	});
});

test('#request returns Promise', t => {
	window.fetch = sinon.stub().returns(Promise.resolve('{}'));
	window.localStorage.getItem = sinon.stub().returns('oauthToken');

	return NetworkService.request(t.context.endpoint).then(() => {
		t.pass();
	});
});

test('#request requests fetches given url with proper headers', t => {
	window.fetch = sinon.stub().returns(Promise.resolve('{}'));
	window.localStorage.getItem = sinon.stub().returns('oauthToken');

	return NetworkService.request(t.context.endpoint).then(() => {
		const args = [t.context.endpoint, {
			headers: {
				'Authorization': 'token oauthToken',
				'If-Modified-Since': ''
			}
		}];
		t.deepEqual(window.fetch.lastCall.args, args);
	});
});

test('#request returns rejected Promise if oauthToken is empty', t => {
	window.localStorage.getItem = sinon.stub().returns('');

	t.throws(NetworkService.request(t.context.endpoint), 'missing token');
});
