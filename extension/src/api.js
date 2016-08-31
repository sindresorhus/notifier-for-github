import PersistenceService from './persistence-service';
import NetworkService from './network-service';

const API = {
	buildQuery(options) {
		const params = new URLSearchParams();
		params.append('per_page', options.perPage);
		if (PersistenceService.get('useParticipatingCount')) {
			params.append('participating', true);
		}
		return params.toString();
	},

	getApiUrl(query) {
		let rootUrl = PersistenceService.get('rootUrl');

		if (/(^(https:\/\/)?(api\.)?github\.com)/.test(rootUrl)) {
			rootUrl = 'https://api.github.com/notifications';
		} else {
			rootUrl = `${rootUrl}api/v3/notifications`;
		}

		if (query) {
			return `${rootUrl}?${this.buildQuery(query)}`;
		}

		return rootUrl;
	},

	getTabUrl() {
		let rootUrl = PersistenceService.get('rootUrl');

		if (/api.github.com\/$/.test(rootUrl)) {
			rootUrl = 'https://github.com/';
		}

		const tabUrl = `${rootUrl}notifications`;
		if (PersistenceService.get('useParticipatingCount')) {
			return `${tabUrl}/participating`;
		}
		return tabUrl;
	},

	parseApiResponse(response) {
		const status = response.status;

		if (status >= 500) {
			return Promise.reject(new Error('server error'));
		}

		if (status >= 400) {
			return Promise.reject(new Error(`client error: ${status} ${response.statusText}`));
		}

		const interval = Number(response.headers.get('X-Poll-Interval'));
		const lastModifed = response.headers.get('Last-Modified');
		const linkheader = response.headers.get('Link');

		if (linkheader === null) {
			return response.json().then(data => {
				return {count: data.length, interval, lastModifed};
			});
		}

		const lastlink = linkheader.split(', ').find(link => {
			return link.endsWith('rel="last"');
		});

		const count = Number(lastlink.slice(lastlink.lastIndexOf('page=') + 5, lastlink.lastIndexOf('>')));
		return Promise.resolve({count, interval, lastModifed});
	},

	makeApiRequest(options) {
		const url = options.url || this.getApiUrl(options);
		return NetworkService.request(url);
	},

	getNotifications() {
		return this.makeApiRequest({perPage: 1}).then(this.parseApiResponse);
	}
};

export default API;
