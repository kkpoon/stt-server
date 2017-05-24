var express = require("express");
var morgan = require("morgan");
var bodyParser = require("body-parser");
var fetch = require("node-fetch");
var ffmpeg = require("fluent-ffmpeg");
var stream = require("stream");

var PORT = process.env.PORT || "3000";
var APIKEY = process.env.APIKEY || "";

function convertAudioToFLAC(audio) {
    return new Promise(function (resolve, reject) {
        var inStream = new stream.PassThrough();
        inStream.end(audio);
        var outStream = new stream.PassThrough();
        var bufs = [];
        var command = ffmpeg(inStream)
            .format("flac")
            .on("error", function (err) { return reject(err); })
            .pipe(outStream, { end: true });
        outStream.on("data", function (d) { return bufs.push(d); });
        outStream.on("end", function () { return resolve(Buffer.concat(bufs)); });
    });
}

function stt(audio, lang) {
    return convertAudioToFLAC(audio)
        .then(function (flac) {
            return fetch("https://speech.googleapis.com/v1/speech:recognize?key=" + APIKEY, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    config: {
                        encoding: "FLAC",
                        sampleRateHertz: 8000,
                        languageCode: lang
                    },
                    audio: { content: flac.toString("base64") }
                })
            })
                .then(function (res) { return res.json(); })
                .then(function (result) {
                    return result.results
                        && result.results.length > 0
                        && result.results[0].alternatives.length > 0 ?
                        result.results[0].alternatives[0] : {};
                });
        });
}

var app = express();
app.use(morgan("tiny"));
app.use(bodyParser.json());

app.post("/convert", function(req, res) {
    if (!req.body || !req.body.url || !req.body.lang) {
        res.sendStatus(400);
    } else {
        fetch(req.body.url)
            .then(function(audioRes) {
                return audioRes.buffer();
            })
            .then(function(audio) {
                return stt(audio, req.body.lang);
            })
            .then(function(sttRes) {
                var result = {
                    text: sttRes.transcript || "",
                    confidence: sttRes.confidence || 0
                };
                res.json(result);
            })
            .catch(function(err) {
                console.error("error: " + err);
                res.sendStatus(500);
            });
    }
});

app.use(function(req, res) {
    res.sendStatus(404);
});
app.listen(+PORT);

