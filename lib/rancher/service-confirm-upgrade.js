const config = require('../config').get();
const rancherRequest = require('./request');

module.exports = serviceId => {
    return rancherRequest(`/v2-beta/projects/${config.rancher.project}/services/${serviceId}/?action=finishupgrade`, {
            method: 'POST'
        })
        .then(parsedData => Promise.resolve());
};
