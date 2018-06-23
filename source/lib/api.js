import OptionsSync from 'webext-options-sync';

const syncStore = new OptionsSync();

export const getTabUrl = async () => {
	const {rootUrl, onlyParticipating} = await syncStore.getAll();
	const useParticipating = onlyParticipating ? '/participating' : '';

	if (/(^(https:\/\/)?(api\.)?github\.com)/.test(rootUrl)) {
		return `https://github.com/notifications${useParticipating}`;
	}

	return `${rootUrl}notifications${useParticipating}`;
};

export const getApiUrl = async () => {
	const {rootUrl} = await syncStore.getAll();

	if (/(^(https:\/\/)?(api\.)?github\.com)/.test(rootUrl)) {
		return 'https://api.github.com/';
	}

	return `${rootUrl}api/v3/`;
};

export const getParsedUrl = async (endpoint, params) => {
	const api = await getApiUrl();
	const query = params ? '?' + (new URLSearchParams(params)).toString() : '';
	return `${api}${endpoint}${query}`;
};

export const getHeaders = async () => {
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
};

export const makeApiRequest = async (endpoint, params) => {
	const url = await getParsedUrl(endpoint, params);

	const response = await fetch(url, {
		headers: await getHeaders()
	});

	const {status} = response;

	if (status >= 500) {
		return Promise.reject(new Error('server error'));
	}

	if (status >= 400) {
		return Promise.reject(new Error(`client error: ${status} ${response.statusText}`));
	}

	const json = await response.json();

	return {
		headers: response.headers,
		json
	};
};

export const getNotificationResponse = async (maxItems = 100) => {
	const {onlyParticipating} = await syncStore.getAll();

	if (onlyParticipating) {
		return makeApiRequest('notifications', {
			participating: onlyParticipating,
			per_page: maxItems // eslint-disable-line camelcase
		});
	}

	return makeApiRequest('notifications', {
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

	const lastlink = linkHeader.split(', ').find(link => {
		return link.endsWith('rel="last"');
	});

	const count = Number(lastlink.slice(lastlink.lastIndexOf('page=') + 5, lastlink.lastIndexOf('>')));

	return {
		count,
		interval,
		lastModified
	};
};
