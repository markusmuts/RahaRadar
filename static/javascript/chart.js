// Load the Google Charts library dynamically
function loadGoogleCharts() {
  const script = document.createElement("script");
  script.src = "https://www.gstatic.com/charts/loader.js";
  script.type = "text/javascript";
  script.onload = () => {
    google.charts.load("current", { packages: ["corechart"] });
    google.charts.setOnLoadCallback(drawChart);
  };
  document.head.appendChild(script);
}

// Define the drawChart function
function drawChart() {
  // Create the data for the chart
  const data = google.visualization.arrayToDataTable([
    ['Kategooria', 'Eurod'],
    ['Work', 11],
    ['Eat', 2],
    ['Commute', 2],
    ['Watch TV', 2],
    ['Pede', 2],
    ['Sleep', 7]
  ]);

  // Set chart options
  const options = {
    pieHole: 0.6,
    width: 500,
    height: 500,
    pieSliceText: 'none',
    chartArea: {
      left: 80,
      top: 80
    },
    legend: { position: 'bottom' },
  };

  // Draw the chart in the specified container
  const chart = new google.visualization.PieChart(document.getElementById('donutchart'));
  chart.draw(data, options);
}

// Load Google Charts and draw the chart
loadGoogleCharts();

  /*
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

// Fetch chart data from the server
function fetchChartData() {
    fetch("/chart-data")
        .then(response => response.json())
        .then(data => {
            drawChart(data); // Call drawChart with the fetched data
        })
        .catch(error => console.error("Error fetching chart data:", error));
}

// Load Google Charts and initial chart data
function loadGoogleCharts() {
    const script = document.createElement("script");
    script.src = "https://www.gstatic.com/charts/loader.js";
    script.onload = () => {
        google.charts.load("current", { packages: ["corechart"] });
        google.charts.setOnLoadCallback(fetchChartData); // Fetch data and draw chart
    };
    document.head.appendChild(script);
}

// Initialize Google Charts on page load
loadGoogleCharts(); */