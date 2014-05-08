"use strict"

var http = require("http");
var url = require("url");
var png = require("png").Png;

function hash(s) {
  var key = 0;
  for (var i = 0; i < s.length; ++i) {
    var c = s.charCodeAt(i);
    key = ((key << 5) - key) + s.charCodeAt(i);
    key &= key;
  }
  return Math.abs(key);
}

http.createServer(function(req, res) {
  var request = url.parse(req.url, true);
  var action = request.pathname.substr(1);
  var width = 16;
  var height = 16;

  var key = hash(action);
  var red = (key ^ 55818801) % 255;
  var green = (key ^ 30023737) % 255;
  var blue = (key ^ 54382664) % 255;

  var buffer = new Buffer(width * height * 3);
  for (var i = 0; i < height; ++i) {
    for (var j = 0; j < width; ++j) {
      buffer[i * width * 3 + j * 3 + 0] = red;
      buffer[i * width * 3 + j * 3 + 1] = green;
      buffer[i * width * 3 + j * 3 + 2] = blue;
    }
  }
  var image = new png(buffer, width, height, "rgb").encodeSync();
  res.writeHead(200, {"Content-Type": "image/png"});
  res.end(image.toString("binary"), "binary");
}).listen(8080, "127.0.0.1");

console.log("rndpng running at localhost:84");
