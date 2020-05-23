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

    var post_query = `SELECT posts.postid, title, content, published, DATE_FORMAT(published_date, '%M %d, %Y') AS date, users.userid, username, num_likes, has_liked, has_followed
                             FROM posts, users, (SELECT like_data.postid, like_data.num_likes, like_data.has_liked, follow_data.has_followed
                                                 FROM (SELECT num_likes_data.postid, num_likes_data.num_likes, has_liked_data.has_liked
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
                                                 INNER JOIN (SELECT posts.postid, COUNT(userfollows.userid) AS has_followed
                                                             FROM posts
                                                             LEFT JOIN (SELECT * FROM follows WHERE follows.userid = ?) userfollows
                                                             ON posts.postid = userfollows.postid
                                                             GROUP BY posts.postid) follow_data
                                                 ON like_data.postid = follow_data.postid) interaction_data
                             WHERE posts.userid = users.userid AND posts.postid = interaction_data.postid AND ` + where_conditions;
    return post_query;
}

function build_post_string(sql_results, session_userid, set_first_post=true){

    var post_template = fs.readFileSync('post_template.html');
    var post_string = "";
    for(var i = 0; i < sql_results.length; i++){

        if(!sql_results[i].published){

            if(sql_results[i].userid != session_userid){

                continue;
            }
            info_string += " Not published.";
            
        }else{

            info_string += " " + sql_results[i].date + ".";
        }

        var first_string = "";
        if(set_first_post && i == 0){

            first_string = " first";
        }

        var new_post = post_template.toString().replace(/IS_FIRST/gi, first_string);
        new_post = new_post.toString().replace(/PAGEPOSTID/gi, sql_results[i].postid);
        new_post = new_post.toString().replace(/PAGEUSERID/gi, sql_results[i].userid);
        new_post = new_post.toString().replace(/POSTTITLE/gi, sql_results[i].title);
        new_post = new_post.toString().replace(/POSTAUTHOR/gi, sql_results[i].username);
        new_post = new_post.toString().replace(/POSTCONTENT/gi, sql_results[i].content);
        var info_string = "First revision.";

        new_post = new_post.toString().replace(/LIKEBUTTONID/gi, "like-button-" + String(sql_results[i].postid));
        if(sql_results[i].has_liked){

            new_post = new_post.toString().replace(/HEARTSYMBOL/gi, String.fromCharCode(0xe800));

        }else{

            new_post = new_post.toString().replace(/HEARTSYMBOL/gi, String.fromCharCode(0xe801));
        }
        new_post = new_post.toString().replace(/FOLLOWBUTTONID/gi, "follow-button-" + String(sql_results[i].postid));
        if(sql_results[i].userid == session_userid){

            new_post = new_post.toString().replace(/POSTFOLLOWED/gi, "");
            new_post = new_post.toString().replace(/POSTFOLLOW/gi, "Revise");

        }else{

            if(sql_results[i].has_followed){
            
                new_post = new_post.toString().replace(/POSTFOLLOWED/gi, " filled");
                new_post = new_post.toString().replace(/POSTFOLLOW/gi, "Unfollow");

            }else{

                new_post = new_post.toString().replace(/POSTFOLLOWED/gi, "");
                new_post = new_post.toString().replace(/POSTFOLLOW/gi, "Follow");
            }
        }

        new_post = new_post.toString().replace(/POSTINFO/gi, info_string);
        new_post = new_post.toString().replace(/LIKES/gi, String(sql_results[i].num_likes));
        post_string += new_post;
    }

    return post_string;
}

