import test from 'ava';
import sinon from 'sinon';
import {
	getGitHubOrigin,
	getTabUrl,
	getApiUrl,
	getParsedUrl,
	getHeaders,
	makeApiRequest
} from '../source/lib/api-multi.js';

const originalFetch = global.fetch;

test.before(() => {
	global.fetch = sinon.stub();
});

test.after(() => {
	global.fetch = originalFetch;
});

test.afterEach(() => {
	sinon.restore();
	global.fetch = sinon.stub();
});

test('#getGitHubOrigin returns GitHub origin for github.com URLs', t => {
	t.is(getGitHubOrigin('https://github.com/'), 'https://github.com');
	t.is(getGitHubOrigin('https://api.github.com/'), 'https://github.com');
});

test('#getGitHubOrigin returns custom origin for enterprise URLs', t => {
	t.is(getGitHubOrigin('https://git.company.com/'), 'https://git.company.com');
	t.is(getGitHubOrigin('https://github.enterprise.com/'), 'https://github.enterprise.com');
});

test('#getTabUrl returns correct URL without participating filter', t => {
	const instance = {
		rootUrl: 'https://github.com/',
		onlyParticipating: false
	};
	t.is(getTabUrl(instance), 'https://github.com/notifications');
});

test('#getTabUrl returns correct URL with participating filter', t => {
	const instance = {
		rootUrl: 'https://github.com/',
		onlyParticipating: true
	};
	t.is(getTabUrl(instance), 'https://github.com/notifications/participating');
});

test('#getTabUrl returns correct URL for enterprise', t => {
	const instance = {
		rootUrl: 'https://git.company.com/',
		onlyParticipating: false
	};
	t.is(getTabUrl(instance), 'https://git.company.com/notifications');
});

test('#getApiUrl returns GitHub API URL for github.com', t => {
	t.is(getApiUrl('https://github.com/'), 'https://api.github.com');
	t.is(getApiUrl('https://api.github.com/'), 'https://api.github.com');
});

test('#getApiUrl returns enterprise API URL', t => {
	t.is(getApiUrl('https://git.company.com/'), 'https://git.company.com/api/v3');
	t.is(getApiUrl('https://github.enterprise.com/'), 'https://github.enterprise.com/api/v3');
});

test('#getParsedUrl builds correct URL without parameters', t => {
	const url = getParsedUrl('https://github.com/', '/notifications', null);
	t.is(url, 'https://api.github.com/notifications');
});

test('#getParsedUrl builds correct URL with parameters', t => {
	const parameters = {page: 1, per_page: 100}; // eslint-disable-line camelcase
	const url = getParsedUrl('https://github.com/', '/notifications', parameters);
	t.is(url, 'https://api.github.com/notifications?page=1&per_page=100');
});

test('#getHeaders returns correct headers with token', t => {
	const headers = getHeaders('test-token');
	t.is(headers.Authorization, 'Bearer test-token');
	t.is(headers['If-Modified-Since'], '');
});

test('#getHeaders throws when token is missing', t => {
	t.throws(() => getHeaders(''), {message: 'missing token'});
	t.throws(() => getHeaders(null), {message: 'missing token'});
});

test('#makeApiRequest handles successful response', async t => {
	const mockResponse = {
		status: 200,
		headers: new Map([['X-Poll-Interval', '60']]),
		json: async () => ({data: 'test'})
	};
	global.fetch.resolves(mockResponse);

	const instance = {
		rootUrl: 'https://github.com/',
		token: 'test-token',
		name: 'GitHub'
	};

	const result = await makeApiRequest(instance, '/notifications', {});

	t.deepEqual(result.json, {data: 'test'});
	t.is(result.headers.get('X-Poll-Interval'), '60');
});

test('#makeApiRequest handles 4xx errors', async t => {
	global.fetch.resolves({status: 404});

	const instance = {
		rootUrl: 'https://github.com/',
		token: 'test-token',
		name: 'GitHub'
	};

	await t.throwsAsync(
		makeApiRequest(instance, '/notifications', {}),
		{message: 'client error'}
	);
});

test('#makeApiRequest handles 5xx errors', async t => {
	global.fetch.resolves({status: 500});

	const instance = {
		rootUrl: 'https://github.com/',
		token: 'test-token',
		name: 'GitHub'
	};

	await t.throwsAsync(
		makeApiRequest(instance, '/notifications', {}),
		{message: 'server error'}
	);
});

test('#makeApiRequest handles network errors', async t => {
	global.fetch.rejects(new Error('Network error'));

	const instance = {
		rootUrl: 'https://github.com/',
		token: 'test-token',
		name: 'GitHub'
	};

	await t.throwsAsync(
		makeApiRequest(instance, '/notifications', {}),
		{message: 'network error'}
	);
});
