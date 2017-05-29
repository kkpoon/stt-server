# stt-server

## Problem

Why? Google Speech Recognition is already a RESTful API. However, it is limited to input Lossless audio file.

If you have a `.mp3`, or `.aac` file, this server use `ffmpeg` to convert the audio file into `FLAC` format and send it to Google API.
