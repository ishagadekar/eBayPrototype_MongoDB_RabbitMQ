var mongo = require("./mongo");
var mongoURL = "mongodb://localhost:27017/ebaydb";
var sequencegenerator = require('./sequencegenerator');

var logger = require('./logger');

exports.removecartitems = function(msg, callback) {
	try {
	logger.log("info", "Removing cart items for checkout after cart items checkout");
	var json_response;

		logger.log("info", "Removing cart items for user with id = " + msg.userId);
		
		mongo.connect(mongoURL, function(db) {
			console.log('Connected to mongo at: ' + mongoURL);
			logger.log("info", 'Connected to mongo at: ' + mongoURL);
			
			var coll = db.collection('shoppingcart');
			coll.remove({userId:msg.userId}, function(err) {
				if (err) {
					logger.log("error", "Error occurred while executing query = " + query);
					throw err;
				} else {
						console.log("Cart items deleted");
						logger.log("info", "Cart items deleted for user with id = " + msg.userId);
						var cartItems = msg.cartItems;
						var time = new Date();
						var date = time.getFullYear() + "-" + (time.getMonth()+1) + "-"
								+ time.getDate();
						console.log("Purchase/Sell date : " + date);
						
						var stampmonths = new Array( "01","02","03","04","05","06","07","08","09","10","11","12");
						var thedate = new Date();
						var orderId = stampmonths[thedate.getMonth()] + thedate.getDate() + thedate.getFullYear() + thedate.getSeconds();
						console.log("Order Id is : " + orderId);
						logger.log("info", "Order id for user with id = " + msg.userId + " is = " + orderId);
						for(var i = 0; i < cartItems.length; i++) {
							logger.log("info", "Inserting cart items into user activity history for user with id = " + msg.userId);
							var coll1 = db.collection('useractivityhistory');
							coll1.insert({orderId:orderId, userId:msg.userId, itemId:cartItems[i]._id, quantitybought:cartItems[i].quantity,
								datepurchased:date}, function(err) {
									if (err) {
										logger.log("error", "Error occurred while executing query to insert into useractivityhistory for " +
												"user with id = " + msg.userId);
										throw err;
									} else {
										logger.log("info", "User activity history updated for user with id = " + msg.userId);
										console.log("Query executed successfully");
										callback(null, json_response);
									}
								});
							
							var coll2 = db.collection('usersellhistory');
							coll2.insert({orderId:orderId, sellerId:cartItems[i].sellerId, itemId:cartItems[i]._id, quantitysold:cartItems[i].quantity,
								datesold:date}, function(err) {
									if (err) {
										logger.log("error", "Error occurred while executing query to insert into usersellhistory for " +
												"user with id = " + msg.userId);
										throw err;
									} else {
										logger.log("info", "Seller's sell history updated");
										console.log("Query executed successfully");
										callback(null, json_response);
									}
								});
						}
						json_response = {
								"statuscode" : 200
							};
						callback(null, json_response);
				}
			});
		});
	}catch(err) {
		console.log("Error occurred : " + err.message);
	}
};

exports.removeboughtitems = function(msg, callback) {
	try {
	logger.log("info", "Removing bought items for checkout after buy now click");
	var json_response;

	mongo.connect(mongoURL, function(db) {
		console.log('Connected to mongo at: ' + mongoURL);
		logger.log("info", 'Connected to mongo at: ' + mongoURL);
		
		var coll = db.collection('itemsforsale');
		var quantity = Number(msg.quantity);
		var itemId = Number(msg.itemId);
		var sellerId = Number(msg.sellerId);
		coll.update({_id : itemId},{$inc:{'quantity': -quantity}}, function(err) {
				if (err) {
					logger.log("error", "Error occurred while executing query to update itemsforsale to remove bought items for " +
							"user with id = " + msg.userId);
					throw err;
				} else {
					console.log("Items for sale updated");
					logger.log("info", "Items for sale updated");
					var time = new Date();
					var date = time.getFullYear() + "-" + (time.getMonth()+1) + "-"
					+ time.getDate();
					
					var stampmonths = new Array( "01","02","03","04","05","06","07","08","09","10","11","12");
					var thedate = new Date();
					var orderId = stampmonths[thedate.getMonth()] + thedate.getDate() + thedate.getFullYear() + thedate.getSeconds();
					console.log("Order Id is : " + orderId);
					logger.log("info", "Order id for user with id = " + msg.userId + " is = " + orderId);
					
					var coll1 = db.collection('useractivityhistory');
					coll1.insert({orderId:orderId, userId:msg.userId, itemId:itemId, quantitybought:quantity,
						datepurchased:date}, function(err) {
							if (err) {
								logger.log("error", "Error occurred while executing query = " + query1);
								throw err;
							} else {
								logger.log("info", "User activity history updated for user with id = " + msg.userId);
								console.log("Query for " + itemId + " executed successfully");
								callback(null, json_response);
							}
					});
					
					var coll2 = db.collection('usersellhistory');
					coll2.insert({orderId:orderId, sellerId:sellerId, itemId:itemId, quantitysold:quantity,
						datesold:date}, function(err) {
							if (err) {
								logger.log("error", "Error occurred while executing query = " + query1);
								throw err;
							} else {
								logger.log("info", "Seller's sell history updated for seller with id = " + sellerId);
								console.log("Query executed successfully");
								callback(null, json_response);
							}
					});
					json_response = {
							"statuscode" : 200
						};
					callback(null, json_response);
				}
			});
	});
	}catch(err) {
		console.log("Error occurred : " + err.message);
	}
};