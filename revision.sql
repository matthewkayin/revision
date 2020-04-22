DROP DATABASE IF EXISTS revision;
CREATE DATABASE revision;
USE revision;
CREATE TABLE users(

    userid INT NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    PRIMARY KEY (userid)
);
