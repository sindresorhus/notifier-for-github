export function isNetworkError(error) {
	const message = typeof error === 'string' ? error : error?.message;
	return typeof message === 'string' && message.toLowerCase() === 'network error';
}
