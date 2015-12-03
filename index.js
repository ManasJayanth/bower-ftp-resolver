var Ftp = require('./ftp-promisified');
var Q = require('q');
var fs = require('fs');

/**
 * Factory function for resolver
 * It is called only one time by Bower, to instantiate resolver.
 * You can instantiate here any caches or create helper functions.
 */
module.exports = function resolver(bower) {

    // Resolver factory returns an instance of resolver
    return {

        // Match method tells whether resolver supports given source
        // It can return either boolean or promise of boolean
        match: function (source) {
            return Q.Promise(function (resolve, reject) {
                var ftpConnection = new Ftp(source);
                if (source.search(/^\s*ftp:/) === -1) {
                    resolve(false);
                } else {
                    ftpConnection.init()
                        .then(function (connection) {
                            resolve(true);
                        }, function (error) {
                            resolve(false);
                        });
                }
            });
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
                var ftpConnection = new Ftp(source);
                if (source.search(/^\s*ftp:/) === -1) {
                    resolve(false);
                } else {
                    ftpConnection.init()
                        .then(function (connection) {
                            var path = source.split('localhost')[1];
                            connection.get(path + '/bower.json')
                                .then(function (file) {
                                    var bw = JSON.parse(file);
                                    resolve([{
                                        target: bw.version,
                                        version: bw.version
                                    }]);
                                })
                                .catch(function (err) {
                                    reject(err);
                                });
                        }, function (error) {
                            resolve([]);
                        });
                }
            });
        },

        // It downloads package and extracts it to temporary directory
        // You can use npm's "tmp" package to tmp directories
        // See the "Resolver API" section for details on this method
        fetch: function (endpoint, cached) {
        }
    };
};
