var expect = require('expect.js');
var ftpResolver = require('./index');

describe('FTPResolver', function () {
    describe('ftpResolver.match', function () {
        it('should return promise resolving to true to connection handle ' +
           'for a valid FTP url', function (done) {
               var resolver = new ftpResolver();
               var testPackageUrl = 'ftp://localhost/test-bower-package/';
               this.timeout(1000);
               resolver.match(testPackageUrl)
                   .then(function (connection) {
                       expect(connection).to.be.ok();
                       done();
                   })
                   .catch(function (error) {
                       console.log(error.message);
                   });
           })

        it('should return resolve to false for an invalid FTP url',
           function (done) {
               var resolver = new ftpResolver();
               var testPackageUrl = 'not-ftp://localhost/';
               this.timeout(500);
               resolver.match(testPackageUrl)
                   .then(function (isMatched) {
                       expect(isMatched).to.not.be.ok();
                       done();
                   })
                   .catch(function (error) {
                       console.log(error)
                   });
           })
    });

    describe('ftpResolver.releases', function () {
        it('should ', function (done) {
            var resolver = new ftpResolver();
            var testPackageUrl = 'ftp://localhost/development/js/' +
                    'dev/try-node-ftp/test-bower-package';
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
                    console.log(error)
                });
        })
    });
})
