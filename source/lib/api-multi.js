import {parseLinkHeader} from '../util.js';

export function getGitHubOrigin(rootUrl) {
	const {origin} = new URL(rootUrl);

	if (origin === 'https://api.github.com' || origin === 'https://github.com') {
		return 'https://github.com';
	}

	return origin;
}

export function getTabUrl(instance) {
	const useParticipating = instance.onlyParticipating ? '/participating' : '';
	const origin = getGitHubOrigin(instance.rootUrl);
	return `${origin}/notifications${useParticipating}`;
}

export function getApiUrl(rootUrl) {
	const origin = getGitHubOrigin(rootUrl);
	return origin === 'https://github.com' ? 'https://api.github.com' : `${origin}/api/v3`;
}

export function getParsedUrl(rootUrl, endpoint, parameters) {
	const api = getApiUrl(rootUrl);
	const query = parameters ? '?' + (new URLSearchParams(parameters)).toString() : '';
	return `${api}${endpoint}${query}`;
}

export function getHeaders(token) {
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

export async function makeApiRequest(instance, endpoint, parameters) {
	const url = getParsedUrl(instance.rootUrl, endpoint, parameters);

	let response;
	try {
		response = await fetch(url, {
			headers: getHeaders(instance.token)
		});
	} catch (error) {
		console.error(`API request failed for ${instance.name}: url=${url}`, error);
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

export async function getNotificationResponse(instance, {page = 1, maxItems = 100, lastModified = ''}) {
	const parameters = {
		page,
		per_page: maxItems // eslint-disable-line camelcase
	};

	if (instance.onlyParticipating) {
		parameters.participating = instance.onlyParticipating;
	}

	if (lastModified) {
		parameters.since = lastModified;
	}

	return makeApiRequest(instance, '/notifications', parameters);
}

export async function getNotifications(instance, {page, maxItems, lastModified, notifications = []}) {
	const {headers, json} = await getNotificationResponse(instance, {page, maxItems, lastModified});
	notifications.push(...json);

	const {next} = parseLinkHeader(headers.get('Link'));
	if (!next) {
		return notifications;
	}

	const {searchParams} = new URL(next);
	return getNotifications(instance, {
		page: searchParams.get('page'),
		maxItems: searchParams.get('per_page'),
		lastModified,
		notifications
	});
}

export async function getNotificationCount(instance) {
	const {headers, json: notifications} = await getNotificationResponse(instance, {maxItems: 1});

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
	if (!last) {
		return {
			count: notifications.length,
			interval,
			lastModified
		};
	}

	const {searchParams} = new URL(last);
	const count = Number(searchParams.get('page'));

	return {
		count,
		interval,
		lastModified
	};
}
