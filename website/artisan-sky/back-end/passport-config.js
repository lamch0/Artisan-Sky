/*
*
* PROGRAM Passport-config - use as authentication of user
* PROGRAMMER: Poon Tsz Fung(1155142944)
* VERSION 2.3: written 05/05/2022
* PURPOSE: This passport-config.js is to use the passport extension from expressJs to athenticate users, 
*          compare password and perform login function.
* METHOD: Use mongoose.Schema and export as 'post'
*
*/
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')


//Initialize the passport by getting user info
function initialize(passport, getUserByEmail, getUserById){
    const authenticateUser = async (email, password, done) => {
        var user = await getUserByEmail(email)
        if (user == null){
            return done(null, false, { message: "No user with that email!" })
        }
        try{
            console.log("user exists")
            if (!user.verified) {
                return done(null, false, { message: "Not yet verified!"})
            } else {
                if (await bcrypt.compare(password, user.password)){
                    return done(null, user)
                } else {
                    return done(null, false, { message: "Incorrect password!"})
                }
            }
        } catch(error) {
            return done(error)
        }
    }
    
    passport.use(new LocalStrategy({usernameField: 'email'},
    authenticateUser))
    passport.serializeUser((user, done) => done(null, user.id))
    passport.deserializeUser((id, done) => {  
        return done(null, getUserById(id))
    })
}

module.exports = initialize