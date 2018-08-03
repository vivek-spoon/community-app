(function (module) {
    mifosX.services = _.extend(module, {
        MiddlewareAuthService: function (scope, httpService, MIDDLEWARE_SECURITY, localStorageService, timeout) {

            var onLoginFailure = function (data, status) {
                scope.$broadcast("middlewareAuthenticationFailureEvent", data, status);
            };

            var onLoginSuccess = function (data) {
                scope.$broadcast("MiddlewareAuthenticationSuccessEvent", data);
                data.isLoggedIn = true;
                localStorageService.addToLocalStorage('middlewareTokenDetails', data);
                setTimer(data.expires_in);
            }

            var updateAccessDetails = function (data) {
                localStorageService.addToLocalStorage('middlewareTokenDetails', data);
                httpService.setAuthorization(data.access_token);
                setTimer(data.expires_in);
            }

            this.isAuthenticated = function() {
                var data = localStorageService.getFromLocalStorage("middlewareTokenDetails");
                if(data != undefined && data.isLoggedIn) {
                    return true;
                }

                return false;
            }

            var setTimer = function (time) {
                timeout(getAccessToken, time * 1000);
            }

            this.getAuthHeader = function() {
                var data = localStorageService.getFromLocalStorage("middlewareTokenDetails");
                return "bearer " + data.access_token;
            };

            var getAccessToken = function () {
                var refreshToken = localStorageService.getFromLocalStorage("middlewareTokenDetails").refresh_token;
                var data = JSON.parse(MIDDLEWARE_SECURITY);
                var encodedCredentials = "Basic " + btoa(data.clientId + ':' + data.clientSecret);
                httpService.setAuthorization(encodedCredentials, false);
                httpService.post("/oauth/token?&grant_type=refresh_token&refresh_token=" + refreshToken, {}, {'Authorization': encodedCredentials, 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'})
                    .success(updateAccessDetails);
            };

            this.authenticate = function () {
                if(!this.isAuthenticated()) {
                    var data = JSON.parse(MIDDLEWARE_SECURITY);
                    var encodedCredentials = "Basic " + btoa(data.clientId + ':' + data.clientSecret);
                    scope.$broadcast("MiddlewareAuthenticationStartEvent");
                    httpService.post("/oauth/token?username=" + data.username + "&password=" + data.password + "&grant_type=password", {}, {'Authorization': encodedCredentials, 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'})
                        .success(onLoginSuccess)
                        .error(onLoginFailure);
                }
            };

            scope.$on("OnUserPreLogout", function (event) {
                // Remove user data and two-factor access token if present
                localStorageService.removeFromLocalStorage("middlewareTokenDetails");
            });
        }
    });
    mifosX.ng.services.service('MiddlewareAuthService', ['$rootScope', 'MiddlewareHttpService', 'MIDDLEWARE_SECURITY', 'localStorageService', '$timeout', mifosX.services.MiddlewareAuthService]).run(function ($log) {
        $log.info("Middleware AuthenticationService initialized");
    });
}(mifosX.services || {}));