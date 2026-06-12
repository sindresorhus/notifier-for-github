import test from 'ava';
import sinon from 'sinon';
import * as defaults from '../source/lib/defaults.js';
import {fakeFetch} from './util.js';

const defaultOptions = {
	options: {
		token: 'a1b2c3d4e5f6g7h8i9j0a1b2c3d4e5f6g7h8i9j0',
		rootUrl: 'https://api.github.com',
		onlyParticipating: false,
		updateCountOnNavigation: false
	}
};

const tick = async () => new Promise(resolve => {
	setTimeout(resolve, 0);
});

async function waitFor(assertion) {
	for (let index = 0; index < 20; index++) {
		if (assertion()) {
			return;
		}

		await tick();
	}
}

function setGlobalProperty(t, name, value) {
	const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
	Object.defineProperty(globalThis, name, {
		value,
		configurable: true
	});
	t.teardown(() => {
		if (descriptor) {
			Object.defineProperty(globalThis, name, descriptor);
		} else {
			delete globalThis[name];
		}
	});
}

function addActionApi(t) {
	const action = {
		setBadgeText: sinon.stub(),
		setBadgeBackgroundColor: sinon.stub(),
		setTitle: sinon.stub(),
		onClicked: {
			addListener: sinon.stub()
		}
	};
	const originalAction = browser.action;
	browser.action = action;
	t.teardown(() => {
		browser.action = originalAction;
	});
	return action;
}

test.serial('background recovers from API network errors when the browser comes online', async t => {
	browser.flush();

	const action = addActionApi(t);
	const addEventListener = sinon.stub();
	const consoleError = sinon.stub(console, 'error');
	let fetchHandler = sinon.stub().rejects(new Error('offline'));
	t.teardown(() => {
		consoleError.restore();
	});

	setGlobalProperty(t, 'navigator', {
		onLine: true,
		userAgent: 'Chrome'
	});
	setGlobalProperty(t, 'addEventListener', addEventListener);
	setGlobalProperty(t, 'fetch', (...arguments_) => fetchHandler(...arguments_));

	browser.offscreen = {
		hasDocument: sinon.stub().resolves(true),
		createDocument: sinon.stub().resolves()
	};
	browser.storage.sync.get.callsFake((key, callback) => {
		if (typeof callback === 'function') {
			callback(defaultOptions);
		}

		return Promise.resolve(defaultOptions);
	});
	browser.storage.local.get.resolves({});
	browser.storage.local.set.resolves();
	browser.alarms.clearAll.resolves();
	browser.permissions.contains.resolves(false);

	await import('../source/background.js');
	await waitFor(() => action.setBadgeText.calledWith({text: 'off'}));

	t.true(addEventListener.calledWith('online', sinon.match.func));
	t.true(addEventListener.calledWith('offline', sinon.match.func));
	t.true(action.setBadgeText.calledWith({text: 'off'}));
	t.true(action.setBadgeBackgroundColor.calledWith({color: defaults.getBadgeWarningColor()}));
	t.true(action.setTitle.calledWith({title: defaults.getWarningTitle('offline')}));

	const onlineHandler = addEventListener.withArgs('online').firstCall.args[1];
	fetchHandler = fakeFetch();
	action.setBadgeText.resetHistory();

	await onlineHandler();

	t.true(action.setBadgeText.calledWith({text: ''}));
});
