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
      title: 'Kulude analüüs',
      pieHole: 0.6,
      width: 500,
      height: 500,
      pieSliceText: 'none',
      chartArea: {
        width: '80%',
        height: '80%',
        left: 0,
        top: 0
      },
      legend: { position: 'bottom' },
    };
  
    // Draw the chart in the specified container
    const chart = new google.visualization.PieChart(document.getElementById('donutchart'));
    chart.draw(data, options);
  }
  
  // Load Google Charts and draw the chart
  loadGoogleCharts();
  