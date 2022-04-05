//
//This passport-config.js is to use the passport extension from expressJs to athenticate users, compare password and perform login function.
//
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const mysql = require("mysql")

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST, //if network put ip address
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE,
    //socketPath: '/Applications/MAMP/tmp/mysql/mysql.sock'
  })

function initialize(passport){
    const authenticateUser = async (email, password, done) => {
        db.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
            if(error){
                console.log(error)
            }else{
                const user = results
                if (user.length === 0){
                    return done(null, false, { message: "No user with that email!" })
                }
                try{
                    if (await bcrypt.compare(password, user[0].password)){
                        return done(null, user)
                    } else {
                        return done(null, false, { message: "Incorrect password!"})
                    }
                } catch(e) {
                    return done(e)
                }
            }
        })
        
    }
    passport.use(new LocalStrategy({usernameField: 'email'},
    authenticateUser))
    passport.serializeUser((user, done) => done(null, user))
    passport.deserializeUser((id, done) => {
        db.query('SELECT * FROM users WHERE id = ?', [id], async (error, results) => {
            if(error){
                console.log(error)
            }else{
                return done(null, results)
            }
            })
        })
 }

/*function initialize(passport, getUserByEmail, getUserById){
    const authenticateUser = async (email, password, done) => {
        const user = getUserByEmail(email)
        console.log("user: " + user)   
        if (user== null){
            return done(null, false, { message: "No user with that email!" })
        }
        try{
            if (await bcrypt.compare(password, user.password)){
                return done(null, user)
            } else {
                return done(null, false, { message: "Incorrect password!"})
            }
        } catch(e) {
            return done(e)
        }
    }
    
    passport.use(new LocalStrategy({usernameField: 'email'},
    authenticateUser))
    passport.serializeUser((user, done) => done(null, user.id))
    passport.deserializeUser((id, done) => {  
        return done(null, getUserById(id))})
}*/

module.exports = initialize