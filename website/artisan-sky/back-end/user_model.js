/*
*
* PROGRAM User model - define the user model 
* PROGRAMMER: Poon Tsz Fung(1155142944), Lam Lok Hin(1155143373)
* VERSION 2.3: written 05/05/2022
* PURPOSE: The define the structure of a user
* METHOD: Use mongoose.Schema and export as 'user'
*
*/

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
      type: String,
      require: true
    },
    id: {
      type: String,
      require: true,
      unique: true
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
    },
    verified: {
      type: Boolean,
      default: false,
    },
    user_type: {
      type: String,
      default: 'user'
    }
  })

module.exports = mongoose.model('user', userSchema);
