var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyparser = require('body-parser');
var path = require('path');
var fs = require('fs');

var sqlserver = mysql.createConnection({

    host: 'localhost',
    user: 'root',
    password: '#Rosew00d!',
    database: 'revision'
});

sqlserver.connect(function(error){

    if(error){

        console.log("Failed to connect to mysql server.");
        throw error;
    }
    console.log("Connected to mysql server.");
})

var app = express();
app.use(session({

    secret: 'revision-secret',
    resave: true,
    saveUninitialized: true
}));
app.use(bodyparser.urlencoded({extended: true}));
app.use(bodyparser.json());

app.get('/index.css', function(request, response){

    response.sendFile(path.join(__dirname + "/index.css"));
});
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

app.post('/signup', function(request, response){

    sqlserver.query("INSERT INTO users (email, username, password) VALUES (?, ?, ?)", [request.body.email, request.body.username, request.body.password], function(error, result){

        //response.send("Congradulations, " + request.body.username + ", you have created an account!");
        //response.end();
        request.session.loggedin = true;
        request.session.username = request.body.username;
        response.redirect('/home');
    });
});

app.post('/auth', function(request, response){

    sqlserver.query("SELECT * FROM users WHERE users.email = ? AND users.password = ?", [request.body.email, request.body.password], function(error, results){

        if(results.length > 0){

            request.session.loggedin = true;
            request.session.username = results[0].username;
            response.redirect('/home');
            //response.send("Login successful, " + results[0].username + "!");

        }else{

            response.send("Login incorrect!");
        }
    });
});

app.get('/home.css', function(request, response){

    response.sendFile(path.join(__dirname + "/home.css"));
});
app.get('/res/icofont/icofont.min.css', function(request, response){

    response.sendFile(path.join(__dirname + "/res/icofont/icofont.min.css"));
});
app.get('/res/icofont/fonts/icofont.woff2', function(request, response){

    response.sendFile(path.join(__dirname + "/res/icofont/fonts/icofont.woff2"));
});
app.get('/home.js', function(request, response){

    response.sendFile(path.join(__dirname + "/home.js"));
});
app.get('/home', function(request, response){

    if(!request.session.loggedin){

        response.redirect('/');

    }else{

        var template = fs.readFileSync('home.html');
        var output = template.toString().replace(/USERNAME/gi, request.session.username);
        response.send(output);
        response.end();
    }
});

app.listen(8080);
