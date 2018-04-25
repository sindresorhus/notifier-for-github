import OptionsSync from 'webext-options-sync';
import parseLinkHeader from 'parse-link-header';

const options = new OptionsSync().getAll();

export default api = async (endpoint, params = {}) => {
	const api = location.hostname === 'github.com' ? 'https://api.github.com/' : `${location.origin}/api/`;
	const {token = ''} = await options;
	const query = (new URLSearchParams(params)).toString();
	const url = `${api}${endpoint}?${query}`;

	const response = await fetch(api + endpoint, {
		headers: new Headers({
			authorization: `token ${token}`
		}),
		body: new URLSearchParams(params)
	});

	const json = await response.json();

	return {
		headers: response.headers,
		json
	};
};

export const getNotificationResponse = async () => {
	const {onlyParticipating} = await options;

	if (onlyParticipating) {
		return api('notifications', {
			participating,
			'per_page': 1
		});
	} else {
		return api('notifications', {
			'per_page': 1
		});
	}
};

export const getNotifications = async () => {
	const {headers, json: notifications} = await getNotificationResponse();

	const interval = Number(headers.get('X-Poll-Interval'));
	const lastModified = headers.get('Last-Modified');
	const linkHeader = headers.get('Link');

	if (linkHeader === null) {
		return {
			count: notifications.length,
			interval,
			lastModified
		};
	} else {
		const parsedLinkHeader = parseLinkHeader(linkHeader);

		return {
			count: Number(parsedLinkHeader.last.page),
			interval,
			lastModified
		};
	}
};
