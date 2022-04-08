//
//This passport-config.js is to use the passport extension from expressJs to athenticate users, compare password and perform login function.
//
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')

function initialize(passport, getUserByEmail, getUserById){
    const authenticateUser = async (email, password, done) => {
        var user = await getUserByEmail(email)
        if (user == null){
            return done(null, false, { message: "No user with that email!" })
        }
        try{
            //console.log("user exists")
            // if (!user[0].verified) {
            //     return done(null, false, { message: "Not yet verified!"})
            // } else {
                if (await bcrypt.compare(password, user.password)){
                    return done(null, user)
                } else {
                    return done(null, false, { message: "Incorrect password!"})
                }
            // }
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