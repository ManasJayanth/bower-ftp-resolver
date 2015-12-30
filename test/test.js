var expect = require('expect.js'),
    fs = require('fs'),
    BowerFTPResolver = require('../lib/index'),
    testHelpers = require('./test-helpers/');

var tempDir = 'test-bower-package',
    testText = 'module.exports = console.log',
    testBowerJSON = JSON.stringify({
      "name": "test-bower-package",
      "version": "0.0.1",
      "target": "v0.0.1",
      "description": "",
      "main": "index.js",
      "moduleType": [],
      "license": "MIT",
      "homepage": "",
      "ignore": [
        "**/.*",
        "node_modules",
        "bower_components",
        "test",
        "tests"
      ]
    }),
    testFileName = 'index.js';

__TEST__ = 1;
__FTP_PORT__ = 9999;

describe('FTPResolver', function () {
  beforeEach(function (done) {
    fs.mkdir(tempDir);
    fs.writeFile('./' + tempDir + '/' + testFileName, testText, function (err) {
      if (!err) {
        fs.writeFile('./' + tempDir + '/bower.json', testBowerJSON, function (err) {
          testHelpers.startFTPServerAsync({port: __FTP_PORT__})
            .then(function () {
              done();
            })
            .catch(function (e) {
            });
        });
      }
    });
  });
  afterEach(function (done) {
    fs.unlink('./' + tempDir + '/' + testFileName, function (err) {
      if (!err) {
        fs.unlink('./' + tempDir + '/bower.json', function (err) {
          fs.rmdir(tempDir);
          testHelpers.stopFTPServerAsync();
          done();
        });
      }
    });
  });
  describe('BowerFTPResolver.match', function () {
    it('should return promise resolving to true to connection handle ' +
       'for a valid FTP url', function () {
         var resolver = new BowerFTPResolver();
         var testPackageUrl = 'ftp://localhost/test-bower-package/';
         var isMatched = resolver.match(testPackageUrl)
         expect(isMatched).to.be.ok();
       })

    it('should return resolve to false for an invalid FTP url',
       function () {
         var resolver = new BowerFTPResolver();
         var testPackageUrl = 'not-ftp://localhost/';
         var isMatched = resolver.match(testPackageUrl)
         expect(isMatched).to.not.be.ok();
       })
  });

  describe('BowerFTPResolver.locate', function () {
    it('should return normalized source', function () {
         var resolver = new BowerFTPResolver();
         var testPackageName = 'test-bower-package';
         var isMatched = resolver.locate(testPackageName)
         expect(isMatched).to.be.equal('ftp://localhost/test-bower-package/');
       })
  });

  describe('BowerFTPResolver.releases', function () {
    it('should should return target releases', function (done) {
      var resolver = new BowerFTPResolver();
      var testPackageUrl = 'ftp://localhost/test-bower-package/';
      this.timeout(500);
      resolver.releases(testPackageUrl)
        .then(function (releases) {
          releases.forEach(function (release) {
            expect(release).to.have.property('target');
            expect(release.target).to.be.equal('0.0.1');
            expect(release).to.have.property('version');
            expect(release.version).to.be.equal('0.0.1');
          });
          done();
        })
        .catch(function (error) {
          console.error(error)
        });
    });
    it('should return the promise that resolves false when supplied with ' +
       'invalid url', function (done) {
      var resolver = new BowerFTPResolver();
      var testPackageUrl = 'not-ftp://localhost/test-bower-package/';
      this.timeout(500);
      resolver.releases(testPackageUrl)
        .then(function (releases) {
          expect(releases).to.not.be.ok();
          done();
        })
        .catch(function (error) {
          console.error(error)
        });
    });
    it('should return the promise that rejects when supplied with ' +
       'valid url that does not exist', function (done) {
      var resolver = new BowerFTPResolver();
      var testPackageUrl = 'ftp://localhost/test-bower-package-that-doesnot-exist/';
      this.timeout(500);
      resolver.releases(testPackageUrl)
        .catch(function (error) {
          expect(error).to.have.property('cause');
          expect(error.cause).to.have.property('code');
          expect(error.cause.code).to.be.equal(550);
          expect(error.cause).to.have.property('message');
          expect(error.cause.message).to.be.equal('Not Found');
          expect(error).to.have.property('code');
          expect(error.code).to.be.equal(550);
          expect(error).to.have.property('message');
          expect(error.message).to.be.equal('Not Found');
          done();
        });
    });
  });

  describe('BowerFTPResolver.fetch', function () {
    it('should download packages and copy to temp directory', function (done) {
      var resolver = new BowerFTPResolver();
      var testPackageUrl = 'ftp://localhost/test-bower-package';
      this.timeout(500);
      resolver.fetch({
        name: 'test-bower-package',
        source: testPackageUrl,
        target: '0.0.1'
      }).then(function (fetched) {
          expect(fetched).to.have.property('tempPath');
          expect(fetched).to.have.property('removeIgnores');
          expect(fetched).to.have.property('resolution');
          done();
        })
        .catch(function (error) {
          console.error(error)
        });
    });
    it('should resolve to false when invalid url is provided', function (done) {
      var resolver = new BowerFTPResolver();
      var testPackageUrl = 'not-ftp://localhost/test-bower-package';
      this.timeout(500);
      resolver.fetch({
        name: 'test-bower-package',
        source: testPackageUrl,
        target: '0.0.1'
      }).then(function (fetched) {
          expect(fetched).to.not.be.ok();
          done();
        })
        .catch(function (error) {
          console.error(error)
        });
    });
    it('should reject when valid url that does not exist is provided', function (done) {
      var resolver = new BowerFTPResolver();
      var testPackageUrl = 'ftp://localhost/non-existent-test-bower-package';
      this.timeout(500);
      resolver.fetch({
        name: 'test-bower-package',
        source: testPackageUrl,
        target: '0.0.1'
      }).catch(function (error) {
        expect(error).to.have.property('cause');
        expect(error.cause).to.have.property('code');
        expect(error.cause.code).to.be.equal(550);
        expect(error).to.have.property('code');
        expect(error.code).to.be.equal(550);
        done();
      });
    });
  });
});
