const config = require('../config').get();
const logging = require('../logging').forModule('cleanup');
const goAgents = require('../go-agents');
const disableGoAgent = require('../gocd/disable-agent');
const deleteGoAgent = require('../gocd/delete-agent');

module.exports = function() {
    const timeBeforeInitialPing = typeof config.cleanup.timeBeforeFirst !== 'undefined' ? config.cleanup.timeBeforeFirst : 30000;
    const timeBetweenPings = typeof config.cleanup.timeBetweenPings !== 'undefined' ? config.cleanup.timeBetweenPings : 300000;

    function ping() {
        goAgents.list().then(allAgents =>{
            const agentWithNoContainer = allAgents.filter(agent => agent.agent_state === 'LostContact');

            logging.logInfo('Agents to cleanup', { numberOfAgentsToDelete: agentWithNoContainer.length });

            Promise.all(agentWithNoContainer.map(agent => disableGoAgent(agent.uuid)
                .then(() => deleteGoAgent(agent.uuid))))
                .then(() => {
                    logging.logInfo('Ping complete, scheduling next ping', { nextPing: timeBetweenPings });
                    setTimeout(ping, timeBetweenPings);
                });
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
