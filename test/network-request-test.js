import test from 'ava';
import sinon from 'sinon';
import util from './util';

global.window = util.setupWindow();
const sandbox = sinon.sandbox.create();

const networkRequest = require('../extension/src/network-request.js');

test.beforeEach(t => {
	t.context.endpoint = 'http://endpoint.net/foo';
	window.chrome.storage.sync = {get: () => {}};
});

test.afterEach(() => {
	sandbox.restore();
});

test('#request returns Promise', async t => {
	sandbox.stub(window, 'fetch').returns(Promise.resolve('{}'));

	sandbox.stub(window.chrome.storage.sync, 'get')
		.withArgs('oauthToken').yieldsAsync('token');

	const response = await networkRequest(t.context.endpoint);

	t.is(response, '{}');
});

test('#request requests fetches given url with proper headers', async t => {
	sandbox.stub(window, 'fetch').returns(Promise.resolve('{}'));

	sandbox.stub(window.chrome.storage.sync, 'get')
		.withArgs('oauthToken').yieldsAsync('oauthToken');

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

test('#request returns rejected Promise if oauthToken is empty', async t => {
	sandbox.stub(window.chrome.storage.sync, 'get')
		.withArgs('oauthToken').yieldsAsync('');

	await t.throws(networkRequest(t.context.endpoint), 'missing token');
});
