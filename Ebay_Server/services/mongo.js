var MongoClient = require('mongodb').MongoClient;


var optionvalues = {
    db:{
        numberOfRetries : 5
    },
    server: {
        auto_reconnect: true,
        poolSize : 30,
        socketOptions: {
            connectTimeoutMS: 500
        }
    },
    replSet: {},
    mongos: {}
};

function CoonectionPool(){}

var connection;

function initializePool(url, callback){
    MongoClient.connect(url, optionvalues, function(err, db) {
        if (err) throw err;

        connection = db;
        connected = true;
        if(callback && typeof(callback) == 'function')
            callback(connection);
    });
    return CoonectionPool;
}

CoonectionPool.initiatePool = initializePool;

function connect(url, callback){
    if(!connection){
        initializePool(url, callback)
    }
    else{
        if(callback && typeof(callback) == 'function')
            callback(connection);
    }
}


CoonectionPool.connect = connect;


module.exports = CoonectionPool;