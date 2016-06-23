(function(root) {
  'use strict';

  const request = url => {
		const token = root.PersistenceService.get('oauthToken');
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
	}

  root.NetworkService = {
    request
  };

})(window);
