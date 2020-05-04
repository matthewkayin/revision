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

    });
    sqlserver.query("SELECT * FROM users WHERE users.email = ? AND users.password = ?", [request.body.email, request.body.password], function(error, results){

        if(results.length > 0){

            request.session.loggedin = true;
            request.session.userid = results[0].userid;
            response.redirect('/home');

        }else{

            response.send("Signup failed!");
        }
    });
});

app.post('/auth', function(request, response){

    sqlserver.query("SELECT * FROM users WHERE users.email = ? AND users.password = ?", [request.body.email, request.body.password], function(error, results){

        if(results.length > 0){

            request.session.loggedin = true;
            request.session.userid = results[0].userid;
            response.redirect('/home');

        }else{

            response.send("Login incorrect!");
        }
    });
});

app.get('/home.css', function(request, response){

    response.sendFile(path.join(__dirname + "/home.css"));
});
app.get('/res/fontello/font/fontello.woff2', function(request, response){

    response.sendFile(path.join(__dirname + "/res/fontello/font/fontello.woff2"));
});
app.get('/home.js', function(request, response){

    response.sendFile(path.join(__dirname + "/home.js"));
});
app.get('/home', function(request, response){

    if(!request.session.loggedin){

        response.redirect('/');

    }else{

        var template = fs.readFileSync('home.html');
        var content = fs.readFileSync('new_button.html');
        var post_template = fs.readFileSync('post_template.html');
        var output = template.toString().replace(/PAGETITLE/gi, "Write");
        var post_content = content.toString();
        sqlserver.query("SELECT title, content, username FROM posts, users WHERE users.userid = ? AND users.userid = posts.userid", [request.session.userid], function(error, results){

            if(error){

                throw error;
            }
            for(var i = 0; i < results.length; i++){

                var new_post = post_template.toString().replace(/IS_FIRST/gi, "");
                new_post = new_post.toString().replace(/POSTTITLE/gi, results[i].title);
                new_post = new_post.toString().replace(/POSTAUTHOR/gi, results[i].username);
                new_post = new_post.toString().replace(/POSTCONTENT/gi, results[i].content);
                new_post = new_post.toString().replace(/POSTINFO/gi, "First revision.");
                new_post = new_post.toString().replace(/LIKES/gi, "0");
                post_content += new_post;
            }
            output = output.replace(/PAGECONTENT/gi, post_content);
            response.send(output);
            response.end();
        });
    }
});
app.get('/write', function(request, response){

    if(!request.session.loggedin){

        response.redirect('/');

    }else{

        var template = fs.readFileSync('home.html');
        var content = fs.readFileSync('post_editor.html');
        var output = template.toString().replace(/PAGETITLE/gi, "Write");
        output = output.toString().replace(/PAGECONTENT/gi, content.toString());
        response.send(output);
        response.end();
    }
});
app.post('/save', function(request, response){

    if(!request.session.loggedin){

        response.redirect('/');

    }else{

        sqlserver.query("INSERT INTO posts (userid, published, title, content) VALUES (?, ?, ?, ?)", [request.session.userid, 0, request.body.title, request.body.content], function(error, results){

            if(error){

                throw error;
            }
            response.redirect('/home');
        });
    }
});

app.listen(8080);
