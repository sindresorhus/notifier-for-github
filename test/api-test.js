import test from 'ava';
import * as api from '../source/lib/api';
import {fakeFetch} from './util';

test.beforeEach(t => {
	t.context.service = Object.assign({}, api);

	browser.storage.sync.set({
		options: {
			token: 'a1b2c3d4e5f6g7h8i9j0a1b2c3d4e5f6g7h8i9j0',
			rootUrl: 'https://api.github.com/',
			onlyParticipating: false
		}
	});
});

test.serial('#getApiUrl uses default endpoint if rootUrl matches GitHub', async t => {
	const {service} = t.context;

	browser.storage.sync.set({
		options: {
			rootUrl: 'https://api.github.com/'
		}
	});

	t.is(await service.getApiUrl(), 'https://api.github.com/');
});

test.serial('#getApiUrl uses custom endpoint if rootUrl is something other than GitHub', async t => {
	const {service} = t.context;

	browser.storage.sync.set({
		options: {
			rootUrl: 'https://something.com/'
		}
	});

	t.is(await service.getApiUrl(), 'https://something.com/api/v3/');
});

test.serial('#getTabUrl uses default page if rootUrl matches GitHub', async t => {
	const {service} = t.context;

	browser.storage.sync.set({
		options: {
			rootUrl: 'https://api.github.com/',
			onlyParticipating: false
		}
	});

	t.is(await service.getTabUrl(), 'https://github.com/notifications');
});

test.serial('#getTabUrl uses uses custom page if rootUrl is something other than GitHub', async t => {
	const {service} = t.context;

	browser.storage.sync.set({
		options: {
			rootUrl: 'https://something.com/',
			onlyParticipating: false
		}
	});

	t.is(await service.getTabUrl(), 'https://something.com/notifications');
});

test.serial('#getTabUrl respects useParticipatingCount setting', async t => {
	const {service} = t.context;

	browser.storage.sync.set({
		options: {
			rootUrl: 'https://api.github.com/',
			onlyParticipating: true
		}
	});

	t.is(await service.getTabUrl(), 'https://github.com/notifications/participating');
});

test.serial('#getNotificationCount promise resolves response of 0 notifications if Link header is null', async t => {
	const {service} = t.context;

	global.fetch = fakeFetch();

	const response = await service.getNotificationCount();
	t.deepEqual(response, {count: 0, interval: 60, lastModified: null});
});

test.serial('#getNotificationCount promise resolves response of N notifications according to Link header', async t => {
	const {service} = t.context;

	global.fetch = fakeFetch({
		headers: {
			// eslint-disable-next-line quote-props
			'Link': `<https://api.github.com/resource?page=1>; rel="next"
							 <https://api.github.com/resource?page=2>; rel="last"`
		}
	});

	t.deepEqual(await service.getNotificationCount(), {count: 2, interval: 60, lastModified: null});

	global.fetch = fakeFetch({
		headers: {
			// eslint-disable-next-line quote-props
			'Link': `<https://api.github.com/resource?page=1>; rel="next"
							 <https://api.github.com/resource?page=2>; rel="next"
							 <https://api.github.com/resource?page=3>; rel="last"`
		}
	});

	t.deepEqual(await service.getNotificationCount(), {count: 3, interval: 60, lastModified: null});
});

test.serial('#makeApiRequest returns rejected promise for 4xx status codes', async t => {
	const {service} = t.context;

	global.fetch = fakeFetch({
		status: 404,
		statusText: 'Not found'
	});

	await t.throws(service.makeApiRequest('notifications'), 'client error: 404 Not found');
});

test.serial('#makeApiRequest returns rejected promise for 5xx status codes', async t => {
	const {service} = t.context;

	global.fetch = fakeFetch({
		status: 501
	});

	await t.throws(service.makeApiRequest('notifications'), 'server error');
});

test.serial('#makeApiRequest makes networkRequest for provided url', async t => {
	const {service} = t.context;

	const url = 'https://api.github.com/resource';

	global.fetch = fakeFetch();

	await service.makeApiRequest('resource');

	t.true(global.fetch.calledWith(url));
});

test.serial('#makeApiRequest makes networkRequest with provided params', async t => {
	const {service} = t.context;

	const url = 'https://api.github.com/resource?user=sindre';

	global.fetch = fakeFetch({
		body: 'Sindre is awesome'
	});

	await service.makeApiRequest('resource', {user: 'sindre'});

	t.true(global.fetch.calledWith(url));
});
