var FtpClient = require('ftp');
var Q = require('q');
var nodeUrl = require('url');
var fs = require('fs');

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
                        rejectConnection({
                            filename: file,
                            error: error
                        });
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

        function cwd (directory) {
            return Q.Promise(function (resolveConnection, rejectConnection) {
                ftpConnection.cwd(directory, function(error) {
                    if (error) {
                        rejectConnection(error);
                    } else {
                        resolveConnection();
                    }
                });
            });
        }

        function copyDir (source, destination) {
            return cwd(source).then(function () {
                return list();
            })
            .then(function (files) {
                return Q.all(files.map(function (file) {
                    if (file.type === 'd') {
                        var destPath = destination + '/' + file.name;
                        fs.stat(destPath, function (err) {
                            if (err) {
                                fs.mkdir(destPath);
                            }
                        });
                        return copyDir(source + '/' + file.name, destPath);
                    } else {
                        return get(source + '/' + file.name)
                            .then(function (fileContents) {
                                fs.writeFileSync(destination + '/' + file.name,
                                                 fileContents);
                            });
                    }
                }));
            });
        }

        function close () {
            selfFtp.connection.end();
        }

        ftpConnection.on('ready', function () {
            selfFtp.connection = {
                list: list,
                get: get,
                cwd: cwd,
                copyDir: copyDir,
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
