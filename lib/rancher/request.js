const request = require('request');
const logging = require('../logging').forModule('rancher::get-hosts');
const config = require('../config').get();
const RancherServerError = require('../exceptions').RancherServerError;

module.exports = function rancherRequest(path, options) {
    const rancherHost = config.rancher.host;
    const key = config.rancher.key;
    const secret = config.rancher.secret;
    const usernameAndPassword = `${key}:${secret}`;

    const requestOptions = {
        url: `${rancherHost}${path}`,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Basic ${new Buffer(usernameAndPassword).toString('base64')}`
        }
    };

    if(options) {
        if(options.headers) {
            requestOptions.headers = Object.keys(options.headers).reduce((requestHeaders, headerKey) => {
                requestHeaders[headerKey] = options.headers[headerKey];

                return requestHeaders;
            }, requestOptions.headers);
        }

        ['method', 'body'].forEach(option => {
            if(options[option]) {
                requestOptions[option] = options[option];
            }
        });
    }

    if(options && typeof requestOptions.body === 'object') {
        requestOptions.body = JSON.stringify(options.body);
    }

    return new Promise((resolve, reject) => request(requestOptions, (err, response, data) => {
        if(err) {
            logging.logError('Could not connect to rancher', { host: rancherHost, error: err.message });
            return reject(new Error('Could not contact Rancher server'));
        }

        let parsedData;
        try {
            parsedData = JSON.parse(data);
        }
        catch(e) {
            logging.logError('Rancher returned invalid json', { host: goServer, error: e.message, body: data })
            return reject(new RancherServerError('Rancher returned invalid JSON'));
        }

        return resolve(parsedData);
    }));
}
