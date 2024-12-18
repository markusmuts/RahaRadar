function filterByMonthYear() {
    const selectedMonth = document.getElementById('monthSelector').value;
    const selectedYear = document.getElementById('yearSelector').value;

    // Kontrollime, kas kuu ja aasta on valitud
    if (!selectedYear || !selectedMonth) {
        alert('Palun valige kehtiv aasta ja kuu!');
        return;
    }

    // Salvestame valitud kuu ja aasta LocalStorage’i
    localStorage.setItem('selectedMonth', selectedMonth);
    localStorage.setItem('selectedYear', selectedYear);
    
    closeMonthYearSelector()
}

document.addEventListener("DOMContentLoaded", () => {
    // Vaatame, kas LocalStorage’is on olemas kuu ja aasta väärtused
    const selectedMonth = localStorage.getItem("selectedMonth");
    const selectedYear = localStorage.getItem("selectedYear");

    // Kuu nimed eesti keeles
    const monthNames = {
        "1": "Jaanuar",
        "2": "Veebruar",
        "3": "Märts",
        "4": "Aprill",
        "5": "Mai",
        "6": "Juuni",
        "7": "Juuli",
        "8": "August",
        "9": "September",
        "10": "Oktoober",
        "11": "November",
        "12": "Detsember"
    };

    // Kontrollime, kas mõlemad väärtused on olemas
    if (selectedMonth && selectedYear) {
        // Vormindame kuupäeva ja aasta
        document.getElementById('monthSelector').value = selectedMonth;
        document.getElementById('yearSelector').value = selectedYear;

        const formattedDate = `${monthNames[selectedMonth]} ${selectedYear}`;
        
        // Kuvame vormindatud kuupäeva HTMLis
        document.getElementById('period').textContent = " " + formattedDate;
    } else {
        // Kui andmed puuduvad, kuvame hoiatussõnumi
        console.warn("Kuu või aasta puudub LocalStorage’ist.");
        document.getElementById('period').textContent = " teadmata";
    }
});


document.addEventListener("DOMContentLoaded", () => {
    const percent = localStorage.getItem("percent");
    const displayPercent = percent ? percent : "0";

    const percentElement = document.querySelector('#percent_to_save');
    if (percentElement) {
        percentElement.textContent = `${displayPercent} %`;
    } else {
        console.error('Elemendi ID-ga "percent_to_save" ei leitud.');
    }
});

// Näitame ja peidame modaalaken, kus saab valida kuu ja aasta
function showMonthYearSelector() {
    document.getElementById('monthYearModal').style.display = 'flex';
}

function closeMonthYearSelector() {
    document.getElementById('monthYearModal').style.display = 'none';
    location.reload();
}

function deleteEntry(entryType) {
    const entryId = document.getElementById('entryId').value
    const entryDetails = `${entryId};${entryType}`
    // Küsimus enne kustutamist
    if (confirm("Kas olete kindel, et soovite seda kustutada?")) {
        fetch(`/delete_entry/${entryDetails}`, {
            method: "DELETE",
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    location.reload(); // Leht värskendatakse, et tabelit uuendada
                } else {
                    alert("Kustutamine ebaõnnestus: " + data.message);
                }
            })
            .catch(error => {
                console.error("Viga:", error);
                alert("Kustutamisel tekkis viga.");
            }); 
    }
}

function modifyEntry(entryType) {
    if (entryType == "goals") {
        const entryId = document.getElementById('entryIdGoal').value
        const entryCategory = document.getElementById('entryCategoryGoal').value;
        const entryGoal = document.getElementById('entryGoal').value;

        const entryDetails = `${entryId};${entryCategory};${entryGoal};${entryType}`

        fetch(`/modify_goal/${entryDetails}`, {
            method: "POST",
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    location.reload(); // Leht värskendatakse, et tabelit uuendada
                } else {
                    alert("Muutmine ebaõnnestus: " + data.message);
                }
            })
            .catch(error => {
                console.error("Viga:", error);
                alert("Muutmisel tekkis viga.");
            });

    } else {
        entryDate = document.getElementById('entryDate').value;
        const entryPayer = document.getElementById('entryPayer').value;
        const entryCategory = document.getElementById('entryCategory').value;
        const entryAmount = document.getElementById('entryAmount').value;
        const entryId = document.getElementById('entryId').value

        const entryDate = format(new Date(entryDate), 'dd.MM.yyyy');
    
        const entryDetails = `${entryId};${entryDate};${entryPayer};${entryCategory};${entryAmount};${entryType}`

        fetch(`/modify_entry/${entryDetails}`, {
            method: "POST",
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    location.reload(); // Leht värskendatakse, et tabelit uuendada
                } else {
                    alert("Muutmine ebaõnnestus: " + data.message);
                }
            })
            .catch(error => {
                console.error("Viga:", error);
                alert("Muutmisel tekkis viga.");
            });
    }
}

