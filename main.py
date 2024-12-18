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
# Lisakommentaar: Javascripti ja osaliselt Pythoni kirjutamisel on kasutatud ChatGPT abi
# Käivitusjuhend: Main branchis on fail nimega "ülespanek.md", milles on juhend programmi käivitamiseks
#
##################################################

from flask import Flask, render_template, request, redirect, url_for, flash, session
import pyrebase
import pandas as pd
from flask import jsonify
from secrets import token_hex
import os

# Firebase konfiguratsioon
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

# Peamine leht, suunab sisse loginimist või kulude vaatamist
@app.route("/")
def main():
    if "user" in session:
        return redirect(url_for("kulud"))
    return redirect(url_for("login"))

# Logimise leht
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
        

# Logimist lõpetav raja
@app.route("/logout")
def logout():
    session.pop("user", None)
    return redirect(url_for("login"))

# Kulude vaatamise leht
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

# Tulu vaatamise leht
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

# Säästmisvõimaluste vaatamine ja haldamine
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

# Failide üleslaadimise kontrollimine
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# Eesmärgi lisamine
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

# Andmete lisamine Firebase'i
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

# Firebase andmete hankimine ja kuvamine
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

# Kustutamise funktsioon
@app.route("/delete_entry/<entry_details>", methods=["DELETE"])
def delete_entry(entry_details):
    entry_id, entry_type = entry_details.split(';')
    try:
        uid = session["user"]
        # Kustutamine Firebase-ist
        db.child("users").child(uid).child(entry_type).child(entry_id).remove(token=session['idToken'])
        return jsonify({"success": True, "message": "Sisend edukalt kustutatud!"}), 200
    except Exception as e:
        print(f"Viga tehingu kustutamisel Firebase'ist: {e}")
        return jsonify({"success": False, "message": f"Kustutamine ebaõnnestus: {e}"}), 500

# Muutmisfunktsioon
@app.route("/modify_entry/<entry_details>", methods=["POST"])
def modify_entry(entry_details):
    try:
        uid = session["user"]
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
        print(f"Viga tehingu muutmisel: {e}")
        return jsonify({"success": False, "message": f"Muutmine ebaõnnestus: {e}"}), 500

# Eesmärgi muutmine
@app.route("/modify_goal/<entry_details>", methods=["POST"])
def modify_goal(entry_details):
    try:
        uid = session["user"]
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
        print(f"Viga tehingu muutmisel: {e}")
        return jsonify({"success": False, "message": f"Muutmine ebaõnnestus: {e}"}), 500

# Google Charts jaoks andmete tagastamine
@app.route("/chart-data")
def chart_data():
    uid = session["user"]
    entries = db.child("users").child(uid).child("expenses").get(token=session['idToken'])
    
    data = [["Category", "Amount"]]  
    if entries.val():
        for key, entry in entries.val().items():
            data.append([entry["category"], float(entry["amount"])])  
    
    return jsonify(data)  


#Ei tööta korrektselt
# CSV failide üleslaadimine ja töötlemine
@app.route('/upload_csv', methods=['POST'])
def upload_csv():
    file = request.files.get('csvFile')
    if not file:
        flash("No file uploaded", "error")
        return redirect(url_for("kulud"))
    
    try:
        filename = file.filename
        file_path = os.path.join('uploads', filename)
        file.save(file_path)

        data = pd.read_csv(file_path, sep=';', on_bad_lines='skip')
        data.columns = data.columns.str.strip('"')

        # Kaardistamine
        column_mapping = {
            "Kuupäev": "date",
            "Saaja/Maksja": "payer",
            "Summa": "amount",
            "Selgitus": "category"
        }

        # Nõutavad veerud
        required_columns = set(column_mapping.keys())
        if not required_columns.issubset(data.columns):
            flash(f"CSV must contain columns: {', '.join(required_columns)}", "error")
            return redirect(url_for("kulud"))

        # Veergude ümbersuunamine Firebase'iga ühilduvaks
        data.rename(columns=column_mapping, inplace=True)

        entries = data.to_dict(orient='records')

        # Firebase'i viide
        uid = session["user"]
        firebase_path = db.child("users").child(uid).child("expenses")

        # Faili ridadelt Firebase'i andmete lisamine
        for entry in entries:
            try:
                # Raha summa töötlemine
                amount = float(entry["amount"].replace(',', '.'))
                payer = entry["payer"].strip() if pd.notna(entry["payer"]) else "Unknown"
                category = entry["category"].strip() if pd.notna(entry["category"]) else "Uncategorized"

                entry_ref = firebase_path.push({
                    "date": entry["date"],
                    "payer": payer,
                    "category": category,
                    "amount": amount
                }, token=session['idToken'])

                print(f"Successfully pushed entry with ID: {entry_ref['name']}")

            except ValueError as ve:
                print(f"Skipping row due to invalid data: {entry}. Error: {ve}")
                continue

        # Faili kustutamine pärast töötlemist
        os.remove(file_path)
        print(f"File {filename} deleted successfully!")

        flash("CSV file successfully uploaded and data added to Firebase!", "success")
        return redirect(url_for("kulud"))
    
    except Exception as e:
        print(f"Error: {e}")
        flash(f"Error processing CSV: {str(e)}", "error")
        return redirect(url_for("kulud"))

# Rakenduse käivitamine
if __name__ == "__main__":
    if not os.path.exists(app.config["UPLOAD_FOLDER"]):
        os.makedirs(app.config["UPLOAD_FOLDER"])
    app.run(debug=False)
