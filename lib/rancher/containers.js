const config = require('../config').get();
const rancherRequest = require('./request');

module.exports = () => {
    return rancherRequest(`/v2-beta/projects/${config.rancher.project}/containers`)
        .then(parsedData => Promise.resolve(parsedData.data.map(container => Object.keys(container).reduce((mappedContainer, property) => {
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
        }, {}))));
};
