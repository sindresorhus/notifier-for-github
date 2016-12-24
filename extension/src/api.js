const PersistenceService = require('./persistence-service.js');
const networkRequest = require('./network-request.js');

const API = {
	async buildQuery(options) {
		const params = new window.URLSearchParams();
		params.append('per_page', options.perPage);
		const useParticipating = await PersistenceService.get('useParticipatingCount');
		if (useParticipating) {
			params.append('participating', true);
		}
		return params.toString();
	},

	async getApiUrl(query) {
		let rootUrl = await PersistenceService.get('rootUrl');

		if (/(^(https:\/\/)?(api\.)?github\.com)/.test(rootUrl)) {
			rootUrl = 'https://api.github.com/notifications';
		} else {
			rootUrl = `${rootUrl}api/v3/notifications`;
		}

		if (query) {
			const params = await this.buildQuery(query);
			return `${rootUrl}?${params}`;
		}

		return rootUrl;
	},

	async getTabUrl() {
		let rootUrl = await PersistenceService.get('rootUrl');

		if (/api.github.com\/$/.test(rootUrl)) {
			rootUrl = 'https://github.com/';
		}

		const tabUrl = `${rootUrl}notifications`;
		const useParticipating = await PersistenceService.get('useParticipatingCount');
		if (useParticipating) {
			return `${tabUrl}/participating`;
		}
		return tabUrl;
	},

	async parseApiResponse(response) {
		const status = response.status;

		if (status >= 500) {
			throw new Error('server error')
		}

		if (status >= 400) {
			throw new Error(`client error: ${status} ${response.statusText}`);
		}

		const interval = Number(response.headers.get('X-Poll-Interval'));
		const lastModified = response.headers.get('Last-Modified');
		const linkheader = response.headers.get('Link');

		if (linkheader === null) {
			const data = await response.json();
			return {count: data.length, interval, lastModified};
		}

		const lastlink = linkheader.split(', ').find(link => {
			return link.endsWith('rel="last"');
		});

		const count = Number(lastlink.slice(lastlink.lastIndexOf('page=') + 5, lastlink.lastIndexOf('>')));
		return {count, interval, lastModified};
	},

	async makeApiRequest(options) {
		const url = options.url ? options.url : await this.getApiUrl(options);
		return networkRequest(url);
	},

	async getNotifications() {
		const response = await this.makeApiRequest({perPage: 1});
		return this.parseApiResponse(response);
	}
};

module.exports = API;
