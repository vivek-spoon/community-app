(function (module) {
    mifosX.services = _.extend(module, {
        MiddlewareHttpServiceProvider: function () {
            var requestInterceptors = {};

            this.addRequestInterceptor = function (id, interceptorFn) {
                requestInterceptors[id] = interceptorFn;
            };

            this.removeRequestInterceptor = function (id) {
                delete requestInterceptors[id];
            };

            this.$get = ['$http', function (http) {
                var SpoonHttpService = function () {
                    var getConfig = function (config) {
                        return _.reduce(_.values(requestInterceptors), function (c, i) {
                            return i(c);
                        }, config);
                    };

                    var self = this;
                    _.each(['post'], function (method) {
                        self[method] = function (url, data, header) {
                            var config = getConfig({
                                method: method.toUpperCase(),
                                url: url,
                                data: data,
                                headers: header
                            });
                            return http(config);
                        };
                    });
                };
                return new SpoonHttpService();
            }];
        }
    });
    mifosX.ng.services.config(function ($provide) {
        $provide.provider('MiddlewareHttpService', mifosX.services.MiddlewareHttpServiceProvider);
    }).run(function ($log) {
        $log.info("Middleware HttpService initialized");
    });
}(mifosX.services || {}));