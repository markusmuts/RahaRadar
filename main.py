from flask import Flask, render_template
import pyrebase

config = {
  "apiKey": "AIzaSyCewjkjV-23sjbKG2QpNQfxo2SN9lMu2oU",
  "authDomain": "raharadar-27498.firebaseapp.com",
  "databaseURL": "https://raharadar-27498-default-rtdb.europe-west1.firebasedatabase.app/",
  "storageBucket": "raharadar-27498.firebasestorage.app"
}

firebase = pyrebase.initialize_app(config)
auth = firebase.auth()

app = Flask(__name__)

@app.route("/")
def main_page():
    return render_template("tulud.html")

if __name__ == "__main__":
    app.run()

