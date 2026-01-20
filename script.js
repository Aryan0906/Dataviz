// ============================================
// Data Analyzer Pro - Main JavaScript
// HTML5 Semantic Web Application
// ============================================

// ============================================
// GLOBAL STATE & VARIABLES
// ============================================

let dataPoints = [];
let currentChart = null;

// ============================================
// DOM ELEMENTS
// ============================================

const DOM = {
    // Forms
    dataForm: document.getElementById('dataForm'),
    xInput: document.getElementById('xInput'),
    yInput: document.getElementById('yInput'),
    csvForm: document.getElementById('csvForm'),
    csvInput: document.getElementById('csvInput'),
    predictionForm: document.getElementById('predictionForm'),
    predictXInput: document.getElementById('predictXInput'),

    // Buttons
    clearDataBtn: document.getElementById('clearDataBtn'),
    downloadDataBtn: document.getElementById('downloadDataBtn'),
    themeToggle: document.getElementById('themeToggle'),

    // Display Elements
    tableBody: document.getElementById('tableBody'),
    dataChart: document.getElementById('dataChart'),
    pointCount: document.getElementById('pointCount'),
    avgX: document.getElementById('avgX'),
    avgY: document.getElementById('avgY'),
    minX: document.getElementById('minX'),
    maxX: document.getElementById('maxX'),
    analysisContent: document.getElementById('analysisContent'),
    predictionResult: document.getElementById('predictionResult'),
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    initializeEventListeners();
    initializeTheme();

    // Load sample data for demonstration
    loadSampleData();
});

// ============================================
// EVENT LISTENERS
// ============================================

function initializeEventListeners() {
    // Form submissions
    DOM.dataForm.addEventListener('submit', handleAddDataPoint);
    DOM.csvForm.addEventListener('submit', handleCSVUpload);
    DOM.predictionForm.addEventListener('submit', handlePrediction);

    // Button clicks
    DOM.clearDataBtn.addEventListener('click', handleClearData);
    DOM.downloadDataBtn.addEventListener('click', handleDownloadData);
    DOM.themeToggle.addEventListener('click', toggleTheme);
}

// ============================================
// DATA MANAGEMENT - Add, Remove, Clear
// ============================================

function handleAddDataPoint(e) {
    e.preventDefault();

    const x = parseFloat(DOM.xInput.value);
    const y = parseFloat(DOM.yInput.value);

    // Validation
    if (isNaN(x) || isNaN(y)) {
        showNotification('Please enter valid numbers for both X and Y', 'error');
        return;
    }

    // Add point to array
    dataPoints.push({ x, y });

    // Sort by X value
    dataPoints.sort((a, b) => a.x - b.x);

    // Clear form
    DOM.dataForm.reset();

    // Update UI
    updateDisplay();
    showNotification('Data point added successfully!', 'success');

    // Focus back on X input
    DOM.xInput.focus();
}

function handleRemoveDataPoint(index) {
    dataPoints.splice(index, 1);
    updateDisplay();
    showNotification('Data point removed!', 'success');
}

function handleClearData() {
    if (dataPoints.length === 0) {
        showNotification('No data to clear!', 'info');
        return;
    }

    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
        dataPoints = [];
        updateDisplay();
        showNotification('All data cleared!', 'success');
    }
}

// ============================================
// CSV HANDLING
// ============================================

