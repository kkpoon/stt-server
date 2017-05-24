var express = require('express');
var morgan = require("morgan");

var PORT = process.env.PORT || "3000";

var app = express();
app.use(morgan("tiny"));
app.post("/convert", function(req, res) {
});
app.use(function(req, res) {
    res.sendStatus(404);
});
app.listen(+PORT);

