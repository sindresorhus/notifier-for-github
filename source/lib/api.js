import OptionsSync from 'webext-options-sync';

const syncStore = new OptionsSync();

export async function getHostname() {
	const {rootUrl} = await syncStore.getAll();

	if (/(^(https:\/\/)?(api\.)?github\.com)/.test(rootUrl)) {
		return 'https://github.com/';
	}

	return (new URL(rootUrl)).hostname;
}

export async function getTabUrl() {
	const {onlyParticipating} = await syncStore.getAll();
	const useParticipating = onlyParticipating ? '/participating' : '';

	return `https://${await getHostname()}${useParticipating}`;
}

export async function getApiUrl() {
	const {rootUrl} = await syncStore.getAll();

	if (/(^(https:\/\/)?(api\.)?github\.com)/.test(rootUrl)) {
		return 'https://api.github.com';
	}

	return `${rootUrl}api/v3`;
}

export async function getParsedUrl(endpoint, params) {
	const api = await getApiUrl();
	const query = params ? '?' + (new URLSearchParams(params)).toString() : '';
	return `${api}${endpoint}${query}`;
}

export async function getHeaders() {
	const {token} = await syncStore.getAll();

	if (!(/[a-z\d]{40}/.test(token))) {
		throw new Error('missing token');
	}

	return {
		/* eslint-disable quote-props */
		'Authorization': `token ${token}`,
		'If-Modified-Since': ''
		/* eslint-enable quote-props */
	};
}

export async function makeApiRequest(endpoint, params) {
	const url = await getParsedUrl(endpoint, params);

	const response = await fetch(url, {
		headers: await getHeaders()
	});

	const {status, headers} = response;

	if (status >= 500) {
		return Promise.reject(new Error('server error'));
	}

	if (status >= 400) {
		return Promise.reject(new Error(`client error: ${status} ${response.statusText}`));
	}

	const json = await response.json();

	return {
		headers,
		json
	};
}

export async function getNotificationResponse({maxItems = 100, lastModified = ''} = {}) {
	const {onlyParticipating} = await syncStore.getAll();
	const params = {
		per_page: maxItems // eslint-disable-line camelcase
	};

	if (onlyParticipating) {
		params.participating = onlyParticipating;
	}

	if (lastModified) {
		params.since = lastModified;
	}

	return makeApiRequest('/notifications', params);
}

export async function getNotifications({maxItems, lastModified} = {}) {
	const {json: notifications} = await getNotificationResponse({maxItems, lastModified});
	return notifications || [];
}

export async function getNotificationCount() {
	const {headers, json: notifications} = await getNotificationResponse({maxItems: 1});

	const interval = Number(headers.get('X-Poll-Interval'));
	const lastModified = (new Date(headers.get('Last-Modified'))).toISOString();
	const linkHeader = headers.get('Link');

	if (linkHeader === null) {
		return {
			count: notifications.length,
			interval,
			lastModified
		};
	}

	const lastlink = linkHeader.split(', ').find(link => {
		return link.endsWith('rel="last"');
	});

	// We get notification count by asking the API to give us only one notificaion
	// for each page, then the last page number gives us the count
	const count = Number(lastlink.slice(lastlink.lastIndexOf('page=') + 5, lastlink.lastIndexOf('>')));

	return {
		count,
		interval,
		lastModified
	};
}
