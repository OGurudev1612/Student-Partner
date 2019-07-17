//Firstly run the database from root folder to start the app and store the data in database using ./mongod(mongo daemon)
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var flash = require("connect-flash");
var mongoose = require("mongoose");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var methodOverride = require("method-override");
var User  = require("./models/user");
var Course = require("./models/course");
var Lesson = require("./models/lesson");
var Document = require("./models/document");
var Forum = require("./models/forum");
//for uploading file in lesson show page

// requiring and configuring env variables and keeping them secret
var dotenv = require('dotenv');
// .env is created in root directory and should be configured to be used in app
dotenv.config();
// Setting up multer and cloudinary
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|pdf|24|mp4|mp3|pptx|docx)$/i)) {
        return cb(new Error('Only Specific files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter});

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'dpejec0xk', 
  api_key: process.env.API_KEY, 
  api_secret: process.env.API_SECRET
});


//passport configuration
app.use(require("express-session")({
    secret:"students partner is under construction",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//gives currentuser status to every template and route if exists
app.use(function(req,res,next){
    res.locals.currentUser = req.user;
    next();
});

//connecting to database
mongoose.connect("mongodb://localhost/students_partner",{useNewUrlParser:true});

app.use(bodyParser.urlencoded({extended : true}));
app.set("view engine","ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));


app.get("/",function(req,res){
   res.render("landing"); 
});

app.get("/register",function(req,res){
   res.render("register",{currentUser:req.user}); 
});

//handling register logic
app.post("/register",function(req,res){
   var newUser = new User({username:req.body.username,designation: req.body.designation});
   User.register(newUser,req.body.password,function(err,user){
       if(err){
           //req.flash("error",err.message);
           console.log(err);
           return res.render("register",{"error":err.message});
       }
       else{
           console.log(user);
           passport.authenticate("local")(req,res,function(){
              res.redirect("/courses"); 
           });
       }
   }); 
});

app.get("/login",function(req, res){
    res.render("login",{currentUser:req.user});
});


//handling login logic
app.post("/login",passport.authenticate("local",{
    successRedirect:"/courses",
    failureRedirect:"/login"
    }),
    function(req,res){
});

app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/");
});

//gets all the courses
app.get("/courses",isLoggedIn,function(req,res){
    Course.find({},function(err,allcourses){
        if(err){
            console.log(err);
        }
        else{
            res.render("index",{courses:allcourses,currentUser:req.user,designation:req.user.designation});     
        }
    });
});

//posting new course to database
app.post("/courses",isLoggedIn,function(req,res){
    req.body.course.instructor = {
        id: req.user._id,
        username: req.user.username
    }
    console.log(req.body.course);
    Course.create(req.body.course,function(err,newcourse){
        if(err){
            console.log(err);
        }
        else{
            res.redirect("/courses");
        }
    });
});

//creating a new course by rendering a form
app.get("/courses/new",isLoggedIn,function(req,res){
   res.render("new");
});

//showing specific course
app.get("/courses/:id",isLoggedIn,function(req, res) {
    //find course with provided id
    Course.findById(req.params.id).populate("lessons").exec(function(err,foundCourse){
       if(err){
           console.log(err);
       }
       else{
           res.render("show",{course:foundCourse,currentUser:req.user,designation:req.user.designation});
       }
    });
});

app.get("/courses/:id/references",isLoggedIn,function(req, res) {
   Course.findById(req.params.id,function(err, foundCourse) {
      if(err){
          console.log(err);
      }
      else{
          res.render("references",{course:foundCourse,currentUser:req.user});
      }
   }); 
});

app.post("/courses/:id/references",isLoggedIn,function(req, res) {
   Course.findById(req.params.id,function(err, foundCourse) {
       if(err){
           console.log(err);
       }
       else{
           foundCourse.references.push(req.body.referencelink);
           foundCourse.save();
       }
   });
   res.redirect("/courses/"+req.params.id+"/references")
});

app.get("/courses/:id/lessons/new",isLoggedIn,function(req,res){
    Course.findById(req.params.id,function(err,foundCourse){
       if(err){
           console.log(err);
       } 
       else{
           res.render("newlesson",{course:foundCourse,currentUser:req.user,designation:req.user.designation});
       }
    });
});

app.post("/courses/:id/lessons",isLoggedIn,function(req, res) {
   Course.findById(req.params.id,function(err, foundCourse) {
       if(err){
           console.log(err);
       }
       else{
           Lesson.create(req.body.newlesson,function(err,newLesson){
              if(err){
                  console.log(err);
              }
              else{
                  foundCourse.lessons.push(newLesson);
                  foundCourse.save();
                  res.redirect("/courses/"+foundCourse._id);
              }
           });
       }
   });
});

app.get("/courses/:cid/:lid",isLoggedIn,function(req, res) {
    Course.findById(req.params.cid,function(err, foundCourse) {
        if(err){
            console.log(err);
        }
        else{
            Lesson.findById(req.params.lid).populate("docs").exec(function(err,foundLesson){
              if(err){
                  console.log(err);
              }
              else{
                  res.render("showlesson",{lesson:foundLesson,course:foundCourse,currentUser:req.user});
              }
           });
        }
    });
});

app.get("/courses/:cid/:lid/newdoc",isLoggedIn,function(req, res) {
   res.render("uploadfile",{cid:req.params.cid,lid:req.params.lid}); 
});


app.post("/courses/:cid/:lid/newdoc",isLoggedIn,upload.single('image'),function(req, res) {
    cloudinary.uploader.upload(req.file.path,function(result){
    
    // add cloudinary url for the image to the campground object under image property
    Lesson.findById(req.params.lid,function(err, foundLesson) {
        if(err){
            console.log(err);
        }
        else{
            var newdoc = {title: req.body.title,description:req.body.description,username:req.user.username}
            Document.create(newdoc,function(err,newDoc){
                if(err){
                    console.log(err);
                }
                else{
                    newDoc.docs = result.secure_url;
                    newDoc.save();
                    foundLesson.docs.push(newDoc);
                    foundLesson.save();
                }
            });
        }
        });   
    });
    res.redirect("/courses/"+req.params.cid+"/"+req.params.lid);
});

app.get("/forums",isLoggedIn,function(req, res) {
    Forum.find({},function(err,forum){
        if(err){
            console.log(err);
        }
        else{
            res.render("forums",{forum:forum,currentUser:req.user});     
        }
    });
});

app.get("/forums/new",isLoggedIn,function(req,res){
   res.render("newforum"); 
});

app.get("/forums/:id",isLoggedIn,function(req, res) {
    Forum.findById(req.params.id,function(err, foundquestion) {
        if(err){
            console.log(err);
        }
        else{
            res.render("showforum",{question:foundquestion,currentUser:req.user});
        }
    });
});

app.post("/forums",isLoggedIn,function(req,res){
    req.body.forum.username = req.user.username;
    Forum.create(req.body.forum,function(err, newLesson) {
       if(err){
           console.log(err);
       }
       else{
           
       }
    });
    res.redirect("/forums");
});

app.post("/forums/:id/update",isLoggedIn,function(req, res) {
   Forum.findById(req.params.id,function(err, foundquestion) {
      if(err){
          console.log(err);
      } 
      else{
          foundquestion.answers.push(req.body.answer);
          foundquestion.save();
          res.redirect("/forums/"+req.params.id);
      }
   });
});

//middleware
function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}


app.listen(process.env.PORT,process.env.IP,function(){
   console.log("Server has Started!"); 
});