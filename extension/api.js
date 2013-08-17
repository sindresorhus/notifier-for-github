(function () {
	'use strict';

	var xhr = function () {
		var xhr = new XMLHttpRequest();
		return function(method, url, callback) {
			xhr.onreadystatechange = function () {
				if (xhr.readyState === 4) {
					callback(xhr.responseText);
				}
			};
			xhr.open(method, url);
			xhr.send();
		};
	}();

	window.gitHubNotifCount = function (callback) {
		var NOTIFICATIONS_URL = 'https://github.com/notifications';
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
