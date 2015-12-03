var FtpClient = require('ftp');
var Q = require('q');
var nodeUrl = require('url');

function FTP (source) {
    this.sourceParsed = nodeUrl.parse(source);
    this.connection = null;
}

FTP.prototype.init = function () {
    var selfFtp = this;
    return Q.Promise(function (resolve, reject) {
        var ftpConnection = new FtpClient();


        function list () {
            return Q.Promise(function (resolveConnection, rejectConnection) {
                ftpConnection.list(function(error, files) {
                    if (error) {
                        rejectConnection(error);
                    } else {
                        resolveConnection(files);
                    }
                });
            });
        }

        function get (file) {
            return Q.Promise(function (resolveConnection, rejectConnection) {
                ftpConnection.get(file, function(error, stream) {
                    var bufStr = '';
                    if (error) {
                        rejectConnection(error);
                    } else {
                        stream.on('data', function (chunk) {
                            bufStr += chunk;
                        });
                        stream.on('end', function () {
                            resolveConnection(bufStr);
                        });
                    }
                });
            });
        }

        function close () {
            selfFtp.connection.end();
        }       


        ftpConnection.on('ready', function () {
            selfFtp.connection = {
                list: list,
                get: get,
                close: close
            };
            resolve(selfFtp.connection);
        });
        ftpConnection.on('error', function (error) {
            reject(error);
        });
        ftpConnection.connect({
            host: selfFtp.sourceParsed.host,
            port: selfFtp.sourceParsed.port || 21,
            path: selfFtp.sourceParsed.path
        });
    });
};

module.exports = FTP;
