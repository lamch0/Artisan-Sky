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
const multer =require('multer')

dotenv.config({ path: './.env'})

//Make connection to mongodb
mongoose.connect("mongodb+srv://artisansky:webuildappfromscratch@artisan.0mzss.mongodb.net/Artisan?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
const user = require("./user_model")
/*const userSchema = new mongoose.Schema({
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
  },
  profile_image: {
    type: String,
    default: 'images.png',
  }
})*/
//const user = mongoose.model('user', userSchema)

// User Verification model
const UserVerification = require("./UserVerification");

// email handler
const nodemailer = require("nodemailer");

// unique String
const {v4: uuidv4} = require("uuid");

// nodemailer
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth:{
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  }
})

// testing success
transporter.verify((err, e)=>{
  if (err) {
    console.log(err);
  } else {
    console.log("ready for messages");
  }
})
const storage = multer.diskStorage({
  //destination for files
  destination: function (req, file, callback) {
   callback(null, 'public/uploads/user_profile_images')
 },
 //add back extension
 filename: function (req, file, callback) {
   //console.log(file)
   callback(null, Date.now() + file.originalname)
 }
})

//upload parameters for multer
const upload = multer({
 storage: storage,
 limits: {
   fieldSize: 1024 * 1024 * 3,
 }
})

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
  resave: true,
  saveUninitialized: false,
  name: 'userInSession'
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))
app.use(express.static( "public" ))
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
            password: hashedPassword,
            verified: false,
          })
          await newUser.save()
          //console.log(req.body)
          .then((result)=>{
            // email verification
            sendVeriEmail(result, res);
          })
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

// send verification email
const sendVeriEmail = ({_id, email}, res) => {
  const currentUrl = "/register/"
  const uniqueString = uuidv4() + _id;
  // mail options
  const mailOptions= {
    from: process.env.AUTH,
    to: email,
    subject: "Verify Your Email from Artisan Sky",
    html: `<p>Verify your email address to complete the signup and login into your Artisan Sky account.</p><p>This link <b>expires in 15 minutes</b>.</p><p>Press <a href=${currentUrl + "user/verify/" + _id + "/" + uniqueString}>here</a> to proceed.</p>`, 
  };
  // hashing the unique string
  const saltRounds = 10;
  bcrypt.hash(uniqueString, saltRounds)
    .then((hashedUniqueString)=>{
      const newVeri = new UserVerification({
        userId: _id,
        uniqueString: hashedUniqueString,
        createdAt: Date.now(),
        expiresAt: Date.now() + 900
      });
      newVeri.save()
      .then(()=>{
        transporter.sendMail(mailOptions)
        .then(()=>{
          res.json({
            status: "Pending"
          })
        })
        .catch((err)=>{
          console.log(err)
          res.status(404).send("Error of verification email");  
        })
        
      })
      .catch((err)=>{
        console.log(err);
        res.status(404).send("Error while saving verfi email data");
      })
    })
    .catch((err)=>{
      res.status(404).send("Error while hashing data");
    })
}


// verify email
app.get("/verify/:userId/:uniqueString", (req,res) => {
  let {userId, uniqueString} = req.params;
  UserVerification.find({userId})
  .then((result) => {
    if (result.length > 0){
      const {expiresAt} = result[0];
      const hashedUniqueString = result[0].uniqueString;
      if (expiresAt < Date.now()) {
        UserVerification.deleteOne({userId})
        .then(result=>{
          user.deleteOne({_id: userId})
          .then(()=>{
            let msg = "Please sign up again."
            res.redirect(`/user/verified/error=true&message=${msg}`);
          })
          .catch((err)=>{
            let msg = "Deleting user..."
            res.redirect(`/user/verified/error=true&message=${msg}`);
          })
        })
        .catch((err)=>{
          console.log(err);
          let msg = "Error because the email verification expired"
          res.redirect(`/user/verified/error=true&message=${msg}`);
        })
      } else {
        bcrypt.compare(uniqueString, hashedUniqueString)
        .then((result)=>{
          if (result) {
            user.updateOne({_id:userId}, {verified:true})
            .then(()=>{
              UserVerification.deleteOne({userId})
              .then(()=>{
                res.sendFile(path.join(__dirname, "./views/verified.ejs"))
              })
              .catch((err)=>{
                console.log(err);
                let msg = "Error at the last step"
                res.redirect(`/user/verified/error=true&message=${msg}`);  
              })
            })
            .catch((err)=>{
              console.log(err);
              let msg = "Error while updating record"
              res.redirect(`/user/verified/error=true&message=${msg}`);  
            })
          } else {
            let msg = "Invalid verification details. Click the link again"
            res.redirect(`/user/verified/error=true&message=${msg}`);  
          }
        })
        .catch((err)=>{
          let msg = "Error while comparing unique string"
          res.redirect(`/user/verified/error=true&message=${msg}`);  
        })
      }
    } else {
      let msg = "Verified already or account record does not exist. Please signup or login."
      res.redirect(`/user/verified/error=true&message=${msg}`);  
    }
  })
  .catch((err)=>{
    console.log(err)
    let msg = "Error while checking for existing user verification record"
    res.redirect(`/user/verified/error=true&message=${msg}`);
  })
})

app.get("/verified", (req, res) => {
  res.sendFile(path.join(__dirname, "./views/verified.ejs"));
})

app.post('/profile', upload.single('profile_image'), checkAuthenticated, async (req, res) => {
  try{
    //console.log("req.session: "+ req.session.passport.user)
    let updateUser = await user.findOneAndUpdate({id: req.session.passport.user}, {profile_image: req.file.filename}, {new: true})
    user_image = "/uploads/user_profile_images/" + updateUser.profile_image
    req.flash('info', user_image)
    return res.render('index')
  } catch (error){
    console.log(error)
    res.redirect('/profile')
  }
})
//app.put('/pwmod', (req, res) => {
//app.put('/pwmod', passport.authenticate('local'), (req, res) => {
app.put('/pwmod', checkAuthenticated, 
  (req, res) => {
    console.log("User: "+ req.session.passport.user)
    console.log(req.body)
    user.findOne({id: req.session.passport.user},
      (errUser, User) => {
        //console.log(User)
        if (errUser || User == null){
          res.render('passwordmod')
        }
        else (bcrypt.compare(req.body['og_pw'], User['password'], 
          (err, eq) => {
            //console.log(eq)
            if (err)
              res.render('passwordmod')
            if (eq) {
              bcrypt.hash(req.body['new_pw'], 10, 
                (err, hash) => {
                  if (err)
                    res.render('passwordmod')
                  else {
                    //User['password'] = req.body['new_pw']
                    User['password'] = hash;
                    User.save();
                    req.flash('success', 'Successfully changed password')
                    res.render('passwordmod')
                  }
                }
              )
            }
            else {
              req.flash('og_pw', 'Original password is incorrect')
              res.render('passwordmod')
            }
          }
        ))
      }
    )
  }
)

//Get log out request 
app.delete('/logout', (req, res) => {
  req.session.destroy(() => {
    console.log('session destroyed')
  })
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

