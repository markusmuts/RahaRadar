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
    document.getElementById("entryDate").placeholder = entryDate || "Kuupäev puudub";
    document.getElementById("entryPayer").placeholder = entryPayer || "Saaja / Maksja puudub";
    document.getElementById("entryCategory").placeholder = entryCategory || "Kategooria puudub";
    document.getElementById("entryAmount").placeholder = entryAmount + " €" || "Summa puudub";

    document.getElementById("entryDate").value = "";
    document.getElementById("entryPayer").value = "";
    document.getElementById("entryCategory").value = "";
    document.getElementById("entryAmount").value = "";

    document.getElementById("entryId").value = entryId;

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

function showMonthYearSelector() {
    document.getElementById('monthYearModal').style.display = 'flex';
}

function closeMonthYearSelector() {
    document.getElementById('monthYearModal').style.display = 'none';
    location.reload();
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

function showDropdown() {
    document.getElementById("myDropdown").classList.toggle("show");
}

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

document.addEventListener("DOMContentLoaded", () => {
    const selectedMonth = localStorage.getItem("selectedMonth");
    const selectedYear = localStorage.getItem("selectedYear");

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

    if (selectedMonth && selectedYear) {
        document.getElementById('monthSelector').value = selectedMonth;
        document.getElementById('yearSelector').value = selectedYear;

        const formattedDate = `${monthNames[selectedMonth]} ${selectedYear}`;
        
        document.getElementById('period').textContent = " " + formattedDate;
    } else {
        console.warn("Kuu või aasta puudub LocalStorage’ist.");
        document.getElementById('period').textContent = " teadmata";
    }
});