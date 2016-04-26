(() => {
	'use strict';

	window.GitHubNotify = (() => {
		const defaults = {
			rootUrl: 'https://api.github.com/',
			oauthToken: '',
			useParticipatingCount: false,
			interval: 60
		};

		const api = {
			settings: {
				get: name => {
					const item = localStorage.getItem(name);

					if (item === null) {
						return {}.hasOwnProperty.call(defaults, name) ? defaults[name] : undefined;
					}

					if (item === 'true' || item === 'false') {
						return item === 'true';
					}

					return item;
				},
				set: localStorage.setItem.bind(localStorage),
				remove: localStorage.removeItem.bind(localStorage),
				reset: localStorage.clear.bind(localStorage)
			}
		};

		api.defaults = defaults;

		return api;
	})();

	window.GitHubNotify.requestPermission = permission => {
		return new Promise(resolve => {
			chrome.permissions.request({
				permissions: [permission]
			}, granted => {
				window.GitHubNotify.settings.set(`${permission}_permission`, granted);
				resolve(granted);
			});
		});
	};

	window.GitHubNotify.queryPermission = permission => {
		return new Promise(resolve => {
			chrome.permissions.contains({
				permissions: [permission]
			}, resolve);
		});
	};

	window.GitHubNotify.request = url => {
		const token = window.GitHubNotify.settings.get('oauthToken');
		if (!token) {
			return Promise.reject(new Error('missing token'));
		}

		/* eslint-disable quote-props */
		const headers = Object.assign({
			Authorization: `token ${token}`,
			'If-Modified-Since': ''
		});
		/* eslint-enable quote-props */

		return fetch(url, {headers});
	};

	window.GitHubNotify.getApiUrl = () => {
		const rootUrl = window.GitHubNotify.settings.get('rootUrl');

		if (/(^(https:\/\/)?(api\.)?github\.com)/.test(rootUrl)) {
			return 'https://api.github.com/notifications';
		}
		return `${rootUrl}api/v3/notifications`;
	};

	window.GitHubNotify.getTabUrl = () => {
		let rootUrl = window.GitHubNotify.settings.get('rootUrl');

		if (/api.github.com\/$/.test(rootUrl)) {
			rootUrl = 'https://github.com/';
		}

		const tabUrl = `${rootUrl}notifications`;
		if (window.GitHubNotify.settings.get('useParticipatingCount')) {
			return `${tabUrl}/participating`;
		}
		return tabUrl;
	};

	window.GitHubNotify.buildQuery = options => {
		const perPage = options.perPage;
		const query = [`per_page=${perPage}`];
		if (window.GitHubNotify.settings.get('useParticipatingCount')) {
			query.push('participating=true');
		}
		return query;
	};

	window.gitHubNotifCount = () => {
		const query = window.GitHubNotify.buildQuery({perPage: 1});
		const url = `${window.GitHubNotify.getApiUrl()}?${query.join('&')}`;

		return window.GitHubNotify.request(url).then(response => {
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

			return {count, interval, lastModifed};
		});
	};
})();
