from flask import Flask, render_template, request, redirect, url_for, flash
import pyrebase
import pandas as pd
import os
from LHV import KuludTulud as LHV_KuludTulud  # Import specific functions for each bank
from SEB import KuludTulud as SEB_KuludTulud
from SWEDBANK import KuludTulud as SWED_KuludTulud

config = {
  "apiKey": "AIzaSyCewjkjV-23sjbKG2QpNQfxo2SN9lMu2oU",
  "authDomain": "raharadar-27498.firebaseapp.com",
  "databaseURL": "https://raharadar-27498-default-rtdb.europe-west1.firebasedatabase.app/",
  "storageBucket": "raharadar-27498.firebasestorage.app"
}

firebase = pyrebase.initialize_app(config)
auth = firebase.auth()
db = firebase.database()

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = "uploads"
app.secret_key = "supersecretkey"

@app.route("/")
def main_page():
<<<<<<< HEAD
    return render_template("kulud.html")
=======
    return render_template("firebase.html")

@app.route("/upload_csv", methods=["POST"])
def upload_csv():
    bank = request.form.get("bank")  # Get the selected bank from the form

    # Check for file uploads based on the bank selection
    if bank == "LHV":
        file = request.files.get("file_lhv")
        if not file or not file.filename.endswith(".csv"):
            flash("Please upload a valid CSV file for LHV.")
            return redirect(url_for("main_page"))
        
        file_path = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
        file.save(file_path)
        
        # Process the LHV file
        result = LHV_KuludTulud(file_path)
        
        # Remove the file after processing
        os.remove(file_path)
    
    elif bank in ["SEB", "SWEDBANK"]:
        income_file = request.files.get("file_income")
        expenses_file = request.files.get("file_expenses")
        
        if not income_file or not income_file.filename.endswith(".csv"):
            flash("Please upload a valid income CSV file.")
            return redirect(url_for("main_page"))
        
        if not expenses_file or not expenses_file.filename.endswith(".csv"):
            flash("Please upload a valid expenses CSV file.")
            return redirect(url_for("main_page"))
        
        # Save files temporarily
        income_file_path = os.path.join(app.config["UPLOAD_FOLDER"], income_file.filename)
        expenses_file_path = os.path.join(app.config["UPLOAD_FOLDER"], expenses_file.filename)
        income_file.save(income_file_path)
        expenses_file.save(expenses_file_path)
        
        # Process files based on the bank
        if bank == "SEB":
            result = SEB_KuludTulud(income_file_path, expenses_file_path)
        elif bank == "SWEDBANK":
            result = SWED_KuludTulud(income_file_path, expenses_file_path)
        
        # Remove files after processing
        os.remove(income_file_path)
        os.remove(expenses_file_path)
    
    else:
        flash("Please select a valid bank.")
        return redirect(url_for("main_page"))
    
    # Render the result on a results page
    return render_template("results.html", result=result)
>>>>>>> 4cc5a79e533f0bbd5cd4a34b14952be56416b3f3

if __name__ == "__main__":
    if not os.path.exists(app.config["UPLOAD_FOLDER"]):
        os.makedirs(app.config["UPLOAD_FOLDER"])
    
    app.run(debug=True)
