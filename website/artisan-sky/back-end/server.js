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
const formidable = require('formidable')
const fileSystem = require('fs')

const http = require('http')
const server = http.createServer(app)
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users')
const socketio = require('socket.io')
const io = socketio(server)
const formatMsg = require('./utils/message')

dotenv.config({ path: './.env'})

//Make connection to mongodb
mongoose.connect("mongodb+srv://artisansky:webuildappfromscratch@artisan.0mzss.mongodb.net/Artisan?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
const user = require("./user_model")
const post = require("./post_model")
//const admin = require("./admin_model")

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
    // console.log("ready for messages");
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

// initializeAdminPassport(
//     passport,
//     async (id) => {
//       const adminFound = await admin.findOne({id: id});
//       return adminFound;
//   }
// )


app.use(morgan(":method :url :status :res[content-length] - :response-time ms"))
app.set('views', path.join(__dirname, "views"));
app.set('view engine', 'ejs')
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: false,
  name: 'userInSession'
}))
app.use(passport.initialize())
//app.use(passport.admininitialize())
app.use(passport.session())
app.use(methodOverride('_method'))
app.use(express.static( "public" ))
app.use(express.static( "views" ))
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

// app.post('/adminlogin', checkAdminNotAuthenticated, passport.authenticate('local', {
//   successRedirect: '/adminprofile',
//   failureRedirect: '/adminlogin',
//   failureFlash: true
// }))

app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
      const { name, email, password, passwordConfirm } = req.body
      const userExists = await user.findOne({ email: email})
      if(userExists){
        req.flash('info', 'That email is already in use')
        return res.render('register')
      } else if (password !== passwordConfirm){
        req.flash('info', 'Passwords do not match')
        return res.render('register')
      } else {
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
          res.redirect('/waitForVeri')
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

const botName = 'Artisan Sky Bot'
// Run when clients connects
io.on('connection', socket => {
  socket.on('joinRoom', ({username, room})=>{
    const user = userJoin(socket.id, username, room);
    socket.join(room);


    socket.emit('message', formatMsg(botName, 'Welcome to the Real-time Chat Room!'));

    // Broadcast when a user connects
    socket.broadcast.to(user.room)
    .emit('message', formatMsg(botName, `${user.username} has joined the chat`));

    // Info sidebar
    io.to(user.room)
    .emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    }) 
  })

  // Listen for chatMessage
  socket.on('chatMessage', (msg) => {
    const user = getCurrentUser(socket.id);

    io.to(user.room)
    .emit('message', formatMsg(user.username, msg));
  });

  // when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room)
      .emit('message', formatMsg(botName, `${user.username} has left the chat`));

      // Info sidebar
      io.to(user.room)
      .emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      }) 
    }
  });
})

// send verification email
const sendVeriEmail = ({_id, email}, res) => {
  const currentUrl = "http://100.26.109.239:8080/"
  const uniqueString = uuidv4() + _id;
  // mail options
  const mailOptions= {
    from: process.env.AUTH,
    to: email,
    subject: "Verify Your Email from Artisan Sky",
    html: `<p>Verify your email address to complete the signup and login into your Artisan Sky account.</p><p>This link <b>expires in 15 minutes</b>.</p><p>Press <a href=${currentUrl + "user/verified/" + _id + "/" + uniqueString}>here</a> to proceed.</p>`, 
  };
  // hashing the unique string
  const saltRounds = 10;
  bcrypt.hash(uniqueString, saltRounds)
    .then((hashedUniqueString)=>{
      const newVeri = new UserVerification({
        userId: _id,
        uniqueString: hashedUniqueString,
        createdAt: Date.now(),
        expiresAt: Date.now() + 900000
      });
      newVeri.save()
      .then(()=>{
        transporter.sendMail(mailOptions)
        .then(()=>{
          // res.json({
          //   status: "Pending"
          // })
        })
        .catch((err)=>{
          console.log(err)
          // res.status(404).send("Error of verification email");  
        })
        
      })
      .catch((err)=>{
        console.log(err);
        res.status(404).send("Error while saving verify email data");
      })
    })
    .catch((err)=>{
      res.status(404).send("Error while hashing data");
    })
}


