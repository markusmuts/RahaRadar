function loadGoogleCharts(callback) {
    const script = document.createElement("script");
    script.src = "https://www.gstatic.com/charts/loader.js";
    script.onload = () => {
        console.log("Google Charts skript laeti edukalt.");
        google.charts.load("current", { packages: ["piechart"] });
        google.charts.setOnLoadCallback(callback);
    };
    script.onerror = () => {
        console.error("Google Charts skripti laadimine ebaõnnestus.");
    };
    document.head.appendChild(script);
}

// Funktsioon diagrammi algatamiseks
function initializeChart() {
    if (typeof google === "undefined" || typeof google.visualization === "undefined") {
        console.error("Google Charts teek ei ole saadaval.");
        return;
    }
    console.log("Google Charts algatatud.");
    updateChartData();
}

// Funktsioon diagrammi andmete uuendamiseks
function updateChartData() {
    if (typeof google === "undefined" || typeof google.visualization === "undefined") {
        console.error("Google Charts teek ei ole õigesti laetud.");
        return;
    }

    const selectedMonth = localStorage.getItem('selectedMonth');
    const selectedYear = localStorage.getItem('selectedYear');

    if (selectedMonth && selectedYear) {
        filterByMonthYear();
    } else {
        console.warn("Kuu/aasta ei ole valitud. Kuvatakse kõik read.");
        const rows = document.querySelectorAll('#transactionTable tbody tr');
        rows.forEach(row => row.style.display = '');
        const processedChartData = preprocessChartData(getRowData(rows));
        if (processedChartData.length <= 1) {
            console.warn("Kehtivat andmestikku pole diagrammi kuvamiseks.");
        }
        drawChart(processedChartData);
    }
}

// Funktsioon et eelprotsesseerida graafiku andmeid
function preprocessChartData(rawData) {
    const categoryMap = new Map();

    rawData.forEach(([category, value]) => {
        if (category && typeof value === "number" && value > 0) {
            categoryMap.set(category, (categoryMap.get(category) || 0) + value);
        }
    });

    if (categoryMap.size === 0) {
        console.warn("Processed data is empty. Ensure rows have valid categories and amounts.");
    }

    return [["Category", "Amount"], ...Array.from(categoryMap.entries())];
}

// Function, et luua graafik
function drawChart(chartData) {
    if (!chartData || chartData.length < 2) {
        console.error("Invalid or empty chart data.", chartData);
        document.getElementById('donutchart').innerHTML = "<p>No data available to display.</p>";
        return;
    }

    const data = google.visualization.arrayToDataTable(chartData);
    var options = {
        pieHole: 0.4,
    };

    const chart = new google.visualization.PieChart(document.getElementById('donutchart'));
    chart.draw(data, options);
    console.log("Chart drawn successfully.", chartData);
}

function filterByMonthYear() {
    const selectedMonth = document.getElementById('monthSelector').value;
    const selectedYear = document.getElementById('yearSelector').value;

    if (!selectedYear || !selectedMonth) {
        alert('Please select a valid year and month!');
        return;
    }

    localStorage.setItem('selectedMonth', selectedMonth);
    localStorage.setItem('selectedYear', selectedYear);

    const startDate = new Date(selectedYear, selectedMonth - 1, 1);
    const endDate = new Date(selectedYear, selectedMonth, 0);

    const rows = document.querySelectorAll('#transactionTable tbody tr');
    let total = 0; // Arvuta kogusumma

    const filteredRows = Array.from(rows).filter(row => {
        const dateCell = row.cells[0]?.textContent?.trim();
        if (!dateCell) {
            console.warn('Row missing date cell:', row);
            return false;
        }

        const [day, month, year] = dateCell.split('.');
        if (!day || !month || !year) {
            console.warn('Invalid date format in row:', dateCell, row);
            return false;
        }

        const fullYear = parseInt(year.length === 2 ? `20${year}` : year);
        const rowDate = new Date(fullYear, month - 1, day);

        const isVisible = rowDate >= startDate && rowDate <= endDate;
        row.style.display = isVisible ? '' : 'none';

        if (isVisible) {
            const amountCell = row.cells[3]?.textContent || '';
            const amount = parseFloat(amountCell.replace(/[^\d.-]/g, ''));
            if (!isNaN(amount)) total += amount;
        }
        return isVisible;
    });

    console.log('Filtered rows count:', filteredRows.length);

    // Uuenda kogusummat DOM-is
    document.querySelector('.list_bottom span').textContent = `${total.toFixed(2)} €`;

    if (filteredRows.length === 0) {
        console.warn('No rows match the selected month/year.');
    }

    const chartRows = getRowData(filteredRows);
    console.log('Chart rows:', chartRows);
    const processedChartData = preprocessChartData(chartRows);
    if (processedChartData.length <= 1) {
        console.warn('No valid data available for the selected range.');
        document.getElementById('donutchart').innerHTML = "<p style='font-size: 23px; font-weight: bold; align-self: center; justify-self: center; width: 100%; '>Pole andmeid antud</p>";
    } else {
        drawChart(processedChartData);
    }

    closeMonthYearSelector();
}



