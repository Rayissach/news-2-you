// var express = require("express");
// var bodyParser = require("body-parser");
// var logger = require("morgan");
// var mongoose = require("mongoose");
// var request = require("request")
// var cheerio = require("cheerio")
// var axios = require("axios")
// var mongojs = require('mongojs')

var express = require("express");
var mongojs = require("mongojs");
// Require request and cheerio. This makes the scraping possible
var request = require("request");
var cheerio = require("cheerio");

// var PORT = 3000;

// Require all models
// var db = require("./models");

// Initialize Express
var app = express();

// Configure middleware
var databaseUrl = "scraping";
var collections = ["nytData"];

var db = mongojs(databaseUrl, collections);
db.on("error", function(error) {
  console.log("Database Error:", error);
});

// mongoose.Promise = Promise;
// mongoose.connect(
//     // "mongodb://heroku_sh60cb6j"
//     "mongodb://localhost/scrape"
//     , {
//   useMongoClient: true
// });

app.get("/", function(req, res) {
    res.json("Hello World")
});

app.get("/all",function(req, res) {
    db.nytData.find({}, function(error, found) {
        if(error) {
            console.log(error)
        }
        else {
            res.json(found)
        }
    })
})

app.get("/scrape", function(req, res) {
    // Make a request for the news section of ycombinator
    request("https://www.nytimes.com/", function(error, response, html) {
      // Load the html body from request into cheerio
      var $ = cheerio.load(html);
      // For each element with a "title" class
      $("article h2").each(function(i, element) {
        // Save the text and href of each link enclosed in the current element
        var title = $(element).children("a").text();
        var link = $(element).children("a").attr("href");
  
        // If this found element had both a title and a link
        if (title && link) {
          // Insert the data in the nytData db
          db.nytData.insert({
            title: title,
            link: link
          },
          function(err, inserted) {
            if (err) {
              // Log the error if one is encountered during the query
              console.log(err);
            }
            else {
              // Otherwise, log the inserted data
              console.log(inserted);
            }
          });
        }
      });
    });
  
    // Send a "Scrape Complete" message to the browser
    res.send("Scrape Complete");
  });



  app.listen(3000, function () {
    console.log("App running on port 3000 !");
  });