function handleCSVUpload(e) {
    e.preventDefault();

    const file = DOM.csvInput.files[0];

    if (!file) {
        showNotification('Please select a CSV file', 'error');
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        try {
            const csv = event.target.result;
            const lines = csv.trim().split('\n');

            if (lines.length < 2) {
                showNotification('CSV file is empty or too short', 'error');
                return;
            }

            // Parse CSV
            const newPoints = [];
            let headerSkipped = false;

            for (const line of lines) {
                if (!headerSkipped) {
                    headerSkipped = true;
                    continue; // Skip header row
                }

                const values = line.split(',').map(v => v.trim());

                if (values.length >= 2) {
                    const x = parseFloat(values[0]);
                    const y = parseFloat(values[1]);

                    if (!isNaN(x) && !isNaN(y)) {
                        newPoints.push({ x, y });
                    }
                }
            }

            if (newPoints.length === 0) {
                showNotification('No valid data points found in CSV', 'error');
                return;
            }

            // Ask if user wants to append or replace
            if (dataPoints.length > 0) {
                if (confirm(`Found ${newPoints.length} data points. Replace existing data?`)) {
                    dataPoints = newPoints;
                } else {
                    dataPoints = [...dataPoints, ...newPoints];
                }
            } else {
                dataPoints = newPoints;
            }

            // Sort by X
            dataPoints.sort((a, b) => a.x - b.x);

            DOM.csvForm.reset();
            updateDisplay();
            showNotification(`Successfully loaded ${newPoints.length} data points!`, 'success');

        } catch (error) {
            showNotification('Error parsing CSV file: ' + error.message, 'error');
            console.error('CSV parsing error:', error);
        }
    };

    reader.readAsText(file);
}