// verify email
app.get("/user/verified/:userId/:uniqueString", (req,res) => {
  let {userId, uniqueString} = req.params;
  UserVerification.find({userId})
  .then((result) => {
    if (result.length > 0){
      const {expiresAt} = result[0];
      const hashedUniqueString = result[0].uniqueString;
      if (expiresAt < Date.now()) {
        // console.log(expiresAt)
        // console.log(Date.now)
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
                // res.sendFile(path.join(__dirname, "./views/verified.ejs"))
                res.render("verified.ejs")
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

app.get("/user/verified", (req, res) => {
  res.sendFile(path.join(__dirname, "./views/verified.ejs"));
})

app.post('/profile', upload.single('profile_image'), checkAuthenticated, async (req, res) => {
  try{
    //console.log("req.session: "+ req.session.passport.user)
    let updateUser = await user.findOneAndUpdate({id: req.session.passport.user}, {profile_image: req.file.filename}, {new: true})
    user_image = "/uploads/user_profile_images/" + updateUser.profile_image
    req.flash('info', user_image)
    const User = await user.findOne({id: req.session.passport.user})
    return res.render('index', {name: User.name, email: User.email})
  } catch (error){
    console.log(error)
    res.redirect('/profile')
  }
})

//changes password of normal user from passwordmod.ejs
app.put('/pwmod', checkAuthenticated, 
  async (req, res) => {
    //console.log(JSON.stringify(req.body))
    const updateUser = await user.findOne({id: req.session.passport.user})
    // console.log(updateUser)
    if (updateUser.user_type == 'user'){
        var user_image = "/uploads/user_profile_images/" + updateUser.profile_image
        req.flash('info', user_image)
        // req.flash('success', null)
        // req.flash('fail', null)
        //res.render('passwordmod', {name: updateUser.name, email: updateUser.email})
    }
    // console.log("User: "+ req.session.passport.user)
    console.log(req.body)
    user.findOne({id: req.session.passport.user},
      async (errUser, User) => {
        console.log("we need old password "+User.password)
        if (errUser || User == null){
          //res.render('passwordmod', {name: updateUser.name, email: updateUser.email})
        }
        else (await bcrypt.compare(req.body['og_pw'], User['password'], 
          async (err, eq) => {
            console.log(eq)
            // if (err)
              //res.render('passwordmod', {name: updateUser.name, email: updateUser.email})
            if (eq) {
              bcrypt.hash(req.body['new_pw'], 10, 
                (err, hash) => {
                  if (err){
                    //res.render('passwordmod', {name: updateUser.name, email: updateUser.email})
                  }
                  else {
                    //User['password'] = req.body['new_pw']
                    console.log('correct password')
                    User['password'] = hash;
                    User.save();
                    let success_message = `Successfully changed password`
                    req.flash('success', success_message)
                    res.render('passwordmod', {name: updateUser.name, email: updateUser.email})
                  }
                }
              )
            }
            else {
              console.log('wrong password')
              let fail_message = `Original password is incorrect`
              req.flash('fail', fail_message)
              res.render('passwordmod', {name: updateUser.name, email: updateUser.email})
            }
          }
        ))
      }
    )
  }
)

app.post('/adminprofile', upload.single('profile_image'), checkAuthenticated, async (req, res) => {
  try{
    let updateUser = await user.findOneAndUpdate({id: req.session.passport.user}, {profile_image: req.file.filename}, {new: true})
      user_image = "/uploads/user_profile_images/" + updateUser.profile_image
      req.flash('info', user_image)
      return res.render('index')
    } catch (error){
      console.log(error)
      res.redirect('/profile')
    }
})

app.put('/resetpw', checkAuthenticated, async (req, res) => {
  try{
    //console.log("in resetpw put body: "+ req.body.id)
    user.findOne({id: req.body.id},
      (err, user) => {
        if (err)
          res.sendStatus(404)
        else {
          bcrypt.hash(req.body.password, 10, 
            (err, hash) => {
              if (err)
                res.sendStatus(404)
              else {
                user['password'] = hash;
                user.save();
                res.sendStatus(204)
              }
            }
          )
        }
      })
  } catch {
    res.sendStatus(404)
  }
})

app.get('/getusers', checkAuthenticated, async (req, res) => {
  user.find({},
    (err, users) =>{
      if (err)
        res.redirect('/adminprofile')
      else {
        let new_users = ''
        users.forEach(user => {
          let new_user_row = user_info(user.id, user.name, user.email)
          //console.log(new_user_row)
          new_users = new_users + new_user_row
        });
        //console.log(new_users)
        res.send(new_users)
      }
    })
})

app.get('/manageusers', checkAuthenticated, async (req, res) => {
  try{
    const updateUser = await user.findOne({id: req.session.passport.user})
    var user_image = "/uploads/user_profile_images/" + updateUser.profile_image
    req.flash('info', user_image)
    res.render("manageUsers", {name: updateUser.name, email: updateUser.email})
        //res.render('manageUsers')
  } catch (error){
    console.log(error)
    res.redirect('/adminprofile')
  }
})

function user_info(id, name, email){
  return(`  <tr name="user">
    <th name="id" scope="row">${id}</th>
    <td name="name">${name}</td>
    <td name="email">${email}</td>
    <td>
      <input type="button" value="Reset password" class="btn btn-primary" onclick="resetpw(${id})">
    </td>
  </tr>
`)
}
{/* <form action="/resetpw?_method=PUT" method="POST">
  <button name="id_to_reset" value="${id}" class="btn btn-primary" type="button">Reset password</button>
</form> */}


//Get log out request 
app.delete('/logout', (req, res) => {
  req.session.destroy(() => {
    console.log('session destroyed')
  })
  req.logOut()
  res.redirect('/login')
})

app.post("/upload_post", checkAuthenticated, async function(req, res){
  //console.log("upload caption: "+req.body.caption)
  var formData = new formidable.IncomingForm();
  formData.maxFileSize = 1000 * 1024 * 1024
  formData.parse(req, function(error1, fields, files){
    //console.log("upload caption: "+JSON.stringify(fields))
    var oldPath = files.image.filepath
    var newPath = "public/uploads/post_images/" + new Date().getTime() + "-" + files.image.originalFilename
    fileSystem.rename(oldPath, newPath, async(error2)=>{
      const creater = await user.findOne({ id: req.session.passport.user }, {email: 1, name: 1});
      //console.log(JSON.stringify(creater))
      // delete creater.password
      // delete creater.id
      var currentTime = new Date().getTime()

        const newPost = new post({
          caption: fields.caption,
          file_path: newPath,
          creater: creater,
          createTime: currentTime,
          likers: [],
          comments: [],
        })
        await newPost.save()
        req.flash('info', "Post have been successfully uploaded!")
        var user_image = "/uploads/user_profile_images/" + creater.profile_image
        req.flash('image', user_image)
        return res.render('my_upload', {name: creater.name})
      
    })
  })
})

app.post("/do_like", (req, res) => {
  if(req.session.passport){
    post.findOne({ "_id": req.body._id, "likers._id": req.session.passport.user}, (error, video) => {
      if(video == null){
        post.updateOne({"_id": req.body._id}, {
          $push:{
            "likers": {
              "_id": req.session.passport.user
            }
          }
        }, (error, data)=>{
          res.json({
            "status": "success",
            "message": "Image has been liked"
          })
        })
      } else {
        res.json({
          "status": "success",
          "message": "You have already liked this image."
        })
      }
    })
  } else{
    res.json({
      "status": "error",
      "message": "Please login to like"
    })
  }
})

app.post("/do_comment", (req, res) => {
  if(req.session.passport){
    var comment = req.body.comment
    var _id = req.body._id 
    console.log("id: "+req.session.passport.user)
    console.log("session: "+req.session.passport)
    user.findOne({id: req.session.passport.user}, function(error, User){
      console.log("User: "+User)
      delete User.password

      post.findOneAndUpdate({
        "_id": _id
      }, {
        $push: {
          "comments": {
            "user": User,
            "comment": comment,
            "createTime": new Date().getTime()
          }
        }
      }, function (error, data){
        res.redirect("/view_post?_id=" + _id + "&message=success#comments")
      })
    })

  }else{
    res.redirect("/view_post?_id=" + _id + "&error=not_login#comments")
  }
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

// function checkAdminAuthenticated(req,res,next){
//   if (req.isAuthenticated()){
//     return next()
//   }
//   console.log("Admin not authenticated, returning to login")
//   res.redirect('/adminlogin')
// }

// function checkAdminNotAuthenticated(req,res,next){
//   if (req.isAuthenticated()){
//     console.log("Admin authenticated, returning to admin profile")
//     return res.redirect('/adminprofile')
//   }
//   next()
// }

//print what port we are listening
const port = process.env.PORT || 8080
server.listen(port, () => {
  console.log(`Listening on port:${port}`)
})

