/*
*
* PROGRAM Pages - use to format the message
* PROGRAMMER: Lam Cheuk Hin(1155143825)
* VERSION 2.3: written 05/05/2022
* PURPOSE: This message.js is used for formatting the message
* METHOD: format message with text username and time
*
*/

const moment = require('moment-timezone');

function formatMsg(username, text) {
    return {
        username,
        text,
        time: moment().tz("Asia/Taipei").format('h:mm a')
    }
}

module.exports = formatMsg;