// TODO add user logged in to set the like button
function build_page_string(sql_results, comment_results, session_userid){

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

        page_string = page_string.replace(/LIKEBUTTONID/gi, "like-button-" + String(sql_results[0].postid));
        if(sql_results[0].has_liked){

            page_string = page_string.replace(/HEARTSYMBOL/gi, String.fromCharCode(0xe800));

        }else{

            page_string = page_string.replace(/HEARTSYMBOL/gi, String.fromCharCode(0xe801));
        }
        page_string = page_string.replace(/FOLLOWBUTTONID/gi, "follow-button-" + String(sql_results[0].postid));
        if(sql_results[0].userid == session_userid){

            page_string = page_string.replace(/POSTFOLLOWED/gi, "");
            page_string = page_string.replace(/POSTFOLLOW/gi, "Revise");

        }else{

            if(sql_results[0].has_followed){

                page_string = page_string.replace(/POSTFOLLOWED/gi, " filled");
                page_string = page_string.replace(/POSTFOLLOW/gi, "Unfollow");

            }else{

                page_string = page_string.replace(/POSTFOLLOWED/gi, "");
                page_string = page_string.replace(/POSTFOLLOW/gi, "Follow");
            }
        }

        page_string = page_string.replace(/POSTLIKES/gi, sql_results[0].num_likes); 
        page_string = page_string.replace(/POSTINFO/gi, sql_results[0].date); 
        page_string = page_string.replace(/PAGEPOSTID/gi, sql_results[0].postid); 
        page_string = page_string.replace(/PAGEUSERID/gi, sql_results[0].userid); 

        var comment_string = "";
        var comment_template = fs.readFileSync('comment_template.html');
        for(var i = 0; i < comment_results.length; i++){

            var next_comment = comment_template.toString();
            next_comment = next_comment.replace(/COMMENTAUTHOR/gi, comment_results[i].username);
            next_comment = next_comment.replace(/COMMENTCONTENT/gi, comment_results[i].content);
            next_comment = next_comment.replace(/COMMENTDATE/gi, comment_results[i].date);

            comment_string += next_comment;
        }
        page_string = page_string.replace(/PAGECOMMENTS/gi, comment_string);
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

    if(request.session.loggedin){

        response.redirect('/');

    }else{

        var login = fs.readFileSync('login.html').toString();
        login = login.replace(/ERRORMESSAGE/gi, "");
        response.send(login);
        response.end();
    }
});
app.get('/signup', function(request, response){

    if(request.session.loggedin){

        response.redirect('/');

    }else{

        var signup = fs.readFileSync('signup.html').toString();
        signup = signup.replace(/ERRORMESSAGE/gi, "");
        response.send(signup);
        response.end();
    }
});

app.post('/signup', function(request, response){

    if(request.session.loggedin){

        response.redirect('/');

    }else{

        sqlserver.query("SELECT * FROM users WHERE users.email = ?", [request.body.email], function(validate_error, validate_results){

            if(validate_error){

                throw validate_error;
            }

            if(validate_results.length != 0){

                var signup = fs.readFileSync('signup.html').toString();
                signup = signup.replace(/ERRORMESSAGE/gi, "The email address you entered has already been used with an account!")
                response.send(signup);
                response.end();

            }else{

                sqlserver.query("INSERT INTO users (email, username, password, bio) VALUES (?, ?, ?, ?)", [request.body.email, request.body.username, request.body.password, "This is a new user."], function(error, result){

                    if(error){

                        throw error;
                    }

                    sqlserver.query("SELECT * FROM users WHERE users.email = ? AND users.password = ?", [request.body.email, request.body.password], function(inner_error, inner_results){

                        if(inner_error){

                            throw inner_error;
                        }

                        if(inner_results.length > 0){

                            request.session.loggedin = true;
                            request.session.userid = inner_results[0].userid;
                            request.session.usertheme = 0;
                            response.redirect('/home');

                        }else{

                            var signup = fs.readFileSync('signup.html').toString();
                            signup = signup.replace(/ERRORMESSAGE/gi, "Signup failed!");
                            response.send(signup);
                            response.end();
                        }
                    });
                });
            }
        });
    }
});

