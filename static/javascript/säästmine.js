function filterByMonthYear() {
    const selectedMonth = document.getElementById('monthSelector').value;
    const selectedYear = document.getElementById('yearSelector').value;

    if (!selectedYear || !selectedMonth) {
        alert('Please select a valid year and month!');
        return;
    }

    localStorage.setItem('selectedMonth', selectedMonth);
    localStorage.setItem('selectedYear', selectedYear);
    
    closeMonthYearSelector()
}

document.addEventListener("DOMContentLoaded", () => {
    // Retrieve values from LocalStorage
    const selectedMonth = localStorage.getItem("selectedMonth");
    const selectedYear = localStorage.getItem("selectedYear");

    // Month name mapping for Estonian
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

    // Check if both values are available
    if (selectedMonth && selectedYear) {
        // Format the month and year
        document.getElementById('monthSelector').value = selectedMonth;
        document.getElementById('yearSelector').value = selectedYear;

        const formattedDate = `${monthNames[selectedMonth]} ${selectedYear}`;
        
        // Display the formatted date in the HTML
        document.getElementById('period').textContent = " " + formattedDate;
    } else {
        // Handle missing data
        console.warn("Month or year is missing from LocalStorage.");
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
        console.error('Element with ID "percent_to_save" not found.');
    }
});

// Show and hide modal for selecting month and year
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
    if (confirm("Kas olete kindel, et soovite seda kustutada?")) {
        fetch(`/delete_entry/${entryDetails}`, {
            method: "DELETE",
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    location.reload(); // Reload the page to update the table
                } else {
                    alert("Kustutamine ebaõnnestus: " + data.message);
                }
            })
            .catch(error => {
                console.error("Error:", error);
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
                    location.reload(); // Reload the page to update the table
                } else {
                    alert("Muutmine ebaõnnestus: " + data.message);
                }
            })
            .catch(error => {
                console.error("Error:", error);
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
                    location.reload(); // Reload the page to update the table
                } else {
                    alert("Muutmine ebaõnnestus: " + data.message);
                }
            })
            .catch(error => {
                console.error("Error:", error);
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
                    location.reload(); // Reload the page to update the table
                } else {
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error("Error:", error);
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
                    location.reload(); // Reload the page to update the table
                } else {
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error("Error:", error);
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
    // Set the placeholders with the current entry values
    document.getElementById("entryDate").placeholder = entryDate || "Kuupäev puudub";
    document.getElementById("entryPayer").placeholder = entryPayer || "Saaja / Maksja puudub";
    document.getElementById("entryCategory").placeholder = entryCategory || "Kategooria puudub";
    document.getElementById("entryAmount").placeholder = entryAmount + " €" || "Summa puudub";

    // Set the input values to empty so the user can modify them
    document.getElementById("entryDate").value = "";
    document.getElementById("entryPayer").value = "";
    document.getElementById("entryCategory").value = "";
    document.getElementById("entryAmount").value = "";

    // Store the entry ID in a hidden field
    document.getElementById("entryId").value = entryId;

    // Display the modal
    document.getElementById("optionsModal").style.display = "flex";
}


function changePercent() {
    const newPercent = parseFloat(document.getElementById("percent").value)
    if (newPercent == ""){
        location.reload();
        console.log("Value not provided")
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