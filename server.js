
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var request = require("request");
var handlebars = require("handlebars");
var exphbs = require("express-handlebars");
var index = require("./routes/index");
// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

// var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: false }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// app.use("/", index);

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect("mongodb://localhost/newsapp")

app.get("/", function(req, res){
	db.Article
	.find({}).sort({createdAt:-1})
	.then(function(dbArticles){
		if(dbArticles.length != 0){
			var handlerObj = {
				articles: dbArticles
			}
			res.render("index", handlerObj)
		} 
		else {
			res.render("index")
		}
	})
})

// app.post("/saved", function(req, res) {
//   db.Article
//   .findAndUpdate({}).sort({createdAt:-1})
//   .then(function(dbArticles) {
//     res.render()
//   })
// })

app.get("/saved", function(req, res) {
  console.log("WHATS UPPPPP")
});


app.get("/saved", function(req, res) {
  db.Article
  .find({saved: true}, {_id: req.params.id}).sort({createdAt: -1})
  .then(function(dbArticles) {
    if(dbArticles.length != 0) {
      var hndleobj ={
        articles: dbArticles
      }
      res.render("saved", hndleobj)
    } else {
      res.render("saved")
    }
  })
  .catch(function(err) {
    res.json(err)
  })
})

// A GET route for scraping the echojs website
app.get("/scrape", function(req, res) {
    // First, we grab the body of the html with request
    request("https://www.nytimes.com/", function(error, response, html) {
      // Then, we load that into cheerio and save it to $ for a shorthand selector
      var $ = cheerio.load(html);
  
      // Now, we grab every h2 within an article tag, and do the following:
      $("article h2").each(function(i, element) {
        // Save an empty result object

        $("p.summary")

        var result = {};
  
        // Add the text and href of every link, and save them as properties of the result object
        result.title = $(this)
          .children("a")
          .text();
        result.link = $(this)
          .children("a")
          .attr("href");
        result.summary = $(this)
          // .children("p.summary")
          .text();
            // console.log("////////////////////////")
        // Create a new Article using the `result` object built from scraping
        db.Article
          .create(result)
          .then(function(dbArticle){
            // If we were able to successfully scrape and save an Article, send a message to the client
            res.send("Scrape Complete");
          })
        //   .catch(function(err) {
        //     // If an error occurred, send it to the client
        //     res.json(err);
        //   });
      });
    });
  });

 // Route for getting all Articles from the db
app.get("/articles", function(req, res) {
    // Grab every document in the Articles collection
    db.Article
      .find({})
      .then(function(dbArticle) {
        // If we were able to successfully find Articles, send them back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });
  
  // Route for grabbing a specific Article by id, populate it with it's note
  app.get("/articles/:id", function(req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article
      .findOne({ _id: req.params.id })
      // ..and populate all of the notes associated with it
      .populate("note")
      .then(function(dbArticle) {
        // If we were able to successfully find an Article with the given id, send it back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

  // app.get("/saved/:id", function(req, res) {
  //   db.Article
  //   .find({saved: true}, {sort: {created: -1}})
  //   .then(function (dbArticle) {
  //     if (dbArticle == 0) {
  //       res.render("placeholder", {message: "Nothing Here"})
  //     } else {
  //       res.render("search", {search: dbArticle})
  //     }
  //   })      
  // })

  // app.get("/saved/", function(req, res) {
  //   db.Article
  //   .findById({_id:req.params.id},{ saved: true }, {sort: {created: -1}})
  //   .then(function(dbArticle) {
  //       var hbsObject = {};
  //       hbsObject = dbArticle;
  //       // console.log(hbsObject)
  //       res.render('saved', hbsObject);
  //     })
  //     .catch(function(err) {
  //       res.json(err);
  //     });
  // })

  app.post("/saved", function(req, res) {
    db.Article
    .update({_id: req.params.id}, {$set: {saved: true} })
    .then(function (data) {
      res.json(data)
      
    })
  });


  

//   app.get("/saved", function(req, res) {
//   Article.find({issaved: true}, null, {sort: {created: -1}}, function(err, data) {
//     if(data.length === 0) {
//       res.render("placeholder", {message: "You have not saved any articles yet. Try to save some delicious news by simply clicking \"Save Article\"!"});
//     }
//     else {
//       res.render("saved", {saved: data});
//     }
//   });
// });
  
  // Route for saving/updating an Article's associated Note
  app.post("/articles/:id", function(req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note
      .create(req.body)
      .then(function(dbNote) {
        // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
        // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
        // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
        return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
      })
      .then(function(dbArticle) {
        // If we were able to successfully update an Article, send it back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

  // Route for retrieving all Notes from the db
app.get("/notes", function (req, res) {
    // Find all Notes
    db.Note.find({})
      .then(function (dbNote) {
        // If all Notes are successfully found, send them back to the client
        res.json(dbNote);
      })
      .catch(function (err) {
        // If an error occurs, send the error back to the client
        res.json(err);
      });
  });
  
  // Route for retrieving all Users from the db
  app.get("/user", function (req, res) {
    // Find all Users
    db.User.find({})
      .then(function (dbUser) {
        // If all Users are successfully found, send them back to the client
        res.json(dbUser);
      })
      .catch(function (err) {
        // If an error occurs, send the error back to the client
        res.json(err);
      });
  });
  
  // Route for saving a new Note to the db and associating it with a User
  app.post("/submit", function (req, res) {
    // Create a new Note in the db
    db.Note.create(req.body)
      .then(function (dbNote) {
        // If a Note was created successfully, find one User (there's only one) and push the new Note's _id to the User's `notes` array
        // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
        // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
        return db.User.findOneAndUpdate({}, { $push: { notes: dbNote._id } }, { new: true });
      })
      .then(function (dbUser) {
        // If the User was updated successfully, send it back to the client
        res.json(dbUser);
      })
      .catch(function (err) {
        // If an error occurs, send it back to the client
        res.json(err);
      });
  });
  
  // Route to get all User's and populate them with their notes
  app.get("/populateduser", function (req, res) {
    // Find all users
    db.User.find({})
      // Specify that we want to populate the retrieved users with any associated notes
      .populate("notes")
      .then(function (dbUser) {
        // If able to successfully find and associate all Users and Notes, send them back to the client
        res.json(dbUser);
      })
      .catch(function (err) {
        // If an error occurs, send it back to the client
        res.json(err);
      });
  });

  app.listen(3000, function () {
    console.log("App running on port 3000 !");
  });