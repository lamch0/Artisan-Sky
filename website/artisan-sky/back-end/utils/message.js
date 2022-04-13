const moment = require('moment-timezone');

function formatMsg(username, text) {
    return {
        username,
        text,
        time: moment().tz("Asia/Taipei").format('h:mm a')
    }
}

module.exports = formatMsg;