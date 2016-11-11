var ejs = require('ejs');
var mq_client = require('../rpc/client');
var logger = require('./logger');

exports.displayCheckout = function(req, res) {
	logger.log("info", "Displaying checkout page for user with id = " + req.session.user._id);
	ejs.renderFile('./views/ebaycheckout.ejs', function(err, result) {
		if (!err) {
			res.end(result);
		} else {
			res.end('An error occurred');
			console.log(err);
		}
	});
};

exports.removecartitems = function(req, res) {
	
	logger.log("info", "Removing cart items for checkout after cart items checkout");
	
	var json_response;

	if (req.session.user) {
		
		logger.log("info", "Removing cart items for user with id = " + req.session.user._id);
		
		var msg_payload = {"userId": req.session.user._id, "cartItems" : req.param("cartItems"), 
				"reqType" : "removecartitems"};
		
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

exports.removeboughtitems = function(req, res) {
	logger.log("info", "Removing bought items for checkout after buy now click");
	var json_response;

	if (req.session.user) {
		
		var quantity = Number(req.param("quantity"));
		var itemId = Number(req.param("itemId"));
		var sellerId = Number(req.param("sellerId"));
		
		var msg_payload = {"userId" : req.session.user._id, "itemId": itemId, "quantity" : quantity, "sellerId" : sellerId,
				"reqType" : "removeboughtitems"};
		
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