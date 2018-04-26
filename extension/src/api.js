const PersistenceService = require('./persistence-service.js');
const networkRequest = require('./network-request.js');

const API = {
	buildQuery(options) {
		const params = new window.URLSearchParams();
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

	async parseApiResponse(response) {
		const status = response.status;

		if (status >= 500) {
			return Promise.reject(new Error('server error'));
		}

		if (status >= 400) {
			return Promise.reject(new Error(`client error: ${status} ${response.statusText}`));
		}

		const interval = Number(response.headers.get('X-Poll-Interval'));
		const lastModified = response.headers.get('Last-Modified');
		const linkheader = response.headers.get('Link');

		if (linkheader === null) {
			try {
				const data = await response.json();
				return {count: data.length, interval, lastModified};
			} catch (err) {

			}
		}

		const lastlink = linkheader.split(', ').find(link => {
			return link.endsWith('rel="last"');
		});

		const count = Number(lastlink.slice(lastlink.lastIndexOf('page=') + 5, lastlink.lastIndexOf('>')));
		return Promise.resolve({count, interval, lastModified});
	},

	makeApiRequest(options) {
		const url = options.url || this.getApiUrl(options);
		return networkRequest(url);
	},

	async getNotifications() {
		return this.makeApiRequest({perPage: 1}).then(this.parseApiResponse);
	}
};

module.exports = API;
