var mongo = require("./mongo");
var mongoURL = "mongodb://localhost:27017/ebaydb";
var sequencegenerator = require('./sequencegenerator');
var logger = require('./logger');
var bidlogger = require('./bidlogger');

exports.createList = function(msg, callback) {
	try{
		console.log("msg.itemhandlingtime : " + msg.itemhandlingtime);
		var handlingTimeRegex = new RegExp("^[0-9]{1}$");
		if(!handlingTimeRegex.test(msg.itemhandlingtime)) {
			throw "Incorrect value for item handling time";
		}
		if(msg.quantity < 0) {
			throw "Incorrect value for quantity. Quantity should be greater than zero.";
		}
	var json_response;
	var bidenddate;

	logger.log("info", "Create listing button clicked by user with id = " + msg.sellerId);
	
	var time = new Date();
	var dateTime = time.getFullYear() + "-" + (time.getMonth()+1) + "-"
			+ time.getDate() + " " + time.getHours() + ":" + time.getMinutes()
			+ ":" + time.getSeconds();
	
	if(msg.isbidproduct === 1) {
		var date = new Date(time.getTime() + 4*24*60*60*1000);
		bidenddate = date.getFullYear() + "-" + (date.getMonth()+1) + "-"
		+ date.getDate();
		logger.log("info", "Listing to be created is a bid product for user with id = " + msg.sellerId + 
				" with bid end date = " + bidenddate);
		bidlogger.log("info", "Listing to be created is a bid product for user with id = " + msg.sellerId + 
				" with bid end date = " + bidenddate);
	} else {
		bidenddate = '0000-00-00';
	}
	
	mongo.connect(mongoURL, function(db) {
		console.log('Connected to mongo at: ' + mongoURL);
		logger.log("info", 'Connected to mongo at: ' + mongoURL);
		
		sequencegenerator.getNextSeqNumber("id",function(seqId){
			var coll = db.collection('itemsforsale');
			coll.insert({_id:seqId, sellerId:msg.sellerId, itemname: msg.itemname,
				itemdescription: msg.itemdescription, sellername: msg.sellername,
				selleraddress:msg.selleraddress, itemprice:msg.itemprice, quantity:msg.quantity,
				timestamp:dateTime, isbidproduct:msg.isbidproduct, bidenddate:bidenddate}, function(err, docs) {
					if (err) {
						logger.log("error", "Error occurred while executing query to insert into itemsforsale");
						throw err;
					} else {
						logger.log("info", "Listing created for for user with id = " + msg.sellerId);
						if(msg.isbidproduct == 1) {
							bidlogger.log("info", "Listing for bidding created for for user with id = " + msg.sellerId);
						}
						json_response = {
							"statuscode" : 200
						};
						callback(null, json_response);
				}
			});
		});
	});
	}catch(err) {
		console.log("Error occurred : " + err);
	}
};

exports.getListingDetails = function(msg, callback) {
	try{
	var json_response;

	logger.log("info", "Fetching listing details for item with id = " + msg.itemId + " for user with id = " + msg.userId);
	
	mongo.connect(mongoURL, function(db) {
		console.log('Connected to mongo at: ' + mongoURL);
		logger.log("info", 'Connected to mongo at: ' + mongoURL);
		
		var coll = db.collection('itemsforsale');
		coll.find({_id:msg.itemId}).toArray(function(err, results){
			if (err) {
				logger.log("error", "Error occurred while executing query = " + query);
				throw err;
			} else {
				logger.log("info", "Listing details for item with id = " + msg.itemId + " for user with id = " + msg.userId
						+ " fetched successfully");
				json_response = {
						"statuscode" : 200,
						"listingitem" : results[0]
				};
				callback(null, json_response);
			}
		});
	});
	}catch(err) {
		console.log("Error occurred : " + err.message);
	}
};

exports.bidproduct = function(msg, callback) {

	try{
	var json_response;

		logger.log("info", "Bid product button clicked for item id = " + msg.itemId + " by user with id = " + msg.userId);
		bidlogger.log("info", "Bid product button clicked for item id = " + msg.itemId + " by user with id = " + msg.userId);
		
		var time = new Date();
		var bidDate = time.getFullYear() + "-" + (time.getMonth()+1) + "-"
		+ time.getDate() + " " + time.getHours() + ":" + time.getMinutes()
		+ ":" + time.getSeconds();

		mongo.connect(mongoURL, function(db) {
			console.log('Connected to mongo at: ' + mongoURL);
			logger.log("info", 'Connected to mongo at: ' + mongoURL);
			var amount = msg.bidamount;
			var coll = db.collection('biduser');
			coll.insert({userId:msg.userId, itemId:msg.itemId, bidamount:amount,
				biddate:bidDate}, function(err) {
					if (err) {
						logger.log("error", "Error occurred while executing query = " + query);
						bidlogger.log("error", "Error occurred while executing query = " + query);
						throw err;
					} else {
						logger.log("info", "Bid amount of " + msg.bidamount + " for item id = " + msg.itemId
								+ " entered in DB for user with id = " + msg.userId);
						bidlogger.log("info", "Bid amount of " + msg.bidamount + " for item id = " + msg.itemId
								+ " entered in DB for user with id = " + msg.userId);
						
						var coll1 = db.collection('itemsforsale');
						coll1.update({_id:msg.itemId}, {$set : {itemprice:amount}}, function(err) {
							if (err) {
								logger.log("error", "Error occurred while executing query = " + query1);
								bidlogger.log("error", "Error occurred while executing query = " + query1);
								throw err;
							} else {
								logger.log("info", "Bid amount entered in DB successully for user with id = " + msg.userId);
								bidlogger.log("info", "Bid amount entered in DB successully for user with id = " + msg.userId);
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