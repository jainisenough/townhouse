var assert = require('assert');
var async = require('async');
var ADMIN_ROLE_ID = '56fa3b4489a30df81c7cdca2';

module.exports = function (Member) {
	/**************API Hook***************/
	Member.afterRemote('login', function(context, user, next) {
		var RoleModel = Member.app.models.Role;
		var RoleMappingModel = Member.app.models.RoleMapping;
		RoleMappingModel.findOne({
			where: {
				principalId: user.userId
			},
			fields: ['roleId']
		}, function(err, role) {
			user.adminUser = role && String(role.roleId) === ADMIN_ROLE_ID;
			next();
		});
	});

	/**************Custom API***************/
	/************Social Login**************/
	Member.socialLogin = function (credentials, include, cb) {
		assert(typeof credentials === 'object', 'credentials required when calling Member.socialLogin()');
		assert(typeof credentials.username === 'string', 'You must supply a social (credentials.social)');

		var search = {
			username: credentials.username
		};

		Member.findOne({where: search}, function (err, user) {
			if (err)
				cb(err);

			if (!user) {
				err = new Error('MEMBER_NOT_FOUND');
				err.statusCode = 404;
				cb(err);
			}
			else {
				if (user.status === 0) {
					err = new Error('MEMBER_NOT_ACTIVE');
					err.statusCode = 422;
					cb(err);
				}
				else {
					async.parallel([
						//generate access token
						function (cbk) {
							user.createAccessToken(undefined, function (err, token) {
								if (err) return cbk(err);
								if (include === 'user') {
									token.__data.user = user;
								}
								cbk(err, token);
							});
						},
						//update user new fb token
						function (cbk) {
							user.updateAttribute('fbAccessToken', credentials.fbAccessToken, cbk);
						}
					], function (err, resp) {
						if (err) cb(err);
						else cb(err, resp[0]);
					});
				}
			}
		});
	};

	/**************Remote method***************/
	Member.remoteMethod('socialLogin', {
		http: {path: '/socialLogin', verb: 'post'},
		accepts: [{
			arg: 'credentials',
			type: 'object',
			http: {source: 'body'},
			required: true,
			description: 'Model instance data.'
		}, {
			arg: 'include',
			type: 'string',
			http: {source: 'query'},
			description: 'Related object include to response.'
		}],
		returns: {arg: 'token', type: 'object'},
		description: 'Create a new instance of the user or login with already exist model and ' +
		'persist it into the data source.'
	});
};
