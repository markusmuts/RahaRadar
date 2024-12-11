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
# Mõningane eeskuju: Eelmise aasta projekt (Koduse eelarve haldamise programm), isiklik vajadus taolise programmi järele
#
# Lisakommentaar (nt käivitusjuhend): Main branchis on fail nimega "ülespanek.md", milles on juhend programmi käivitamiseks
#
##################################################

from flask import Flask, render_template, request, redirect, url_for, flash, session
import pyrebase
import pandas as pd
import os
from LHV import KuludTulud as LHV_KuludTulud 
from SEB import KuludTulud as SEB_KuludTulud
from SWEDBANK import KuludTulud as SWED_KuludTulud
from flask import jsonify
from secrets import token_hex
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

db.child("users")

app = Flask(__name__, static_folder='static')
app.config["UPLOAD_FOLDER"] = "uploads"
app.secret_key = token_hex(24)

@app.route("/")
def main():
    if "user" in session:
        return redirect(url_for("kulud"))
    return redirect(url_for("login"))

@app.route("/login", methods=["GET", "POST"])
def login():
    error_message = None
    if request.method == "POST":
        email = request.form["email"]
        password = request.form["password"]
        try:
            user = auth.sign_in_with_email_and_password(email, password)
            uid = user['localId']
            session['user'] = uid
            get_data()
            return redirect(url_for("kulud"))
        except Exception as e:
            print(e)
            error_message = "An error occurred. Please try again."
            if "" in str(e):
                error_message = "Invalid credentials. Please try again."

    return render_template("login.html", error_message=error_message)
        

@app.route("/logout")
def logout():
    session.pop("user", None)
    return redirect(url_for("login"))

@app.route("/kulud")
def kulud():
    if "user" in session:
        uid = session["user"]
        entries = db.child("users").child(uid).child("expenses").get()
        expenses = db.child("users").child(uid).child("expenses").get().val()
        total_expenses = 0

        if entries.val():
            data_list = [{"id": key, **entry} for key, entry in entries.val().items()]
        else:
            data_list = []
        return render_template("kulud.html", data=data_list, total_sum = total_expenses)
    return redirect(url_for("login"))

# Funktsioon, mis lisab tehingu Firebase andmebaasi
def add_transaction_to_firebase(date, payer, category, amount):
    transaction_data = {
        "date": date,                 
        "payer": payer,               
        "category": category,         
        "amount": amount              
    }
    uid = session["user"]
    db.child("users").child(uid).push(transaction_data)
    print("Tehing lisatud Firebase'i:", transaction_data)

def sum_expenses():
    uid = session["user"]
    expenses = db.child("users").child(uid).child("expenses").get().val()
    total_expenses = 0

    if expenses:
        for expense_id, expense in expenses.items():
            total_expenses += expense.get("amount", 0)

    return render_template("kulud.html", total_sum = total_expenses)
    

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
            uid = session["user"]
            db.child("users").child(uid).child("expenses").push({
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
    return redirect(url_for("kulud"))


# Hangib andmed Firebase andmebaasist ja kuvab kulud.html lehel
@app.route("/get_data")
def get_data():
    uid = session["user"]
    entries = db.child("users").child(uid).child("expenses").get()
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
        uid = session["user"]
        # Attempt to delete the entry in Firebase
        db.child("users").child(uid).child("expenses").child(entry_id).remove()
        return jsonify({"success": True, "message": "Tehing edukalt kustutatud!"}), 200
    except Exception as e:
        # Log the exact error for debugging
        print(f"Viga tehingu kustutamisel Firebase'ist: {e}")
        return jsonify({"success": False, "message": f"Kustutamine ebaõnnestus: {e}"}), 500

@app.route("/modify_entry/<entry_details>", methods=["POST"])
def modify_entry(entry_details):
    try:
        uid = session["user"]
        # Attempt to delete the entry in Firebase
        entry_id, entry_date, entry_payer, entry_category, entry_amount = entry_details.split('*')
        entry_changes = [entry_date, entry_payer, entry_category, entry_amount]
        i = 0
        for change in entry_changes:
            change = change.strip()
            if change == "" or change == None:
                i += 1
            else:
                match i:
                    case 0: db.child("users").child(uid).child("expenses").child(entry_id).update({"date": str(change)})
                    case 1: db.child("users").child(uid).child("expenses").child(entry_id).update({"payer": str(change)})
                    case 2: db.child("users").child(uid).child("expenses").child(entry_id).update({"category": str(change)})
                    case 3: db.child("users").child(uid).child("expenses").child(entry_id).update({"amount": str(change)})
                i += 1
        return jsonify({"success": True, "message": "Tehing edukalt muudetud!"}), 200
    except Exception as e:
        # Log the exact error for debugging
        print(f"Viga tehingu muutmisel: {e}")
        return jsonify({"success": False, "message": f"Muutmine ebaõnnestus: {e}"}), 500


# Tagastab Firebase andmed JSON-formaadis, mida saab kasutada Google Charts jaoks
@app.route("/chart-data")
def chart_data():
    uid = session["user"]
    entries = db.child("users").child(uid).child("expenses").get()
    
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