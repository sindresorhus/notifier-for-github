import test from 'ava';
import sinon from 'sinon';
import {addConnectionChangeListeners, isNetworkError} from '../source/lib/connection.js';

test('#isNetworkError matches API network failures', t => {
	t.true(isNetworkError(new Error('network error')));
	t.true(isNetworkError(new Error('Network Error')));
	t.true(isNetworkError('network error'));

	for (const error of [
		new Error('client error'),
		new Error('server error'),
		new Error('parse error'),
		undefined,
		null
	]) {
		t.false(isNetworkError(error));
	}
});

test('#addConnectionChangeListeners binds online and offline handlers', t => {
	const target = {
		addEventListener: sinon.stub()
	};
	const onOnline = sinon.stub();
	const onOffline = sinon.stub();

	addConnectionChangeListeners({onOnline, onOffline}, target);

	t.true(target.addEventListener.calledWith('online', onOnline));
	t.true(target.addEventListener.calledWith('offline', onOffline));
});

test('#addConnectionChangeListeners skips targets without event support', t => {
	t.notThrows(() => {
		addConnectionChangeListeners({}, {});
	});
});
