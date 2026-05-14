export function addConnectionStatusListeners({target = globalThis, onOnline, onOffline}) {
	target.addEventListener('online', onOnline);
	target.addEventListener('offline', onOffline);
}
