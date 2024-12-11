// Load Google Charts and initialize the chart
function loadGoogleCharts(callback) {
    const script = document.createElement("script");
    script.src = "https://www.gstatic.com/charts/loader.js";
    script.onload = () => {
        console.log("Google Charts script loaded successfully.");
        google.charts.load("current", { packages: ["corechart", "piechart"] });
        google.charts.setOnLoadCallback(callback);
    };
    script.onerror = () => {
        console.error("Failed to load Google Charts script.");
    };
    document.head.appendChild(script);
}

// Function to initialize the chart
function initializeChart() {
    if (typeof google === "undefined" || typeof google.visualization === "undefined") {
        console.error("Google Charts library not available.");
        return;
    }
    console.log("Google Charts initialized.");
    updateChartData();
}

// Function to update chart data
function updateChartData() {
    if (typeof google === "undefined" || typeof google.visualization === "undefined") {
        console.error("Google Charts library not loaded correctly.");
        return;
    }

    const selectedMonth = localStorage.getItem('selectedMonth');
    const selectedYear = localStorage.getItem('selectedYear');

    if (selectedMonth && selectedYear) {
        filterByMonthYear();
    } else {
        console.warn("No month/year selected. Displaying all rows.");
        const rows = document.querySelectorAll('#transactionTable tbody tr');
        rows.forEach(row => row.style.display = '');
        const processedChartData = preprocessChartData(getRowData(rows));
        if (processedChartData.length <= 1) {
            console.warn("No valid data found to display in the chart.");
        }
        drawChart(processedChartData);
    }
}

// Function to preprocess chart data
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

// Function to draw the chart
function drawChart(chartData) {
    if (!chartData || chartData.length < 2) {
        console.error("Invalid or empty chart data.", chartData);
        document.getElementById('donutchart').innerHTML = "<p>No data available to display.</p>";
        return;
    }

    const data = google.visualization.arrayToDataTable(chartData);
    const options = {
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
    let total = 0; // Initialize the total sum

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
            // Include the amount in the total sum if the row is visible
            const amountCell = row.cells[3]?.textContent || '';
            const amount = parseFloat(amountCell.replace(/[^\d.-]/g, ''));
            if (!isNaN(amount)) total += amount;
        }

        return isVisible;
    });

    console.log('Filtered rows count:', filteredRows.length);

    // Update the total sum in the DOM
    document.querySelector('.list_bottom span').textContent = `${total.toFixed(2)} €`;

    if (filteredRows.length === 0) {
        console.warn('No rows match the selected month/year.');
    }

    const chartRows = getRowData(filteredRows);
    console.log('Chart rows:', chartRows);
    const processedChartData = preprocessChartData(chartRows);
    if (processedChartData.length <= 1) {
        console.warn('No valid data available for the selected range.');
        document.getElementById('donutchart').innerHTML = "<p>Pole andmeid antud.</p>";
    } else {
        drawChart(processedChartData);
    }

    closeMonthYearSelector();
}



// Helper to extract row data
function getRowData(rows) {
    return Array.from(rows).map(row => {
        // Extract the category from the 3rd cell (adjust index as needed)
        const categoryCell = row.cells[2]; // Assuming category is in the 3rd cell
        const category = categoryCell ? categoryCell.textContent.trim() : null;

        // Extract the amount from the 4th cell
        const amountCell = row.cells[3]; // Assuming amount is in the 4th cell
        let amount = amountCell ? amountCell.textContent.replace(/[^\d.-]/g, '').trim() : null; // Remove non-numeric characters
        amount = parseFloat(amount); // Convert to a number

        if (!category || isNaN(amount)) {
            console.warn("Invalid row data skipped.", row);
            return null;
        }
        return [category, amount];
    }).filter(Boolean);
}



// Event listener for DOM content loaded
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

// Show and hide modal for selecting month and year
function showMonthYearSelector() {
    document.getElementById('monthYearModal').style.display = 'flex';
}

function closeMonthYearSelector() {
    document.getElementById('monthYearModal').style.display = 'none';
}
function deleteEntry(entryId) {
    if (confirm("Kas olete kindel, et soovite selle tehingu kustutada?")) {
        fetch(`/delete_entry/${entryId}`, {
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

function modifyEntry(entryId) {
    const entryDate = document.getElementById('entryDate').value;
    const entryPayer = document.getElementById('entryPayer').value;
    const entryCategory = document.getElementById('entryCategory').value;
    const entryAmount = document.getElementById('entryAmount').value;
    const entryDetails = `${entryId}*${entryDate}*${entryPayer}*${entryCategory}*${entryAmount}`
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
function showOptionsOnListItem() {
    document.getElementById('optionsModal').style.display = 'flex';
}

function closeOptionsOnListItem() {
    document.getElementById('optionsModal').style.display = 'none';
}
