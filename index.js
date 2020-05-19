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

function get_post_query(where_conditions){

    var post_query = `SELECT posts.postid, title, content, published, DATE_FORMAT(published_date, '%M %d, %Y') AS date, username, num_likes, has_liked
                             FROM posts, users, (SELECT num_likes_data.postid, num_likes_data.num_likes, has_liked_data.has_liked
                                                FROM (SELECT posts.postid, COUNT(likes.userid) AS num_likes
                                                      FROM posts
                                                      LEFT JOIN likes
                                                      ON posts.postid = likes.postid
                                                      GROUP BY posts.postid) num_likes_data
                                                INNER JOIN (SELECT posts.postid, COUNT(userlikes.userid) AS has_liked
                                                            FROM posts
                                                            LEFT JOIN (SELECT * FROM likes WHERE likes.userid = ?) userlikes
                                                            ON posts.postid = userlikes.postid
                                                            GROUP BY posts.postid) has_liked_data
                                                ON num_likes_data.postid = has_liked_data.postid) like_data
                                                WHERE posts.userid = users.userid AND posts.postid = like_data.postid AND ` + where_conditions;
    return post_query;
}

function build_post_string(sql_results, set_first_post=true){

    var post_template = fs.readFileSync('post_template.html');
    var post_string = "";
    for(var i = 0; i < sql_results.length; i++){

        var first_string = "";
        if(set_first_post && i == 0){

            first_string = " first";
        }
        var new_post = post_template.toString().replace(/IS_FIRST/gi, first_string);
        new_post = new_post.toString().replace(/PAGEPOSTID/gi, sql_results[i].postid);
        new_post = new_post.toString().replace(/POSTTITLE/gi, sql_results[i].title);
        new_post = new_post.toString().replace(/POSTAUTHOR/gi, sql_results[i].username);
        new_post = new_post.toString().replace(/POSTCONTENT/gi, sql_results[i].content);
        var info_string = "First revision.";

        if(!sql_results[i].published){

            info_string += " Not published.";
            
        }else{

            info_string += " " + sql_results[i].date + ".";
        }

        new_post = new_post.toString().replace(/LIKEBUTTONID/gi, "like-button-" + String(sql_results[i].postid));
        if(sql_results[i].has_liked){

            new_post = new_post.toString().replace(/HEARTSYMBOL/gi, String.fromCharCode(0xe800));

        }else{

            new_post = new_post.toString().replace(/HEARTSYMBOL/gi, String.fromCharCode(0xe801));
        }

        new_post = new_post.toString().replace(/POSTINFO/gi, info_string);
        new_post = new_post.toString().replace(/LIKES/gi, String(sql_results[i].num_likes));
        post_string += new_post;
    }

    return post_string;
}

// TODO add user logged in to set the like button
function build_page_string(sql_results, user_logged_in){

    var page_template = fs.readFileSync('page_template.html');
    var page_string = "";
    if(sql_results.length == 0 || sql_results.length == 1 && !sql_results[0].published){

        page_string =`  <div class="page">
                            <h1 class="page-title">Error! Post not found!</h1>
                            <h2 class="post-author"><a href='/'>&#171 Return home</a></h2>
                        </div>`;

    }else{

        page_string = page_template.toString();
        page_string = page_string.replace(/POSTTITLE/gi, sql_results[0].title);
        page_string = page_string.replace(/POSTAUTHOR/gi, sql_results[0].username);
        page_string = page_string.replace(/POSTCONTENT/gi, sql_results[0].content);
        if(sql_results.has_liked){

            page_string = page_string.replace(/HEARTSYMBOL/gi, String.fromCharCode(0xe800));

        }else{

            page_string = page_string.replace(/HEARTSYMBOL/gi, String.fromCharCode(0xe801));
        }
        page_string = page_string.replace(/POSTLIKES/gi, sql_results[0].num_likes); 
        page_string = page_string.replace(/POSTINFO/gi, sql_results[0].date); 
    }

    return page_string;
}

function send_home(request, response, title, content, current_page, allow_skip_login=false){

    if(!request.session.loggedin && !allow_skip_login){

        response.redirect('/');

    }else{

        var template = fs.readFileSync('home.html');
        var output = template.toString().replace(/PAGETITLE/gi, title);
        var current_theme;
        if(request.session.usertheme == 0){

            current_theme = "theme-light";

        }else if(request.session.usertheme == 1){

            current_theme = "theme-solarized";

        }else if(request.session.usertheme == 2){

            current_theme = "theme-dark";
        }
        output = output.toString().replace(/PAGEDEFAULTTHEME/gi, current_theme);
        current_page_tags = ["", "", "", ""];
        if(current_page != -1){

            current_page_tags[current_page] = " current";
        }
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

    }else{

        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({usertheme: 0}));
    }
});
app.post('/like', function(request, response){

    if(request.session.loggedin){

        sqlserver.query("SELECT * FROM likes WHERE postid = ? AND userid = ?", [request.body.postid, request.session.userid], function(error, results){

            if(error){

                throw error;
            }

            if(results.length == 0 && request.body.liked){

                sqlserver.query("INSERT INTO likes (postid, userid) VALUES (?, ?)", [request.body.postid, request.session.userid], function(inner_error, inner_results){

                    if(inner_error){

                        throw inner_error;
                    }
                    response.end();
                });

            }else if(results.length != 0 && !request.body.liked){

                sqlserver.query("DELETE FROM likes WHERE postid = ? AND userid = ?", [request.body.postid, request.session.userid], function(inner_error, inner_results){

                    if(inner_error){

                        throw inner_error;
                    }
                    response.end();
                });
            }
        });
    }
});
app.get('/home', function(request, response){

    if(!request.session.loggedin){

        response.redirect('/');
        response.end();

    }else{

        var content = (fs.readFileSync('new_button.html')).toString();
        sqlserver.query(get_post_query('users.userid = ?'), [request.session.userid, request.session.userid], function(error, results){

            if(error){

                throw error;
            }
            content += build_post_string(results, false);
            send_home(request, response, "Home", content, 0); });
    }
});
app.get('/read', function(request, response){

    if(!request.session.loggedin){

        response.redirect('/');
        response.end();

    }else{

        var content = "";
        send_home(request, response, "Read", content, 1);
    }
});
app.get('/discover', function(request, response){

    if(!request.session.loggedin){

        response.redirect('/');
        response.end();

    }else{

        sqlserver.query("SELECT title, content, published, DATE_FORMAT(published_date, '%M %d, %Y') AS date, username FROM posts, users WHERE users.userid != ? AND users.userid = posts.userid", [request.session.userid], function(error, results){

            if(error){

                throw error;
            }
            var content = build_post_string(results);
            send_home(request, response, "Discover", content, 2);
        });
    }
});
app.get('/profile', function(request, response){

    if(!request.session.loggedin){

        response.redirect('/');
        response.end();

    }else{

        var content = "";
        send_home(request, response, "Profile", content, 3);
    }
});
app.get('/write', function(request, response){

    if(!request.session.loggedin){

        response.redirect('/');

    }else{

        var content = fs.readFileSync('post_editor.html');
        send_home(request, response, "Write", content, 0);
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
app.get('/post', function(request, response){

    var userid = -1;
    if(request.session.loggedid){

        userid = request.session.userid;
    }
    sqlserver.query(get_post_query('posts.postid = ?'), [userid, request.query.postid], function(error, results){

        if(error){

            throw error;
        }
        var page_string = build_page_string(results);
        send_home(request, response, "Home", page_string, -1, true);
    });
});

app.listen(8080);
