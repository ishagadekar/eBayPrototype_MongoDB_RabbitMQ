var ebayHome = require('./ebayhome');
var ebaySell = require('./ebaysell');
var ebayShoppingCart = require('./ebayshoppingcart');
var ebayCheckout = require('./ebaycheckout');

exports.handle_request = function(message, callback) {
    console.log("In handle_request "+ message.reqType);
    if(message.reqType === "getUserData"){
    	ebayHome.getUserData(message, callback);
    } 
    if(message.reqType === "getMyEbayDetails"){
    	ebayHome.getMyEbayDetails(message, callback);
    } 
    if(message.reqType === "createList"){
    	ebaySell.createList(message, callback);
    } 
    if(message.reqType === "getListingDetails"){
    	ebaySell.getListingDetails(message, callback);
    } 
    if(message.reqType === "bidproduct"){
    	ebaySell.bidproduct(message, callback);
    } 
    if(message.reqType === "getCartDetails"){
    	ebayShoppingCart.getCartDetails(message, callback);
    }
    if(message.reqType === "saveCart"){
    	ebayShoppingCart.saveCart(message, callback);
    }
    if(message.reqType === "removeFromCart"){
    	ebayShoppingCart.removeFromCart(message, callback);
    }
    if(message.reqType === "removecartitems"){
    	ebayCheckout.removecartitems(message, callback);
    }
    if(message.reqType === "removeboughtitems"){
    	ebayCheckout.removeboughtitems(message, callback);
    }
};