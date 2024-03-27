'use strict';

const configDev = {
    app: {
        port: process.env.DEV_APP_PORT || 8080,
    },
    db: {
        host: process.env.DEV_DB_HOST || 'localhost',
        port: process.env.DEV_DB_PORT || 27017,
        name: process.env.DEV_DB_NAME || 'dbDev',
    },
};
const configPro = {
    app: {
        port: process.env.PRO_APP_PORT || 8000,
    },
    db: {
        host: process.env.PRO_DB_HOST || 'localhost',
        port: process.env.PRO_DB_PORT || 27017,
        name: process.env.PRO_DB_NAME || 'dbPro',
    },
};

const config = { configDev, configPro };
module.exports = config;