// Abi andmete lugemisel
function getRowData(rows) {
    return Array.from(rows).map(row => {
        
        const categoryCell = row.cells[2]; 
        const category = categoryCell ? categoryCell.textContent.trim() : null;

        
        const amountCell = row.cells[3]; 
        let amount = amountCell ? amountCell.textContent.replace(/[^\d.-]/g, '').trim() : null; 
        amount = parseFloat(amount); // Muuda numbriks

        if (!category || isNaN(amount)) {
            console.warn("Invalid row data skipped.", row);
            return null;
        }
        return [category, amount];
    }).filter(Boolean);
}

function removeHiddenEntries() {
    // vali kõik tabeli read
    const rows = document.querySelectorAll('#transactionTable tbody tr');

    rows.forEach(row => {
       
        if (row.style.display === 'none') {
            row.remove(); 
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadGoogleCharts(initializeChart);

    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        transactionForm.addEventListener('submit', () => {
            setTimeout(() => {
                const rows = document.querySelectorAll('#transactionTable tbody tr');
                const processedChartData = preprocessChartData(getRowData(rows));
                if (processedChartData.length <= 1) {
                    console.warn("No valid data available after form submission.");
                }
                drawChart(processedChartData);
            }, 100);
        });
    }

    const storedMonth = localStorage.getItem('selectedMonth');
    const storedYear = localStorage.getItem('selectedYear');

    if (storedMonth && storedYear) {
        document.getElementById('monthSelector').value = storedMonth;
        document.getElementById('yearSelector').value = storedYear;
        filterByMonthYear();
    } else {
        const rows = document.querySelectorAll('#transactionTable tbody tr');
        const processedChartData = preprocessChartData(getRowData(rows));
        if (processedChartData.length <= 1) {
            console.warn("No valid data available on initial load.");
        }
        drawChart(processedChartData);
    }
});

// Näita ja peida modal
function showMonthYearSelector() {
    document.getElementById('monthYearModal').style.display = 'flex';
}

function closeMonthYearSelector() {
    document.getElementById('monthYearModal').style.display = 'none';
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
                    location.reload(); // Lae leht uuesti
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
        const entryId = document.getElementById('entryId').value
        const entryCategory = document.getElementById('entryCategory').value;
        const entryGoal = document.getElementById('entryGoal').value;

        const entryDetails = `${entryId};${entryCategory};${entryGoal};${entryType}`

        fetch(`/modify_goal/${entryDetails}`, {
            method: "POST",
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    location.reload(); // Lae leht uuesti tabeli uuendamiseks
                } else {
                    alert("Muutmine ebaõnnestus: " + data.message);
                }
            })
            .catch(error => {
                console.error("Error:", error);
                alert("Muutmisel tekkis viga.");
            });

    } else {
        const entryDate = document.getElementById('entryDate').value;
        const entryPayer = document.getElementById('entryPayer').value;
        const entryCategory = document.getElementById('entryCategory').value;
        const entryAmount = document.getElementById('entryAmount').value;
        const entryId = document.getElementById('entryId').value

    
        const entryDetails = `${entryId};${entryDate};${entryPayer};${entryCategory};${entryAmount};${entryType}`

        fetch(`/modify_entry/${entryDetails}`, {
            method: "POST",
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    location.reload(); // Lae leht uuesti tabeli uuendamiseks
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
                    location.reload(); // Lae leht uuesti tabeli uuendamiseks
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
                    location.reload(); // Lae leht uuesti tabeli uuendamiseks
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
    document.getElementById("entryCategory").placeholder = entryCategory || "Kategooria puudub";
    document.getElementById("entryGoal").placeholder = entryGoal + " €"  || "Eesmärk puudub";

    document.getElementById("entryCategory").value = "";
    document.getElementById("entryGoal").value = "";

    document.getElementById("entryId").value = entryId;
    
    document.getElementById("goalModal").style.display = "flex";
}

function showOptionsOnListItem(entryId, entryDate, entryPayer, entryCategory, entryAmount) {
    document.getElementById("entryDate").placeholder = entryDate || "Kuupäev puudub";
    document.getElementById("entryPayer").placeholder = entryPayer || "Saaja / Maksja puudub";
    document.getElementById("entryCategory").placeholder = entryCategory || "Kategooria puudub";
    document.getElementById("entryAmount").placeholder = entryAmount + " €" || "Summa puudub";

    // Lase kasutajal muuta väärtusi
    document.getElementById("entryDate").value = "";
    document.getElementById("entryPayer").value = "";
    document.getElementById("entryCategory").value = "";
    document.getElementById("entryAmount").value = "";

    // Lae ENTRY ID peidetud kausta
    document.getElementById("entryId").value = entryId;

    // Näita modal-it
    document.getElementById("optionsModal").style.display = 'flex';
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

document.addEventListener("DOMContentLoaded", () => {
    removeHiddenEntries();
    
    // Võta andmed andmebaasist
    const selectedMonth = localStorage.getItem("selectedMonth");
    const selectedYear = localStorage.getItem("selectedYear");

    // KUUDE NIMETUSED EESTI KEELES
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

    // Vaata kas mõlemad väärtused on olemas
    if (selectedMonth && selectedYear) {
        
        const formattedDate = `${monthNames[selectedMonth]} ${selectedYear}`;
        
        
        document.getElementById('period').textContent = " " + formattedDate;
    } else {
        // Käsitle olematuid andmeid
        console.warn("Month or year is missing from LocalStorage.");
        document.getElementById('period').textContent = " teadmata";
    }
});