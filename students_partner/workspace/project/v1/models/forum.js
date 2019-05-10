var express = require("express");
var mongoose = require("mongoose");

var forumSchema = new mongoose.Schema({
   username:String,
   title:String,
   keywords:String,
   description: String,
   answers:[String]
});

module.exports = mongoose.model("Forum",forumSchema);