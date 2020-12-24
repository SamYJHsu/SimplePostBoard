const Mongo = require('./db-client')
const config = require('../config')
const logger = require('./log')

class Init{
    static async init(){
        logger.logInfo('MongoDB connecting...')
        await Mongo.connect(config.DB.db, config.DB.db_name)
        let connectStatus = await Mongo.checkConnect()
        logger.logInfo(`MongoDB connecting >> ${connectStatus}`)
    }
}
module.exports = Init