const logging = require('./logging').forModule('nerfherder');
const HttpServer =  require('./http');
const AgentCleanup =  require('./cleanup');
const goAgents =  require('./go-agents');

module.exports = function() {
    const httpServer = new HttpServer();
    const agentCleanup = new AgentCleanup();

    return {
        start: () => Promise.all([httpServer.start(), goAgents.start(), agentCleanup.start()])
    };
};
