var request = require('request');

// Uncomment to debug request:
// require('request-debug')(request);

var auth = require('./auth.js');

var getDefaultOptions = () => {
    return {
        requiresAuth: true,
        form: false,
        querystring: false
    };
};

class tvRequest {
    makeRequest(requestDetails, options) {
        var options = Object.assign(getDefaultOptions(), options);

        if(options.form) {
            requestDetails.form = requestDetails.body;

            if(requestDetails.json && requestDetails.body) {
                delete requestDetails.json;
                delete requestDetails.body;
            }
        }


        if(options.requiresAuth) {
            var paramType;
            if(options.querystring || requestDetails.method === 'GET') {
                paramType = 'qs';
            } else {
                paramType = 'body';
            }

            requestDetails[paramType] = requestDetails[paramType] || {};
            requestDetails[paramType].access_token = auth.getAccessToken();
            requestDetails[paramType].user_key = auth.getUserKey();
        }
        

        return new Promise((resolve, reject) => {
            request(requestDetails, (err, res, body) => {

                if(isErrorResponse(res.statusCode)) {
                    reject(res.statusCode)
                }

                if(typeof body === 'object' || options.raw) {
                    resolve(body, res);
                } else if(typeof body === 'string') {
                    resolve(JSON.parse(body));
                } else {
                    resolve('');
                }
            });
        });
    }

    get(url, params, options) {
        var requestDetails = {
            url: __tv_host + url,
            method: 'GET',
            qs: params
        };

        return this.makeRequest(requestDetails, options);
    }

    post(url, params, options) {
        var options = options || {};

        var requestDetails = {
            url: __tv_host + url,
            method: 'POST',
            json: true
        };
        requestDetails[options.querystring ? 'qs' : 'body'] = params;

        return this.makeRequest(requestDetails, options);
    }
}

function isErrorResponse(statusCode) {
    if(statusCode === 0 || statusCode >= 400) {
        return true;
    }
    return false;
}

module.exports = new tvRequest();