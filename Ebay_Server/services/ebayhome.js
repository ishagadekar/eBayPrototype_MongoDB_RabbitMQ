var Crypto = require("crypto");
var logger = require('./logger');
var bidlogger = require('./bidlogger');
var mongo = require("./mongo");
var mongoURL = "mongodb://localhost:27017/ebaydb";
var sequencegenerator = require('./sequencegenerator');

exports.handle_login_request = function(msg, callback) {
	try{
	console.log("In handle request:"+ msg.username);
	var username = msg.username;
	var password = msg.password;
	logger.log("info", "Sign in button clicked by user to check for email id = " + username);
	var json_response;
	
	mongo.connect(mongoURL, function(db) {
		console.log('Connected to mongo at: ' + mongoURL);
		logger.log("info", 'Connected to mongo at: ' + mongoURL);
		
		var coll = db.collection('users');
		coll.findOne({email:username}, function(err, user){
			if(err) {
				logger.log("error", "Error occurred while checking sign in credentials for user with email id = " + username);
				throw err;
			}
			if (user) {
				logger.log("info", "Sign in credentials fetched successfully and email id is valid for user with email id = " + username);
				var salt = "Bl@ckS@1t";
				var encryptedPassword = Crypto.createHash('sha1').update(password + salt).digest('hex');
				if(encryptedPassword === user.password) {
					logger.log("info", "Sign in credentials fetched successfully and are valid for user with email = " + user._id);
					
					json_response = {
							"statuscode" : 200,
							"user" : user
					};
						
					var time = new Date();
					var logintime = time.getFullYear() + "-" + (time.getMonth()+1) + "-"
								+ time.getDate() + " " + time.getHours() + ":" + time.getMinutes()
								+ ":" + time.getSeconds();
					logger.log("info", "Login time to be updated for user with id = " + user._id + " is = " + logintime);
						
					coll.update({'email' : username},{$set:{'logintime': logintime}}, function(err) {
						if (err) {
							logger.log("error", "Error occurred while updating login time for user with email id = " + "username");
							throw err;
						} else {
							logger.log("info", "Login time updated successfully for user with id = " + user._id);
							console.log("Login time updated successfully");
							callback(null, json_response);
						}
					});	
				} else {
					logger.log("info", "Sign in credentials fetched successfully but password is invalid for user with email id = " + username);
					console.log("Invalid username and/or password.");
					json_response = {
						"statuscode" : 401
					};
					callback(null, json_response);
				}
			} else {
				logger.log("info", "Sign in credentials fetched successfully but either email id or password is invalid for user with email id = " + username);
				console.log("Invalid username and/or password.");
				json_response = {
					"statuscode" : 401
				};
				callback(null, json_response);
			}
		});
	});
	}catch(err) {
		console.log("Error occurred : " + err.message);
	}
};

exports.handle_register_request = function(msg, callback) {

	try {
	var username = msg.username;
	logger.log("info", "Register button clicked by user to register for email id = " + username);
	
	var json_responses;
	
	mongo.connect(mongoURL, function(db) {
		console.log('Connected to mongo at: ' + mongoURL);
		logger.log("info", 'Connected to mongo at: ' + mongoURL);
		
		var coll = db.collection('users');
		coll.findOne({email:username}, function(err, user){
			if(err) {
				logger.log("error", "Error occurred while processing query to check if user with email id = " + 
						username + " already exists in DB for checkAndRegisterUser functionality");
				throw err;
			}
			if (user) {
				console.log("User with same email id already exists.");
				logger.log("info", "User with same email id = " + username + " already exists.");
				json_responses = {"statusCode" : 401};
				callback(null, json_responses);
			} else {
				console.log("New user registration.");
				logger.log("info", "Registering user with email id = " + username);
				var salt = "Bl@ckS@1t";
				var encryptedPassword = Crypto.createHash('sha1').update(msg.password + salt).digest('hex');
				var dateTime = 0 + "-" + 0 + "-" + 0 + " " + 0 + ":" + 0 + ":" + 0;

				console.log("Dob : " + msg.dob);
				var time = new Date(msg.dob);
				var dob = time.getFullYear() + "-" + (time.getMonth()+1) + "-"
						+ time.getDate();
				sequencegenerator.getNextSeqNumber("user_id",function(seqId){
				coll.insert({ _id: seqId, firstname: msg.firstname, lastname:msg.lastname,
					email:username,password:encryptedPassword, handle:msg.handle,logintime:dateTime,
					dob:dob, phone:msg.phone, address:msg.address}, function(err, docs){
						console.log("data after insert "+ docs);
					if (err) {
						logger.log("error", "Error occurred while executing query to insert values in users table" +
								"for user with email id = " + username);
						throw err;
					} else {
						logger.log("info", "User with email id = " + username + " has been registered successfully");
						json_responses = {"statusCode" : 200};
						callback(null, json_responses);
					} 
				});
				});
			}
		});
	});
	}catch(err) {
		console.log("Error occurred : " + err.message);
	}
};

