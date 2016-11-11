var ejs = require('ejs');
var logger = require('./logger');
var bidlogger = require('./bidlogger');
var mq_client = require('../rpc/client');

exports.displaySignIn = function(req, res) {
	logger.log("info", "Sign in or register link clicked");
	ejs.renderFile('./views/ebayloginregister.ejs', function(err, result) {
		if (!err) {
			res.end(result);
		} else {
			logger.log("error", "Error occurred while displaying sign in or register page");
			res.end('An error occurred');
			console.log(err);
		}
	});
};

exports.displayHome = function(req, res) {
	logger.log("info", "Displaying home page for user with id = " + req.session.user._id);
	ejs.renderFile('./views/ebayhome.ejs', function(err, result) {
		if (!err) {
			res.end(result);
		} else {
			logger.log("error", "Error occurred while displaying home page");
			res.end('An error occurred');
			console.log(err);
		}
	});
};

exports.displaymyebay = function(req, res) {
	if(req.session.user) {
	logger.log("info", "Displaying MyeBay page for user with id = " + req.session.user._id);
	ejs.renderFile('./views/ebaymyebay.ejs', function(err, result) {
		if (!err) {
			res.end(result);
		} else {
			logger.log("error", "Error occurred while displaying MyeBay page");
			res.end('An error occurred');
			console.log(err);
		}
	});
}else {
	res.redirect('/');
}
};

exports.checkSignIn = function(req, res, next) {
	var passport=require('passport');
    require('./passport')(passport);
    console.log(req.body);
    
    var response; 
    
    passport.authenticate('login', function(err, user, info) {
		  
		console.log("In Passport authenticate");
	    if(err) {
	      return next(err);
	    }

	    if(user.statuscode == 401) {
	    	response={"statusCode" : 401};
			res.send(response);	
	    } else {
	    	req.logIn(user, {session:false}, function(err) {
	        if(err) {
	          return next(err);
	        }

	      console.log("USER Details!!!!!!_-------------"+user.user.email + " id : " + user.user._id);
	      req.session.user = user.user;
			console.log(req.session.user);
	      console.log("session initilized");
	      response = {
					"statuscode" : 200,
					"user" : req.session.user
			};
	      res.send(response);	
	    });
	    }
	  })(req, res, next);
}

exports.checkAndRegisterUser = function(req, res) {

	logger.log("info", "Register button clicked by user to register for email id = " + req.param("username"));
	
	var json_response;
	
	var msg_payload = {"username" : req.param("username"), "password" : req.param("password"), "dob" : req.param("dob"),
			"firstname": req.param("firstName"), "lastname":req.param("lastName"), "handle":req.param("handle"),
			"phone":req.param("phone"), "address":req.param("address")};
	
	mq_client.make_request('register_queue',msg_payload, function(err,results){
			console.log(results);
			if(err){
				throw err;
			} else {
				if(results.statusCode == 200){
					console.log("successful registration!");
					res.send(results);
				} else {    
					console.log("Invalid Login");
					res.send(results);
				}
			}  
		});
};

exports.getUserData = function(req, res) {
	logger.log("info", "Fetching home page data after home page hit");
	
	var json_response;

	if (req.session.user) {

		var msg_payload = {"firstname": req.session.user.firstname, "reqType": "getUserData"};
		
		mq_client.make_request('userdata_queue',msg_payload, function(err,results){
			console.log(results);
			if(err){
				throw err;
			} else {
				if(results.statuscode === 200) {
					json_response = {
							"statuscode" : 200,
							"sessionuser" : req.session.user,
							"listings" : results.listings	
					};
				} else if(results.statuscode === 401) {
					json_response = {
							"statuscode" : 401,
							"sessionuser" : req.session.user,
					};
				}
					res.send(json_response);
			}  
		});
		
	} else {
		res.redirect('/');
	}
};

exports.getMyEbayDetails = function(req, res) {
	logger.log("info", "User clicked on MyeBay link");
	var json_response = {items:[]};
	var purchasehistory = [];
	var puchaseditems = [];
	var sellhistory = [];
	var sellitems = [];
	
	if (req.session.user) {
		
	var msg_payload = {"userId": req.session.user._id, "reqType": "getMyEbayDetails"};
		
		mq_client.make_request('userdata_queue',msg_payload, function(err,results){
			console.log(results);
			if(err){
				throw err;
			} else {
					json_response = {
							"user" : req.session.user,
							"items" : results.items
					};
					res.send(json_response);
			}  
		});
	} else {
		res.redirect('/');
	}
};

/*exports.getsummary = function(req, res) {

	var json_response;

	var query = "select * from users where email='" + req.param("username")
			+ "'";// and password='" + req.param("password") + "'";
	console.log("Query is : " + query);
	logger.log("info", "Executing query = " + query);

	mysql.fetchData2(function(err, results) {
		if (err) {
			throw err;
		} else {
			if (results.length > 0) {
				var salt = "Bl@ckS@1t";
				var encryptedPassword = Crypto.createHash('sha1').update(req.param("password") + salt).digest('hex');
//				var passwordhash = crypto.createDecipher("aes192",
//						results[0].password);
				if (encryptedPassword === results[0].password) {
					console.log("Valid login.");
					
					req.session.user = results[0];
					json_response = {
						"statuscode" : 200,
						"user" : req.session.user
					};
					
					var time = new Date();
					var logintime = time.getFullYear() + "-" + (time.getMonth()+1) + "-"
							+ time.getDate() + " " + time.getHours() + ":" + time.getMinutes()
							+ ":" + time.getSeconds();
					console.log(logintime);
					
					var query1 = "update users set logintime='" + logintime + "' where email='" + req.param("username")
									+ "'";
				console.log("Query is : " + query1);
				mysql.fetchData2(function(err, results) {
					if (err) {
						throw err;
					} else {
						console.log("Login time updated successfully");
						res.send(json_response);
					}
				}, query1);
					
				
				} else {
					console.log("Invalid username and/or password.");
					json_response = {
						"statuscode" : 401
					};
					res.send(json_response);
				}
			} else {
				console.log("Invalid username and/or password.");
				json_response = {
					"statuscode" : 401
				};
				res.send(json_response);
			}
		}
	}, query);

};

*/

//Redirects to the homepage
exports.redirectToHomepage = function(req,res)
{
	//Checks before redirecting whether the session is valid
	if(req.session.user)
	{
		//Set these headers to notify the browser not to maintain any cache for the page being loaded
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		res.render("./views/ebayhome.ejs");
	}
	else
	{
		res.redirect('/');
	}
};

exports.signout = function(req, res) {
	logger.log("info", "User with username = " + req.session.user.email + " has been signed out successfully");
	req.session.destroy();
	console.log("Session destroyed");
	res.redirect('/');
};
