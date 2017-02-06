'use strict';
var myApp = angular.module('myApp', ['ui.router', 'ui.bootstrap', 'ngAnimate', 'ngResource',
	'lbServices'])
	.constant('constant', CONSTANT)
	.constant('pathConstant', PATH_CONSTANT)
	.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', 'LoopBackResourceProvider',
		'$controllerProvider', 'constant', 'pathConstant',
		function ($stateProvider, $urlRouterProvider, $locationProvider, LoopBackResourceProvider,
							$controllerProvider, constant, pathConstant) {

			/*********************Lodash Mixins******************/
			_.mixin({
				capitalize: function(string) {
					return string.charAt(0).toUpperCase() + string.substring(1).toLowerCase();
				},
				titleCase: function(string) {
					var _this = this;
					return string.replace(/\w\S*/g, function(txt) {
						return _this.capitalize(txt);
					});
				}
			});

			/*********************App configuration******************/

			// Use a custom auth header instead of the default 'Authorization'
			LoopBackResourceProvider.setAuthHeader('X-Access-Token');

			// enable html5 mode
			$locationProvider.html5Mode({
				enabled: true,
				requireBase: false
			});

			// register provider
			myApp.register = {
				controller: $controllerProvider.register
			};

			/******************App Routing***************/
			$stateProvider.state('admin', {
				url: '/admin',
				authenticate: {
					admin: true
				},
				views: {
					header: {
						templateProvider: ['loadAsync', function (loadAsync) {
							return loadAsync.template({
								view: pathConstant.view + '/admin/header',
								controller: pathConstant.js + '/controllers/admin/adminHeaderController'
							});
						}]
					},
					middle: {
						templateProvider: ['loadAsync', function (loadAsync) {
							return loadAsync.template({
								view: pathConstant.view + '/admin/dashboard',
								controller: pathConstant.js + '/controllers/admin/adminDashboardController'
							});
						}]
					},
					footer: {
						templateProvider: ['loadAsync', function (loadAsync) {
							return loadAsync.template({
								view: pathConstant.view + '/admin/footer',
								controller: pathConstant.js + '/controllers/admin/adminFooterController'
							});
						}]
					}
				}
			}).state('admin.login', {
				url: '/login',
				views: {
					'header@': {
						template: null
					},
					'middle@': {
						templateProvider: ['loadAsync', function (loadAsync) {
							return loadAsync.template({
								view: pathConstant.view + '/admin/login',
								controller: pathConstant.js + '/controllers/admin/adminLoginController'
							});
						}]
					}
				}
			});

			$urlRouterProvider.rule(function ($i, $location) {
				return $location.url().toLowerCase().replace(/\/$/, '').replace('/?', '?');
			}).otherwise('/admin');
		}
	]).run(['$rootScope', '$state', 'storage', 'constant', 'LoopBackAuth', 'Member',
	function ($rootScope, $state, storage, constant, LoopBackAuth, Member) {
		$rootScope.baseUrl = constant.baseUrl;
		$rootScope.apiUrl = constant.apiUrl;
		$rootScope.siteTitle = constant.siteTitle;

		$rootScope.$on('$stateChangeStart', function (event, next) {
			if (next.authenticate) {
				if(angular.isUndefined($rootScope.currentUser) && Member.isAuthenticated()) {
					$rootScope.currentUser = Member.getCurrent();
					$rootScope.currentUser.tokenId = LoopBackAuth.accessTokenId;
					$rootScope.currentUser.adminUser = localStorage.getItem('adminUser') ||
						sessionStorage.getItem('adminUser') || false;
				}

				//check admin access
				if(angular.isUndefined($rootScope.currentUser) || (angular.isDefined($rootScope.currentUser)
					&& next.authenticate.admin && !$rootScope.currentUser.adminUser)) {
					event.preventDefault();
					$state.go('admin.login');
				}
			}

			$rootScope.meta = {
				title: _.titleCase($rootScope.siteTitle + ' ' + next.name.split('.').join(' | ')),
				author: $rootScope.siteTitle,
				description: $rootScope.siteTitle
			};
		});
	}
]).factory('storage', ['$window', '$state', '$uibModal', function ($window, $state, $uibModal) {
		$window.addEventListener('storage', function(event) {
			if(event.key === '$LoopBack$currentUserId' && !event.newValue) {
				$uibModal.open({
					templateUrl: 'sessionWarn.tpl',
					controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
						$scope.ok = function(){
							$uibModalInstance.dismiss('cancel');
							$state.go('admin.login');
						};
					}],
					size: 'sm'
				});
			}
			else if(event.key === '$LoopBack$accessTokenId' && event.newValue) {
				$state.go('admin.login');
			}
		},false);
		return {};
	}
]);
