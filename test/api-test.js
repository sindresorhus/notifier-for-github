import test from 'ava';
import sinon from 'sinon';
import util from './util';

global.window = util.setupWindow();
const sandbox = sinon.sandbox.create();

const API = require('../extension/src/api.js');

test.beforeEach(t => {
	t.context.api = Object.assign({}, API);

	t.context.getDefaultResponse = overrides => {
		const headers = new Map([
			['X-Poll-Interval', '60'],
			['Last-Modified', null],
			['Link', null]
		]);
		return Object.assign({
			status: 200,
			headers,
			json: () => Promise.resolve([])
		}, overrides);
	};

	window.chrome.storage.sync = {get: () => {}};
	sandbox.stub(window, 'fetch');
});

test.afterEach(() => {
	sandbox.restore();
});

test('#buildQuery respects per_page option', async t => {
	const service = t.context.api;

	sandbox.stub(window.chrome.storage.sync, 'get')
		.withArgs('useParticipatingCount').yieldsAsync(false)
		.withArgs('rootUrl').yieldsAsync('https://api.github.com/');

	t.is(await service.buildQuery({perPage: 1}), 'per_page=1');
});

test('#buildQuery respects useParticipatingCount setting', async t => {
	const service = t.context.api;

	sandbox.stub(window.chrome.storage.sync, 'get')
		.withArgs('useParticipatingCount').yieldsAsync(true)
		.withArgs('rootUrl').yieldsAsync('https://api.github.com/');

	t.is(await service.buildQuery({perPage: 1}), 'per_page=1&participating=true');
});

test('#getApiUrl uses default endpoint if rootUrl matches GitHub', async t => {
	const service = t.context.api;

	sandbox.stub(window.chrome.storage.sync, 'get')
		.withArgs('useParticipatingCount').yieldsAsync(false)
		.withArgs('rootUrl').yieldsAsync('https://api.github.com/');

	t.is(await service.getApiUrl(), 'https://api.github.com/notifications');
});

test('#getApiUrl uses custom endpoint if rootUrl is something other than GitHub', async t => {
	const service = t.context.api;

	sandbox.stub(window.chrome.storage.sync, 'get')
		.withArgs('useParticipatingCount').yieldsAsync(false)
		.withArgs('rootUrl').yieldsAsync('https://something.com/');

	t.is(await service.getApiUrl(), 'https://something.com/api/v3/notifications');
});

test('#getApiUrl uses query if passed', async t => {
	const service = t.context.api;

	sandbox.stub(window.chrome.storage.sync, 'get')
		.withArgs('useParticipatingCount').yieldsAsync(false)
		.withArgs('rootUrl').yieldsAsync('https://api.github.com/');

	t.is(await service.getApiUrl({perPage: 123}), 'https://api.github.com/notifications?per_page=123');
});

test('#getTabUrl uses default page if rootUrl matches GitHub', async t => {
	const service = t.context.api;

	sandbox.stub(window.chrome.storage.sync, 'get')
		.withArgs('useParticipatingCount').yieldsAsync(false)
		.withArgs('rootUrl').yieldsAsync('https://api.github.com/');

	t.is(await service.getTabUrl(), 'https://github.com/notifications');
});

test('#getTabUrl uses uses custom page if rootUrl is something other than GitHub', async t => {
	const service = t.context.api;

	sandbox.stub(window.chrome.storage.sync, 'get')
		.withArgs('useParticipatingCount').yieldsAsync(false)
		.withArgs('rootUrl').yieldsAsync('https://something.com/');

	t.is(await service.getTabUrl(), 'https://something.com/notifications');
});

test('#getTabUrl respects useParticipatingCount setting', async t => {
	const service = t.context.api;

	sandbox.stub(window.chrome.storage.sync, 'get')
		.withArgs('useParticipatingCount').yieldsAsync(true)
		.withArgs('rootUrl').yieldsAsync('https://api.github.com/');

	t.is(await service.getTabUrl(), 'https://github.com/notifications/participating');
});

test('#parseApiResponse promise resolves response of 0 notifications if Link header is null', async t => {
	const service = t.context.api;
	const resp = t.context.getDefaultResponse();

	const response = await service.parseApiResponse(resp);
	t.deepEqual(response, {count: 0, interval: 60, lastModified: null});
});

test('#parseApiResponse promise resolves response of N notifications according to Link header', async t => {
	const service = t.context.api;

	const rawResponse = t.context.getDefaultResponse();
	const twoLinkHeader = `<https://api.github.com/resource?page=1>; rel="next"
												 <https://api.github.com/resource?page=2>; rel="last"`;
	rawResponse.headers.set('Link', twoLinkHeader);

	const parsed = await service.parseApiResponse(rawResponse);
	t.deepEqual(parsed, {count: 2, interval: 60, lastModified: null});

	const threeLinkHeader = `<https://api.github.com/resource?page=1>; rel="next"
													 <https://api.github.com/resource?page=2>; rel="next"
													 <https://api.github.com/resource?page=3>; rel="last"`;
	rawResponse.headers.set('Link', threeLinkHeader);

	const nextParsedResponse = await service.parseApiResponse(rawResponse);
	t.deepEqual(nextParsedResponse, {count: 3, interval: 60, lastModified: null});
});

test('#parseApiResponse returns rejected promise for 4xx status codes', async t => {
	const service = t.context.api;
	const resp = t.context.getDefaultResponse({
		status: 404,
		statusText: 'Not found'
	});

	await t.throws(service.parseApiResponse(resp), 'client error: 404 Not found');
});

test('#parseApiResponse returns rejected promise for 5xx status codes', async t => {
	const service = t.context.api;
	const resp = t.context.getDefaultResponse({
		status: 500
	});

	await t.throws(service.parseApiResponse(resp), 'server error');
});

test('#makeApiRequest makes networkRequest for provided url', async t => {
	const service = t.context.api;
	const url = 'https://api.github.com/resource';

	window.fetch.returns(Promise.resolve('response'));

	sandbox.stub(window.chrome.storage.sync, 'get')
		.withArgs('useParticipatingCount').yieldsAsync(false)
		.withArgs('oauthToken').yieldsAsync('token');

	await service.makeApiRequest({url});

	t.true(window.fetch.calledOnce);
});

test('#makeApiRequest makes networkRequest to #getApiUrl if no url provided in options', async t => {
	const service = t.context.api;
	const url = 'https://api.github.com/resource';

	window.fetch.returns(Promise.resolve('response'));

	sandbox.stub(window.chrome.storage.sync, 'get')
		.withArgs('useParticipatingCount').yieldsAsync(false)
		.withArgs('oauthToken').yieldsAsync('token');

	await service.makeApiRequest({url});

	t.true(window.fetch.calledOnce);
});

test('#getNotifications returns promise that resolves to parsed API response', async t => {
	const service = t.context.api;

	window.fetch.returns(Promise.resolve(t.context.getDefaultResponse()));

	sandbox.stub(window.chrome.storage.sync, 'get')
		.withArgs('useParticipatingCount').yieldsAsync(false)
		.withArgs('rootUrl').yieldsAsync('https://api.github.com/')
		.withArgs('oauthToken').yieldsAsync('token');

	const response = await service.getNotifications();

	t.deepEqual(response, {count: 0, interval: 60, lastModified: null});
});
