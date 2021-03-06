const http = require('http');
const app = require('express')();
const logging = require('./logging').forModule('HTTP Server');
const goAgents = require('./go-agents');
const InvalidStateForActionError = require('./exceptions').InvalidStateForActionError;

module.exports = function() {
    const server = http.createServer(app);
    const port = 1234;

    app
        .use((req, res, next) => {
            res.set({
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            });

            next();
        })
        .get('/', (req, res) => res.json({
            name: 'nerfherder',
            description: 'Herding go-agents since 2017',
            usage: []
        }))
        .get('/agents', (req, res) => goAgents.list()
            .then(agents => res.json({
                agents: agents
            })))
        .post('/service/:service([^\/]+)/upgrade', (req, res) => goAgents.upgradeByServiceName(req.params.service, req.query.newImage)
            .then(agents => res.json({
                agents: agents
            }))
            .catch(err => {
                if(err instanceof InvalidStateForActionError) {
                    res.statusCode = 422;
                    res.json({
                        error: err.message
                    });
                }

                res.statusCode = 500;
                res.json({
                    error: err.message
                });
            }))
        .post('/image/:image([^\/]+)/upgrade/', (req, res) => goAgents.upgradeByImage(req.params.image)
            .then(agents => res.json({
                agents: agents
            })));

    return {
        start: () => new Promise(resolve => server.listen(port, () => {
            logging.logInfo('Server listening', { port: port });
            resolve();
        })),
        stop: () => new Promise(resolve => {
            server.close();
            resolve();
        })
    };
};
