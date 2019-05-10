var express = require("express");
var mongoose = require("mongoose");

var courseSchema = new mongoose.Schema({
   name:String,
   instructor: {
        id:{
            type:mongoose.Schema.Types.ObjectId,
            ref : "User"
        },
        username:String
    },
    image: String,
    description: String,
    lessons: [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref: "Lesson"
        }
    ],
    references:[String]
});

module.exports = mongoose.model("Course",courseSchema);