const express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
const helmet = require('helmet');
var passport = require('passport');
const http    = require("http");
const fs = require("fs");
const https = require("https");
const { Issuer,generators,Strategy } = require('openid-client');
https.globalAgent.options.rejectUnauthorized = false;
var usersRouter = require('./Routes/User')
const path = require("path");
require('dotenv').config();

const app = express();

app.use(cookieParser());
app.use(express.urlencoded({
  extended: true,
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '15mb' }));
app.use(session({secret: 'secret', 
                 resave: false, 
                 saveUninitialized: true,}));
//app.use(helmet());
app.use(passport.initialize());
app.use(passport.session());

app.use('/user', usersRouter);

passport.serializeUser(function(user, done) {
    console.log('-----------------------------');
    console.log('serialize user');
    console.log(user);
    console.log('-----------------------------');
    done(null, user);
});
passport.deserializeUser(function(user, done) {
    console.log('-----------------------------');
    console.log('deserialize user');
    console.log(user);
    console.log('-----------------------------');
    done(null, user);
});


Issuer.discover(process.env.ISSUER_DOMAIN) // => Promise
  .then(function (oidcIssuer) {
    var client = new oidcIssuer.Client({
      client_id: process.env.CLIENT_ID,
      client_secret:  process.env.CLIENT_SECRET,
      redirect_uris: [process.env.REDIRECT_URIS],
      response_types: ["code"],
    });

    passport.use(
      "oidc",
      new Strategy(
        { client, passReqToCallback: true },
        (req, tokenSet, done) => {
          console.log("tokenSet", tokenSet);
          //console.log("userinfo",userinfo);
          req.session.tokenSet = tokenSet;
          req.session.userinfo = tokenSet.claims();

          return done(null, tokenSet.claims());
        }
      )
    );

    app.get("/", (req, res) => {
      res.render("index");
    });

    app.get(
      "/auth/login",
      function (req, res, next) {
        console.log("-----------------------------");
        console.log("/Start login handler");
        next();
      },
      passport.authenticate("oidc", {

      })
    );

    app.get("/auth/callback", (req, res, next) => {
  
      console.log("-----------------------------");
      console.log("/Start login Callback"); passport.authenticate("oidc", {
        successRedirect: "/user",
        failureRedirect: "/",
      })(req, res, next);
    });

    app.get("/auth/logout", (req, res) => {
      res.redirect(
        client.endSessionUrl({
          id_token_hint: req.session.tokenSet?.id_token,
        })
      );
    });
    app.get("/auth/logout/callback", (req, res) => {
      // clears the persisted user from the local storage
      req.logout();
      // redirects the user to a public route
      res.redirect("/");
    });
  });














  const httpServer = http.createServer(app)
  //const server= https.createServer(options,app).listen(3003);
  httpServer.listen(8089,() =>{
      console.log(`OIDC Axiom sample app running on port 8089`)
    })
