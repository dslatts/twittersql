'use strict';
const express = require('express');
const router = express.Router();
const client = require('../db');

module.exports = io => {

  // a reusable function

  const respondWithAllTweets = (req, res, next) => {
    client.query('SELECT * FROM tweets', function (err, result) {
    if (err) return next(err); // pass errors to Express
      let tweets = result.rows;
      res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
    });
  }



  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  router.get('/users/:username', (req, res, next) => {
    client.query("SELECT * FROM tweets INNER JOIN users ON tweets.user_id = users.id WHERE users.name = $1", [req.params.username], function (err, result){
      if (err) return next(err); // pass errors to Express
      const tweetsForName = result.rows;
      console.log(tweetsForName);
      res.render('index', {
        title: 'Twitter.js',
        tweets: tweetsForName,
        showForm: true,
        username: req.params.username
      });
    });
  });

  // single-tweet page
  router.get('/tweets/:id', (req, res, next) => {
    client.query('SELECT * FROM tweets WHERE tweets.id = $1', [req.params.id],function (err, result){
      if (err) return next(err);
      const tweetWithThatId = result.rows;
      console.log(tweetWithThatId)
      res.render('index', {
      title: 'Twitter.js',
      tweets: tweetWithThatId // an array of only one element ;-)
    });
   });
  });


  // create a new tweet
  router.post('/tweets', (req, res, next) => {
    let userId;

    client.query('SELECT id FROM users WHERE name = $1', [req.body.name], checkUser);


    function checkUser(err, result){
      if (err) return next(err);
      if(result.rows.length){
        insertTweet(null, result);
      } else {
        makeUser();
      }
    }

    function makeUser(){
      client.query('INSERT INTO users (name) VALUES($1) RETURNING *', [req.body.name], insertTweet);
    }

    function insertTweet(err, result){
      if (err) return next(err);
      var myId = result.rows[0].id;
      client.query('INSERT INTO tweets (user_id, content) VALUES ($1, $2)', [myId, req.body.text], function(err){
          if (err) return next(err);
          res.redirect('/');
      });

    }

});

//replaced this hard-coded route with general static routing in app.js
router.get('/stylesheets/style.css', function (req, res, next){
  res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
});

  return router;
};
