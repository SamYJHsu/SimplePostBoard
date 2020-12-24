const http = require('http');
const init = require('./common/api-init');
const app = require('./app');
const logger = require('./common/log')
const config = require('./config.json')

async function main() {
    await init.init()
    const core = http.createServer(app.callback());
    core.listen(config.server.port)
    logger.logInfo(`server listen on port: ${config.server.port}`)
}

main().catch(ex => logger.logError(`server error: ${ex}`));