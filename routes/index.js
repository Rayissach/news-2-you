var express = require("express")
var router = express.Router();
var db = require("../models")

// var controller = require('../')
router.get("/", function( req, res) {
    res.render("index", {title: 'Express'})
});

// router.get("/articles", function(req, res) {
//     res.render ("index")
// })
// router.post("/articles", function(req, res) {
//     res.render('index')
// })

module.exports = router;