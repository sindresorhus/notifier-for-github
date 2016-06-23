'use strict';
const assert = require('assert');
const sinon = require('sinon');
const chromeStub = require('chrome-stub');
const LocalStorageMock = require('mock-localstorage');

global.window = {
	location: {
		hash: '',
		host: '',
		hostname: '',
		href: '',
		origin: '',
		pathname: '',
		port: '',
		protocol: '',
		search: ''
	}
};

global.localStorage = new LocalStorageMock();
global.chrome = chromeStub;

describe('basic functionality', () => {
	it('should register alarm callback', () => {
		require('../extension/api');
		require('../extension/main');

		assert(chrome.alarms.create.called);
	});

	it('should call gitHubNotifCount on chrome alarm fired', done => {
		const oldNotifCount = global.window.gitHubNotifCount;

		const promise = new Promise(resolve => {
			process.nextTick(resolve);
		});
		global.window.gitHubNotifCount = sinon.stub().returns(promise);

		process.nextTick(() => {
			chrome.alarms.onAlarm.trigger();
			assert(global.window.gitHubNotifCount.called);
			global.window.gitHubNotifCount = oldNotifCount;
			done();
		});
	});
});
