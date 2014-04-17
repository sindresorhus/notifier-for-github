(function () {
	'use strict';

	var xhr = (function () {
		var xhr = new XMLHttpRequest();
		return function (method, url, callback) {
			xhr.onreadystatechange = function () {
				if (xhr.readyState === 4) {
					callback(xhr.responseText);
				}
			};
			xhr.open(method, url);
			xhr.send();
		};
	})();

	window.GitHubNotify = (function () {
		var defaults = {
			notificationUrl: 'https://github.com/notifications'
		};

		var api = {
			settings: {
				get: function (name) {
					var item = localStorage.getItem(name);
					return item === null ? ({}.hasOwnProperty.call(defaults, name) ? defaults[name] : void 0) : item;
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
		var NOTIFICATIONS_URL = GitHubNotify.settings.get('notificationUrl');
		var tmp = document.createElement('div');

		xhr('GET', NOTIFICATIONS_URL, function (data) {
			var countElem;
			tmp.innerHTML = data;
			countElem = tmp.querySelector('a[href="/notifications"] .count');

			if (countElem) {
				callback(countElem.textContent !== '0' ? countElem.textContent : '');
			} else {
				callback(false);
			}
		});
	};
})();
