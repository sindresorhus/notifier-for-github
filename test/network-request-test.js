import test from 'ava';
import sinon from 'sinon';
import util from './util';

global.window = util.setupWindow();

const networkRequest = require('../extension/src/network-request.js');

test.beforeEach(t => {
	t.context.endpoint = 'http://endpoint.net/foo';
});

test('#request returns Promise', t => {
	window.fetch = sinon.stub().returns(Promise.resolve('{}'));
	window.localStorage.getItem = sinon.stub().returns('oauthToken');

	return networkRequest(t.context.endpoint).then(() => {
		t.pass();
	});
});

test('#request requests fetches given url with proper headers', t => {
	window.fetch = sinon.stub().returns(Promise.resolve('{}'));
	window.localStorage.getItem = sinon.stub().returns('oauthToken');

	return networkRequest(t.context.endpoint).then(() => {
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

	t.throws(networkRequest(t.context.endpoint), 'missing token');
});
