import test from 'ava';
import sinon from 'sinon';
import util from './util';

global.window = util.setupWindow();

const API = require('../extension/src/api.js');

test.beforeEach(t => {
	t.context.api = Object.assign({}, API);
	t.context.getDefaultResponse = overrides => {
		const headersGet = sinon.stub();
		headersGet.withArgs('X-Poll-Interval').returns('60');
		headersGet.withArgs('Last-Modified').returns(null);
		headersGet.withArgs('Link').returns(null);
		return Object.assign({
			status: 200,
			headers: {
				get: headersGet
			},
			json: () => Promise.resolve([])
		}, overrides);
	};
});

test('#buildQuery respects per_page option', t => {
	const service = t.context.api;

	t.is(service.buildQuery({perPage: 1}), 'per_page=1');
});

test('#buildQuery respects useParticipatingCount setting', t => {
	const service = t.context.api;

	window.localStorage.getItem = sinon.stub().returns(true);

	t.is(service.buildQuery({perPage: 1}), 'per_page=1&participating=true');
});

test('#getApiUrl uses default endpoint if rootUrl matches GitHub', t => {
	const service = t.context.api;

	window.localStorage.getItem = sinon.stub().returns('https://api.github.com/');

	t.is(service.getApiUrl(), 'https://api.github.com/notifications');
});

test('#getApiUrl uses custom endpoint if rootUrl is something other than GitHub', t => {
	const service = t.context.api;

	window.localStorage.getItem = sinon.stub().returns('https://something.com/');

	t.is(service.getApiUrl(), 'https://something.com/api/v3/notifications');
});

test('#getApiUrl uses query if passed', t => {
	const service = t.context.api;

	window.localStorage.getItem = sinon.stub();
	window.localStorage.getItem.withArgs('rootUrl').returns('https://api.github.com/');
	window.localStorage.getItem.withArgs('useParticipatingCount').returns(false);

	t.is(service.getApiUrl({perPage: 123}), 'https://api.github.com/notifications?per_page=123');
});

test('#getTabUrl uses default page if rootUrl matches GitHub', t => {
	const service = t.context.api;

	window.localStorage.getItem = sinon.stub();
	window.localStorage.getItem.withArgs('rootUrl').returns('https://api.github.com/');
	window.localStorage.getItem.withArgs('useParticipatingCount').returns(false);

	t.is(service.getTabUrl(), 'https://github.com/notifications');
});

test('#getTabUrl uses uses custom page if rootUrl is something other than GitHub', t => {
	const service = t.context.api;

	window.localStorage.getItem = sinon.stub();
	window.localStorage.getItem.withArgs('rootUrl').returns('https://something.com/');
	window.localStorage.getItem.withArgs('useParticipatingCount').returns(false);

	t.is(service.getTabUrl(), 'https://something.com/notifications');
});

test('#getTabUrl respects useParticipatingCount setting', t => {
	const service = t.context.api;

	window.localStorage.getItem = sinon.stub();
	window.localStorage.getItem.withArgs('rootUrl').returns('https://api.github.com/');
	window.localStorage.getItem.withArgs('useParticipatingCount').returns(true);

	t.is(service.getTabUrl(), 'https://github.com/notifications/participating');
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
	rawResponse.headers.get.withArgs('Link').returns(twoLinkHeader);

	const parsed = await service.parseApiResponse(rawResponse);
	t.deepEqual(parsed, {count: 2, interval: 60, lastModified: null});

	const threeLinkHeader = `<https://api.github.com/resource?page=1>; rel="next"
													 <https://api.github.com/resource?page=2>; rel="next"
													 <https://api.github.com/resource?page=3>; rel="last"`;
	rawResponse.headers.get.withArgs('Link').returns(threeLinkHeader);

	const nextParsedResponse = await service.parseApiResponse(rawResponse);
	t.deepEqual(nextParsedResponse, {count: 3, interval: 60, lastModified: null});
});

test.serial('#parseApiResponse returns rejected promise for 4xx status codes', t => {
	const service = t.context.api;
	const resp = t.context.getDefaultResponse({
		status: 404,
		statusText: 'Not found'
	});

	t.throws(service.parseApiResponse(resp), 'client error: 404 Not found');
});

test('#parseApiResponse returns rejected promise for 5xx status codes', t => {
	const service = t.context.api;
	const resp = t.context.getDefaultResponse({
		status: 500
	});

	t.throws(service.parseApiResponse(resp), 'server error');
});

test('#makeApiRequest makes networkRequest for provided url', t => {
	const service = t.context.api;
	const url = 'https://api.github.com/resource';

	window.fetch = sinon.stub().returns(Promise.resolve('response'));
	window.localStorage.getItem = sinon.stub().returns('token');

	service.makeApiRequest({url});

	t.true(window.fetch.calledWith(url));
});

test('#makeApiRequest makes networkRequest to #getApiUrl if no url provided in options', t => {
	const service = t.context.api;
	const url = 'https://api.github.com/resource';

	window.fetch = sinon.stub().returns(Promise.resolve('response'));
	window.localStorage.getItem = sinon.stub().returns('token');

	service.makeApiRequest({url});

	t.true(window.fetch.calledWith(url));
});

test('#getNotifications returns promise that resolves to parsed API response', async t => {
	const service = t.context.api;
	service.getApiUrl = sinon.stub().returns('https://api.github.com/resource');

	window.fetch = sinon.stub().returns(Promise.resolve(t.context.getDefaultResponse()));

	service.makeApiRequest = sinon.spy(service, 'makeApiRequest');
	service.parseApiResponse = sinon.spy(service, 'parseApiResponse');

	const response = await service.getNotifications();

	t.deepEqual(response, {count: 0, interval: 60, lastModified: null});
	t.true(service.makeApiRequest.calledOnce);
	t.true(service.parseApiResponse.calledOnce);
});
