
var passport = require("passport");
var mq_client = require('../rpc/client');
var LocalStrategy = require("passport-local").Strategy;
var logger = require('./logger');

module.exports = function(passport) {
    passport.use('login', new LocalStrategy(function(username, password, done) {
    	console.log("In passport.js");
    	 process.nextTick(function () {
    	            var msg_payload = {username : username, password: password};
    	            console.log(msg_payload);
    	            mq_client.make_request('login_queue',msg_payload, function(err, results){
    	                 console.log(results);
    	                if (results.statusCode === 401) {
    	                    done(null, username);
    	                }
    	                else {
    	                    console.log("username in passport.js" + username);
    	                    done(null, results);
    	                }
    	            });

    	        });
    }));
}