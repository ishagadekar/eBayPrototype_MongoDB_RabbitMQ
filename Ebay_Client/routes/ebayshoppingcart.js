var ejs = require('ejs');
var logger = require('./logger');
var mq_client = require('../rpc/client');

exports.displayShoppingCart = function(req, res) {
	ejs.renderFile('./views/ebayshoppingcart.ejs', function(err, result) {
		if (!err) {
			logger.log("info", "Displaying shopping cart page for user with id = " + req.session.user.user_id);
			res.end(result);
		} else {
			logger.log("error", "Error occurred while displaying shopping cart page");
			res.end('An error occurred');
			console.log(err);
		}
	});
};

exports.getCartDetails = function(req, res) {

	var json_response;

	if (req.session.user) {
		logger.log("info", "Shopping cart icon clicked by user. Fetching shopping cart details for user with id = " + req.session.user._id);
		
		var msg_payload = {"userId": req.session.user._id, "reqType" : "getCartDetails"};
		
		mq_client.make_request('userdata_queue', msg_payload, function(err,results){
			console.log(results);
			if(err){
				throw err;
			} else {
				if(results.statuscode === 200) {
					json_response = {
							"statuscode" : 200,
							"user" : req.session.user,
							"cartItems" : results.cartItems
					};
				} else if(results.statuscode === 401) {
					json_response = {
							"statuscode" : 401,
							"user" : req.session.user
					};
				}
				res.send(json_response);
			}  
		});
	} else {
		res.redirect('/');
	}

};

exports.saveCart = function(req, res) {

	var json_response;

	if (req.session.user) {
		
		var msg_payload = {"userId": req.param("userId"), "itemId" : req.param("itemId"), "quantity" : req.param("quantityBought"), 
				"reqType" : "saveCart"};
		
		mq_client.make_request('userdata_queue', msg_payload, function(err,results){
			console.log(results);
			if(err){
				throw err;
			} else {
				if(results.statuscode === 200) {
					json_response = {
							"statuscode" : 200,
							"user" : req.session.user,
					};
				} else if(results.statuscode === 401) {
					json_response = {
							"statuscode" : 401
					};
				}
				res.send(json_response);
			}  
		});
	} else {
		res.redirect('/');
	}
	
};

exports.removeFromCart = function(req, res) {

	var json_response;
	
	if (req.session.user) {
	logger.log("info", "Remove from cart button clicked by user. Remoing item with id = " + req.param("itemId") 
			+ " from shopping cart of user with id = " + req.session.user._id);
	
	var msg_payload = {"userId": req.session.user._id, "itemId" : req.param("itemId"), "quantity" : req.param("quantityBought"), 
			"reqType" : "removeFromCart"};
	
	mq_client.make_request('userdata_queue', msg_payload, function(err,results){
		console.log(results);
		if(err){
			throw err;
		} else {
			res.send(results);
		}  
	});
	}else {
		res.redirect('/');
	}
};