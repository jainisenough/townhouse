'use strict';
module.exports = function (server) {
  // Install a `/` route that returns server status
  var router = server.loopback.Router();
  var status = server.loopback.status();
  if (process.env.NODE_ENV === 'production') {
    router.use(function (req, res, next) {
      res.setHeader('Expires', new Date(Date.now() + server.get('maxAge')).toUTCString());
      next();
    });
  }

  router.get(/^((?!\.).)*$/, function (req, res) {
    if (process.env.NODE_ENV === 'production')
      status(req, res);
    else
      res.sendFile('/index.html', {root: __dirname + '/../../client/views'});
  });

  server.use(router);
};
