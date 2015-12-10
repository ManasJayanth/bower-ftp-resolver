var expect = require('expect.js'),
    ExtendedFTP = require('../lib/extended-ftp'),
    testHelpers = require('./test-helpers/'),
    fs = require('fs');
describe('FTP', function () {
    beforeEach(function (done) {
        __TEST__ = 1;
        __FTP_PORT__ = 9999;
        testHelpers.startFTPServerAsync({port: __FTP_PORT__})
            .then(function () {
                done();
            })
            .catch(function (e) {
            });
    });
    describe('FTP.prototype.copyDirAsync', function () {
        beforeEach(function (done) {
            done();
        });
        it('copies a file from source to destination', function (done) {
            var extendedFTP = new ExtendedFTP();
            var tempDir = 'test-temp-dir-' + Math.floor(Math.random() * 1000),
                testText = 'testing-text',
                testFileName = 'test.file';

            extendedFTP.on('ready', function () {
                extendedFTP.copyDirAsync('/' + tempDir, '.')
                    .then(function () {
                        var textFound = fs.readFileSync('./' + tempDir + '/' +
                                                        testFileName).toString();
                        expect(textFound, testText);
                        fs.unlinkSync('./' + tempDir + '/' + testFileName);
                        fs.rmdir(tempDir);
                        done();
                    })
                    .catch(function (e) {
                        console.log(e);
                    });
            });

            fs.mkdir(tempDir);
            fs.writeFile('./' + tempDir + '/' + testFileName, testText, function (err) {
                if (!err) {
                    extendedFTP.connect({
                        host: 'localhost',
                        port: __FTP_PORT__
                    });
                }
            });
        });
    });
});
