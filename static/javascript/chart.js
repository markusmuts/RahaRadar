function preprocessChartData(rawData) {
  // Create a map to combine duplicate categories
  const categoryMap = new Map();

  // Start from index 1 to skip the header row
  for (let i = 1; i < rawData.length; i++) {
      const [category, amount] = rawData[i];
      if (categoryMap.has(category)) {
          categoryMap.set(category, categoryMap.get(category) + amount);
      } else {
          categoryMap.set(category, amount);
      }
  }

  // Convert the map back to an array format suitable for Google Charts
  const processedData = [["Category", "Amount"]];
  categoryMap.forEach((amount, category) => {
      processedData.push([category, amount]);
  });

  return processedData;
}

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

function fetchChartData() {
  fetch("/chart-data")
      .then(response => response.json())
      .then(rawData => {
          const processedData = preprocessChartData(rawData); // Process data to combine duplicates
          drawChart(processedData); // Call drawChart with the processed data
      })
      .catch(error => console.error("Error fetching chart data:", error));
}

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
