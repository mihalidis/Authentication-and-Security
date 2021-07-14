//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongo = require("mongodb");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();

app.use(cors());

app.use('/public', express.static(process.cwd() + "public"));

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));

// Mongoose Connectionn
mongoose.connect(process.env.DB_MONGODB, {useNewUrlParser: true, useUnifiedTopology: true}, err => {
    if (err) throw  err;
    console.log("Connection Success");
});

// User Schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

// Model for user
const User = mongoose.model("User", userSchema);



app.get("/", (req, res)=>{
    res.render("home");
});

app.get("/login", (req, res)=>{
    res.render("login");
});

app.get("/register", (req, res)=>{
    res.render("register");
});

//register user
app.post("/register", (req,res)=>{

    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        if (err) throw err;

        const newUser = new User({username: req.body.username, password: hash});

        newUser.save((err,data)=>{
            if (err) throw err;
            res.render("secrets");
        });
    });

});

//login user
app.post("/login",(req,res)=>{
   const username = req.body.username;
   const password = req.body.password;

   User.findOne({username: username}, (err, foundedItem)=>{
      if (err) throw err;
      if(foundedItem) {
          bcrypt.compare(password, foundedItem.password, function(err, result) {
              if (err) throw err;
              if(result === true) {
                  res.render("secrets");
              }else {
                  alert("wrong password or username");
              }
          });
      }
   });
});


app.listen(process.env.PORT || 3000, function(){
    console.log("Server started on port " + process.env.PORT || 3000);
})