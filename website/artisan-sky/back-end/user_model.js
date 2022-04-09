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
    verfied: {
      type: Boolean,
      default: false,
    },
    user_type: {
      type: String,
      default: 'user'
    }
  })

module.exports = mongoose.model('user', userSchema);
