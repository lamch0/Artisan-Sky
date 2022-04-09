const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    file_path: {
      type: String,
      require: true
    },
    creater: {
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
    },
    createTime: {
      type: String,
      require: true
    },
    likers:[{
        id: {
            type: String
        }
    }],
    comments: [{
        user: {
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