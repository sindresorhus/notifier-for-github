import test from 'ava';
import localStorageMock from 'mock-localstorage';
import sinon from 'sinon';

global.window = {
	localStorage: localStorageMock
};
require('../extension/src/defaults-service.js');
require('../extension/src/persistence-service.js');

test.beforeEach(t => {
	t.context.defaults = new global.window.DefaultsService();
});

test('installs PersistenceService constructor', t => {
	t.is(typeof global.window.PersistenceService, 'function');
});

test('PersistenceService constructor sets DefaultsService', t => {
	const service = new global.window.PersistenceService(t.context.defaults);
	t.true(service.DefaultsService instanceof global.window.DefaultsService);
});

test('#get method calls localStorage#getItem', t => {
	const service = new global.window.PersistenceService(t.context.defaults);
	global.window.localStorage.getItem = sinon.spy();
	service.get('name');
	t.true(global.window.localStorage.getItem.calledWith('name'));
});

test('#get method converts "true" and "false" strings to booleans', t => {
	const service = new global.window.PersistenceService(t.context.defaults);
	global.window.localStorage.getItem = sinon.stub().returns('true');
	t.true(service.get('boolean'));
	global.window.localStorage.getItem = sinon.stub().returns('false');
	t.false(service.get('boolean'));
});

test('#get method looks up in defaults if item is null', t => {
	const service = new global.window.PersistenceService(t.context.defaults);
	global.window.localStorage.getItem = sinon.stub().returns(null);
	t.is(service.get('rootUrl'), t.context.defaults.getDefaults().rootUrl);
});

test('#get method returns undefined if no item found in defaults', t => {
	const service = new global.window.PersistenceService(t.context.defaults);
	global.window.localStorage.getItem = sinon.stub().returns(null);
	t.is(service.get('no such thing'), undefined);
});

test('#set method calls localStorage#set', t => {
	const service = new global.window.PersistenceService(t.context.defaults);
	global.window.localStorage.setItem = sinon.spy();
	const obj = {value: 42};
	service.set('name', obj);
	t.true(global.window.localStorage.setItem.calledWith('name', obj));
});

test('#reset method calls localStorage#clear', t => {
	const service = new global.window.PersistenceService(t.context.defaults);
	global.window.localStorage.clear = sinon.spy();
	service.reset();
	t.true(global.window.localStorage.clear.called);
});

test('#remove method calls localStorage#removeItem', t => {
	const service = new global.window.PersistenceService(t.context.defaults);
	global.window.localStorage.removeItem = sinon.spy();
	service.remove('name');
	t.true(global.window.localStorage.removeItem.calledWith('name'));
});
