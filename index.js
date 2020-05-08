var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
//var redis = require('redis');
//var redisclient = redis.createClient();
//var redisstore = require('connect-redis')(session);
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
    //cookie: {secure: false},
    //store: new redisstore({host: 'localhost', port: 6379, client: redisclient, ttl: 86400}),
    resave: true,
    saveUninitialized: true
}));
app.use(bodyparser.urlencoded({extended: true}));
app.use(bodyparser.json());

function load_home(request, response, title, content, current_page){

    if(!request.session.loggedin){

        response.redirect('/');

    }else{

        var template = fs.readFileSync('home.html');
        var output = template.toString().replace(/PAGETITLE/gi, title);
        current_page_tags = ["", "", "", ""];
        current_page_tags[current_page] = " current";
        output = output.toString().replace(/PAGECURRENT1/gi, current_page_tags[0]);
        output = output.toString().replace(/PAGECURRENT2/gi, current_page_tags[1]);
        output = output.toString().replace(/PAGECURRENT3/gi, current_page_tags[2]);
        output = output.toString().replace(/PAGECURRENT4/gi, current_page_tags[3]);
        output = output.toString().replace(/PAGECONTENT/gi, content);
        response.send(output);
        response.end();
    }
}

app.get('/index.css', function(request, response){

    response.sendFile(path.join(__dirname + "/index.css"));
});
app.get('/', function(request, response){

    if(request.session.loggedin){

        response.redirect('/home');

    }else{

        response.sendFile(path.join(__dirname + '/index.html'));
    }
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
            request.session.usertheme = 0;
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
            request.session.usertheme = 0;
            response.redirect('/home');

        }else{

            response.send("Login incorrect!");
        }
        response.end();
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
app.post('/set_theme', function(request, response){

    if(request.session.loggedin){

        request.session.usertheme = request.body.usertheme;
        request.session.save();
    }
});
app.get('/get_theme', function(request, response){

    if(request.session.loggedin){

        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({usertheme: request.session.usertheme}));
    }
});
app.get('/home', function(request, response){

    if(!request.session.loggedin){

        response.redirect('/');
        response.end();

    }else{

        var template = fs.readFileSync('home.html');
        var content = fs.readFileSync('new_button.html');
        var post_template = fs.readFileSync('post_template.html');
        var output = template.toString().replace(/PAGETITLE/gi, "Write");
        var current_theme;
        if(request.session.usertheme == 0){

            current_theme = "theme-light";

        }else if(request.session.usertheme == 1){

            current_theme = "theme-solarized";

        }else if(request.session.usertheme == 2){

            current_theme = "theme-dark";
        }
        output = output.toString().replace(/PAGEDEFAULTTHEME/gi, current_theme);
        output = output.toString().replace(/PAGECURRENT1/gi, " current");
        output = output.toString().replace(/PAGECURRENT2/gi, "");
        output = output.toString().replace(/PAGECURRENT3/gi, "");
        output = output.toString().replace(/PAGECURRENT4/gi, "");
        var post_content = content.toString();
        sqlserver.query("SELECT title, content, published, DATE_FORMAT(published_date, '%M %d, %Y') AS date, username FROM posts, users WHERE users.userid = ? AND users.userid = posts.userid", [request.session.userid], function(error, results){

            if(error){

                throw error;
            }
            for(var i = 0; i < results.length; i++){

                var new_post = post_template.toString().replace(/IS_FIRST/gi, "");
                new_post = new_post.toString().replace(/POSTTITLE/gi, results[i].title);
                new_post = new_post.toString().replace(/POSTAUTHOR/gi, results[i].username);
                new_post = new_post.toString().replace(/POSTCONTENT/gi, results[i].content);
                var info_string = "First revision.";
                if(!results[i].published){

                    info_string += " Not published.";
                    
                }else{

                    info_string += " " + results[i].date + ".";
                }
                new_post = new_post.toString().replace(/POSTINFO/gi, info_string);
                new_post = new_post.toString().replace(/LIKES/gi, "0");
                post_content += new_post;
            }
            output = output.replace(/PAGECONTENT/gi, post_content);
            response.send(output);
            response.end();
        });
    }
});
app.get('/read', function(request, response){

    if(!request.session.loggedin){

        response.redirect('/');
        response.end();

    }else{

        var template = fs.readFileSync('home.html');
        var output = template.toString().replace(/PAGETITLE/gi, "Read");
        var current_theme;
        if(request.session.usertheme == 0){

            current_theme = "theme-light";

        }else if(request.session.usertheme == 1){

            current_theme = "theme-solarized";

        }else if(request.session.usertheme == 2){

            current_theme = "theme-dark";
        }
        output = output.toString().replace(/PAGEDEFAULTTHEME/gi, current_theme);
        output = output.toString().replace(/PAGECURRENT1/gi, "");
        output = output.toString().replace(/PAGECURRENT2/gi, " current");
        output = output.toString().replace(/PAGECURRENT3/gi, "");
        output = output.toString().replace(/PAGECURRENT4/gi, "");
        response.send(output);
        response.end();
    }
});
app.get('/discover', function(request, response){

    if(!request.session.loggedin){

        response.redirect('/');
        response.end();

    }else{

        var template = fs.readFileSync('home.html');
        var post_template = fs.readFileSync('post_template.html');
        var output = template.toString().replace(/PAGETITLE/gi, "Discover");
        var current_theme;
        if(request.session.usertheme == 0){

            current_theme = "theme-light";

        }else if(request.session.usertheme == 1){

            current_theme = "theme-solarized";

        }else if(request.session.usertheme == 2){

            current_theme = "theme-dark";
        }
        output = output.toString().replace(/PAGEDEFAULTTHEME/gi, current_theme);
        output = output.toString().replace(/PAGECURRENT1/gi, "");
        output = output.toString().replace(/PAGECURRENT2/gi, "");
        output = output.toString().replace(/PAGECURRENT3/gi, " current");
        output = output.toString().replace(/PAGECURRENT4/gi, "");
        var post_content = "";
        sqlserver.query("SELECT title, content, published, DATE_FORMAT(published_date, '%M %d, %Y') AS date, username FROM posts, users WHERE users.userid != ? AND users.userid = posts.userid", [request.session.userid], function(error, results){

            if(error){

                throw error;
            }
            for(var i = 0; i < results.length; i++){

                var new_post = "";
                if(i == 0){

                    new_post = post_template.toString().replace(/IS_FIRST/gi, " first");

                }else{

                    new_post = post_template.toString().replace(/IS_FIRST/gi, "");
                }
                new_post = new_post.toString().replace(/POSTTITLE/gi, results[i].title);
                new_post = new_post.toString().replace(/POSTAUTHOR/gi, results[i].username);
                new_post = new_post.toString().replace(/POSTCONTENT/gi, results[i].content);
                var info_string = "First revision.";
                if(!results[i].published){

                    info_string += " Not published.";
                    
                }else{

                    info_string += " " + results[i].date + ".";
                }
                new_post = new_post.toString().replace(/POSTINFO/gi, info_string);
                new_post = new_post.toString().replace(/LIKES/gi, "0");
                post_content += new_post;
            }
            output = output.replace(/PAGECONTENT/gi, post_content);
            response.send(output);
            response.end();
        });
    }
});
app.get('/profile', function(request, response){

    if(!request.session.loggedin){

        response.redirect('/');
        response.end();

    }else{

        var template = fs.readFileSync('home.html');
        var output = template.toString().replace(/PAGETITLE/gi, "Profile");
        var current_theme;
        if(request.session.usertheme == 0){

            current_theme = "theme-light";

        }else if(request.session.usertheme == 1){

            current_theme = "theme-solarized";

        }else if(request.session.usertheme == 2){

            current_theme = "theme-dark";
        }
        output = output.toString().replace(/PAGEDEFAULTTHEME/gi, current_theme);
        output = output.toString().replace(/PAGECURRENT1/gi, "");
        output = output.toString().replace(/PAGECURRENT2/gi, "");
        output = output.toString().replace(/PAGECURRENT3/gi, "");
        output = output.toString().replace(/PAGECURRENT4/gi, " current");
        response.send(output);
        response.end();
    }
});
app.get('/write', function(request, response){

    if(!request.session.loggedin){

        response.redirect('/');

    }else{

        var template = fs.readFileSync('home.html');
        var content = fs.readFileSync('post_editor.html');
        var output = template.toString().replace(/PAGETITLE/gi, "Write");
        var current_theme;
        if(request.session.usertheme == 0){

            current_theme = "theme-light";

        }else if(request.session.usertheme == 1){

            current_theme = "theme-solarized";

        }else if(request.session.usertheme == 2){

            current_theme = "theme-dark";
        }
        output = output.toString().replace(/PAGEDEFAULTTHEME/gi, current_theme);
        output = output.toString().replace(/PAGECURRENT1/gi, " current");
        output = output.toString().replace(/PAGECURRENT2/gi, "");
        output = output.toString().replace(/PAGECURRENT3/gi, "");
        output = output.toString().replace(/PAGECURRENT4/gi, "");
        output = output.toString().replace(/PAGECONTENT/gi, content.toString());
        response.send(output);
        response.end();
    }
});
app.post('/save', function(request, response){

    if(!request.session.loggedin){

        response.redirect('/');

    }else{

        sqlserver.query("INSERT INTO posts (userid, published, published_date, title, content) VALUES (?, ?, ?, ?, ?)", [request.session.userid, 0, new Date(), request.body.title, request.body.content], function(error, results){

            if(error){

                throw error;
            }
            response.redirecet('/home');
            response.end();
        });
    }
});
app.post('/publish', function(request, response){

    if(!request.session.loggedin){

        response.redirect('/');

    }else{

        sqlserver.query("INSERT INTO posts (userid, published, published_date, title, content) VALUES (?, ?, ?, ?, ?)", [request.session.userid, 1, new Date(), request.body.title, request.body.content], function(error, results){

            if(error){

                throw error;
            }
            response.redirect('/home');
            response.end();
        });
    }
});

app.listen(8080);
