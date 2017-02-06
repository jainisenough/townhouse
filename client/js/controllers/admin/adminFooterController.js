'use strict';
myApp.register.controller('adminFooterController', ['$scope', '$state',
	function ($scope, $state) {
		/**************Public variables******************/
		$scope.option = {
			isLoginPage: $state.current.name === 'admin.login'
		};
	}
]);
