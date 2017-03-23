const request = require('request');
const logging = require('../logging').forModule('rancher::get-containers');
const config = require('../config').get();
const RancherServerError = require('../exceptions').RancherServerError;

module.exports = () => {
    const rancherHost = config.rancher.host;
    const key = config.rancher.key;
    const secret = config.rancher.secret;
    const usernameAndPassword = `${key}:${secret}`;

    return new Promise((resolve, reject) => {
        request({
            url: `${rancherHost}/v2-beta/projects/${config.rancher.project}/containers`,
            headers: {
                'Accept': 'application/json',
                'Authorization': `Basic ${new Buffer(usernameAndPassword).toString('base64')}`
            }
        }, (err, response, data) => {
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

            return resolve(parsedData.data.map(container => Object.keys(container).reduce((mappedContainer, property) => {
                if([
                    'id',
                    'type',
                    'name',
                    'state',
                    'accountId',
                    'created',
                    'externalId',
                    'imageUuid',
                    'labels',
                    'primayIpAddress',
                    'hostId',
                    'healthState',
                    'serviceIds',
                    'uuid'
                ].includes(property)) {
                    mappedContainer[property] = container[property];
                }

                return mappedContainer;
            }, {})));
        });
    });
};
