const request = require('request');
const logging = require('./logging').forModule('go-agents');
const config = require('./config').get();
const rangeCheck = require('range_check');

const InvalidGoCredentialsError = require('./exceptions').InvalidGoCredentialsError;
const GoServerError = require('./exceptions').GoServerError;

function getContainersFromRancher() {
    const rancherHost = config.rancher.host;
    const key = config.rancher.key;
    const secret = config.rancher.secret;
    const usernameAndPassword = `${key}:${secret}`;

    return new Promise((resolve, reject) => {
        request({
            url: `${rancherHost}/v2-beta/projects/1a1453/containers`,
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
                return reject(new GoServerError('Rancher returned invalid JSON'));
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
}

function getAgentsFromGo() {
    return new Promise((resolve, reject) => {
        const rancherSubnet = config.rancher.subnet || '10.42.0.0/16';
        const username = config.gocd.username;
        const usernameAndPassword = `${username}:${config.gocd.password}`;
        const goServer = config.gocd.host;

        logging.logDebug('Retrieving agent list from gocd', {
            host: goServer
        });

        request({
            url: `${goServer}/go/api/agents`,
            headers: {
                "Accept": "application/vnd.go.cd.v4+json",
                'Authorization': `Basic ${new Buffer(usernameAndPassword).toString('base64')}`
            }
        }, (err, response, data) => {
            if(err) {
                logging.logError('Could not connect to GOCD server', { host:goServer, error: err.message });
                return reject(new Error('Could not contact GOCD server'));
            }

            if(response.statusCode === 401) {
                logging.logError('Supplied credentials were invalid', { host: goServer, username: username });
                return reject(new InvalidGoCredentialsError());
            }

            if(response.statusCode === 500) {
                logging.logError('GOCD returned server error', { host: goServer, body: data })
                return reject(new GoServerError('GOCD returned a 500 status code'));
            }

            let parsedData;
            try {
                parsedData = JSON.parse(data);
            }
            catch(e) {
                logging.logError('GOCD returned invalid json', { host: goServer, error: e.message, body: data })
                return reject(new GoServerError('GOCD returned invalid JSON'));
            }

            const dockerAgents = parsedData._embedded.agents.filter(agent => rangeCheck.inRange(agent.ip_address, rancherSubnet));

            logging.logDebug('GOCD returned valid agent list', { host: goServer, allAgentsCount: parsedData._embedded.agents.length, dockerAgentCount: dockerAgents.length })
            resolve(dockerAgents.map(agent => Object.keys(agent).reduce((agentWithWhiteListedProperties, property) => {
                if([
                    "uuid",
                    "hostname",
                    "ip_address",
                    "sandbox",
                    "operating_system",
                    "free_space",
                    "agent_config_state",
                    "agent_state",
                    "resources",
                    "environments",
                    "build_state"
                ].includes(property)) {
                    agentWithWhiteListedProperties[property] = agent[property];
                }

                return agentWithWhiteListedProperties;
            }, {})));
        });
    })
}

module.exports = {
    start: () => Promise.resolve(),
    list: () => Promise.all([
        getAgentsFromGo(),
        getContainersFromRancher()
    ])
        .then(results => {
            const [goAgents, rancherContainers] = results;

            return Promise.resolve(goAgents.map(agent => {
                const containers = rancherContainers.filter(container => container.externalId.startsWith(agent.hostname));

                if(!containers.length) {
                    return agent;
                }

                agent.container = containers[0];

                return agent;
            }));
        })
};
