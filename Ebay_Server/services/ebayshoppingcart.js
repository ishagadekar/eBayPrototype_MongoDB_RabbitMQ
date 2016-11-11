var mongo = require("./mongo");
var mongoURL = "mongodb://localhost:27017/ebaydb";
var sequencegenerator = require('./sequencegenerator');
var logger = require('./logger');

exports.getCartDetails = function(msg, callback) {

	try{
	var json_response;

		logger.log("info", "Shopping cart icon clicked by user. Fetching shopping cart details for user with id = " + msg.userId);
		
		mongo.connect(mongoURL, function(db) {
			console.log('Connected to mongo at: ' + mongoURL);
			logger.log("info", 'Connected to mongo at: ' + mongoURL);
			
			var coll = db.collection('shoppingcart');
			coll.find({userId:msg.userId}).toArray(function(err, results){
				if (err) {
					logger.log("error", "Error occurred while executing query to get from shoppingcart for user with id = " + msg.userId);
					throw err;
				} else {
					if (results.length > 0) {
						logger.log("info", "Shopping cart items fetched successfully for user with id = " + msg.userId);
						var idArray = [];
						var quantities = [];
						for (var i = 0; i < results.length; i++) {
							idArray[i] = (results[i].itemId);
							quantities[i] = (results[i].quantitybought);
						}
						
						var coll1 = db.collection('itemsforsale');
						coll1.find({_id:{$in:idArray}}).toArray(function(err, results){
							if (err) {
								logger.log("error", "Error occurred while executing query to get from itemsforsale");
								throw err;
							} else {
								logger.log("info", "Shopping cart item details fetched successfully for user with id = " + msg.userId);
								for (var i = 0; i < results.length; i++) {
									results[i].quantity = quantities[i];
								}
								json_response = {
									"statuscode" : 200,
									"cartItems" : results
								};
								callback(null, json_response);
							}
						});
					} else {
						logger.log("info", "Shopping cart empty for user with id = " + msg.userId);
						json_response = {
							"statuscode" : 401,
						};
						callback(null, json_response);
					}
				}
			});
		});
	}catch(err) {
		console.log("Error occurred : " + err.message);
	}
};

exports.saveCart = function(msg, callback) {

	try{
	var json_response;

	mongo.connect(mongoURL, function(db) {
		console.log('Connected to mongo at: ' + mongoURL);
		logger.log("info", 'Connected to mongo at: ' + mongoURL);
		
		var coll = db.collection('shoppingcart');
		coll.find({$and : [{userId:msg.userId}, {itemId:msg.itemId}]}).toArray(function(err, results){
		if (err) {
			logger.log("error", "Error occurred while executing query to check if user with id = " + msg.userId + " contains item with id = " 
					+ msg.itemId + " in cart");
			throw err;
		} else {
			if(results.length > 0) {
				logger.log("info", "Updating quantity in user's cart for item with id = " + msg.itemId + 
						" as cart already contains it for user with id = " + msg.userId);
				var quantity = msg.quantity;
				coll.update({$and:[{userId : msg.userId},{itemId:msg.itemId}]},{$inc:{'quantitybought': quantity}}, function(err) {
					if (err) {
						logger.log("error", "Error occurred while executing query to update shoppingcart to add quantitybought = " + msg.quantity);
						throw err;
					} else {
						logger.log("info", "Updating quantity in itemsforsale table for item with id = " + msg.itemId + 
								" to reflect item added to cart for user with id = " + msg.userId);
						
						var coll1 = db.collection('itemsforsale');
						coll1.update({_id : msg.itemId},{$inc:{'quantity': -quantity}}, function(err) {
							if (err) {
								logger.log("error", "Error occurred while executing query to update itemsforsale to subtract quantitybought = " + msg.quantity);
								throw err;
							} else {
								console.log("Query for updating quantity for same cart item executed successfully!");
							}
						});
					}
				});
				
				json_response = {
						"statuscode" : 200,
				};
				callback(null, json_response);
			} else {
				logger.log("info", "Inserting new cart item for user with id = " + msg.userI);
				
				coll.insert({userId:msg.userId, itemId:msg.itemId, quantitybought:msg.quantity}, function(err) {
					if (err) {
						logger.log("error", "Error occurred while executing query to insert new cart item for user with id = " + msg.userId);
						throw err;
					} else {
						var coll1 = db.collection('itemsforsale');
						var quantity = msg.quantity;
						coll1.update({_id : msg.itemId},{$inc:{'quantity': -quantity}}, function(err) {
							if (err) {
								logger.log("error", "Error occurred while executing query itemsforsale to subtract quantitybought = " + msg.quantity);
								throw err;
							} else {
								json_response = {
										"statuscode" : 401
								};
								callback(null, json_response);
							}
						});
					}
				});
			}
		}
		});
	});
	}catch(err) {
		console.log("Error occurred : " + err.message);
	}
};

exports.removeFromCart = function(msg, callback) {

	try{
	var json_response;
	
	logger.log("info", "Remove from cart button clicked by user. Remoing item with id = " + msg.itemId 
			+ " from shopping cart of user with id = " + msg.userId);
	
	mongo.connect(mongoURL, function(db) {
		console.log('Connected to mongo at: ' + mongoURL);
		logger.log("info", 'Connected to mongo at: ' + mongoURL);
		
		var coll = db.collection('shoppingcart');
		coll.remove({itemId:msg.itemId}, function(err){
			if (err) {
				logger.log("error", "Error occurred while executing query = " + query);
				throw err;
			} else {
				logger.log("info", "Updating quantity in itemsforsale table for item with id = " + msg.itemId + 
						" to reflect item removed from cart for user with id = " + msg.userId);
				var quantity = msg.quantity;
				var coll1 = db.collection('itemsforsale');
				coll1.update({_id:msg.itemId},{$inc:{'quantity':quantity}}, function(err) {
					if (err) {
						logger.log("error", "Error occurred while executing query to update itemsforsale to remove cart items");
						throw err;
					} else {
						json_response = {
							"statuscode" : 200
						};
						callback(null, json_response);
					}
				});
			}
		});
	});
	}catch(err) {
		console.log("Error occurred : " + err.message);
	}
};