function addEntry(entryType) {
    if (entryType == "goals") {
        const entryCategory = document.getElementById('newEntryCategory').value;
        const entryGoal = document.getElementById('newEntryGoal').value;
        const entryDetails = `${entryCategory};${entryGoal}`

        fetch(`/add_goal/${entryDetails}`, {
            method: "POST",
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    location.reload(); // Leht värskendatakse, et tabelit uuendada
                } else {
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error("Viga:", error);
                alert("Lisamisel tekkis viga.");
            });

    } else {
        const entryDate = document.getElementById('newEntryDate').value;
        const entryPayer = document.getElementById('newEntryPayer').value;
        const entryCategory = document.getElementById('newEntryCategory').value;
        const entryAmount = document.getElementById('newEntryAmount').value;

        const entryDetails = `${entryDate};${entryPayer};${entryCategory};${entryAmount};${entryType}`
        fetch(`/add_data/${entryDetails}`, {
            method: "POST",
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    location.reload(); // Leht värskendatakse, et tabelit uuendada
                } else {
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error("Viga:", error);
                alert("Lisamisel tekkis viga.");
            });
    }
}

function showOptionsOnGoalItem(entryId, entryCategory, entryGoal) {
    document.getElementById("entryCategoryGoal").placeholder = entryCategory || "Kategooria puudub";
    document.getElementById("entryGoal").placeholder = entryGoal + " €"  || "Eesmärk puudub";

    document.getElementById("entryCategoryGoal").value = "";
    document.getElementById("entryGoal").value = "";

    document.getElementById("entryIdGoal").value = entryId;
    
    document.getElementById("goalModal").style.display = "flex";
}

function showOptionsOnListItem(entryId, entryDate, entryPayer, entryCategory, entryAmount) {
    // Seame sisendite väärtused ja kohandame kuupäeva, makseja ja summa väli
    document.getElementById("entryDate").placeholder = entryDate || "Kuupäev puudub";
    document.getElementById("entryPayer").placeholder = entryPayer || "Saaja / Maksja puudub";
    document.getElementById("entryCategory").placeholder = entryCategory || "Kategooria puudub";
    document.getElementById("entryAmount").placeholder = entryAmount + " €" || "Summa puudub";

    // Seame sisendväljad tühjaks, et kasutaja saaks neid muuta
    document.getElementById("entryDate").value = "";
    document.getElementById("entryPayer").value = "";
    document.getElementById("entryCategory").value = "";
    document.getElementById("entryAmount").value = "";

    // Salvestame sisendite ID peidetud väljal
    document.getElementById("entryId").value = entryId;

    // Kuvame modaalaken
    document.getElementById("optionsModal").style.display = "flex";
}


function changePercent() {
    const newPercent = parseFloat(document.getElementById("percent").value)
    // Kontrollime, kas väärtus on sisestatud ja kas see on vahemikus 0-100
    if (newPercent == ""){
        location.reload();
        console.log("Väärtust ei ole sisestatud")
    }else if (0 <= newPercent & newPercent <= 100) {
        localStorage.setItem('percent', newPercent)
        location.reload();
    } else {
        alert("Palun sisestage protsent vahemikus 0-100!")
    }
}

function closeOptionsOnListItem() {
    document.getElementById('optionsModal').style.display = 'none';
}

function closeOptionsOnGoalItem() {
    document.getElementById('goalModal').style.display = 'none';
}

function showPercent() {
    document.getElementById('percentModal').style.display = 'flex';
}

function closePercent() {
    document.getElementById('percentModal').style.display = 'none';
}

function showEntryItem() {
    document.getElementById('entryModal').style.display = 'flex';
}

function closeEntryItem() {
    document.getElementById('entryModal').style.display = 'none';
}

function myFunction() {
    document.getElementById("myDropdown").classList.toggle("show");
}
