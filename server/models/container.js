module.exports = function (Container) {
	var fs = require('fs'), im = require('imagemagick'), assert = require('assert'),
		async = require('async'), basePath = 'client/images/', quality = 0.5;
	var args = [
		'-strip', '-interlace', 'plane', '-gaussian-blur', '2',
		'-define', 'jpeg:fancy-upsampling=off',
		'-define', 'png:compression-filter=5',
		'-define', 'png:compression-level=9',
		'-define', 'png:compression-strategy=1',
		'-define', 'png:exclude-chunk=all',
		'-dither', 'None'
	];

	/****************Remote API******************/
	Container.crop = function (opt, cb) {
		assert(typeof opt === 'object', 'options required when calling Container.crop()');
		assert(opt.path, 'You must supply a image path (options.path)');
		var name = opt.path;
		opt.path = basePath + opt.path;
		opt.persist = opt.persist || false;
		if (opt.bulk) {
			assert(typeof opt.bulk === 'object', 'You must supply a valid bulk arguments (options.bulk)');
			assert(opt.bulk.length > 0, 'You must supply a valid bulk arguments (options.bulk)');

			opt.bulk.forEach(function (v, i) {
				assert(v.width > 0, 'You must supply a crop width (options[%d].width)', i);
				assert(v.height > 0, 'You must supply a crop height (options[%d].height)', i);
			});

			opt.bulk = opt.bulk.map(function (v) {
				if (!v.uploadPath) {
					v.uploadPath = opt.path;
				} else {
					v.uploadPath = basePath + v.uploadPath + v.width + 'X' + v.height + '_' + name;
				}

				return v;
			});
		} else {
			assert(opt.width > 0, 'You must supply a crop width (options.width)');
			assert(opt.height > 0, 'You must supply a crop height (options.height)');
			opt.uploadPath = opt.uploadPath ?
			basePath + opt.uploadPath + opt.width + 'X' + opt.height + '_' + name : opt.path;
		}

		try {
			args.unshift(opt.path);
			args.push(opt.path);
			im.convert(args, function (err) {
				if (err) cb(err, null);

				//crop images
				var args = [opt.path];
				if (opt.bulk) {
					opt.bulk.forEach(function (v) {
						args = args.concat([
							'(',
							'-clone', '0',
							'-resize', v.width + 'x' + v.height + '^',
							'-gravity', 'center',
							'-crop', v.width + 'x' + v.height + '+0+0',
							'-quality', quality,
							'-write', v.uploadPath,
							')'
						]);
					});
					args.push(null);
				} else {
					args = args.concat([
						'-resize', opt.width + 'x' + opt.height + '^',
						'-gravity', 'center',
						'-crop', opt.width + 'x' + opt.height + '+0+0',
						'-quality', quality,
						opt.uploadPath
					]);
				}

				im.convert(args, function (err) {
					if (err) cb(err, null);
					else {
						async.waterfall([
							function (cbk) {
								if (opt.persist) {
									fs.unlink(opt.path, cbk);
								} else cbk(null);
							}
						], function (err) {
							var result = {};
							var uploadFileName;
							if (opt.bulk) {
								result.file = [];
								opt.bulk.forEach(function (v) {
									uploadFileName = v.uploadPath.split('/');
									result.file.push({
										container: uploadFileName[uploadFileName.length - 2],
										name: uploadFileName[uploadFileName.length - 1],
										width: v.width,
										height: v.height,
										replace: err ? false : true
									});
								});
							} else {
								uploadFileName = opt.uploadPath.split('/');
								result.file = {
									container: uploadFileName[uploadFileName.length - 2],
									name: uploadFileName[uploadFileName.length - 1],
									width: opt.width,
									height: opt.height,
									replace: err ? false : true
								};
							}

							cb(null, result);
						});
					}
				});
			});
		}
		catch (e) {
			cb(new Error('Imagemagick not installed'), null);
		}
	};

	Container.resize = function (opt, cb) {
		assert(typeof opt === 'object', 'options required when calling Container.crop()');
		assert(opt.path, 'You must supply a image path (options.path)');

		var name = opt.path;
		opt.path = basePath + opt.path;
		opt.persist = opt.persist || false;
		if (opt.bulk) {
			assert(typeof opt.bulk === 'object', 'You must supply a valid bulk arguments (options.bulk)');
			assert(opt.bulk.length > 0, 'You must supply a valid bulk arguments (options.bulk)');

			opt.bulk.forEach(function (v, i) {
				assert(typeof v.width === 'undefined' || (typeof v.width === 'number' && v.width > 0),
					'You must supply a crop width (options[%d].width)', i);
				assert(typeof v.height === 'undefined' || (typeof v.height === 'number' && v.height > 0),
					'You must supply a crop height (options[%d].height)', i);
			});

			opt.bulk = opt.bulk.map(function (v) {
				if (!v.uploadPath) {
					v.uploadPath = opt.path;
				} else {
					v.uploadPath = basePath + v.uploadPath + name;
				}

				return v;
			});
		} else {
			assert(typeof opt.width === 'undefined' || (typeof opt.width === 'number' && opt.width > 0),
				'You must supply a crop width (options.width)');
			assert(typeof opt.height === 'undefined' || (typeof opt.height === 'number' && opt.height > 0),
				'You must supply a crop height (options.height)');
			opt.uploadPath = opt.uploadPath ? basePath + opt.uploadPath + name : opt.path;
		}

		try {
			args.unshift(opt.path);
			args.push(opt.path);
			im.convert(args, function (err) {
				if (err) cb(err, null);

				//crop images
				var args = [opt.path], temp;
				if (opt.bulk) {
					opt.bulk.forEach(function (v) {
						temp = [v.width || '', v.height || ''];
						args = args.concat([
							'(',
							'-clone', '0',
							'-resize', temp.join('x'),
							'-quality', quality,
							'-write', v.uploadPath,
							')'
						]);
					});
					args.push(null);
				} else {
					temp = [opt.width || '', opt.height || ''];
					args = args.concat([
						'-resize', temp.join('x'),
						'-quality',
						quality, opt.uploadPath
					]);
				}

				im.convert(args, function (err) {
					if (err) cb(err, null);
					else {
						async.waterfall([
							function (cbk) {
								if (opt.persist) {
									fs.unlink(opt.path, cbk);
								} else cbk(null);
							}
						], function (err) {

							var result = {};
							var uploadFileName;
							if (opt.bulk) {
								result.file = [];
								opt.bulk.forEach(function (v) {
									uploadFileName = v.uploadPath.split('/');
									result.file.push({
										container: uploadFileName[uploadFileName.length - 2],
										name: uploadFileName[uploadFileName.length - 1],
										width: v.width || '',
										height: v.height || '',
										replace: err ? false : true
									});
								});
							} else {
								uploadFileName = opt.uploadPath.split('/');
								result.file = {
									container: uploadFileName[uploadFileName.length - 2],
									name: uploadFileName[uploadFileName.length - 1],
									width: opt.width || '',
									height: opt.height || '',
									replace: err ? false : true
								};
							}

							cb(null, result);
						});
					}
				});
			});
		}
		catch (e) {
			cb(new Error('Imagemagick not installed'), null);
		}
	};

	Container.remoteMethod('crop', {
		http: {path: '/crop', verb: 'get'},
		accepts: {
			arg: 'options',
			type: 'object',
			http: {source: 'query'},
			required: true,
			description: 'Options defining path, width, height, persist, bulk'
		},
		returns: {arg: 'result', type: 'object'},
		description: 'Crop images into multiple size.'
	});

	Container.remoteMethod('resize', {
		http: {path: '/resize', verb: 'get'},
		accepts: {
			arg: 'options',
			type: 'object',
			http: {source: 'query'},
			required: true,
			description: 'Options defining path, width or height, persist, bulk'
		},
		returns: {arg: 'result', type: 'object'},
		description: 'Resize images into multiple size.'
	});
};
