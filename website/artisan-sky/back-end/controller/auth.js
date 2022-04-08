const user = require("./user_model")

exports.signup = (req,res) => {
    console.log(req.body);
    const {name, email, password} = req.body;
    user.findOne({email})
    .exec((err,e) => {
        if (e) {
            return res.status(400).json({error: "User with this email already exists."});
        }
        let newUser = new user({name, email, password});
        newUser.save((err, success) => {
            if (err) {
                console.log("Error in signup: ", err);
                return res.status(400), json({error: err})
            }
            res.json({
                message: "Signup success!"
            })
        })
    })
}