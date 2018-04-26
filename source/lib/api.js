import OptionsSync from 'webext-options-sync';
import parseLinkHeader from 'parse-link-header';

const syncStore = new OptionsSync();

export const getApiUrl = async () => {
	const {rootUrl} = await syncStore.getAll();

	if (/(^(https:\/\/)?(api\.)?github\.com)/.test(rootUrl)) {
		return 'https://api.github.com/';
	}
		return `${rootUrl}api/v3/`;

};

export const getTabUrl = async () => {
	const {rootUrl, onlyParticipating} = await syncStore.getAll();
	const useParticipating = onlyParticipating ? 'participating' : '';

	if (/(^(https:\/\/)?(api\.)?github\.com)/.test(rootUrl)) {
		return `https://github.com/notifications/${useParticipating}`;
	}
		return `${rootUrl}/notifications/${useParticipating}`;

};

export const api = async (endpoint, params) => {
	const api = await getApiUrl();
	const {token = ''} = await syncStore.getAll();
	const query = params ? '?' + (new URLSearchParams(params)).toString() : '';
	const url = `${api}${endpoint}${query}`;

	const response = await fetch(url, {
		headers: new Headers({
			authorization: `token ${token}`
		})
	});

	const json = await response.json();

	return {
		headers: response.headers,
		json
	};
};

export const getNotificationResponse = async (maxItems = 100) => {
	const {onlyParticipating} = await syncStore.getAll();

	if (onlyParticipating) {
		return api('notifications', {
			participating: onlyParticipating,
			per_page: maxItems // eslint-disable-line
		});
	}

	return api('notifications', {
		per_page: maxItems // eslint-disable-line camelcase
	});
};

export const getNotifications = async maxItems => {
	const {json: notifications} = await getNotificationResponse(maxItems);
	return notifications;
};

export const getNotificationCount = async () => {
	const {headers, json: notifications} = await getNotificationResponse(1);

	const interval = Number(headers.get('X-Poll-Interval'));
	const lastModified = headers.get('Last-Modified');
	const linkHeader = headers.get('Link');

	if (linkHeader === null) {
		return {
			count: notifications.length,
			interval,
			lastModified
		};
	}

	const parsedLinkHeader = parseLinkHeader(linkHeader);

	return {
		count: Number(parsedLinkHeader.last.page),
		interval,
		lastModified
	};
};

export default api;
