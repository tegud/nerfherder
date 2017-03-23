const request = require('request');
const logging = require('../logging').forModule('gocd::agents');
const config = require('../config').get();

const InvalidGoCredentialsError = require('../exceptions').InvalidGoCredentialsError;
const GoServerError = require('../exceptions').GoServerError;

module.exports = () => new Promise((resolve, reject) => {
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

        logging.logDebug('GOCD returned valid agent list', { host: goServer, agents: parsedData._embedded.agents.length })
        resolve(parsedData._embedded.agents.map(agent => Object.keys(agent).reduce((agentWithWhiteListedProperties, property) => {
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
});
