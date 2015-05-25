(function () {
	'use strict';

	var xhr = (function () {
		var xhr = new XMLHttpRequest();
		return function (method, url, headers, callback) {
			if (!callback && typeof headers === 'function') {
				callback = headers;
				headers = null;
			}
			xhr.onreadystatechange = function () {
				if (xhr.readyState === 4) {
					callback(xhr.responseText, xhr.status, xhr);
					return;
				}
			};
			xhr.open(method, url);
			if (headers) {
				Object.keys(headers).forEach(function (k) {
					xhr.setRequestHeader(k, headers[k]);
				});
			}
			xhr.setRequestHeader('If-Modified-Since', '');
			xhr.send();
		};
	})();

	window.GitHubNotify = (function () {
		var defaults = {
			rootUrl: 'https://api.github.com/',
			oauthToken: '',
			useParticipatingCount: false,
			interval: 60
		};

		var api = {
			settings: {
				get: function (name) {
					var item = localStorage.getItem(name);
					if (item === null) {
						return ({}.hasOwnProperty.call(defaults, name) ? defaults[name] : void 0);
					} else if (item === 'true' || item === 'false') {
						return (item === 'true');
					}
					return item;
				},
				set: localStorage.setItem.bind(localStorage),
				reset: localStorage.clear.bind(localStorage)
			}
		};

		return api;
	})();

	window.gitHubNotifCount = function (callback) {
		var token = GitHubNotify.settings.get('oauthToken');
		var opts = {
			Authorization: 'token ' + token
		};
		var participating = GitHubNotify.settings.get('useParticipatingCount')
			? '?participating=true'
			: '';
		var url = GitHubNotify.settings.get('rootUrl');

		if (!token) {
			callback(new Error('missing token'));
			return;
		}

		if (/(^(https:\/\/)?(api\.)?github\.com)/.test(url)) {
			url = 'https://api.github.com/notifications';
		} else {
			url += 'api/v3/notifications';
		}
		url += participating;

		xhr('GET', url, opts, function (data, status, response) {
			var interval = Number(response.getResponseHeader('X-Poll-Interval'));

			if (status >= 500) {
				callback(new Error('server error'), null, interval);
				return;
			}

			if (status >= 400) {
				callback(new Error('client error: '+data), null, interval);
				return;
			}

			try {
				data = JSON.parse(data);
			} catch (err) {
				callback(new Error('parse error'), null, interval);
				return;
			}

			if (data && data.hasOwnProperty('length')) {
				callback(null, data.length, interval);
				return;
			}
			callback(new Error('data format error'), null, interval);
			return;
		});
	};
})();
