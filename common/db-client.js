const { MongoClient } = require('mongodb')
const config = require('../config.json') 

let db
let client

class Mongo{
    static async connect(url=config.DB.db, dbname=config.DB.db_name){
        client = await new MongoClient(url).connect()
        db = client.db(dbname)
        // if (client.isConnected) console.log('MongoDB is running...')
    }

    static async getCollection(collectionName){
        // console.log(`model name: ${collectionName}`)
        if (collectionName){
            return db.collection(collectionName)
        }
        // TODO: handle undefine
    }

    static async checkConnect(){
        return client.isConnected()
    }

    static async disconnect(){
        return client.close()
    }
}

module.exports = Mongo