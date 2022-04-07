if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config()
}

const express = require('express')
const morgan = require('morgan')
const path = require('path');
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const dotenv = require('dotenv')
const initializePassport = require('./passport-config');
const fileUpload = require('express-fileupload')
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const { runInNewContext } = require('vm');

dotenv.config({ path: './.env'})

//Make connection to mongodb
mongoose.connect("mongodb+srv://artisansky:webuildappfromscratch@artisan.0mzss.mongodb.net/Artisan?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
//const user = require("./user_model.js")
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true
  },
  id: {
    type: String,
    require: true
  },
  email: {
    type: String,
    require: true
  },
  password: {
    type: String,
    require: true
  }
})
const user = mongoose.model('user', userSchema)


initializePassport(
  passport,
  async (email) => {
    const userFound = await user.findOne({ email: email });
    //console.log('userFound: '+ userFound)
    return userFound;
  },
  async (id) => {
    const userFound = await user.findOne({ id: id });
    return userFound;
  }
)

app.use(morgan(":method :url :status :res[content-length] - :response-time ms"))
app.set('views', path.join(__dirname, "views"));
app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false

}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

//Parse URL-encoded bodies (as sent by HTML)
app.use(express.urlencoded({ extended: false}))
//Parse JSON bodies (as sent by API)
app.use(express.json())

//Define Routes, where app.get put in
app.use('/', require('./routes/pages'))

//Get login input from user and base on information to redirect to other page
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/profile/',
  failureRedirect: '/login',
  failureFlash: true
}))

app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
      const { name, email, password, passwordConfirm } = req.body
      const userExists = await user.findOne({ email: email})
      if(userExists){
        req.flash('info', 'That email is already in use')
        return res.render('register')
      } else if(password !== passwordConfirm){
        req.flash('info', 'Passwords do not match')
        return res.render('register')
      }else {
        try{
          const hashedPassword = await bcrypt.hash(password, 10)
          const id = Date.now().toString();
          const newUser = new user({
            name: name,
            email: email,
            id: id,
            password: hashedPassword
          })
          await newUser.save()
          console.log(req.body)
          res.redirect('/login')
        } catch {
          console.log(error)
          res.redirect('/register')
        }
      }
  } catch {
    console.log(error)
    res.redirect('/register')
  }
})
//app.put('/pwmod', (req, res) => {
//app.put('/pwmod', passport.authenticate('local'), (req, res) => {
app.put('/pwmod', checkAuthenticated, (req, res) => {
  console.log("User: "+ req.session.passport.user)
  user.findOne({id: req.session.passport.user},
  (errUser, User) => {
    if (errUser || User == null){
      res.render('index')
    }
    else if (bcrypt.compare(User['password'], req.body['og_pw'])){
      bcrypt.hash(req.body['new_pw'], 10, (err, hash) => {
        if (err)
          res.render(index)
        else {
          //User['password'] = req.body['new_pw']
          User['password'] = hash;
          User.save();
          req.flash('success', 'Successfully changed password')
          res.redirect('/profile')
        }
      })
    }
    else{
      req.flash('og_pw', 'Original password is incorrect')
      res.redirect('/profile')
    }
  })
})

//Get log out request 
app.delete('/logout', (req, res) => {
  req.logOut()
  res.redirect('/login')
})

//Function to cheack if the user is authenticated if yes the continuse request, else stay in login page
function checkAuthenticated(req, res, next){
  if (req.isAuthenticated()){
    //console.log("User authenticated " + req.session.passport.user)
    return next()
  }
  console.log("User not authenticated, returning to login")
  res.redirect('/login')
}

//Function to make user don't go back to login or register page when they haven't log out
function checkNotAuthenticated(req, res, next){
  if (req.isAuthenticated()){
    console.log("User authenticated, returning to profile")
    return res.redirect('/profile')
  }
  //console.log("User authenticated " + req.session.passport.user)
  next()
}

//print what port we are listening
const port = process.env.PORT || 8080
app.listen(port, () => {
  console.log(`Listening on port:${port}`)
})

