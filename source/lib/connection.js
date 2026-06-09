export function isNetworkError(error) {
	return Boolean(error && error.message === 'network error');
}

export function addConnectionChangeListeners({onOnline, onOffline}, target = globalThis) {
	if (typeof target.addEventListener !== 'function') {
		return;
	}

	target.addEventListener('online', onOnline);
	target.addEventListener('offline', onOffline);
}
