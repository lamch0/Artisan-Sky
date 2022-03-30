/*var http = require('http');
var fs = require('fs');
http.createServer(function (req, res) {
  fs.readFile('homepage.html', function(err, data) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(data);
    return res.end();
  });
}).listen(8080);*/

const express = require('express');

const app = express();

app.get("/", async (req, res) => {
  try {
    res.send("<h1>Artisan's Sky</h1>")
  } catch (error) {
    res.send(error)
  }
});

const port = 8080;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

