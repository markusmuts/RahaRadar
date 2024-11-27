function preprocessChartData(rawData) {
    const monthMap = new Map();
    console.log("Raw data before processing:", rawData);

    rawData.forEach(row => {
        if (!Array.isArray(row) || row.length < 3) {
            console.error(`Skipping invalid row. Expected array with at least 3 elements, got: ${JSON.stringify(row)}`);
            return;
        }

        const [category, amount, date] = row;
        if (!date || isNaN(amount)) {
            console.error("Skipping row with invalid data (missing date or non-numeric amount):", row);
            return;
        }

        const [day, month, year] = date.split('.');
        const fullYear = parseInt(year.length === 2 ? `20${year}` : year);
        const monthYearKey = `${fullYear}-${String(month).padStart(2, '0')}`;

        monthMap.set(monthYearKey, (monthMap.get(monthYearKey) || 0) + parseFloat(amount));
    });

    const chartData = [["Month", "Amount"]];
    monthMap.forEach((amount, monthYear) => {
        chartData.push([monthYear, amount]);
    });

    console.log("Processed Data for Google Chart:", chartData);
    return chartData;
}

function fetchChartData() {
    fetch("/chart-data")
        .then(response => response.json())
        .then(rawData => {
            console.log("Raw data from server:", rawData);
            const processedData = preprocessChartData(rawData);
            drawChart(processedData);
        })
        .catch(error => console.error("Error fetching chart data:", error));
}

// Draw the chart using Google Charts
function drawChart(chartData) {
    const data = google.visualization.arrayToDataTable(chartData);

    const options = {
        pieHole: 0.6,
        width: 500,
        height: 500,
        pieSliceText: 'none',
        chartArea: { left: 80, top: 80 },
        legend: { position: 'bottom' },
    };

    const chart = new google.visualization.PieChart(document.getElementById('donutchart'));
    chart.draw(data, options);
}

// Fetch chart data from the server and process it
function fetchChartData() {
    fetch("/chart-data")
        .then(response => response.json())
        .then(rawData => {
            const processedData = preprocessChartData(rawData); // Process data to group by month and year
            drawChart(processedData); // Call drawChart with the processed data
        })
        .catch(error => console.error("Error fetching chart data:", error));
}

// Load Google Charts and initialize the chart
function loadGoogleCharts() {
    const script = document.createElement("script");
    script.src = "https://www.gstatic.com/charts/loader.js";
    script.onload = () => {
        google.charts.load("current", { packages: ["corechart"] });
        google.charts.setOnLoadCallback(fetchChartData); // Fetch and process data, then draw chart
    };
    document.head.appendChild(script);
}

// Initialize Google Charts on page load
loadGoogleCharts();

// Function to delete an entry
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

// Function to calculate the total sum of amounts in the table
function calculateTotalSum(filteredRows) {
    let total = 0;

    filteredRows.forEach((row) => {
        const amountCell = row.querySelector('.amount');
        if (amountCell) {
            total += parseFloat(amountCell.textContent) || 0;
        }
    });

    document.getElementById('totalSum').textContent = total.toFixed(2);
}

// Function to filter rows based on selected month and year
function filterByMonthYear() {
    const selectedMonth = document.getElementById('monthSelector').value;
    const selectedYear = document.getElementById('yearSelector').value;

    if (!selectedYear) {
        alert('Palun sisestage aasta!');
        return;
    }

    localStorage.setItem('selectedMonth', selectedMonth);
    localStorage.setItem('selectedYear', selectedYear);

    const startDate = new Date(selectedYear, selectedMonth - 1, 1); // First day of the selected month
    const endDate = new Date(selectedYear, selectedMonth, 0); // Last day of the selected month

    const rows = document.querySelectorAll('#transactionTable tbody tr');
    const filteredRows = [];

    rows.forEach(row => {
        // Validate the row to ensure it is a proper table row
        if (!row || !row.cells || row.cells.length === 0) {
            console.error("Invalid row encountered:", row);
            return;
        }

        const dateCell = row.cells[0].textContent.trim();
        const [day, month, year] = dateCell.split('.');
        const fullYear = parseInt(year.length === 2 ? `20${year}` : year);
        const rowDate = new Date(fullYear, month - 1, day);

        if (rowDate >= startDate && rowDate <= endDate) {
            filteredRows.push(row);
            row.style.display = '';  // Show the row
        } else {
            row.style.display = 'none';  // Hide the row
        }
    });

    document.querySelector('.list_upper p:nth-child(2)').textContent = 
        `Periood: ${startDate.toLocaleString('et-EE', { month: 'long' })} ${selectedYear}`;

    calculateTotalSum(filteredRows);

    // Pass filtered rows to preprocessChartData
    const processedChartData = preprocessChartData(filteredRows);
    drawChart(processedChartData);

    closeMonthYearSelector();
}




// Show month/year selector modal
function showMonthYearSelector() {
    document.getElementById('monthYearModal').style.display = 'flex';
}

// Close month/year selector modal
function closeMonthYearSelector() {
    document.getElementById('monthYearModal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', (event) => {
    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        transactionForm.addEventListener('submit', (e) => {
            setTimeout(() => {
                const rows = document.querySelectorAll('#transactionTable tbody tr');
                calculateTotalSum(rows);
                const processedChartData = preprocessChartData(rows);
                drawChart(processedChartData);
            }, 100);
        });
    }

    loadGoogleCharts();

    const storedMonth = localStorage.getItem('selectedMonth');
    const storedYear = localStorage.getItem('selectedYear');

    if (storedMonth && storedYear) {
        document.getElementById('monthSelector').value = storedMonth;
        document.getElementById('yearSelector').value = storedYear;
        filterByMonthYear(); 
    } else {
        const rows = document.querySelectorAll('#transactionTable tbody tr');
        rows.forEach(row => row.style.display = '');
        document.querySelector('.list_upper p:nth-child(2)').textContent = "Periood: teadmata";
        calculateTotalSum(rows);
        const processedChartData = preprocessChartData(rows);
        drawChart(processedChartData);
    }

    document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', () => {
            setTimeout(() => {
                const rows = document.querySelectorAll('#transactionTable tbody tr');
                calculateTotalSum(rows);
                const processedChartData = preprocessChartData(rows);
                drawChart(processedChartData);
            }, 100);
        });
    });
});

