'use strict';

const mongoose = require('mongoose');
const { configDev } = require('../configs/config.mongodb');

class Database {
    constructor() {
        this.connect();
    }

    connect(type = 'mongodb') {
        if (1 === 1) {
            mongoose.set('debug', true);
            mongoose.set('debug', { color: true });
        }
        mongoose
            .connect(`mongodb://${configDev.db.host}:${configDev.db.port}/${configDev.db.name}`)
            .then((_) => console.log(`Connect Database__${configDev.db.name} successfully `))
            .catch((err) => console.log('Error connect'));
    }

    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
}

const instanceMongodb = Database.getInstance();
module.exports = instanceMongodb;
