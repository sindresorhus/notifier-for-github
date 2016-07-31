(root => {
	'use strict';

	class NetworkService {
		constructor(persistence) {
			this.PersistenceService = persistence;
		}

		getHeaders(token) {
			/* eslint-disable quote-props */
			return {
				'Authorization': `token ${token}`,
				'If-Modified-Since': ''
			};
			/* eslint-enable quote-props */
		}

		request(url) {
			const token = this.PersistenceService.get('oauthToken');
			if (!token) {
				return Promise.reject(new Error('missing token'));
			}

			const headers = this.getHeaders(token);

			return root.fetch(url, {headers});
		}
	}

	root.NetworkService = NetworkService;
})(window);
