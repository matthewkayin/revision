//var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyparser = require('body-parser');
var path = require('path');

var app = express();
app.use(session({

    secret: 'revision-secret',
    resave: true,
    saveUninitialized: true
}));
app.use(bodyparser.urlencoded({extended: true}));
app.use(bodyparser.json());

app.get('/', function(request, response){

    response.sendFile(path.join(__dirname + '/index.html'));
});
app.get('/about', function(request, response){

    response.sendFile(path.join(__dirname + '/about.html'));
});
app.get('/login', function(request, response){

    response.sendFile(path.join(__dirname + '/login.html'));
});
app.get('/signup', function(request, response){

    response.sendFile(path.join(__dirname + '/signup.html'));
});

app.listen(8080);
