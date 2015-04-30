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
				reset: function () {
					Object.keys(localStorage).forEach(api.settings.revert);
				},
				revert: localStorage.removeItem.bind(localStorage)
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
			callback(-4);
			return;
		}
		if (/github.com\/?/.test(url)) {
			url = 'https://api.github.com/notifications';
		} else {
			url += 'api/v3/notifications';
		}
		url += participating;

		xhr('GET', url, opts, function (data, status, response) {
			var interval = Number(response.getResponseHeader('X-Poll-Interval'));
			if (status >= 400) {
				callback(-1, interval);
				return;
			}

			if (status === 304) {
				callback(-3, interval);
				return;
			}

			try {
				data = JSON.parse(data);
			} catch (err) {
				callback(-1, interval);
				return;
			}

			if (data && data.hasOwnProperty('length')) {
				callback(String(data.length), interval);
				return;
			}
			callback(-2, interval);
			return;
		});
	};
})();
