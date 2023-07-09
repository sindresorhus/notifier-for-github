import optionsStorage from '../options-storage.js';
import {parseLinkHeader} from '../util.js';

export async function getGitHubOrigin() {
	const {rootUrl} = await optionsStorage.getAll();
	const {origin} = new URL(rootUrl);

	// TODO: Drop `api.github.com` check when dropping migrations
	if (origin === 'https://api.github.com' || origin === 'https://github.com') {
		return 'https://github.com';
	}

	return origin;
}

export async function getTabUrl() {
	const {onlyParticipating} = await optionsStorage.getAll();
	const useParticipating = onlyParticipating ? '/participating' : '';

	return `${await getGitHubOrigin()}/notifications${useParticipating}`;
}

export async function getApiUrl() {
	const {rootUrl} = await optionsStorage.getAll();
	const {origin} = new URL(rootUrl);

	// TODO: Drop `api.github.com` check when dropping migrations
	if (origin === 'https://api.github.com' || origin === 'https://github.com') {
		return 'https://api.github.com';
	}

	return `${origin}/api/v3`;
}

export async function getParsedUrl(endpoint, parameters) {
	const api = await getApiUrl();
	const query = parameters ? '?' + (new URLSearchParams(parameters)).toString() : '';
	return `${api}${endpoint}${query}`;
}

export async function getHeaders() {
	const {token} = await optionsStorage.getAll();

	if (!token) {
		throw new Error('missing token');
	}

	return {
		/* eslint-disable quote-props */
		'Authorization': `Bearer ${token}`,
		'If-Modified-Since': ''
		/* eslint-enable quote-props */
	};
}

export async function makeApiRequest(endpoint, parameters) {
	const url = await getParsedUrl(endpoint, parameters);
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
	} catch {
		return Promise.reject(new Error('parse error'));
	}
}

export async function getNotificationResponse({page = 1, maxItems = 100, lastModified = ''}) {
	const {onlyParticipating} = await optionsStorage.getAll();
	const parameters = {
		page,
		per_page: maxItems // eslint-disable-line camelcase
	};

	if (onlyParticipating) {
		parameters.participating = onlyParticipating;
	}

	if (lastModified) {
		parameters.since = lastModified;
	}

	return makeApiRequest('/notifications', parameters);
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
	const lastModified = (new Date(headers.get('Last-Modified'))).toUTCString();
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
