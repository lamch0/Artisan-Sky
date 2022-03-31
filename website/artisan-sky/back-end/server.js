if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config()
}

const express = require('express')
const morgan = require('morgan')
const mysql = require('mysql2')
const path = require('path');
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')

const initializePassport = require('./pasport-config')
initializePassport(
  passport, 
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
)

const users = []

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



// https://gist.githubusercontent.com/meech-ward/1723b2df87eae8bb6382828fba649d64/raw/ee52637cc953df669d95bb4ab68ac2ad1a96cd9f/lotr.sql
/*const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
})

function getRandomInt(max) {
  return 1 + Math.floor(Math.random() * (max-1))
}

async function getCharacter(id) {
  const [characters] = await pool.promise().query("SELECT * FROM characters WHERE id = ?", [
    id,
  ])
  return characters[0]
}
async function randomId() {
  const [rows] = await pool.promise().query(
    "SELECT COUNT(*) as totalCharacters FROM characters"
  )
  const { totalCharacters } = rows[0]
  const randomId = getRandomInt(totalCharacters)
  return randomId
}*/

app.get("/test", (req, res) => {
  res.send("<h1>It's working 🤗</h1>")
})

app.get("/", checkAuthenticated, (req, res) => {
  //res.sendFile(path.join(__dirname, '/homepage.html'));
  res.render('index.ejs', { name : req.user.name })
})

app.get("/login", checkNotAuthenticated, (req, res) => {
  res.render('login')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true

}))

app.get("/register", checkNotAuthenticated, (req, res) => {
  res.render('register.ejs')
})

app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPssword = await bcrypt.hash(req.body.password, 10)
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPssword
    })
    res.redirect('/login')
  } catch {
    res.redirect('/register')
  }
  console.log(users)
})

app.delete('/logout', (req, res) => {
  req.logOut()
  res.redirect('/login')
})

function checkAuthenticated(req, res, next){
  if (req.isAuthenticated()){
    return next()
  }

  res.redirect('/login')
}

function checkNotAuthenticated(req, res, next){
  if (req.isAuthenticated()){
    return res.redirect('/')
  }
  next()
}

const port = process.env.PORT || 8080
var server = app.listen(port, () => {
  const host = server.address().address
  console.log(`Listening on http://${host}:${port}`)
})

