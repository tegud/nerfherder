const config = require('../config').get();
const rancherRequest = require('./request');

module.exports = () => {
    return rancherRequest(`/v2-beta/projects/${config.rancher.project}/hosts`)
        .then(parsedData => Promise.resolve(parsedData.data.map(host => Object.keys(host).reduce((mappedHost, property) => {
            if([
                'id',
                'type',
                'agentIpAddress',
                'hostname',
                'labels',
                'physicalHostId',
                'publicEndpoints',
                'uuid'
            ].includes(property)) {
                mappedHost[property] = host[property];
            }

            return mappedHost;
        }, {}))));
};
