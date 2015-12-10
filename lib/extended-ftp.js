var FTP = require('ftp');
var Promise = require('bluebird');
var nodeUrl = require('url');
var fs = require('fs');

function ExtendedFTP () {
    FTP.apply(this, arguments);
}

ExtendedFTP.prototype = Object.create(FTP.prototype);
Object.defineProperty(ExtendedFTP.prototype, 'constructor', {
    value: ExtendedFTP,
    enumerable: false
});

ExtendedFTP.prototype.copyDir = function copyDir (source, destination, callback) {
    this.cwd(source, function (error) {
        if (error) {
            callback(error);
            return;
        }
        this.list(function (error, files) {
            if (error) {
                callback(error);
                return;
            }
            files.forEach(function (file) {
                if (file.type === 'd') {
                    var destPath = destination + '/' + file.name;
                    fs.stat(destPath, function (error) {
                        if (error) {
                            fs.mkdir(destPath);
                        }
                    });
                    copyDir(source + '/' + file.name, destPath, callback);
                } else {
                    this.get(source + '/' + file.name, function (error, fileContents) {
                        if (error) {
                            callback(destPath);
                        }
                        fs.writeFileSync(destination + '/' + file.name,
                                         fileContents);
                    });
                }
            }.bind(this));
            callback(null); //TODO ensure all files are copied
        }.bind(this));
    }.bind(this));
};

Promise.promisifyAll(ExtendedFTP.prototype);
module.exports = ExtendedFTP;
