//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongo = require("mongodb");
const mongoose = require("mongoose");
/*const cors = require("cors");*/
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const app = express();
/*
app.use(cors());*/
app.use('/public', express.static(process.cwd() + "public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// Mongoose Connection
mongoose.connect(process.env.DB_MONGODB, {useNewUrlParser: true, useUnifiedTopology: true}, err => {
    if (err) throw  err;
    console.log("Connection Success");
});
/*mongoose.set("useCreateIndex", true);*/

// User Schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

// Model for user
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res)=>{
    res.render("home");
});

app.get("/login", (req, res)=>{
    res.render("login");
});

app.get("/register", (req, res)=>{
    res.render("register");
});

app.get("/logout", (req, res)=>{
    // end session and deauthenticate user. Note: everytime we restart the server cookies will be deleted
    req.logout();
    res.redirect("/")
});

app.get("/secrets", (req, res)=>{
    if(req.isAuthenticated()){
        res.render("secrets");
    }else {
        res.redirect("/login");
    }

});

//register user
app.post("/register", (req,res)=>{
    // this func comes from passport
    User.register({username: req.body.username}, req.body.password, (err, user)=>{
        if(err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, ()=>{
                res.redirect("/secrets")
            });
        }
    });
});

//login user
app.post("/login",(req,res)=>{

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    // this func comes from passport
    req.login(user,(err)=>{
        if (err) throw err;
        passport.authenticate("local")(req, res, ()=>{
            res.redirect("/secrets")
        });
    });

});


app.listen(process.env.PORT || 3000, function(){
    console.log("Server started on port " + process.env.PORT || 3000);
})