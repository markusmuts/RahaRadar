// Load Google Charts and initialize the chart
// Load Google Charts and initialize the chart
function loadGoogleCharts(callback) {
    const script = document.createElement("script");
    script.src = "https://www.gstatic.com/charts/loader.js";
    script.onload = () => {
        console.log("Google Charts script loaded successfully.");
        google.charts.load("current", { packages: ["corechart", "piechart"] });
        google.charts.setOnLoadCallback(callback); // Ensure callback runs when the library is fully loaded
    };
    script.onerror = () => {
        console.error("Failed to load Google Charts script.");
    };
    document.head.appendChild(script);
}

// Function to initialize the chart (runs once Google Charts is loaded)
function initializeChart() {
    console.log("Initializing Chart...");

    // Ensure Google Charts is loaded and available
    if (typeof google === "undefined" || typeof google.visualization === "undefined") {
        console.error("Google Charts library not available.");
        return;
    }

    console.log("Google Charts loaded and initialized.");
    updateChartData(); // Proceed to update and draw the chart
}

// Function to update chart data based on the table's filtered rows
function updateChartData() {
    // Ensure Google Charts is loaded before proceeding
    if (typeof google === "undefined" || typeof google.visualization === "undefined") {
        console.error("Google Charts library not loaded correctly.");
        return;
    }

    const selectedMonth = localStorage.getItem('selectedMonth');
    const selectedYear = localStorage.getItem('selectedYear');
    
    if (selectedMonth && selectedYear) {
        filterByMonthYear(); // Apply the month/year filter
    } else {
        // If no month/year selected, show all rows
        const rows = document.querySelectorAll('#transactionTable tbody tr');
        rows.forEach(row => row.style.display = '');
        const processedChartData = preprocessChartData(Array.from(rows).map(row => {
            const category = row.querySelector('.category')?.textContent.trim();
            const amount = parseFloat(row.querySelector('.amount')?.textContent || 0);
            return category && !isNaN(amount) ? [category, amount] : null;
        }).filter(Boolean));
        drawChart(processedChartData);  // Call drawChart after data is prepared
    }
}

// Preprocess the chart data (grouping by category)
function preprocessChartData(rawData) {
    console.log("Raw data received by preprocessChartData:", rawData);
    const categoryMap = new Map(); // Use category as the key

    rawData.forEach(row => {
        if (!Array.isArray(row) || row.length < 2) {
            console.error("Skipping invalid row. Expected array with at least 2 elements, got:", row);
            return;
        }

        const [category, value] = row;
        if (!category || typeof value !== "number") {
            console.error("Skipping row with invalid data:", row);
            return;
        }

        categoryMap.set(category, (categoryMap.get(category) || 0) + value);
    });

    console.log("Processed categoryMap:", Array.from(categoryMap.entries()));
    const chartData = [["Category", "Amount"], ...Array.from(categoryMap.entries())];
    console.log("Final chartData:", chartData);
    return chartData;
}

// Function to draw the chart using Google Charts
function drawChart(chartData) {
    if (typeof google === "undefined" || typeof google.visualization === "undefined") {
        console.error("Google Charts not loaded.");
        return;
    }

    console.log("Drawing Chart with Data:", chartData);
    var data = google.visualization.arrayToDataTable(chartData);

    var options = {
        pieHole: 0.4,
    };

    var chart = new google.visualization.PieChart(document.getElementById('donutchart'));
    chart.draw(data, options);
}

// Event listener for DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    loadGoogleCharts(initializeChart);  // Load and initialize charts

    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        transactionForm.addEventListener('submit', (e) => {
            setTimeout(() => {
                const rows = document.querySelectorAll('#transactionTable tbody tr');
                calculateTotalSum(rows);
                const processedChartData = preprocessChartData(Array.from(rows).map(row => {
                    const category = row.querySelector('.category')?.textContent.trim();
                    const amount = parseFloat(row.querySelector('.amount')?.textContent || 0);
                    return category && !isNaN(amount) ? [category, amount] : null;
                }).filter(Boolean));
                drawChart(processedChartData); // Draw the chart after data is processed
            }, 100);
        });
    }

    const storedMonth = localStorage.getItem('selectedMonth');
    const storedYear = localStorage.getItem('selectedYear');

    if (storedMonth && storedYear) {
        document.getElementById('monthSelector').value = storedMonth;
        document.getElementById('yearSelector').value = storedYear;
        filterByMonthYear(); // Apply previously selected filters on page load
    } else {
        const rows = document.querySelectorAll('#transactionTable tbody tr');
        rows.forEach(row => row.style.display = '');
        document.querySelector('.list_upper p:nth-child(2)').textContent = "Periood: teadmata";
        calculateTotalSum(rows);
        const processedChartData = preprocessChartData(Array.from(rows).map(row => {
            const category = row.querySelector('.category')?.textContent.trim();
            const amount = parseFloat(row.querySelector('.amount')?.textContent || 0);
            return category && !isNaN(amount) ? [category, amount] : null;
        }).filter(Boolean));
        drawChart(processedChartData);  // Draw the chart after data is processed
    }
});


// Function to filter rows based on selected month and year
function filterByMonthYear() {
    const selectedMonth = document.getElementById('monthSelector').value;
    const selectedYear = document.getElementById('yearSelector').value;

    if (!selectedYear || !selectedMonth) {
        alert('Please select a valid year and month!');
        return;
    }

    localStorage.setItem('selectedMonth', selectedMonth);
    localStorage.setItem('selectedYear', selectedYear);

    const startDate = new Date(selectedYear, selectedMonth - 1, 1); // First day of the selected month
    const endDate = new Date(selectedYear, selectedMonth, 0); // Last day of the selected month

    const rows = document.querySelectorAll('#transactionTable tbody tr');
    const filteredRows = [];

    rows.forEach(row => {
        const dateCell = row.cells[0]?.textContent?.trim();
        if (!dateCell) return; // Skip invalid rows

        const [day, month, year] = dateCell.split('.');
        const fullYear = parseInt(year.length === 2 ? `20${year}` : year);
        const rowDate = new Date(fullYear, month - 1, day);

        if (rowDate >= startDate && rowDate <= endDate) {
            filteredRows.push(row);
            row.style.display = ''; // Show the row
        } else {
            row.style.display = 'none'; // Hide the row
        }
    });

    document.querySelector('.list_upper p:nth-child(2)').textContent = 
        `Periood: ${startDate.toLocaleString('et-EE', { month: 'long' })} ${selectedYear}`;

    console.log("Filtered rows:", filteredRows);

    const chartRows = filteredRows.map(row => {
        const category = row.querySelector('.category')?.textContent?.trim();
        const amountCell = row.querySelector('.amount')?.textContent || "0";
        const amount = parseFloat(amountCell);

        if (!category || isNaN(amount)) {
            console.warn("Skipping invalid row:", row);
            return null;
        }

        return [category, amount];
    }).filter(row => row !== null); // Remove invalid rows

    const processedChartData = preprocessChartData(chartRows);
    drawChart(processedChartData);
    closeMonthYearSelector();
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


// Show month/year selector modal
function showMonthYearSelector() {
    document.getElementById('monthYearModal').style.display = 'flex';
}

// Close month/year selector modal
function closeMonthYearSelector() {
    document.getElementById('monthYearModal').style.display = 'none';
}

function showOptionsOnListItem() {
    document.getElementById('optionsModal').style.display = 'flex';
}

function closeOptionsOnListItem() {
    document.getElementById('optionsModal').style.display = 'none';
}
