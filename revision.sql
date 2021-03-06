DROP DATABASE IF EXISTS revision;
CREATE DATABASE revision;
USE revision;

CREATE TABLE users(

    userid INT NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    bio VARCHAR(255) NOT NULL,
    PRIMARY KEY (userid)
);

CREATE TABLE posts(

    postid INT NOT NULL AUTO_INCREMENT,
    userid INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    PRIMARY KEY(postid),
    FOREIGN KEY(userid) REFERENCES users(userid)
);

CREATE TABLE revisions(

    revisionid INT NOT NULL AUTO_INCREMENT,
    postid INT NOT NULL,
    published BOOLEAN NOT NULL,
    published_date DATETIME,
    content MEDIUMTEXT NOT NULL,
    revision_num INT NOT NULL,
    PRIMARY KEY(revisionid),
    FOREIGN KEY(postid) REFERENCES posts(postid)
);

CREATE TABLE likes(

    postid INT NOT NULL,
    userid INT NOT NULL,
    PRIMARY KEY(postid, userid),
    FOREIGN KEY(postid) REFERENCES posts(postid), 
    FOREIGN KEY(userid) REFERENCES users(userid)
);

CREATE TABLE follows(

    postid INT NOT NULL,
    userid INT NOT NULL,
    PRIMARY KEY(postid, userid),
    FOREIGN KEY(postid) REFERENCES posts(postid),
    FOREIGN KEY(userid) REFERENCES users(userid)
);

CREATE TABLE comments(

    commentid INT NOT NULL AUTO_INCREMENT,
    postid INT NOT NULL,
    userid INT NOT NULL,
    content TEXT NOT NULL,
    published_date DATETIME NOT NULL,
    PRIMARY KEY(commentid),
    FOREIGN KEY(postid) REFERENCES posts(postid),
    FOREIGN KEY(userid) REFERENCES users(userid)
);
