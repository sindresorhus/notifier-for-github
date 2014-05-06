(function () {
	'use strict';

	var xhr = (function () {
		var xhr = new XMLHttpRequest();
		return function (method, url, callback) {
			xhr.onreadystatechange = function () {
				if (xhr.readyState === 4) {
					callback(xhr.responseText, xhr.status);
				}
			};
			xhr.open(method, url);
			xhr.send();
		};
	})();

	window.GitHubNotify = (function () {
		var defaults = {
			notificationUrl: 'https://github.com/notifications',
			useParticipatingCount: false
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
		var tmp = document.createElement('div');

		xhr('GET', GitHubNotify.settings.get('notificationUrl'), function (data, status) {
			if (status >= 400) {
				callback(-1);
				return;
			}

			tmp.innerHTML = data;

			var participating = (GitHubNotify.settings.get('useParticipatingCount'))
				? '/participating'
				: '';
			var countElem = tmp.querySelector('a[href="/notifications' + participating + '"] .count');
			if (countElem) {
				callback(countElem.textContent !== '0' ? countElem.textContent : '');
			} else {
				callback(-2);
			}
		});
	};
})();
