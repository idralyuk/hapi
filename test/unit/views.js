// Load modules

var Lab = require('lab');
var Hapi = require('../..');
var Views = require('../../lib/views');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


describe('Views', function () {

    var viewsPath = __dirname + '/templates';

    describe('#render', function () {

        var testView = new Views({
            engines: { 'html': 'handlebars' },
            path: viewsPath,
            layout: false
        });

        var testViewWithLayouts = new Views({
            engines: { 'html': 'handlebars' },
            path: viewsPath,
            layout: true
        });

        it('renders with async compile', function (done) {

            var views = new Views({
                path: viewsPath,
                engines: {
                    'html': {
                        compileMode: 'async',
                        module: {
                            compile: function (string, options, callback) {

                                callback(null, require('handlebars').compile(string, options));
                            }
                        }
                    }
                }
            });

            views.render('valid/test', { title: 'test', message: 'Hapi' }, function (err, rendered, config) {

                expect(rendered).to.exist;
                expect(rendered.length).above(1);
                done();
            });
        });

        it('returns error on sync compile that throws', function (done) {

            var views = new Views({
                path: viewsPath,
                engines: {
                    'html': {
                        compileMode: 'sync',
                        module: {
                            compile: function (string, options) {

                                throw (new Error('Bad bad view'));
                            }
                        }
                    }
                }
            });

            views.render('valid/test', { title: 'test', message: 'Hapi' }, function (err, rendered, config) {

                expect(err).to.exist;
                expect(err.message).to.equal('Bad bad view');
                done();
            });
        });

        it('should work and not throw with valid (no layouts)', function (done) {

            testView.render('valid/test', { title: 'test', message: 'Hapi' }, function (err, rendered, config) {

                expect(rendered).to.exist;
                expect(rendered.length).above(1);
                done();
            });
        });

        it('should work and not throw with valid (with layouts)', function (done) {

            testViewWithLayouts.render('valid/test', { title: 'test', message: 'Hapi' }, function (err, rendered, config) {

                expect(rendered).to.exist;
                expect(rendered.length).above(1);
                done();
            });

        });

        it('should work and not throw with basePath, template name, and no path', function (done) {

            var views = new Views({ engines: { 'html': 'handlebars' } });
            views.render('test', { title: 'test', message: 'Hapi' }, { basePath: viewsPath + '/valid' }, function (err, rendered, config) {

                expect(rendered).to.exist;
                expect(rendered.length).above(1);
                done();
            });
        });

        it('should return error when referencing non existant partial (with layouts)', function (done) {

            testViewWithLayouts.render('invalid/test', { title: 'test', message: 'Hapi' }, function (err, rendered, config) {

                expect(err).to.exist;
                done();
            });
        });

        it('should return error when referencing non existant partial (no layouts)', function (done) {

            testView.render('invalid/test', { title: 'test', message: 'Hapi' }, function (err, rendered, config) {

                expect(err).to.exist;
                done();
            });

        });

        it('should return error if context uses layoutKeyword as a key', function (done) {

            var opts = { title: 'test', message: 'Hapi', content: 1 };
            testViewWithLayouts.render('valid/test', opts, function (err, rendered, config) {

                expect(err).to.exist;
                done();
            });
        });

        it('should return error on compile error (invalid template code)', function (done) {

            testView.render('invalid/badmustache', { title: 'test', message: 'Hapi' }, function (err, rendered, config) {

                expect(err instanceof Error).to.equal(true);
                done();
            });
        });

        it('should load partials and be able to render them', function (done) {

            var tempView = new Views({
                engines: { 'html': 'handlebars' },
                path: viewsPath + '/valid',
                partialsPath: viewsPath + '/valid/partials'
            });

            tempView.render('testPartials', {}, function (err, rendered, config) {

                expect(rendered).to.equal('Nav:<nav>Nav</nav>|<nav>Nested</nav>');
                done();
            });
        });

        it('should load partials and render them EVEN if viewsPath has trailing slash', function (done) {

            var tempView = new Views({
                engines: { 'html': 'handlebars' },
                path: viewsPath + '/valid',
                partialsPath: viewsPath + '/valid/partials/'
            });

            tempView.render('testPartials', {}, function (err, rendered, config) {

                expect(rendered).to.exist;
                expect(rendered.length).above(1);
                done();
            });
        });

        it('should skip loading partial if engine does not have registerPartial method', function (done) {

            var tempView = new Views({
                path: viewsPath + '/valid',
                partialsPath: viewsPath + '/valid/partials',
                engines: { 'html': 'jade' }
            });

            tempView.render('testPartials', {}, function (err, rendered, config) {

                expect(rendered).to.exist;
                expect(rendered.length).above(1);
                done();
            });
        });
    });

    describe('#handler', function () {

        it('handles routes to views', function (done) {

            var options = {
                views: {
                    engines: { 'html': 'handlebars' },
                    path: viewsPath
                }
            };

            var server = new Hapi.Server(options);

            server.route({ method: 'GET', path: '/{param}', handler: { view: 'valid/handler' } });
            server.inject({
                method: 'GET',
                url: '/hello'
            }, function (res) {

                expect(res.result).to.contain('hello');
                done();
            });
        });
    });
});
