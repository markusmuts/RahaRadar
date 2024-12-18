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
import csv
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
app.config['ALLOWED_EXTENSIONS'] = {'csv'}
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
            idToken = user['idToken']
            session['user'] = uid
            session['idToken'] = idToken
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
        entries = db.child("users").child(uid).child("expenses").get(token=session['idToken'])
        total_expenses = 0

        if entries.val():
            data_list = [{"id": key, **entry} for key, entry in entries.val().items()]
        else:
            data_list = []
        return render_template("kulud.html", data=data_list, total_sum = total_expenses)
    return redirect(url_for("login"))

@app.route("/tulud")
def tulud():
    if "user" in session:
        uid = session["user"]
        entries = db.child("users").child(uid).child("income").get(token=session['idToken'])
        total_expenses = 0

        if entries.val():
            data_list = [{"id": key, **entry} for key, entry in entries.val().items()]
        else:
            data_list = []
        return render_template("tulud.html", data=data_list, total_sum = total_expenses)
    return redirect(url_for("login"))

@app.route("/säästmine")
def säästmine():
    if "user" in session:
        uid = session["user"]
        entries = db.child("users").child(uid).child("goals").get(token=session['idToken'])
        expenses = db.child("users").child(uid).child("expenses").get(token=session['idToken'])
        income = db.child("users").child(uid).child("income").get(token=session['idToken'])

        if entries.val():
            data_list = [{"id": key, **entry} for key, entry in entries.val().items()]
        else:
            data_list = []

        if expenses.val():
            data_expenses = [{"id": key, **entry} for key, entry in expenses.val().items()]
        else:
            data_expenses = []
        
        if income.val():
            data_income = [{"id": key, **entry} for key, entry in income.val().items()]
        else:
            data_income = []

        return render_template("säästmine.html", data=data_list, data_expenses = data_expenses, data_income = data_income)
    return redirect(url_for("login"))


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']


@app.route("/add_goal/<entry_details>", methods=["POST"])
def add_goal(entry_details):
    category, amount = entry_details.split(';')

    if category and amount:
        try:
            uid = session["user"]
            db.child("users").child(uid).child("goals").push({
                "category": category,
                "goal": amount,
            }, token=session['idToken'])
            redirect(url_for("säästmine"))
            return jsonify({"success": True, "message": "Eesmärk edukalt lisatud!"}), 200 
        except Exception as e:
            print("Viga andmete lisamisel Firebase'i:", e)
            return jsonify({"success": False, "message": f"Lisamine ebaõnnestus: {e}"}), 500
    else:
        return jsonify({"success": False, "message": "Palun täitke kõik väljad"}), 500

# Lisab kasutaja esitatud andmed Firebase andmebaasi
@app.route("/add_data/<entry_details>", methods=["POST"])
def add_data(entry_details):
    date, payer, category, amount, entry_type = entry_details.split(';')
    match entry_type:
        case "expenses": url = "kulud"
        case "income": url = "tulud"

    if date and payer and category and amount:
        try:
            uid = session["user"]
            db.child("users").child(uid).child(entry_type).push({
                "date": date,
                "payer": payer,
                "category": category,
                "amount": float(amount)  
            }, token=session['idToken'])
            redirect(url_for(url))
            return jsonify({"success": True, "message": "Tehing edukalt lisatud!"}), 200 
        except Exception as e:
            print("Viga andmete lisamisel Firebase'i:", e)
            return jsonify({"success": False, "message": f"Lisamine ebaõnnestus: {e}"}), 500
    else:
        return jsonify({"success": False, "message": "Palun täitke kõik väljad"}), 500  
    
    # Redirect back to the main page


# Hangib andmed Firebase andmebaasist ja kuvab kulud.html lehel
@app.route("/get_data")
def get_data():
    uid = session["user"]
    entries = db.child("users").child(uid).child("expenses").get(token=session['idToken'])
    if entries.val():
        data_list = [
            {"id": key, **entry} for key, entry in entries.val().items()
        ]  # Firebase-i andmed sõnastikuks
    else:
        data_list = []

    return render_template("kulud.html", data=data_list)

@app.route("/delete_entry/<entry_details>", methods=["DELETE"])
def delete_entry(entry_details):
    entry_id, entry_type = entry_details.split(';')
    try:
        uid = session["user"]
        # Attempt to delete the entry in Firebase
        db.child("users").child(uid).child(entry_type).child(entry_id).remove(token=session['idToken'])
        return jsonify({"success": True, "message": "Sisend edukalt kustutatud!"}), 200
    except Exception as e:
        # Log the exact error for debugging
        print(f"Viga tehingu kustutamisel Firebase'ist: {e}")
        return jsonify({"success": False, "message": f"Kustutamine ebaõnnestus: {e}"}), 500

