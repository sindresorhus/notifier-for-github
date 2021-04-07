import test from 'ava';
import * as api from '../source/lib/api.js';
import {fakeFetch} from './util.js';

test.beforeEach(t => {
	t.context.service = Object.assign({}, api);
	t.context.defaultOptions = {
		options: {
			token: 'a1b2c3d4e5f6g7h8i9j0a1b2c3d4e5f6g7h8i9j0',
			rootUrl: 'https://api.github.com',
			onlyParticipating: false
		}
	};

	browser.flush();

	browser.storage.sync.get.callsFake((key, cb) => {
		cb(t.context.defaultOptions);
	});
});

test.serial('#getApiUrl uses default endpoint if rootUrl matches GitHub', async t => {
	const {service} = t.context;

	browser.storage.sync.get.callsFake((key, cb) => {
		cb({
			options: {
				rootUrl: 'https://api.github.com/'
			}
		});
	});

	t.is(await service.getApiUrl(), 'https://api.github.com');
});

test.serial('#getApiUrl uses custom endpoint if rootUrl is something other than GitHub', async t => {
	const {service} = t.context;

	browser.storage.sync.get.callsFake((storageName, callback) => {
		callback({
			options: {
				rootUrl: 'https://git.something.com/'
			}
		});
	});

	t.is(await service.getApiUrl(), 'https://git.something.com/api/v3');
});

test.serial('#getGitHubOrigin uses default endpoint if rootUrl matches GitHub API url', async t => {
	const {service} = t.context;

	browser.storage.sync.get.callsFake((key, cb) => {
		cb({
			options: {
				rootUrl: 'https://api.github.com/'
			}
		});
	});

	t.is(await service.getGitHubOrigin(), 'https://github.com');
});

test.serial('#getGitHubOrigin uses custom endpoint if rootUrl is something other than GitHub', async t => {
	const {service} = t.context;

	browser.storage.sync.get.callsFake((storageName, callback) => {
		callback({
			options: {
				rootUrl: 'http://git.something.com/'
			}
		});
	});

	t.is(await service.getGitHubOrigin(), 'http://git.something.com');
});

test.serial('#getGitHubOrigin uses custom endpoint if rootUrl has trailing slash removed', async t => {
	const {service} = t.context;

	browser.storage.sync.get.callsFake((storageName, callback) => {
		callback({
			options: {
				rootUrl: 'https://git.something.com'
			}
		});
	});

	t.is(await service.getGitHubOrigin(), 'https://git.something.com');
});

test.serial('#getGitHubOrigin respects "http:" protocol on non-GitHub servers', async t => {
	const {service} = t.context;

	browser.storage.sync.get.callsFake((storageName, callback) => {
		callback({
			options: {
				rootUrl: 'http://git.something.com/'
			}
		});
	});

	t.is(await service.getGitHubOrigin(), 'http://git.something.com');
});

test.serial('#getTabUrl uses default page if rootUrl matches GitHub', async t => {
	const {service} = t.context;

	browser.storage.sync.get.callsFake((storageName, callback) => {
		callback({
			options: {
				rootUrl: 'https://api.github.com/',
				onlyParticipating: false
			}
		});
	});

	t.is(await service.getTabUrl(), 'https://github.com/notifications');
});

test.serial('#getTabUrl uses uses custom page if rootUrl is something other than GitHub', async t => {
	const {service} = t.context;

	browser.storage.sync.get.callsFake((storageName, callback) => {
		callback({
			options: {
				rootUrl: 'https://git.something.com/',
				onlyParticipating: false
			}
		});
	});

	t.is(await service.getTabUrl(), 'https://git.something.com/notifications');
});

test.serial('#getTabUrl respects useParticipatingCount setting', async t => {
	const {service} = t.context;

	browser.storage.sync.get.callsFake((storageName, callback) => {
		callback({
			options: {
				rootUrl: 'https://api.github.com/',
				onlyParticipating: true
			}
		});
	});

	t.is(await service.getTabUrl(), 'https://github.com/notifications/participating');
});

test.serial('#getNotificationCount promise resolves response of 0 notifications if Link header is null', async t => {
	const {service} = t.context;

	global.fetch = fakeFetch();

	const response = await service.getNotificationCount();
	t.deepEqual(response, {count: 0, interval: 60, lastModified: '1970-01-01T00:00:00.000Z'});
});

test.serial('#getNotificationCount promise resolves response of N notifications according to Link header', async t => {
	const {service} = t.context;

	global.fetch = fakeFetch({
		headers: {
			// eslint-disable-next-line quote-props
			'Link': `<https://api.github.com/resource?page=1>; rel="next",
							 <https://api.github.com/resource?page=2>; rel="last"`
		}
	});

	t.deepEqual(await service.getNotificationCount(), {count: 2, interval: 60, lastModified: '1970-01-01T00:00:00.000Z'});

	global.fetch = fakeFetch({
		headers: {
			// eslint-disable-next-line quote-props
			'Link': `<https://api.github.com/resource?page=1>; rel="next",
							 <https://api.github.com/resource?page=2>; rel="next",
							 <https://api.github.com/resource?page=3>; rel="last"`
		}
	});

	t.deepEqual(await service.getNotificationCount(), {count: 3, interval: 60, lastModified: '1970-01-01T00:00:00.000Z'});
});

test.serial('#makeApiRequest returns rejected promise for 4xx status codes', async t => {
	const {service} = t.context;

	global.fetch = fakeFetch({
		status: 404,
		statusText: 'Not found'
	});

	await t.throwsAsync(service.makeApiRequest('notifications'), {
		message: 'client error'
	});
});

test.serial('#makeApiRequest returns rejected promise for 5xx status codes', async t => {
	const {service} = t.context;

	global.fetch = fakeFetch({
		status: 501
	});

	await t.throwsAsync(service.makeApiRequest('notifications'), {
		message: 'server error'
	});
});

test.serial('#makeApiRequest makes networkRequest for provided url', async t => {
	const {service} = t.context;

	global.fetch = fakeFetch();

	await service.makeApiRequest('/resource');

	t.true(global.fetch.calledWith('https://api.github.com/resource'));
});

test.serial('#makeApiRequest makes networkRequest with provided params', async t => {
	const {service} = t.context;

	global.fetch = fakeFetch({
		body: 'Sindre is awesome'
	});

	await service.makeApiRequest('/resource', {user: 'sindre'});

	t.true(global.fetch.calledWith('https://api.github.com/resource?user=sindre'));
});