exports.getUserData = function(msg, callback) {
	try {
	logger.log("info", "Fetching home page data after home page hit");
	var json_response;

		mongo.connect(mongoURL, function(db) {
			console.log('Connected to mongo at: ' + mongoURL);
			logger.log("info", 'Connected to mongo at: ' + mongoURL);
			
			var coll = db.collection('itemsforsale');
			coll.find({ $query: {$and: [{sellername:{$ne:msg.firstname}},{quantity:{$gt:0}}]}, $orderby: { timestamp : -1 }}).toArray(function(err, results){
				if(err) {
					logger.log("error", "Error occurred while executing query to fetch listings for home page data");
					throw err;
				} else {
					if (results.length > 0) {
					var time = new Date();
					var bidDate = time.getFullYear() + "-" + (time.getMonth()+1) + "-"
					+ time.getDate();
					
					var productsToBeShown = [];
					var closeBids = [];
					
					for(var i = 0; i < results.length; i++) {
						var time1 = new Date(results[i].bidenddate);
						var bidDate1 = time1.getFullYear() + "-" + (time1.getMonth() + 1) + "-"
						+ time1.getDate();
						console.log(bidDate);
						
						if(bidDate1 > bidDate) {
							productsToBeShown.push(results[i]);
						} else if (bidDate1 === bidDate && results[i].sold !== 1) {
							bidlogger.log("info", "Bid end date " + bidDate1 + " for item with id = " + results[i]._id + " has arrived");
							
							var coll1 = db.collection('biduser');
							coll1.find({itemId:results[i]._id}).toArray(function(err, results2){
								if (err) {
									logger.log("error", "Error occurred while executing query to fetch data from biduser table");
									bidlogger.log("error", "Error occurred while executing query to fetch data from biduser table");
									throw err;
								} else {
									var length = results2.length;
									if(length > 0) {
										logger.log("info", "Fetching data from bid users to get highest bidder");
										bidlogger.log("info", "Fetching data from bid users to get highest bidder");
										var stampmonths = new Array( "01","02","03","04","05","06","07","08","09","10","11","12");
										var thedate = new Date();
										var orderId = stampmonths[thedate.getMonth()] + thedate.getDate() + thedate.getFullYear() + thedate.getSeconds();
										console.log("Order Id is : " + orderId);
										
										var time2 = new Date(results2[length-1].biddate);
										var bidDate2 = time2.getFullYear() + "-" + (time2.getMonth()+1) + "-"
										+ time2.getDate() + " " + time2.getHours() + ":" + time2.getMinutes()
										+ ":" + time2.getSeconds();
										bidlogger.log("info", "Highest bidder for item id = " + results2[length-1].itemId + " is user with id = " + results2[length-1].userId);
										
										var coll2 = db.collection('bidwinners');
										coll2.insert({userId:results2[length-1]._id, itemId:results2[length-1].itemId 
										, highestbid: results2[length-1].bidamount, orderId:orderId, datewon:bidDate2}, function(err){
											if (err) {
												logger.log("error", "Error occurred while executing query to insert bid winners");
												bidlogger.log("error", "Error occurred while executing query to insert bid winners");
												throw err;
											} else {
												
												coll.update({_id : results2[length-1].itemId},{$set:{'sold': 1}}, function(err) {
													if (err) {
														logger.log("error", "Error occurred while executing query to update itemsforsale when setting " +
																"sold item");
														bidlogger.log("error", "Error occurred while executing query to update itemsforsale when setting " +
																"sold item");
														throw err;
													} else {
														console.log("Bid queries done successfully");
														logger.log("Bid queries done successfully");
														bidlogger.log("Bid queries done successfully");
													}
												});
											}
											});
										}
									}
								});
						}
					}
			
			console.log("Listings fetched");
			json_response = {
				"statuscode" : 200,
				"listings" : productsToBeShown
			};
				} else {
			console.log("No listings in database");
			logger.log("info", "No items to show on home page listings");
			json_response = {
				"statuscode" : 401,
			};
				}
		}
		callback(null, json_response);
			});
		});
	}catch(err) {
		console.log("Error occurred : " + err.message);
	}
};

