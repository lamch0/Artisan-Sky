const moment = require('moment');

function formatMsg(username, text) {
    return {
        username,
        text,
        time: moment().format('h:mm a')
    }
}

module.exports = formatMsg;