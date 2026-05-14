import test from 'ava';
import sinon from 'sinon';
import {addConnectionStatusListeners} from '../source/lib/connection-status.js';

test('#addConnectionStatusListeners updates when the browser is back online', t => {
	const listeners = new Map();
	const target = {
		addEventListener(eventName, listener) {
			listeners.set(eventName, listener);
		}
	};
	const onOnline = sinon.stub();
	const onOffline = sinon.stub();

	addConnectionStatusListeners({target, onOnline, onOffline});

	listeners.get('online')();

	t.true(onOnline.calledOnce);
	t.false(onOffline.called);
});

test('#addConnectionStatusListeners updates the badge when the browser goes offline', t => {
	const listeners = new Map();
	const target = {
		addEventListener(eventName, listener) {
			listeners.set(eventName, listener);
		}
	};
	const onOnline = sinon.stub();
	const onOffline = sinon.stub();

	addConnectionStatusListeners({target, onOnline, onOffline});

	listeners.get('offline')();

	t.true(onOffline.calledOnce);
	t.false(onOnline.called);
});