exports.getMyEbayDetails = function(msg, callback) {
	try{
	logger.log("info", "User clicked on MyeBay link");
	var json_response = {items:[]};
	var purchasehistory = [];
	var puchaseditems = [];
	var sellhistory = [];
	var sellitems = [];
	
		mongo.connect(mongoURL, function(db) {
			console.log('Connected to mongo at: ' + mongoURL);
			logger.log("info", 'Connected to mongo at: ' + mongoURL);
			
			var coll = db.collection('useractivityhistory');
			coll.find({userId:msg.userId}).toArray(function(err, results){
				if (err) {
					logger.log("error", "Error occurred while executing query to fetch useractivityhistory for user with id = " + msg.userId);
					throw err;
				} else {
					if (results.length > 0) {
						console.log("Purchase history fetched for user with id " + msg.userId);
						logger.log("info", "Purchase history fetched for user with id = " + msg.userId);
						var itemIds = [];
						for(var i = 0; i < results.length; i++) {
							itemIds[i] = results[i].itemId;
						}
						var coll1 = db.collection('itemsforsale');
						coll1.find({_id:{$in:itemIds}}).toArray(function(err, results1){
							if (err) {
								logger.log("error", "Error occurred while executing query = " + query);
								throw err;
							} else {
								console.log("Items purchased fetched for user with id " + msg.userId);
								logger.log("info", "Items purchased fetched for user with id = " + msg.userId);
								 purchasehistory = results;
								 puchaseditems = results1;
								 json_response.items.push(
											{"purchasehistory" : purchasehistory},
												{"puchaseditems" : puchaseditems}
								 );
							}
						});
					} else {
						console.log("No purchase history found for user with id " + msg.userId);
						logger.log("info", "No purchase history found for user with id = " + msg.userId);
						 purchasehistory = [];
						 puchaseditems = [];
						 json_response.items.push(
													{"purchasehistory" : purchasehistory},
														{"puchaseditems" : puchaseditems}
						 );
					}
					
					var coll2 = db.collection('usersellhistory');
					coll2.find({sellerId:msg.userId}).toArray(function(err, results2){
						if (err) {
							logger.log("error", "Error occurred while executing query = " + query);
							throw err;
						} else {
							if (results2.length > 0) {
								console.log("Sell history fetched for user with id " + msg.userId);
								logger.log("info", "Sell history fetched for user with id = " + msg.userId);
								
								var coll1 = db.collection('itemsforsale');
								var itemIds = [];
								for(var i = 0; i < results2.length; i++) {
									itemIds[i] = results2[i].itemId;
									console.log("Item id : " + itemIds[i]);
								}
								coll1.find({itemId:{$in:itemIds}}).toArray(function(err, results3){
									if (err) {
										logger.log("error", "Error occurred while executing query = " + query);
										throw err;
									} else {
										 console.log("Items sold fetched for use with id " + msg.userId);
										 logger.log("info", "Items sold fetched for use with id = " + msg.userId);
										 
										 sellhistory = results2;
										 sellitems = results3;
										 json_response.items.push(
													 {"sellhistory" : sellhistory},
													 {"sellitems" : sellitems}
												 );
										 callback(null, json_response);
									}
								});
							}  else {
								console.log("No sell history found for use with id " + msg.userId);
								logger.log("info", "No sell history found for use with id = " + msg.userId);
								
								sellhistory = [];
								sellitems = [];
								 json_response.items.push(
										 {"sellhistory" : sellhistory},
										 {"sellitems" : sellitems}
									 );
								 callback(null, json_response);
							}
						}
					});
				}
			});
		});
	}catch(err) {
		console.log("Error occurred : " + err.message);
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
/*exports.redirectToHomepage = function(req,res)
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
};*/