function downloadSampleCSV(e) {
    e.preventDefault();

    const sampleData = `X,Y
1,2.5
2,4.1
3,6.2
4,8.0
5,10.1
6,12.3
7,14.5
8,16.2
9,18.9
10,21.0`;

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_data.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// ============================================
// DISPLAY UPDATE FUNCTIONS
// ============================================

function updateDisplay() {
    updateTable();
    updateStatistics();
    updateChart();
    updateAnalysis();
    clearPredictionResult();
}

function updateTable() {
    DOM.tableBody.innerHTML = '';

    if (dataPoints.length === 0) {
        DOM.tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #999;">No data points yet. Add some data to get started!</td></tr>';
        return;
    }

    dataPoints.forEach((point, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${point.x.toFixed(2)}</td>
            <td>${point.y.toFixed(2)}</td>
            <td>
                <button class="btn btn-delete" onclick="handleRemoveDataPoint(${index})">Remove</button>
            </td>
        `;
        DOM.tableBody.appendChild(row);
    });
}

function updateStatistics() {
    if (dataPoints.length === 0) {
        DOM.pointCount.textContent = '0';
        DOM.avgX.textContent = '0';
        DOM.avgY.textContent = '0';
        DOM.minX.textContent = '0';
        DOM.maxX.textContent = '0';
        return;
    }

    const xs = dataPoints.map(p => p.x);
    const ys = dataPoints.map(p => p.y);

    const count = dataPoints.length;
    const avgXVal = (xs.reduce((a, b) => a + b, 0) / count).toFixed(2);
    const avgYVal = (ys.reduce((a, b) => a + b, 0) / count).toFixed(2);
    const minXVal = Math.min(...xs).toFixed(2);
    const maxXVal = Math.max(...xs).toFixed(2);

    DOM.pointCount.textContent = count;
    DOM.avgX.textContent = avgXVal;
    DOM.avgY.textContent = avgYVal;
    DOM.minX.textContent = minXVal;
    DOM.maxX.textContent = maxXVal;
}

// ============================================
// REGRESSION ANALYSIS
// ============================================

function performRegressionAnalysis() {
    if (dataPoints.length < 2) {
        return null;
    }

    // Simple Linear Regression
    const n = dataPoints.length;
    const sumX = dataPoints.reduce((sum, p) => sum + p.x, 0);
    const sumY = dataPoints.reduce((sum, p) => sum + p.y, 0);
    const sumXY = dataPoints.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumX2 = dataPoints.reduce((sum, p) => sum + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R²
    const yMean = sumY / n;
    const ssTotal = dataPoints.reduce((sum, p) => sum + Math.pow(p.y - yMean, 2), 0);
    const ssResidual = dataPoints.reduce((sum, p) => {
        const predicted = slope * p.x + intercept;
        return sum + Math.pow(p.y - predicted, 2);
    }, 0);
    const r2 = 1 - (ssResidual / ssTotal);

    return {
        type: 'Linear',
        slope,
        intercept,
        equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`,
        r2,
        predict: (x) => slope * x + intercept,
        points: dataPoints.map(p => ({
            x: p.x,
            y: p.y,
            predicted: slope * p.x + intercept
        }))
    };
}

function updateAnalysis() {
    const analysis = performRegressionAnalysis();

    if (!analysis) {
        DOM.analysisContent.innerHTML = '<p class="no-data-message">Add at least 2 data points to see regression analysis</p>';
        return;
    }

    const r2Percent = (analysis.r2 * 100).toFixed(2);
    const correlation = Math.sqrt(Math.abs(analysis.r2)).toFixed(4);

    DOM.analysisContent.innerHTML = `
        <div class="analysis-box">
            <div class="analysis-item">
                <span class="analysis-label">Model Type:</span>
                <span class="analysis-value">${analysis.type}</span>
            </div>
            <div class="analysis-item">
                <span class="analysis-label">Equation:</span>
                <span class="analysis-value">${analysis.equation}</span>
            </div>
            <div class="analysis-item">
                <span class="analysis-label">R² Value:</span>
                <span class="analysis-value">${r2Percent}%</span>
            </div>
            <div class="analysis-item">
                <span class="analysis-label">Slope:</span>
                <span class="analysis-value">${analysis.slope.toFixed(4)}</span>
            </div>
            <div class="analysis-item">
                <span class="analysis-label">Intercept:</span>
                <span class="analysis-value">${analysis.intercept.toFixed(4)}</span>
            </div>
            <div class="analysis-item">
                <span class="analysis-label">Correlation:</span>
                <span class="analysis-value">${correlation}</span>
            </div>
            <p style="font-size: 12px; margin-top: 10px; color: #999;">
                R² indicates goodness of fit (1.0 = perfect, 0 = poor)
            </p>
        </div>
    `;
}

// ============================================
// CHART VISUALIZATION
// ============================================

function updateChart() {
    const canvas = DOM.dataChart;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (dataPoints.length === 0) {
        ctx.fillStyle = '#999';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No data to display. Add data points to visualize.', canvas.width / 2, canvas.height / 2);
        return;
    }

    // Calculate bounds
    const xs = dataPoints.map(p => p.x);
    const ys = dataPoints.map(p => p.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const padding = 60;
    const width = canvas.width - 2 * padding;
    const height = canvas.height - 2 * padding;

    // Add padding to ranges
    const xRange = maxX - minX || 1;
    const yRange = maxY - minY || 1;
    const xPad = xRange * 0.1;
    const yPad = yRange * 0.1;

    const xMin = minX - xPad;
    const xMax = maxX + xPad;
    const yMin = minY - yPad;
    const yMax = maxY + yPad;

    // Drawing functions
    function scaleX(x) {
        return padding + ((x - xMin) / (xMax - xMin)) * width;
    }

    function scaleY(y) {
        return canvas.height - padding - ((y - yMin) / (yMax - yMin)) * height;
    }

    // Draw axes
    drawAxes(ctx, padding, canvas.width, canvas.height, xMin, xMax, yMin, yMax, scaleX, scaleY);

    // Draw regression line if applicable
    const analysis = performRegressionAnalysis();
    if (analysis) {
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const x1 = xMin;
        const y1 = analysis.predict(x1);
        const x2 = xMax;
        const y2 = analysis.predict(x2);
        ctx.moveTo(scaleX(x1), scaleY(y1));
        ctx.lineTo(scaleX(x2), scaleY(y2));
        ctx.stroke();
    }

    // Draw data points
    ctx.fillStyle = '#3b82f6';
    dataPoints.forEach(point => {
        const x = scaleX(point.x);
        const y = scaleY(point.y);

        // Draw point
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();

        // Draw point outline
        ctx.strokeStyle = '#1e40af';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}

function drawAxes(ctx, padding, width, height, xMin, xMax, yMin, yMax, scaleX, scaleY) {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;

    // X axis
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Y axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();

    // X labels
    ctx.fillStyle = '#666';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';

    for (let i = 0; i <= 5; i++) {
        const x = xMin + (xMax - xMin) * (i / 5);
        const px = scaleX(x);
        ctx.fillText(x.toFixed(1), px, height - padding + 20);

        // Grid line
        ctx.strokeStyle = '#eee';
        ctx.beginPath();
        ctx.moveTo(px, padding);
        ctx.lineTo(px, height - padding);
        ctx.stroke();
    }

    // Y labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
        const y = yMin + (yMax - yMin) * (i / 5);
        const py = scaleY(y);
        ctx.fillText(y.toFixed(1), padding - 10, py + 4);

        // Grid line
        ctx.strokeStyle = '#eee';
        ctx.beginPath();
        ctx.moveTo(padding, py);
        ctx.lineTo(width - padding, py);
        ctx.stroke();
    }

    // Axis labels
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('X', width - 20, height - 20);

    ctx.save();
    ctx.translate(15, padding + (height - 2 * padding) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Y', 0, 0);
    ctx.restore();
}

// ============================================
// PREDICTION
// ============================================

function handlePrediction(e) {
    e.preventDefault();

    const analysis = performRegressionAnalysis();

    if (!analysis) {
        showNotification('Need at least 2 data points for prediction', 'error');
        return;
    }

    const xVal = parseFloat(DOM.predictXInput.value);

    if (isNaN(xVal)) {
        showNotification('Please enter a valid X value', 'error');
        return;
    }

    const predictedY = analysis.predict(xVal);

    DOM.predictionResult.innerHTML = `
        <div>
            <strong>Prediction Result:</strong><br>
            When X = ${xVal.toFixed(2)}<br>
            Y = ${predictedY.toFixed(4)}
        </div>
    `;

    DOM.predictXInput.value = '';
}

function clearPredictionResult() {
    DOM.predictionResult.innerHTML = '';
}

// ============================================
// FILE DOWNLOAD
// ============================================

function handleDownloadData() {
    if (dataPoints.length === 0) {
        showNotification('No data to download', 'error');
        return;
    }

    // Create CSV content
    let csv = 'X,Y\n';
    dataPoints.forEach(point => {
        csv += `${point.x},${point.y}\n`;
    });

    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showNotification('Data downloaded successfully!', 'success');
}

// ============================================
// THEME MANAGEMENT
// ============================================

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

function setTheme(theme) {
    const isDark = theme === 'dark';
    const body = document.body;
    const icon = DOM.themeToggle.querySelector('.theme-icon');

    if (isDark) {
        body.classList.add('dark-theme');
        icon.textContent = '☀️';
    } else {
        body.classList.remove('dark-theme');
        icon.textContent = '🌙';
    }

    localStorage.setItem('theme', theme);
}

// ============================================
// NOTIFICATIONS
// ============================================

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;

    // Set colors based on type
    const colors = {
        success: { bg: '#10b981', text: 'white' },
        error: { bg: '#ef4444', text: 'white' },
        info: { bg: '#3b82f6', text: 'white' }
    };

    const color = colors[type] || colors.info;
    notification.style.backgroundColor = color.bg;
    notification.style.color = color.text;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// SAMPLE DATA LOADER
// ============================================

function loadSampleData() {
    // Load some sample data for demonstration
    dataPoints = [
        { x: 1, y: 2.5 },
        { x: 2, y: 4.1 },
        { x: 3, y: 6.2 },
        { x: 4, y: 8.0 },
        { x: 5, y: 10.1 },
        { x: 6, y: 12.3 }
    ];

    updateDisplay();
    showNotification('Sample data loaded. Ready to analyze!', 'success');
}

// ============================================
// SMOOTH SCROLL BEHAVIOR (Fallback)
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && document.querySelector(href)) {
            e.preventDefault();
            document.querySelector(href).scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

document.addEventListener('keydown', function (e) {
    // Ctrl+S or Cmd+S to download data
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleDownloadData();
    }

    // Ctrl+K or Cmd+K to clear data
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (dataPoints.length > 0) {
            handleClearData();
        }
    }
});

// ============================================
// EXPORT FUNCTIONS
// ============================================

window.handleRemoveDataPoint = handleRemoveDataPoint;
window.downloadSampleCSV = downloadSampleCSV;
