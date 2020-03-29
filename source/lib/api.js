import optionsStorage from '../options-storage';
import {parseLinkHeader} from '../util';

export async function getHostname() {
	const {rootUrl} = await optionsStorage.getAll();

	if (/(^(https:\/\/)?(api\.)?github\.com)/.test(rootUrl)) {
		return 'github.com';
	}

	return (new URL(rootUrl)).hostname;
}

export async function getTabUrl() {
	const {onlyParticipating} = await optionsStorage.getAll();
	const useParticipating = onlyParticipating ? '/participating' : '';

	return `https://${await getHostname()}/notifications${useParticipating}`;
}

export async function getApiUrl() {
	const {rootUrl} = await optionsStorage.getAll();

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
	const {token} = await optionsStorage.getAll();

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
	let response;
	try {
		response = await fetch(url, {
			headers: await getHeaders()
		});
	} catch (error) {
		console.error(error);
		return Promise.reject(new Error('network error'));
	}

	const {status, headers} = response;

	if (status >= 500) {
		return Promise.reject(new Error('server error'));
	}

	if (status >= 400) {
		return Promise.reject(new Error('client error'));
	}

	try {
		const json = await response.json();
		return {
			headers,
			json
		};
	} catch (error) {
		return Promise.reject(new Error('parse error'));
	}
}

export async function getNotificationResponse({page = 1, maxItems = 100, lastModified = ''}) {
	const {onlyParticipating} = await optionsStorage.getAll();
	const params = {
		page,
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

export async function getNotifications({page, maxItems, lastModified, notifications = []}) {
	const {headers, json} = await getNotificationResponse({page, maxItems, lastModified});
	notifications = [...notifications, ...json];

	const {next} = parseLinkHeader(headers.get('Link'));
	if (!next) {
		return notifications;
	}

	const {searchParams} = new URL(next);
	return getNotifications({
		page: searchParams.get('page'),
		maxItems: searchParams.get('per_page'),
		lastModified,
		notifications
	});
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

	const {last} = parseLinkHeader(linkHeader);
	const {searchParams} = new URL(last);

	// We get notification count by asking the API to give us only one notification
	// for each page, then the last page number gives us the count
	const count = Number(searchParams.get('page'));

	return {
		count,
		interval,
		lastModified
	};
}
