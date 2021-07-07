//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongo = require("mongodb");
const mongoose = require("mongoose");
const cors = require("cors");
const encrypt = require("mongoose-encryption");

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

const secret = "thisisasecretlongsecret."; // this line will be change in future, its for trying mongoose-encryption
userSchema.plugin(encrypt, { secret: secret, encryptedFields: ['password'] });
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

app.post("/register", (req,res)=>{
    const username = req.body.username;
    const password = req.body.password;

    const newUser = new User({username: username, password: password});

    newUser.save((err,data)=>{
        if (err) throw err;
        console.log("Your item saved to database");
        res.render("secrets");
    });
});

app.post("/login",(req,res)=>{
   const username = req.body.username;
   const password = req.body.password;

   User.findOne({username: username}, (err, foundedItem)=>{
      if (err) throw err;
      if(foundedItem) {
          if(foundedItem.password === password){
              res.render("secrets")
          }
      }
   });
});


app.listen(process.env.PORT || 3000, function(){
    console.log("Server started on port " + process.env.PORT || 3000);
})