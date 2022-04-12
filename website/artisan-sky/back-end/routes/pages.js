//
//This pages.js is use to render to corresponding pages by request
//
const express = require('express')
const router = express.Router()
const mongoose = require('mongoose');
mongoose.connect("mongodb+srv://artisansky:webuildappfromscratch@artisan.0mzss.mongodb.net/Artisan?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
const user = require("../user_model")
const post = require("../post_model");
const { query } = require('express');
router.use(express.static(__dirname + '../views/chat_room'));

router.get("/view_post", function(req, res){
    post.findOne({ "_id": req.query._id }, function (error, gotPost){
        if(req.session.passport){
            user.findOne({id: req.session.passport.user}, async (logedInUser) => {
                const updateUser = await user.findOne({id: req.session.passport.user})
                var user_image = "/uploads/user_profile_images/" + updateUser.profile_image
                req.flash('info', user_image)
                res.render("view_post", {
                    "isLogin": true,
                    "query": req.query,
                    "gotPost": gotPost,
                    "creater": logedInUser,
                    "name": updateUser.name,
                })
            })
        } else {
            res.render("view_post", {
                "isLogin": false,
                "query": req.query,
                "gotPost": gotPost,
            })
        }
    })
})

router.get('/new_post', checkAuthenticated, async (req, res) => {
    if(req.session.passport.user){
        const updateUser = await user.findOne({id: req.session.passport.user})
        var user_image = "/uploads/user_profile_images/" + updateUser.profile_image
        req.flash('image', user_image)
        req.flash('info', null)
        res.render("my_upload", {
            "query": req.query,
            "user": updateUser,
            name: updateUser.name
        })




        // user.findOne({id: req.session.passport.user}, (logedInUser) => {
        //     post.find({"creater.id": req.session.passport.user})
        //     .sort({
        //         createTime: -1
        //     }).exec( async (error1, result) => {
        //         const updateUser = await user.findOne({id: req.session.passport.user})
        //         var user_image = "/uploads/user_profile_images/" + updateUser.profile_image
        //         req.flash('image', user_image)
        //         res.render("my_upload", {
        //             "query": req.query,
        //             "posts": result,
        //             "user": logedInUser,
        //             name: updateUser.name
        //         })
        //     })
        // })
    }else{
        res.redirect('/login')
    }
})

router.get('/pwmod', checkAuthenticated, 
async (req, res) => {
    const updateUser = await user.findOne({id: req.session.passport.user})
    // console.log(updateUser)
    if (updateUser.user_type == 'user'){
        var user_image = "/uploads/user_profile_images/" + updateUser.profile_image
        req.flash('info', user_image)
        req.flash('success', null)
        req.flash('fail', null)
        res.render('passwordmod', {name: updateUser.name, email: updateUser.email})
    }
})

router.get("/test", (req, res) => {
    res.send("<h1>It's working 🤗</h1>")
})

router.get("/", async (req, res) => {
    post.find()
    .sort({createTime: -1})
    .exec(function(err, posts){
        if(req.session.passport){
             user.findOne({id: req.session.passport.user}, (error, User)=>{
                req.flash('pic', posts.file_path)
                var user_image = "/uploads/user_profile_images/" + User.profile_image
                req.flash('info', user_image)
            
                return res.render('homepage.ejs', {
                    "isLogin": true,
                    "query": req.query,
                    "user": User,
                    "posts": posts,
                    name: User.name
                })
             })
                
        }else{
            return res.render('homepage.ejs', {
                "isLogin": false,
                "query": req.query,
                "posts": posts
            })
        }
    })
})

router.get("/profile",  checkAuthenticated, async (req, res) => {
    const updateUser = await user.findOne({id: req.session.passport.user})
    // console.log(updateUser)
    if (updateUser.user_type == 'user'){
        var user_image = "/uploads/user_profile_images/" + updateUser.profile_image
        req.flash('info', user_image)
        res.render('index.ejs', {name: updateUser.name, email: updateUser.email})
    }
    else if (updateUser.user_type == 'admin'){
        // var user_image = "/uploads/user_profile_images/" + updateUser.profile_image
        // req.flash('info', user_image)
        res.redirect("/adminprofile")
    }
})

router.get("/change_icon", checkAuthenticated, async (req, res) =>{
    const updateUser = await user.findOne({id: req.session.passport.user})
    var user_image = "/uploads/user_profile_images/" + updateUser.profile_image
    req.flash('info', user_image)
    res.render("change_icon", {name: updateUser.name})
})

// router.get("/profile",  checkAuthenticated, async (req, res) => {
//     const updateUser = await user.findOne({id: req.session.passport.user})
//     // console.log(updateUser)
//     var user_image = "/uploads/user_profile_images/" + updateUser.profile_image
//     req.flash('info', user_image)
//     res.render('index.ejs')
// })

router.get("/adminprofile", checkAuthenticated, async (req, res) => {
    const updateUser = await user.findOne({id: req.session.passport.user})
    var user_image = "/uploads/user_profile_images/" + updateUser.profile_image
    req.flash('info', user_image)
    res.render("adminIndex", {name: updateUser.name, email: updateUser.email})
    //res.render('adminIndex.ejs')
})

router.get("/login", checkNotAuthenticated, (req, res) => {
     // const updateUser = await user.findOne({id: req.session.passport.user})
    //if (updateUser.verified === true) {
        req.flash('info', null)
        res.render('login')    
    //} else {
        //req.flash('info', null)
        //res.render('not_verified')
    //}
})

// router.get("/adminlogin", checkAdminNotAuthenticated, (req, res) => {
//     req.flash('info', null)
//     res.render('adminlogin')
// })

router.get("/register", checkNotAuthenticated, (req, res) => {
    req.flash('info', null)
    res.render('register.ejs')
})


router.get("/chatroom", (req,res)=>{
    req.flash('info', null)
    res.render('chat_room/chat_room.ejs')
})

router.get("/chat", (req,res)=>{
    req.flash('info', null)
    res.render('chat_room/chat.ejs')
})

router.get('/waitForVeri',checkNotAuthenticated, (req, res) => {
    res.render('waitForVeri')

})


router.get("/my_posts", checkAuthenticated, async (req, res) => {
        const User = await user.findOne({id: req.session.passport.user})
        var user_image = "/uploads/user_profile_images/" + User.profile_image
        
        post.find({"creater.name": User.name})
        .sort({createTime: -1})
        .exec(function(err, posts){
            if(req.session.passport){
                    req.flash('pic', posts.file_path)
                    req.flash('image', user_image)
                    return res.render('my_posts.ejs', {
                        "isLogin": true,
                        "query": req.query,
                        "user": User,
                        "posts": posts,
                        name: User.name
                    })
            }else{
                
                return res.render('my_posts.ejs', {
                    "isLogin": false,
                    "query": req.query,
                    "posts": posts,
                })
            }
        })
    
})

function checkAuthenticated(req, res, next){
    if (req.isAuthenticated()){
        return next()
    }
    res.redirect('/login')
}

function checkNotAuthenticated(req, res, next){
    if (req.isAuthenticated()){
        return res.redirect('/profile')
    }
    next()
}

// function checkAdminNotAuthenticated(req, res, next){
//     if (req.isAuthenticated()){
//         return res.redirect('/adminprofile')
//     }
//     next()
// }



module.exports = router;