################################################
# Programmeerimine I
# 2024/2025 sügissemester
#
# Projekt RahaRadar 
# Teema: Isiklike kulude, tulude ja säästmise jälgimise veebirakendus
#
#
# Autorid: Markus Muts, Randel Johannes Reeder
#
# mõningane eeskuju: Eelmise aasta projekt (Koduse eelarve haldamise programm), isiklik vajadus taolise programmi järele
#
# Lisakommentaar (nt käivitusjuhend): Main branchis on fail nimega "ülespanek.md", milles on juhend programmi käivitamiseks
#
##################################################

from flask import Flask, render_template
from flask import Flask, render_template, request, redirect, url_for, flash
import pyrebase
import pandas as pd
import os
from LHV import KuludTulud as LHV_KuludTulud 
from SEB import KuludTulud as SEB_KuludTulud
from SWEDBANK import KuludTulud as SWED_KuludTulud
from flask import jsonify

# Ei saa peita oma config-i kuna muidu programm ei töötaks.
config = {
  "apiKey": "AIzaSyCewjkjV-23sjbKG2QpNQfxo2SN9lMu2oU",
  "authDomain": "raharadar-27498.firebaseapp.com",
  "databaseURL": "https://raharadar-27498-default-rtdb.europe-west1.firebasedatabase.app/",
  "storageBucket": "raharadar-27498.firebasestorage.app"
}


# Firebase ja Flask rakenduse initsialiseerimine
firebase = pyrebase.initialize_app(config)
auth = firebase.auth()
db = firebase.database()

app = Flask(__name__, static_folder='static')
app.config["UPLOAD_FOLDER"] = "uploads"
app.secret_key = "supersecretkey"

@app.route("/")
def main_page():
    entries = db.child("entries").get()
    if entries.val():
        data_list = [{"id": key, **entry} for key, entry in entries.val().items()]
    else:
        data_list = []
    return render_template("kulud.html", data=data_list)

# Funktsioon, mis lisab tehingu Firebase andmebaasi
def add_transaction_to_firebase(date, payer, category, amount):
    transaction_data = {
        "date": date,                 
        "payer": payer,               
        "category": category,         
        "amount": amount              
    }
    
    db.child("entries").push(transaction_data)
    print("Tehing lisatud Firebase'i:", transaction_data)

# Lisab kasutaja esitatud andmed Firebase andmebaasi
@app.route("/add_data", methods=["POST"])
def add_data():
    # Get form inputs
    date = request.form.get("date")
    payer = request.form.get("payer")
    category = request.form.get("category")
    amount = request.form.get("amount")
    
    if date and payer and category and amount:
        try:
            # Push data to Firebase
            db.child("entries").push({
                "date": date,
                "payer": payer,
                "category": category,
                "amount": float(amount)  # Convert amount to float
            })
            flash("Andmed edukalt lisatud!")  # Feedback to user
        except Exception as e:
            print("Viga andmete lisamisel Firebase'i:", e)
            flash("Tekkis viga andmete lisamisel Firebase'i.")
    else:
        flash("Palun täitke kõik väljad.")  # Validation feedback
    
    # Redirect back to the main page
    return redirect(url_for("main_page"))


# Hangib andmed Firebase andmebaasist ja kuvab kulud.html lehel

@app.route("/get_data")
def get_data():
    entries = db.child("entries").get()
    if entries.val():
        data_list = [
            {"id": key, **entry} for key, entry in entries.val().items()
        ]  # Firebase-i andmed sõnastikuks
    else:

        data_list = []

    return render_template("kulud.html", data=data_list)


@app.route("/delete_entry/<entry_id>", methods=["DELETE"])
def delete_entry(entry_id):
    try:
        # Attempt to delete the entry in Firebase
        db.child("entries").child(entry_id).remove()
        return jsonify({"success": True, "message": "Tehing edukalt kustutatud!"}), 200
    except Exception as e:
        # Log the exact error for debugging
        print(f"Viga tehingu kustutamisel Firebase'ist: {e}")
        return jsonify({"success": False, "message": f"Kustutamine ebaõnnestus: {e}"}), 500



# Tagastab Firebase andmed JSON-formaadis, mida saab kasutada Google Charts jaoks
@app.route("/chart-data")
def chart_data():
    entries = db.child("entries").get()
    
    data = [["Category", "Amount"]]  
    if entries.val():
        for key, entry in entries.val().items():
            data.append([entry["category"], float(entry["amount"])])  
    
    return jsonify(data)  

# Funktsioon CSV-faili üleslaadimiseks ja töötlemiseks sõltuvalt valitud pangast
@app.route("/upload_csv", methods=["POST"])
def upload_csv():
    bank = request.form.get("bank")  # Saadakse vormilt valitud pank

    # Kontrollib, kas kasutaja laeb faili üles sõltuvalt valitud pangast
    if bank == "LHV":
        file = request.files.get("file_lhv")
        if not file or not file.filename.endswith(".csv"):
            flash("Palun laadige üles sobiv LHV CSV-fail.")
            return redirect(url_for("main_page"))
        
        file_path = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
        file.save(file_path)
        
        # LHV-faili töötlemine
        result = LHV_KuludTulud(file_path)
        
        # Kustutab faili pärast töötlemist
        os.remove(file_path)
    
    elif bank in ["SEB", "SWEDBANK"]:
        income_file = request.files.get("file_income")
        expenses_file = request.files.get("file_expenses")
        
        if not income_file or not income_file.filename.endswith(".csv"):
            flash("Palun laadige üles sobiv tulude CSV-fail.")
            return redirect(url_for("main_page"))
        
        if not expenses_file or not expenses_file.filename.endswith(".csv"):
            flash("Palun laadige üles sobiv kulude CSV-fail.")
            return redirect(url_for("main_page"))
        
        # Salvestab failid ajutiselt
        income_file_path = os.path.join(app.config["UPLOAD_FOLDER"], income_file.filename)
        expenses_file_path = os.path.join(app.config["UPLOAD_FOLDER"], expenses_file.filename)
        income_file.save(income_file_path)
        expenses_file.save(expenses_file_path)
        
        # Töötleb failid sõltuvalt pangast
        if bank == "SEB":
            result = SEB_KuludTulud(income_file_path, expenses_file_path)
        elif bank == "SWEDBANK":
            result = SWED_KuludTulud(income_file_path, expenses_file_path)
        
        # Kustutab failid pärast töötlemist
        os.remove(income_file_path)
        os.remove(expenses_file_path)
    
    else:
        flash("Palun valige sobiv pank.")
        return redirect(url_for("main_page"))
    
    # Kuvab tulemuse results.html lehel
    return render_template("results.html", result=result)

if __name__ == "__main__":
    if not os.path.exists(app.config["UPLOAD_FOLDER"]):
        os.makedirs(app.config["UPLOAD_FOLDER"])
    
    app.run(debug=True)  # Rakenduse käivitamine silumisrežiimis