'use strict';
myApp.register.controller('adminLoginController', ['$scope', '$rootScope', '$state', '$location',
	'Member',
	function ($scope, $rootScope, $state, $location, Member) {
		/**************Public variables******************/
		$scope.option = {
			errorMsg: ''
		};

		/******************Load Calls******************/
		$location.replace();

		/**************Public methods******************/
		$scope.signIn = function() {
			if($scope.loginForm.$valid) {
				$scope.login.rememberMe = !!$scope.login.rememberMe || true;
				Member.login($scope.login, function(user) {
					$rootScope.currentUser = user.user;
					$rootScope.currentUser.tokenId = user.id;
					$rootScope.currentUser.adminUser = user.adminUser;

					var storage = $scope.login.rememberMe ? localStorage : sessionStorage;
					storage.setItem('adminUser', $rootScope.currentUser.adminUser);
					$state.go('admin');
				}, function(err) {
					switch (err.status) {
						case 401:
							$scope.option.errorMsg = 'Invalid username or password';
							break;
						default:
							$scope.option.errorMsg = 'Something went wrong';
							break;
					}
				});
			} else $scope.option.errorMsg = 'Username/Password is blank';
		};
	}
]);