@app.route("/modify_entry/<entry_details>", methods=["POST"])
def modify_entry(entry_details):
    try:
        uid = session["user"]
        # Attempt to delete the entry in Firebase
        entry_id, entry_date, entry_payer, entry_category, entry_amount, entry_type = entry_details.split(';')
        entry_changes = [entry_date, entry_payer, entry_category, entry_amount]
        i = 0

        for change in entry_changes:
            change = change.strip()
            if change == "" or change == None:
                i += 1
            else:
                match i:
                    case 0: db.child("users").child(uid).child(entry_type).child(entry_id).update({"date": str(change)}, token=session['idToken'])
                    case 1: db.child("users").child(uid).child(entry_type).child(entry_id).update({"payer": str(change)}, token=session['idToken'])
                    case 2: db.child("users").child(uid).child(entry_type).child(entry_id).update({"category": str(change)}, token=session['idToken'])
                    case 3: db.child("users").child(uid).child(entry_type).child(entry_id).update({"amount": str(change)}, token=session['idToken'])
                i += 1
        return jsonify({"success": True, "message": "Tehing edukalt muudetud!"}), 200
    except Exception as e:
        # Log the exact error for debugging
        print(f"Viga tehingu muutmisel: {e}")
        return jsonify({"success": False, "message": f"Muutmine ebaõnnestus: {e}"}), 500
    
@app.route("/modify_goal/<entry_details>", methods=["POST"])
def modify_goal(entry_details):
    try:
        uid = session["user"]
        # Attempt to delete the entry in Firebase
        entry_id, entry_category, entry_goal, entry_type = entry_details.split(';')
        entry_changes = [entry_category, entry_goal]
        i = 0

        for change in entry_changes:
            change = change.strip()
            if change == "" or change == None:
                i += 1
            else:
                match i:
                    case 0: db.child("users").child(uid).child(entry_type).child(entry_id).update({"category": str(change)}, token=session['idToken'])
                    case 1: db.child("users").child(uid).child(entry_type).child(entry_id).update({"goal": str(change)}, token=session['idToken'])
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
    entries = db.child("users").child(uid).child("expenses").get(token=session['idToken'])
    
    data = [["Category", "Amount"]]  
    if entries.val():
        for key, entry in entries.val().items():
            data.append([entry["category"], float(entry["amount"])])  
    
    return jsonify(data)  

# Funktsioon CSV-faili üleslaadimiseks ja töötlemiseks sõltuvalt valitud pangast

@app.route('/upload_csv', methods=['POST'])
def upload_csv():
    file = request.files.get('csvFile')
    if not file:
        flash("No file uploaded", "error")
        return redirect(url_for("kulud"))
    try:
        # Load the CSV file into a DataFrame
        data = pd.read_csv(file)
        print("CSV Headers:", data.columns.tolist())  # Debug CSV headers

        # Map your CSV columns to Firebase fields
        column_mapping = {
            "Kuupäev": "date",        # Correct the name here
            "Saaja/Maksja": "payer",
            "Summa": "amount",
            "Kirjeldus": "category"
        }

        # Ensure the required columns exist in the uploaded CSV
        required_columns = set(column_mapping.keys())
        if not required_columns.issubset(data.columns):
            flash(f"CSV must contain columns: {', '.join(required_columns)}", "error")
            return redirect(url_for("kulud"))

        # Rename columns to match Firebase schema
        data.rename(columns=column_mapping, inplace=True)

        # Convert the DataFrame into a list of dictionaries for Firebase
        entries = data.to_dict(orient='records')

        # Save each entry into the Firebase database under "expenses"
        uid = session["user"]
        for entry in entries:
            db.child("users").child(uid).child("expenses").push({
                "date": entry["date"],
                "payer": entry["payer"],
                "category": entry["category"],
                "amount": float(entry["amount"])
            })

        flash("CSV file successfully uploaded and data added to Firebase!", "success")
        return redirect(url_for("kulud"))
    except Exception as e:
        print(f"Error: {e}")
        flash(f"Error processing CSV: {str(e)}", "error")
        return redirect(url_for("kulud"))



if __name__ == "__main__":
    if not os.path.exists(app.config["UPLOAD_FOLDER"]):
        os.makedirs(app.config["UPLOAD_FOLDER"])
    
    app.run(debug=True)  # Rakenduse käivitamine silumisrežiimis