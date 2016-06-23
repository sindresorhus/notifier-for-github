((root) => {
  'use strict';

  const getApiUrl = () => {
		const rootUrl = window.PersistenceService.get('rootUrl');

		if (/(^(https:\/\/)?(api\.)?github\.com)/.test(rootUrl)) {
			return 'https://api.github.com/notifications';
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

  const buildQuery = options => {
		const perPage = options.perPage;
		const query = [`per_page=${perPage}`];
		if (window.PersistenceService.get('useParticipatingCount')) {
			query.push('participating=true');
		}
		return query;
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
		const query = buildQuery({perPage: 1});
		const url = `${getApiUrl()}?${query.join('&')}`;

		return window.NetworkService.request(url).then(parseApiResponse);
	}

  root.API = {
    getApiUrl,
    getTabUrl,
    getNotifications,
    buildQuery,
  };

})(window);
