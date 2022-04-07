//
//This pages.js is use to render to corresponding pages by request
//
const express = require('express')
const router = express.Router()


router.get('/pwmod', checkAuthenticated, (req,res) => {
    res.render('passwordmod')  
  })

router.get("/test", (req, res) => {
    res.send("<h1>It's working 🤗</h1>")
})

router.get("/", (req, res) => {
    res.render('homepage.ejs')
})

router.get("/profile",  checkAuthenticated, (req, res) => {
    res.render('index.ejs')
})

router.get("/login", checkNotAuthenticated, (req, res) => {
    req.flash('info', null)
    res.render('login')
})

router.get("/register", checkNotAuthenticated, (req, res) => {
    req.flash('info', null)
    res.render('register.ejs')
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

module.exports = router;