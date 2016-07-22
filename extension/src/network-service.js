(root => {
	'use strict';

	class NetworkService {
		constructor(persistence) {
			this.PersistenceService = persistence;
		}
		request(url) {
			const token = this.PersistenceService.get('oauthToken');
			if (!token) {
				return Promise.reject(new Error('missing token'));
			}

			/* eslint-disable quote-props */
			const headers = Object.assign({
				'Authorization': `token ${token}`,
				'If-Modified-Since': ''
			});
			/* eslint-enable quote-props */

			return fetch(url, {headers});
		}
	}

	root.NetworkService = NetworkService;
})(window);
