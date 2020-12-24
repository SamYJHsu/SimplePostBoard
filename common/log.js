const winston = require('winston')
const logger = winston.createLogger({
    transports: [
        // new winston.transports.Console(),
        new winston.transports.File({ filename: 'log/server.log'})
    ]
})
logger.info(`[${new Date().toISOString()}] Logger init`)
class logging{
    static logInfo(info){
        logger.info(`[${new Date().toISOString()}] ${info}`)
    }
    static logResponse(ctx){
        logger.info(`[${new Date().toISOString()}] status: ${ctx.status}`)
        logger.info(`[${new Date().toISOString()}] response: ${JSON.stringify(ctx.body)}`)
    }
    static logError(err){
        logger.error(`[${new Date().toISOString()}] ${err}`)
    }
}
module.exports = logging