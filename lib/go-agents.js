const logging = require('./logging').forModule('go-agents');
const config = require('./config').get();
const rangeCheck = require('range_check');
const getRancherHosts = require('./rancher/hosts');
const getContainersFromRancher = require('./rancher/containers');
const getAgentsFromGo = require('./gocd/agents');
const getServicesByName = require('./rancher/services-query');
const upgradeService = require('./rancher/service-upgrade');

function getDataFromGocdAndRancher() {
    return Promise.all([
        getAgentsFromGo(),
        getContainersFromRancher(),
        getRancherHosts()
    ]);
}

function filterToRancherGoAgents(results) {
    const [goAgents, rancherContainers, rancherHosts] = results;
    const rancherSubnet = config.rancher.subnet || '10.42.0.0/16';
    const rancherHostIps = rancherHosts.map(host => host.agentIpAddress);

    return Promise.resolve({
        dockerAgents: goAgents.filter(agent => rangeCheck.inRange(agent.ip_address, rancherSubnet) || rancherHostIps.includes(agent.ip_address)),
        rancherContainers: rancherContainers
    });
}

function createCombinedModel(agentsAndContainers) {
    const dockerAgents = agentsAndContainers.dockerAgents;
    const rancherContainers = agentsAndContainers.rancherContainers;

    return Promise.resolve(dockerAgents.map(agent => {
        const containers = rancherContainers.filter(container => container.externalId.startsWith(agent.hostname));

        if(!containers.length) {
            return agent;
        }

        agent.container = containers[0];

        return agent;
    }));
}

module.exports = {
    start: () => Promise.resolve(),
    list: () => getDataFromGocdAndRancher()
        .then(filterToRancherGoAgents)
        .then(createCombinedModel),
    upgradeByServiceName: (service, newImage) => getServicesByName(service)
        .then(services => Promise.all(services.map(service => upgradeService(service, newImage)))),
    upgradeByImage: image => Promise.resolve()
};
