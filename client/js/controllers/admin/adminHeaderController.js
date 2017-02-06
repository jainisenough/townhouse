'use strict';
myApp.register.controller('adminHeaderController', ['$scope', '$log', '$rootScope', '$state',
	'Member',
	function ($scope, $log, $rootScope, $state, Member) {
		$scope.logout = function() {
			Member.logout(angular.noop, $log.log).$promise.finally(function() {
				$rootScope.currentUser = {};
				try {
					localStorage.removeItem('adminUser');
					sessionStorage.removeItem('adminUser');
				} catch (e) {}

				$state.go('admin.login');
			});
		};
	}
]);
