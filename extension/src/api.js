(root => {
	'use strict';

	const buildQuery = options => {
		const perPage = options.perPage;
		const query = [`per_page=${perPage}`];
		if (window.PersistenceService.get('useParticipatingCount')) {
			query.push('participating=true');
		}
		return query.join('&');
	};

	const getApiUrl = query => {
		const rootUrl = window.PersistenceService.get('rootUrl');

		if (/(^(https:\/\/)?(api\.)?github\.com)/.test(rootUrl)) {
			return 'https://api.github.com/notifications';
		}

		if (query) {
			return `${rootUrl}api/v3/notifications?${buildQuery(query)}`;
		}

		return `${rootUrl}api/v3/notifications`;
	};

	const getTabUrl = () => {
		let rootUrl = window.PersistenceService.get('rootUrl');

		if (/api.github.com\/$/.test(rootUrl)) {
			rootUrl = 'https://github.com/';
		}

		const tabUrl = `${rootUrl}notifications`;
		if (window.PersistenceService.get('useParticipatingCount')) {
			return `${tabUrl}/participating`;
		}
		return tabUrl;
	};

	const parseApiResponse = response => {
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
	};

	const getNotifications = () => {
		const url = getApiUrl({perPage: 1});
		return window.NetworkService.request(url).then(parseApiResponse);
	};

	const openTab = (url, tab) => {
		// checks optional permissions
		window.PermissionsService.queryPermission('tabs').then(granted => {
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
	};

	root.API = {
		getApiUrl,
		getTabUrl,
		getNotifications,
		openTab
	};
})(window);
