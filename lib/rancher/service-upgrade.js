const config = require('../config').get();
const rancherRequest = require('./request');

module.exports = (service, newImage) => {
    service.launchConfig.imageUuid = `docker:${newImage}`;
    return rancherRequest(`/v2-beta/projects/${config.rancher.project}/services/${service.id}/?action=upgrade`, {
            method: 'POST',
            body: {
                "inServiceStrategy": {
                    launchConfig: service.launchConfig,
                    secondaryLaunchConfig: []
                }
            }
        })
        .then(parsedData => Promise.resolve(console.log(parsedData)));
};
