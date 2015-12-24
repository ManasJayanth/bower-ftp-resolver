var FTP = require('./extended-ftp');
var Q = require('q');
var fs = require('fs');
var path = require('path');
var os = require('os');
var nodeUrl = require('url');

/**
 * Factory function for resolver
 * It is called only one time by Bower, to instantiate resolver.
 * You can instantiate here any caches or create helper functions.
 */
module.exports = function resolver() {

  // Resolver factory returns an instance of resolver
  return {

    // Match method tells whether resolver supports given source
    // It can return either boolean or promise of boolean
    match: function (source) {
      return source.search(/^\s*ftp:/) !== -1;
    },

    // Optional:
    // Can resolve or normalize sources, like:
    // "jquery" => "git://github.com/jquery/jquery.git"
    locate: function (source) {
      return 'file://localhost/' + source;
    },

    // Optional:
    // Allows to list available versions of given source.
    // Bower chooses matching release and passes it to "fetch"
    releases: function (source) {
      return Q.Promise(function (resolve, reject) {
        var ftpClient = new FTP();
        if (source.search(/^\s*ftp:/) === -1) {
          resolve(false);
        } else {
          source = nodeUrl.parse(source);
          if (typeof __TEST__ !== 'undefined') {
            source.port = __FTP_PORT__;
          }
          ftpClient.on('ready', function () {
            var path = source.path;
            ftpClient.getAsync(path + '/bower.json')
              .then(function (file) {
                var fileContents = '';
                file.on('data', function (chunk) {
                  fileContents += chunk;
                });
                file.on('end', function () {
                  var bw = JSON.parse(fileContents);
                  resolve([{
                    target: bw.version,
                    version: bw.version
                  }]);
                });
              })
              .catch(function (err) {
                reject(err);
              });
          });
          ftpClient.on('error', function (error) {
            reject(error);
          });
          ftpClient.connect(source);
        }
      });
    },

    // It downloads package and extracts it to temporary directory
    // You can use npm's "tmp" package to tmp directories
    // See the "Resolver API" section for details on this method
    fetch: function (endpoint) {
      return Q.Promise(function (resolve, reject) {
        var source = endpoint.source;
        var tempPath = path.join(os.tmpdir(), endpoint.name);
        var ftpClient = new FTP();
        if (source.search(/^\s*ftp:/) === -1) {
          resolve(false);
        } else {
          source = nodeUrl.parse(source);
          if (typeof __TEST__ !== 'undefined') {
            source.port = __FTP_PORT__;
          }
          ftpClient.on('ready', function () {
            var path = source.path;
            fs.stat(tempPath, function (err) {
              if (err) {
                fs.mkdir(tempPath);
              }
            });
            ftpClient.copyDirAsync(path, tempPath).then(function () {
              resolve({
                tempPath: tempPath,
                removeIgnores: true,
                resolution: new Date()
              });
            }).catch(function (err) {
              reject(err);
            });
          });
          ftpClient.on('error', function (error) {
            reject(error);
          });
          ftpClient.connect(source);
        }
      });
    }
  };
};
