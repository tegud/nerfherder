const config = require('../config').get();
const logging = require('../logging').forModule('gocd-disable-agent');
const request = require('request');

const InvalidGoCredentialsError = require('../exceptions').InvalidGoCredentialsError;
const GoServerError = require('../exceptions').GoServerError;

module.exports = uuid => {
    return new Promise((resolve, reject) => {
        const username = config.gocd.username;
        const usernameAndPassword = `${username}:${config.gocd.password}`;
        const goServer = config.gocd.host;

        logging.logInfo('Disabling agent in gocd', {
            host: goServer,
            uuid: uuid
        });

        request({
            url: `${goServer}/go/api/agents/${uuid}`,
            method: 'PATCH',
            headers: {
                "Accept": "application/vnd.go.cd.v4+json",
                "Content-Type": "application/json",
                "Authorization": `Basic ${new Buffer(usernameAndPassword).toString('base64')}`
            },
            body: JSON.stringify({ 'agent_config_state': 'Disabled' })
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

            logging.logInfo('Agent disabled', { host: goServer, uuid: uuid });

            console.log(parsedData);

            resolve();
        });
    })
}
