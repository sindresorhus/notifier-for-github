(root => {
	'use strict';

	const chrome = root.chrome;

	class API {
		constructor(persistence, networking, permissions, defaults) {
			this.PersistenceService = persistence;
			this.NetworkService = networking;
			this.PermissionsService = permissions;
			this.DefaultsService = defaults;
		}

		buildQuery(options) {
			const params = new URLSearchParams();
			params.append('per_page', options.perPage);
			if (this.PersistenceService.get('useParticipatingCount')) {
				params.append('participating', true);
			}
			return params.toString();
		}

		getApiUrl(query) {
			let rootUrl = this.PersistenceService.get('rootUrl');

			if (/(^(https:\/\/)?(api\.)?github\.com)/.test(rootUrl)) {
				rootUrl = 'https://api.github.com/notifications';
			} else {
				rootUrl = `${rootUrl}api/v3/notifications`;
			}

			if (query) {
				return `${rootUrl}?${this.buildQuery(query)}`;
			}

			return rootUrl;
		}

		getTabUrl() {
			let rootUrl = this.PersistenceService.get('rootUrl');

			if (/api.github.com\/$/.test(rootUrl)) {
				rootUrl = 'https://github.com/';
			}

			const tabUrl = `${rootUrl}notifications`;
			if (this.PersistenceService.get('useParticipatingCount')) {
				return `${tabUrl}/participating`;
			}
			return tabUrl;
		}

		parseApiResponse(response) {
			const status = response.status;
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

			if (status >= 500) {
				return Promise.reject(new Error('server error'));
			}

			if (status >= 400) {
				return Promise.reject(new Error(`client error: ${status} ${response.statusText}`));
			}

			return Promise.resolve({count, interval, lastModifed});
		}

		getNotifications() {
			const url = this.getApiUrl({perPage: 1});
			return this.NetworkService.request(url).then(this.parseApiResponse);
		}

		openTab(url, tab) {
			// checks optional permissions
			this.PermissionsService.queryPermission('tabs').then(granted => {
				if (granted) {
					const currentWindow = true;
					chrome.tabs.query({currentWindow, url}, tabs => {
						if (tabs.length > 0) {
							const highlighted = true;
							chrome.tabs.update(tabs[0].id, {highlighted, url});
						} else if (tab && tab.url === 'chrome://newtab/') {
							chrome.tabs.update(null, {url});
						} else {
							chrome.tabs.create({url});
						}
					});
				} else {
					chrome.tabs.create({url});
				}
			});
		}
	}

	root.API = API;
})(window);
