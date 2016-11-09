import test from 'ava';
import sinon from 'sinon';
import util from './util';

global.window = util.setupWindow();

const networkRequest = require('../extension/src/network-request.js');

test.beforeEach(t => {
	t.context.endpoint = 'http://endpoint.net/foo';
});

test('#request returns Promise', async t => {
	window.fetch = sinon.stub().returns(Promise.resolve('{}'));
	window.localStorage.getItem = sinon.stub().returns('oauthToken');

	const response = await networkRequest(t.context.endpoint);

	t.is(response, '{}');
	t.pass();
});

test('#request requests fetches given url with proper headers', async t => {
	window.fetch = sinon.stub().returns(Promise.resolve('{}'));
	window.localStorage.getItem = sinon.stub().returns('oauthToken');

	const response = await networkRequest(t.context.endpoint);
	const args = [t.context.endpoint, {
		headers: {
			/* eslint-disable quote-props */
			'Authorization': 'token oauthToken',
			/* eslint-enable quote-props */
			'If-Modified-Since': ''
		}
	}];

	t.deepEqual(window.fetch.lastCall.args, args);
	t.is(response, '{}');
});

test('#request returns rejected Promise if oauthToken is empty', t => {
	window.localStorage.getItem = sinon.stub().returns('');

	t.throws(networkRequest(t.context.endpoint), 'missing token');
});
