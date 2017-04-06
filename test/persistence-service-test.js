import test from 'ava';
import sinon from 'sinon';
import util from './util';

global.window = util.setupWindow();

const PersistenceService = require('../extension/src/persistence-service.js');
const Defaults = require('../extension/src/defaults.js');

test.beforeEach(t => {
	t.context.persistence = Object.assign({}, PersistenceService);
});

test('#get calls chrome.storage.sync#get', async t => {
	const service = t.context.persistence;

	window.chrome.storage.sync.get = sinon.stub().yieldsAsync(null);
	await service.get('name');

	t.true(window.chrome.storage.sync.get.calledWith('name'));
});

test('#get looks up in defaults if item is null', async t => {
	const service = t.context.persistence;

	window.chrome.storage.sync.get = sinon.stub().yieldsAsync(null);

	t.is(await service.get('rootUrl'), Defaults.get('rootUrl'));
});

test('#get returns undefined if no item found in defaults', async t => {
	const service = t.context.persistence;

	window.chrome.storage.sync.get = sinon.stub().yieldsAsync(null);

	t.is(await service.get('no such thing'), undefined);
});

test('#set calls chrome.storage.sync#set', async t => {
	const service = t.context.persistence;
	window.chrome.storage.sync.set = sinon.stub().yieldsAsync();

	const obj = {value: 42};
	await service.set('name', obj);

	t.true(window.chrome.storage.sync.set.calledWith({name: obj}));
});

test('#reset calls window.chrome.storage.sync#reset', async t => {
	const service = t.context.persistence;

	window.chrome.storage.sync.reset = sinon.stub().yieldsAsync();
	await service.reset();

	t.true(window.chrome.storage.sync.reset.called);
});

test('#remove calls chrome.storage.sync#remove', async t => {
	const service = t.context.persistence;

	window.chrome.storage.sync.remove = sinon.stub().yieldsAsync();
	await service.remove('name');

	t.true(global.window.chrome.storage.sync.remove.calledWith('name'));
});