app.post('/auth', function(request, response){

    sqlserver.query("SELECT * FROM users WHERE users.email = ? AND users.password = ?", [request.body.email, request.body.password], function(error, results){

        if(results.length > 0){

            request.session.loggedin = true;
            request.session.userid = results[0].userid;
            request.session.usertheme = 0;
            response.redirect('/home');

        }else{

            var login = fs.readFileSync('login.html').toString();
            login = login.replace(/ERRORMESSAGE/gi, "Login incorrect!");
            response.send(login);
            response.end();
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
app.post('/follow', function(request, response){

    if(request.session.loggedin){

        sqlserver.query("SELECT * FROm follows WHERE postid = ? AND userid = ?", [request.body.postid, request.session.userid], function(error, results){

            if(error){

                throw error;
            }

            if(results.length == 0 && request.body.followed){

                sqlserver.query("INSERT INTO follows (postid, userid) VALUES (?, ?)", [request.body.postid, request.session.userid], function(inner_error, inner_results){

                    if(inner_error){

                        throw inner_error;
                    }
                    response.end();
                });

            }else if(results.length != 0 && !request.body.followed){

                sqlserver.query("DELETE FROM follows WHERE postid = ? AND userid = ?", [request.body.postid, request.session.userid], function(inner_error, inner_results){

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
        sqlserver.query(get_post_query('users.userid = ?'), [request.session.userid, request.session.userid, request.session.userid], function(error, results){

            if(error){

                throw error;
            }
            content += build_post_string(results, request.session.userid, false);
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

    }else{

        response.redirect('/user?userid=' + request.session.userid);
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
    if(request.session.loggedin){

        userid = request.session.userid;
    }
    sqlserver.query(get_post_query('posts.postid = ?'), [userid, userid, request.query.postid], function(error, results){

        if(error){

            throw error;
        }

        sqlserver.query("SELECT username, content, DATE_FORMAT(published_date, '%M %d, %Y') AS date FROM comments, users WHERE comments.postid = ? AND comments.userid = users.userid", [request.query.postid], function(comment_error, comment_results){

            var page_string = build_page_string(results, comment_results, request.session.userid);
            send_home(request, response, "Home", page_string, -1, true);
        });
    });
});
app.post('/comment', function(request, response){

    if(!request.session.loggedin){

        response.redirect('/post?postid=' + request.body.postid);

    }else{

        sqlserver.query("INSERT INTO comments (postid, userid, content, published_date) VALUES (?, ?, ?, ?)", [request.body.postid, request.session.userid, request.body.content, new Date()], function(error, results){

            if(error){

                throw error;
            }

            response.redirect('/post?postid=' + request.body.postid);
        });
    }
});
app.post('/edituser', function(request, response){

    if(!request.session.loggedin || (request.session.loggedin && request.session.userid != request.body.userid)){

        response.redirect('/user?userid=' + request.body.userid);

    }else{

        sqlserver.query("UPDATE users SET username = ?, bio = ? WHERE userid = ?", [request.body.username, request.body.bio, request.body.userid], function(error, results){

            if(error){

                throw error;
            }

            response.redirect('/user?userid=' + request.body.userid);
        });
    }
});
app.get('/user', function(request, response){

    var userid = -1;
    if(request.session.loggedin){

        userid = request.session.userid;
    }
    sqlserver.query('SELECT username, bio FROM users WHERE users.userid = ?', [request.query.userid], function(error, results){

        if(error){

            throw error;
        }

        if(results.length == 0){

            var content_string = "<div class='page'><h1 class='page-title'>Error! User not found!</h1></div>";
            send_home(request, response, "Home", content_string, -1, true);

        }else{

            sqlserver.query(get_post_query('users.userid = ?'), [userid, userid, request.query.userid], function(inner_error, inner_results){

                if(inner_error){

                    throw inner_error;
                }

                var post_string = build_post_string(inner_results, userid);
                var content_string = fs.readFileSync('user_template.html').toString();
                content_string = content_string.replace(/PAGEUSERID/gi, request.query.userid);
                content_string = content_string.replace(/PAGEUSER/gi, results[0].username);
                content_string = content_string.replace(/PAGEBIO/gi, results[0].bio);
                content_string = content_string.replace(/PAGEPOSTS/gi, post_string);
                if(request.query.userid == userid){

                    content_string = content_string.replace(/ENABLEEDIT/gi, "");

                }else{

                    content_string = content_string.replace(/ENABLEEDIT/gi, "disabled");
                }
                var current_page = -1;
                if(request.query.userid == request.session.userid){

                    current_page = 3;
                }
                send_home(request, response, "Home", content_string, current_page, true);
            });
        }
    });
});

app.listen(8080);
