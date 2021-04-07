import test from 'ava';
import * as repositories from '../source/lib/repositories-service.js';
import {fakeFetch} from './util.js';

const body = [{full_name: 'foo/repo1'}, {full_name: 'bar/repo1'}, {full_name: 'foo/repo2'}]; // eslint-disable-line camelcase
global.fetch = fakeFetch({body});

test.beforeEach(t => {
	t.context.repositories = Object.assign({}, repositories);
	t.context.defaultOptions = {
		options: {token: 'a1b2c3d4e5f6g7h8i9j0a1b2c3d4e5f6g7h8i9j0'},
		repositories: {}
	};

	browser.flush();

	browser.storage.sync.get.callsFake((_, cb) => cb(t.context.defaultOptions));
	browser.storage.sync.set.callsFake((_, cb) => cb());
});

test.serial('#getRepositories fetches repositories', async t => {
	const {repositories} = t.context;

	try {
		const response = await repositories.getRepositories();
		t.log({res: response});
		t.deepEqual(response, body);
	} catch (error) {
		t.log({error});
	}
});

test.serial('#listRepositories lists repositories as tree', async t => {
	const {repositories} = t.context;

	try {
		const response = await repositories.listRepositories();
		t.deepEqual(response, {
			bar: {
				repo1: false
			},
			foo: {
				repo1: false,
				repo2: false
			}
		});
	} catch (error) {
		t.log({error});
	}
});

test.serial('#listRepositories doesn\'t update if store has values', async t => {
	const {repositories, defaultOptions} = t.context;
	defaultOptions.repositories = {foo: {repo1: true}};

	try {
		const response = await repositories.listRepositories();
		t.deepEqual(response, defaultOptions.repositories);
	} catch (error) {
		t.log({error});
	}
});

test.serial('#listRepositories force updates and keeps previously stored values', async t => {
	const {repositories, defaultOptions} = t.context;
	defaultOptions.repositories = {foo: {repo1: true}};

	try {
		const response = await repositories.listRepositories(true);
		t.deepEqual(response, {
			bar: {
				repo1: false
			},
			foo: {
				repo1: true,
				repo2: false
			}
		});
	} catch (error) {
		t.log({error});
	}
});
