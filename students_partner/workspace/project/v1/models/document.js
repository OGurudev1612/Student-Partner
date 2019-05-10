var express = require("express");
var mongoose = require("mongoose");

var documentSchema = new mongoose.Schema({
   username: String,
   title: String,
   description: String,
   docs: String
});

module.exports = mongoose.model("Document",documentSchema);