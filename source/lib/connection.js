export function isNetworkError(error) {
	const message = typeof error === 'string' ? error : error?.message;
	return typeof message === 'string' && message.toLowerCase() === 'network error';
}

export function addConnectionChangeListeners({onOnline, onOffline}, target = globalThis) {
	if (typeof target.addEventListener !== 'function') {
		return;
	}

	target.addEventListener('online', onOnline);
	target.addEventListener('offline', onOffline);
}
