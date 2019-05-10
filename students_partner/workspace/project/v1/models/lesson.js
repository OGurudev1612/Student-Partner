var express = require("express");
var mongoose = require("mongoose");

var lessonSchema = new mongoose.Schema({
   lesson:String,
   name: String,
   description:String,
   docs:[
      {
         type:mongoose.Schema.Types.ObjectId,
         ref: "Document"
      }
   ]
});

module.exports = mongoose.model("Lesson",lessonSchema);