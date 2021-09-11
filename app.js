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
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')


const app = express();
/*
app.use(cors());*/
app.use(express.static("public"));
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
    password: String,
    googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// Model for user
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
/*
its for local auth
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
*/

// This is for any kind of authentication
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:27017/auth/google/secrets"
    },
    function(accessToken, refreshToken, profile, cb) {
    //Mongoose findorcreate package
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));


app.get("/", (req, res)=>{
    res.render("home");
});

app.get("/login", (req, res)=>{
    res.render("login");
});

app.get("/auth/google", passport.authenticate('google', { scope: ["profile"] }));

app.get("/auth/google/secrets",
    passport.authenticate("google", { failureRedirect: "/login" }),
    function(req, res) {
        // Successful authentication, redirect secrets page.
        res.redirect('/secrets');
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