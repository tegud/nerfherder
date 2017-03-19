const config = require('../config').get();
const logging = require('../logging').forModule('cleanup');
const goAgents = require('../go-agents');

module.exports = function() {
    const timeBeforeInitialPing = typeof config.cleanup.timeBeforeFirst !== 'undefined' ? config.cleanup.timeBeforeFirst : 30000;
    const timeBetweenPings = typeof config.cleanup.timeBetweenPings !== 'undefined' ? config.cleanup.timeBetweenPings : 300000;

    function ping() {
        goAgents.list().then(allAgents =>{
            const agentWithNoContainer = allAgents.filter(agent => agent.hostname === '2fd23c3ed4fa');

            console.log(agentWithNoContainer);

            logging.logInfo('Ping complete, scheduling next ping', { nextPing: timeBetweenPings });
            setTimeout(ping, timeBetweenPings);
        });
    }

    return {
        start: () => {
            logging.logInfo('Starting up, scheduling first ping', { nextPing: timeBeforeInitialPing });
            setTimeout(ping, timeBeforeInitialPing);
            return Promise.resolve();
        }
    }
};
