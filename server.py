from flask import Flask, request, jsonify, send_file
import requests
import uuid
import os
import subprocess

app = Flask(__name__)

@app.route("/merge", methods=["POST"])
def merge_video():
    data = request.get_json()
    audio_url = data.get("audio_url")
    image_url = data.get("image_url")

    if not audio_url or not image_url:
        return jsonify({"error": "Missing audio_url or image_url"}), 400

    try:
        uid = uuid.uuid4().hex
        audio_path = f"/tmp/audio_{uid}.mp3"
        image_path = f"/tmp/image_{uid}.jpg"
        output_path = f"/tmp/output_{uid}.mp4"

        with open(audio_path, "wb") as f:
            f.write(requests.get(audio_url).content)

        with open(image_path, "wb") as f:
            f.write(requests.get(image_url).content)

        command = [
            "ffmpeg",
            "-loop", "1",
            "-i", image_path,
            "-i", audio_path,
            "-c:v", "libx264",
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
            "-movflags", "+faststart",
            "-pix_fmt", "yuv420p",
            output_path
        ]
        subprocess.run(command, check=True)

        return send_file(output_path, mimetype="video/mp4")

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/")
def index():
    return "FFmpeg Video Merger is running."

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
