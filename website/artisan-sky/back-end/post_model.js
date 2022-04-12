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
        // id: {
        //     type: String,
        //     require: true
        // },
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
              // id: {
              //   type: String,
              // },
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