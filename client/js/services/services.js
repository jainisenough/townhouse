(function (angular) {
	'use strict';
	myApp.service('loadAsync', ['$q', '$http', '$templateCache', '$log',
		function ($q, $http, $templateCache, $log) {
		this.css = function (url) {
			var res = document.createElement('link');
			res.href = url;
			res.rel = 'stylesheet';
			var ele = document.getElementsByTagName('head')[0];
			ele.appendChild(res);
		};

		this.js = function (url, cb, defer) {
			defer = defer || $q.defer();
			var res = document.createElement('script');
			res.type = 'application/javascript';
			var script = document.getElementsByTagName('script'), len = script.length, flag = true;
			if (angular.isArray(url) && url.length) {
				var _this = this;
				res.src = url[0].replace(/\/$/, '');
				res.src += ~res.src.indexOf('.js') ? '' : '.js';
				for (var i = 0; i < len; i++) {
					if (script[i].src === res.src) {
						flag = false;
						break;
					}
				}

				if (flag) {
					res.onerror = res.onload = function () {
						url.shift();
						if (url.length) _this.js(url, cb, defer);
						else typeof cb === 'function' ? cb() : defer.resolve();
					};
				} else {
					url.shift();
					if (url.length) _this.js(url, cb, defer);
					else typeof cb === 'function' ? cb() : defer.resolve();
				}
			} else if (angular.isString(url)) {
				res.src = url.replace(/\/$/, '');
				res.src += ~res.src.indexOf('.js') ? '' : '.js';
				for (var j = 0; j < len; j++) {
					if (script[j].src === res.src) {
						flag = false;
						break;
					}
				}

				if (flag) {
					res.onerror = res.onload = function () {
						typeof cb === 'function' ? cb() : defer.resolve();
					};
				} else typeof cb === 'function' ? cb() : defer.resolve();
			} else typeof cb === 'function' ? cb() : defer.resolve();

			if (flag) document.body.appendChild(res);
			return defer.promise;
		};

		this.template = function (params) {
			if (angular.isUndefined(params) || angular.isUndefined(params.view)) {
				$log.log('Required arguments missing : view');
				return;
			}

			params.view += params.view.indexOf('.html') > -1 ? '' : '.html';
			if (!angular.isUndefined(params.controller) && params.controller.length) {
				var counter = 0, resp = '', total = Object.keys(params).length, defer = $q.defer();
				this.js(params.controller).then(function () {
					counter++;
					if (counter === total)
						defer.resolve(resp);
				});

				$http.get(params.view, {cache: $templateCache}).then(function (res) {
					counter++;
					resp = res.data;
					if (counter === total)
						defer.resolve(resp);
				});
				return defer.promise;
			} else {
				return $http.get(params.view, {cache: $templateCache}).then(function (res) {
					return res.data;
				});
			}
		};
	}]);
})(window.angular);
