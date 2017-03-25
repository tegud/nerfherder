const config = require('../config').get();
const rancherRequest = require('./request');

module.exports = serviceName => {
    return rancherRequest(`/v2-beta/projects/1a1453/services/?name=${serviceName}`)
        .then(parsedData => Promise.resolve(parsedData.data.map(host => Object.keys(host).reduce((mappedHost, property) => {
            if([
                "id",
                "name",
                "state",
                "created",
                "currentScale",
                "scale",
                "instanceIds",
                "launchConfig",
                "stackId",
                "uuid"
            ].includes(property)) {
                mappedHost[property] = host[property];
            }

            return mappedHost;
        }, {}))));
};
