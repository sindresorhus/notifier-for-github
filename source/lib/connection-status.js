export function addConnectionStatusListeners({target = globalThis, onOnline, onOffline}) {
	if (typeof target.addEventListener !== 'function') {
		return;
	}

	target.addEventListener('online', onOnline);
	target.addEventListener('offline', onOffline);
}
