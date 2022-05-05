/*
*
* PROGRAM Post model - define the post model 
* PROGRAMMER: Poon Tsz Fung(1155142944), Lam Lok Hin(1155143373)
* VERSION 2.3: written 05/05/2022
* PURPOSE: The define the structure of a post
* METHOD: Use mongoose.Schema and export as 'post'
*
*/

const mongoose = require('mongoose');
var Schema= mongoose.Schema;
const user = require('./user_model')

const postSchema = new mongoose.Schema({
    caption: {
      type: String
    },
    file_path: {
      type: String,
      require: true
    },
    creater: {
        name: {
            type: String,
            require: true
        },
        email: {
            type: String,
            require: true
        },
        _id: {
            type: Schema.Types.ObjectId, ref: 'user',
        }
    },
    createTime: {
      type: String,
      require: true
    },
    likes:{
      type: Number,
      default: 0,
    },
    comments: [{
        user: {
            name: {
                type: String,
                // require: true
              },
              email: {
                type: String,
                // require: true
              },
              _id: {
                type: Schema.Types.ObjectId, ref: 'user',
              },
        },
        comment: {
            type: String,
        },
        createTime: {
            type: String,
        }
    }],
  })

module.exports = mongoose.model('post', postSchema);