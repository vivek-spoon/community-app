(function (module) {
    mifosX.services = _.extend(module, {
        MiddlewareService: function (scope, httpService, middlewareAuthService) {

            this.decipherData = function (cipheredData, userId, callback) {
                if (middlewareAuthService.isAuthenticated()) {
                    var data = {
                        encryptedCredentials: cipheredData,
                        userId: userId
                    };
                    httpService.post("/user/credentials", data, {'Authorization' : middlewareAuthService.getAuthHeader()})
                        .success(callback)
                        .error(callback);
                } else {
                    middlewareAuthService.authenticate();
                }
            }
        }
    });
    mifosX.ng.services.service('MiddlewareService', ['$rootScope', 'MiddlewareHttpService', 'MiddlewareAuthService', mifosX.services.MiddlewareService]).run(function ($log) {
        $log.info("Middleware Service initialized");
    });
}(mifosX.services || {}));