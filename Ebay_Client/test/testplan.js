var request = require('request')
, express = require('express')
,assert = require('chai').assert
,http = require("http");

describe('http tests', function(){

	it('Register page error if user registers with already existing username', function(done){
		request.post('http://localhost:3000/registerUser', {form: { firstname:'Isha', lastname: 'Gadekar',
			username: 'ishagadekar@gmail.com',password:'12345',address:'San Jose', dob:'1991-6-4', phone:'888-444-5471', handle:'i' } }, function(error, response, body) {
			assert.equal(401, JSON.parse(response.body).statusCode);
			done();
		})
	});

	it('Login page error if user logs in with incorrect credentials', function(done) {
		request.post(
			    'http://localhost:3000/checkSignIn',
			    { form: { username: 'ishagadekar123@gmail.com',password:'1234555' } },
			    function (error, response, body) {
			    	assert.equal(401, JSON.parse(response.body).statusCode);
			    	done();
			    }
			);
	  });
	
	it('Should not display the My Ebay page without logging in', function(done){
		http.get('http://localhost:3000/myebay', function(res) {
			assert.equal(302, res.statusCode);
			done();
		})
	});
	

	it('Should not return the eBay site main page if the url is wrong', function(done){
		http.get('http://localhost:3000/ebayhome', function(res) {
			assert.equal(404, res.statusCode);
			done();
		})
	});
	
	it('Home page should be displayed after successful login', function(done){
		request.post(
			    'http://localhost:3000/checkSignIn',
			    { form: {username:'ishagadekar@gmail.com',password:'12345'} },
			    function (error, response, body) {
					http.get('http://localhost:3000/home', function(res) {
						assert.equal(200, JSON.parse(response.body).statusCode);
					});
			    	done();
			    }
			);
	});
	
});