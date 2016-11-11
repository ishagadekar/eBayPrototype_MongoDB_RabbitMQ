var ejs = require('ejs');
var mq_client = require('../rpc/client');
var logger = require('./logger');
var bidlogger = require('./bidlogger');

exports.displaySellerPage = function(req, res) {
	if(req.session.user) {
	logger.log("info", "Displaying seller home page for user with id = " + req.session.user._id);
	ejs.renderFile('./views/ebaysellerhome.ejs', function(err, result) {
		if (!err) {
			res.end(result);
		} else {
			logger.log("error", "Error occurred while displaying seller home page");
			res.end('An error occurred');
			console.log(err);
		}
	});
	} else {
		res.redirect('/');
	}
};

exports.displayListing = function(req, res) {
	logger.log("info", "Displaying listing page for user with id = " + req.session.user._id);
	ejs.renderFile('./views/ebaylisting.ejs', function(err, result) {
		if (!err) {
			res.end(result);
		} else {
			logger.log("error", "Error occurred while displaying listing page");
			res.end('An error occurred');
			console.log(err);
		}
	});
};

exports.createList = function(req, res) {
	var json_response;
	var bidenddate;
	
	if (req.session.user) {
	
	var msg_payload = {"itemhandlingtime":req.param("itemhandlingtime"),"sellerId" : req.session.user._id, "itemname":req.param("itemname"), "itemdescription":req.param("itemdescription"),
			"sellername":req.session.user.firstname, "selleraddress":req.param("itemaddress"), "itemprice":req.param("itemprice"),
			"quantity":req.param("itemquantity"), "isbidproduct":req.param("isbidproduct"), "reqType" : "createList"};
		
	logger.log("info", "Create listing button clicked by user with id = " + req.session.user._id);
	mq_client.make_request('userdata_queue',msg_payload, function(err,results){
		console.log(results);
		if(err){
			throw err;
		} else {
				res.send(results);
		}  
	});
	} else {
		res.redirect('/');
	}
};

exports.getListingDetails = function(req, res) {
	var json_response;

	if (req.session.user) {
	logger.log("info", "Fetching listing details for item with id = " + req.param("itemId") + " for user with id = " + req.session.user._id);
	
	var msg_payload = {"itemId" : req.param("itemId"), "userId": req.session.user._id, "reqType" : "getListingDetails"};
		
	logger.log("info", "Create listing button clicked by user with id = " + req.session.user._id);
	
	mq_client.make_request('userdata_queue',msg_payload, function(err,results){
		console.log(results);
		if(err){
			throw err;
		} else {
			json_response = {
					"statuscode" : 200,
					"sessionuser" : req.session.user,
					"listingitem" : results.listingitem
			};
			res.send(json_response);
		}  
	});
	} else {
		res.redirect('/');
	}

};

exports.bidproduct = function(req, res) {

	var json_response;

	if (req.session.user) {
		
		logger.log("info", "Bid product button clicked for item id = " + req.param("itemId") + " by user with id = " + req.session.user.user_id);
		bidlogger.log("info", "Bid product button clicked for item id = " + req.param("itemId") + " by user with id = " + req.session.user.user_id);
		
		var amount = Number(req.param("bidamount"));
		
		var msg_payload = {"itemId" : req.param("itemId"), "userId": req.session.user._id, "bidamount" : amount, "reqType" : "bidproduct"};
		
		logger.log("info", "Create listing button clicked by user with id = " + req.session.user._id);
		
		mq_client.make_request('userdata_queue', msg_payload, function(err,results){
			console.log(results);
			if(err){
				throw err;
			} else {
				res.send(results);
			}  
		});
	} else {
		res.redirect('/');
	}

};