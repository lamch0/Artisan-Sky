if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config()
}

const express = require('express')
const morgan = require('morgan')
const mysql = require('mysql')
const path = require('path');
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const dotenv = require('dotenv')
const initializePassport = require('./pasport-config');

dotenv.config({ path: './.env'})

//Make connection to MySQL database
const db = mysql.createConnection({
  host: process.env.DATABASE_HOST, //if network put ip address
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
  //socketPath: '/Applications/MAMP/tmp/mysql/mysql.sock'
})
db.connect( (error) => {
  if(error){
    console.log(error)
  }else{
    console.log("MYSQL Connected")
  }
} )

initializePassport(
  passport 
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
  successRedirect: '/profile',
  failureRedirect: '/login',
  failureFlash: true

}))
//Get register inforamtion and insert to MySQL database
app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
      const { name, email, password, passwordConfirm } = req.body
      db.query('SELECT email FROM users WHERE email = ?', [email], async (error, results) =>{
      if(error){
          console.log(error)
      }

      if(results.length > 0){
        req.flash('info', 'That email is already in use')
        return res.render('register')
      } else if(password !== passwordConfirm){
        req.flash('info', 'Passwords do not match')
        return res.render('register')
      }
      const hashedPassword = await bcrypt.hash(req.body.password, 10)
      const id = Date.now().toString();
      db.query('INSERT INTO users SET ?', {id: id, name: name, email: email, password: hashedPassword}, (error, results)=>{
        if(error){
            console.log(error)
        }else{
          console.log(req.body)
          res.redirect('/login')
        }
      })
    })
    
  } catch {
    res.redirect('/register')
  }
})

//Get log out request 
app.delete('/logout', (req, res) => {
  req.logOut()
  res.redirect('/login')
})

//Function to cheack if the user is authenticated if yes the continuse request, else stay in login page
function checkAuthenticated(req, res, next){
  if (req.isAuthenticated()){
    return next()
  }
  res.redirect('/login')
}

//Function to make user don't go back to login or register page when they haven't log out
function checkNotAuthenticated(req, res, next){
  if (req.isAuthenticated()){
    return res.redirect('/profile')
  }
  next()
}

//print what port we are listening
const port = process.env.PORT || 8080
app.listen(port, () => {
  console.log(`Listening on port:${port}`)
})

