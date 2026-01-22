let dataPoints = [];
let currentChart = null;
let hoveredPoint = null;
let tooltip = null;

const DOM = {
    dataForm: document.getElementById('dataForm'),
    xInput: document.getElementById('xInput'),
    yInput: document.getElementById('yInput'),
    csvForm: document.getElementById('csvForm'),
    csvInput: document.getElementById('csvInput'),
    predictionForm: document.getElementById('predictionForm'),
    predictXInput: document.getElementById('predictXInput'),
    clearDataBtn: document.getElementById('clearDataBtn'),
    downloadDataBtn: document.getElementById('downloadDataBtn'),
    themeToggle: document.getElementById('themeToggle'),
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

function checkAuthentication() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    
    if (isLoggedIn !== 'true') {
        window.location.href = 'login.html';
        return false;
    }
    
    const username = sessionStorage.getItem('username');
    if (username) {
        displayUserInfo(username);
    }
    
    return true;
}

function displayUserInfo(username) {
    const headerContent = document.querySelector('.header-content');
    if (headerContent && !document.getElementById('userInfo')) {
        const userInfo = document.createElement('div');
        userInfo.id = 'userInfo';
        userInfo.className = 'user-info';
        userInfo.innerHTML = `
            <span class="username">Welcome, ${username}!</span>
            <button id="logoutBtn" class="btn-logout">Logout</button>
        `;
        
        const themeToggle = document.getElementById('themeToggle');
        headerContent.insertBefore(userInfo, themeToggle);
        
        document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    }
}

function handleLogout() {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('loginTime');
    
    alert('You have been logged out successfully!');
    
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', function () {
    checkAuthentication();
    
    initializeEventListeners();
    initializeTheme();
    initializeChartInteractivity();

    loadSampleData();
});

function initializeEventListeners() {
    DOM.dataForm.addEventListener('submit', handleAddDataPoint);
    DOM.csvForm.addEventListener('submit', handleCSVUpload);
    DOM.predictionForm.addEventListener('submit', handlePrediction);
    DOM.clearDataBtn.addEventListener('click', handleClearData);
    DOM.downloadDataBtn.addEventListener('click', handleDownloadData);
    DOM.themeToggle.addEventListener('click', toggleTheme);
}

function initializeChartInteractivity() {
    const canvas = DOM.dataChart;
    
    canvas.addEventListener('mousemove', handleChartMouseMove);
    canvas.addEventListener('mouseout', handleChartMouseOut);
    canvas.addEventListener('click', handleChartClick);
    
    createTooltip();
}

function createTooltip() {
    tooltip = document.createElement('div');
    tooltip.id = 'chart-tooltip';
    tooltip.style.cssText = `
        position: absolute;
        background: rgba(0, 0, 0, 0.85);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 13px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s;
        z-index: 1000;
        white-space: nowrap;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    document.body.appendChild(tooltip);
}

function handleChartMouseMove(e) {
    const canvas = DOM.dataChart;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = mouseX * scaleX;
    const canvasY = mouseY * scaleY;
    
    const point = findPointAtPosition(canvasX, canvasY);
    
    if (point !== null) {
        hoveredPoint = point;
        canvas.style.cursor = 'pointer';
        showTooltip(e.clientX, e.clientY, dataPoints[point]);
        highlightPoint();
    } else {
        hoveredPoint = null;
        canvas.style.cursor = 'crosshair';
        hideTooltip();
        updateChart();
    }
}

function handleChartMouseOut() {
    hoveredPoint = null;
    hideTooltip();
    updateChart();
}

function handleChartClick(e) {
    const canvas = DOM.dataChart;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = mouseX * scaleX;
    const canvasY = mouseY * scaleY;
    
    const point = findPointAtPosition(canvasX, canvasY);
    
    if (point !== null) {
        hideTooltip();
        showRemoveConfirmation(e.clientX, e.clientY, point);
    }
}

function showRemoveConfirmation(x, y, pointIndex) {
    const existingConfirm = document.getElementById('point-remove-confirm');
    if (existingConfirm) {
        existingConfirm.remove();
    }
    
    const confirmBox = document.createElement('div');
    confirmBox.id = 'point-remove-confirm';
    confirmBox.style.cssText = `
        position: fixed;
        left: ${x + 10}px;
        top: ${y - 50}px;
        background: white;
        border: 2px solid #ef4444;
        border-radius: 8px;
        padding: 12px 16px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        z-index: 99999;
        animation: fadeIn 0.2s ease;
        min-width: 200px;
    `;
    
    const point = dataPoints[pointIndex];
    confirmBox.innerHTML = `
        <div style="color: #1f2937; font-size: 14px; margin-bottom: 10px; font-weight: 600;">
            Remove Point?
        </div>
        <div style="color: #6b7280; font-size: 12px; margin-bottom: 12px;">
            X: ${point.x.toFixed(2)}, Y: ${point.y.toFixed(2)}
        </div>
        <div style="display: flex; gap: 8px;">
            <button id="confirmRemove" style="
                background: #ef4444;
                color: white;
                border: none;
                padding: 8px 18px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 600;
                flex: 1;
                transition: background 0.2s;
            " onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">
                Remove
            </button>
            <button id="cancelRemove" style="
                background: #e5e7eb;
                color: #374151;
                border: none;
                padding: 8px 18px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 600;
                flex: 1;
                transition: background 0.2s;
            " onmouseover="this.style.background='#d1d5db'" onmouseout="this.style.background='#e5e7eb'">
                Cancel
            </button>
        </div>
    `;
    
    document.body.appendChild(confirmBox);
    
    document.getElementById('confirmRemove').onclick = (e) => {
        e.stopPropagation();
        handleRemoveDataPoint(pointIndex);
        confirmBox.remove();
    };
    
    document.getElementById('cancelRemove').onclick = (e) => {
        e.stopPropagation();
        confirmBox.remove();
    };
    
    setTimeout(() => {
        const clickOutside = (e) => {
            if (confirmBox && !confirmBox.contains(e.target)) {
                confirmBox.remove();
                document.removeEventListener('click', clickOutside);
            }
        };
        document.addEventListener('click', clickOutside);
    }, 100);
}

function findPointAtPosition(x, y) {
    if (dataPoints.length === 0) return null;
    
    const xs = dataPoints.map(p => p.x);
    const ys = dataPoints.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const padding = 60;
    const canvas = DOM.dataChart;
    const width = canvas.width - 2 * padding;
    const height = canvas.height - 2 * padding;
    
    const xRange = maxX - minX || 1;
    const yRange = maxY - minY || 1;
    const xPad = xRange * 0.1;
    const yPad = yRange * 0.1;
    
    const xMin = minX - xPad;
    const xMax = maxX + xPad;
    const yMin = minY - yPad;
    const yMax = maxY + yPad;
    
    function scaleX(px) {
        return padding + ((px - xMin) / (xMax - xMin)) * width;
    }
    
    function scaleY(py) {
        return canvas.height - padding - ((py - yMin) / (yMax - yMin)) * height;
    }
    
    const hitRadius = 10;
    
    for (let i = 0; i < dataPoints.length; i++) {
        const px = scaleX(dataPoints[i].x);
        const py = scaleY(dataPoints[i].y);
        
        const distance = Math.sqrt(Math.pow(x - px, 2) + Math.pow(y - py, 2));
        
        if (distance <= hitRadius) {
            return i;
        }
    }
    
    return null;
}

function showTooltip(x, y, point) {
    const analysis = performRegressionAnalysis();
    const predicted = analysis ? analysis.predict(point.x) : null;
    const error = predicted !== null ? Math.abs(point.y - predicted) : null;
    
    let content = `<strong>X:</strong> ${point.x.toFixed(2)}<br><strong>Y:</strong> ${point.y.toFixed(2)}`;
    
    if (error !== null) {
        content += `<br><strong>Predicted Y:</strong> ${predicted.toFixed(2)}`;
        content += `<br><strong>Error:</strong> ${error.toFixed(2)}`;
    }
    
    tooltip.innerHTML = content;
    tooltip.style.left = (x + 15) + 'px';
    tooltip.style.top = (y - 10) + 'px';
    tooltip.style.opacity = '1';
}

function hideTooltip() {
    if (tooltip) {
        tooltip.style.opacity = '0';
    }
}

function highlightPoint() {
    if (hoveredPoint === null) return;
    
    updateChart();
    
    const canvas = DOM.dataChart;
    const ctx = canvas.getContext('2d');
    
    const xs = dataPoints.map(p => p.x);
    const ys = dataPoints.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const padding = 60;
    const width = canvas.width - 2 * padding;
    const height = canvas.height - 2 * padding;
    
    const xRange = maxX - minX || 1;
    const yRange = maxY - minY || 1;
    const xPad = xRange * 0.1;
    const yPad = yRange * 0.1;
    
    const xMin = minX - xPad;
    const xMax = maxX + xPad;
    const yMin = minY - yPad;
    const yMax = maxY + yPad;
    
    function scaleX(px) {
        return padding + ((px - xMin) / (xMax - xMin)) * width;
    }
    
    function scaleY(py) {
        return canvas.height - padding - ((py - yMin) / (yMax - yMin)) * height;
    }
    
    const point = dataPoints[hoveredPoint];
    const x = scaleX(point.x);
    const y = scaleY(point.y);
    
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, 2 * Math.PI);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
    ctx.fill();
}

function handleAddDataPoint(e) {
    e.preventDefault();

    const x = parseFloat(DOM.xInput.value);
    const y = parseFloat(DOM.yInput.value);

    if (isNaN(x) || isNaN(y)) {
        showNotification('Please enter valid numbers for both X and Y', 'error');
        return;
    }

    dataPoints.push({ x, y });
    dataPoints.sort((a, b) => a.x - b.x);
    DOM.dataForm.reset();
    updateDisplay();
    showNotification('Data point added successfully!', 'success');
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

            const newPoints = [];
            let headerSkipped = false;

            for (const line of lines) {
                if (!headerSkipped) {
                    headerSkipped = true;
                    continue;
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

            if (dataPoints.length > 0) {
                if (confirm(`Found ${newPoints.length} data points. Replace existing data?`)) {
                    dataPoints = newPoints;
                } else {
                    dataPoints = [...dataPoints, ...newPoints];
                }
            } else {
                dataPoints = newPoints;
            }

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

function performRegressionAnalysis() {
    if (dataPoints.length < 2) {
        return null;
    }

    const models = [
        calculateLinearRegression(),
        calculateQuadraticRegression(),
        calculateExponentialRegression(),
        calculateLogarithmicRegression(),
        calculatePowerRegression()
    ].filter(m => m !== null);

    if (models.length === 0) return null;

    models.sort((a, b) => b.r2 - a.r2);
    
    return models[0];
}

function calculateLinearRegression() {
    const n = dataPoints.length;
    const sumX = dataPoints.reduce((sum, p) => sum + p.x, 0);
    const sumY = dataPoints.reduce((sum, p) => sum + p.y, 0);
    const sumXY = dataPoints.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumX2 = dataPoints.reduce((sum, p) => sum + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const yMean = sumY / n;
    const ssTotal = dataPoints.reduce((sum, p) => sum + Math.pow(p.y - yMean, 2), 0);
    const ssResidual = dataPoints.reduce((sum, p) => {
        const predicted = slope * p.x + intercept;
        return sum + Math.pow(p.y - predicted, 2);
    }, 0);
    const r2 = 1 - (ssResidual / ssTotal);

    const sign = intercept >= 0 ? '+' : '';
    
    return {
        type: 'Linear',
        equation: `y = ${slope.toFixed(4)}x ${sign} ${intercept.toFixed(4)}`,
        r2,
        predict: (x) => slope * x + intercept,
        coefficients: { slope, intercept }
    };
}

function calculateQuadraticRegression() {
    if (dataPoints.length < 3) return null;
    
    const n = dataPoints.length;
    const sumX = dataPoints.reduce((sum, p) => sum + p.x, 0);
    const sumY = dataPoints.reduce((sum, p) => sum + p.y, 0);
    const sumX2 = dataPoints.reduce((sum, p) => sum + p.x * p.x, 0);
    const sumX3 = dataPoints.reduce((sum, p) => sum + Math.pow(p.x, 3), 0);
    const sumX4 = dataPoints.reduce((sum, p) => sum + Math.pow(p.x, 4), 0);
    const sumXY = dataPoints.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumX2Y = dataPoints.reduce((sum, p) => sum + p.x * p.x * p.y, 0);

    const denominator = (n * sumX2 * sumX4 - n * sumX3 * sumX3 - sumX * sumX * sumX4 + 
                        2 * sumX * sumX2 * sumX3 - sumX2 * sumX2 * sumX2);
    
    if (Math.abs(denominator) < 1e-10) return null;

    const a = (n * sumX2 * sumX2Y - n * sumX3 * sumXY - sumX * sumX * sumX2Y + 
               sumX * sumX2 * sumXY + sumX * sumX3 * sumY - sumX2 * sumX2 * sumY) / denominator;
    
    const b = (n * sumX4 * sumXY - n * sumX3 * sumX2Y - sumX * sumX3 * sumY + 
               sumX * sumX2 * sumX2Y + sumX2 * sumX2 * sumY - sumX2 * sumX3 * sumXY) / denominator;
    
    const c = (sumX2 * sumX3 * sumXY - sumX2 * sumX4 * sumY - sumX * sumX3 * sumXY + 
               sumX * sumX4 * sumY + sumX2 * sumX2 * sumX2Y - sumX2 * sumX2 * sumX2Y) / denominator;

    const yMean = sumY / n;
    const ssTotal = dataPoints.reduce((sum, p) => sum + Math.pow(p.y - yMean, 2), 0);
    const ssResidual = dataPoints.reduce((sum, p) => {
        const predicted = a * p.x * p.x + b * p.x + c;
        return sum + Math.pow(p.y - predicted, 2);
    }, 0);
    const r2 = 1 - (ssResidual / ssTotal);

    if (isNaN(r2) || r2 < 0) return null;

    const signB = b >= 0 ? '+' : '';
    const signC = c >= 0 ? '+' : '';

    return {
        type: 'Quadratic',
        equation: `y = ${a.toFixed(4)}x² ${signB} ${b.toFixed(4)}x ${signC} ${c.toFixed(4)}`,
        r2,
        predict: (x) => a * x * x + b * x + c,
        coefficients: { a, b, c }
    };
}

function calculateExponentialRegression() {
    if (dataPoints.some(p => p.y <= 0)) return null;
    
    const n = dataPoints.length;
    const sumX = dataPoints.reduce((sum, p) => sum + p.x, 0);
    const sumLnY = dataPoints.reduce((sum, p) => sum + Math.log(p.y), 0);
    const sumXLnY = dataPoints.reduce((sum, p) => sum + p.x * Math.log(p.y), 0);
    const sumX2 = dataPoints.reduce((sum, p) => sum + p.x * p.x, 0);

    const b = (n * sumXLnY - sumX * sumLnY) / (n * sumX2 - sumX * sumX);
    const lnA = (sumLnY - b * sumX) / n;
    const a = Math.exp(lnA);

    const yMean = dataPoints.reduce((sum, p) => sum + p.y, 0) / n;
    const ssTotal = dataPoints.reduce((sum, p) => sum + Math.pow(p.y - yMean, 2), 0);
    const ssResidual = dataPoints.reduce((sum, p) => {
        const predicted = a * Math.exp(b * p.x);
        return sum + Math.pow(p.y - predicted, 2);
    }, 0);
    const r2 = 1 - (ssResidual / ssTotal);

    if (isNaN(r2) || r2 < 0) return null;

    return {
        type: 'Exponential',
        equation: `y = ${a.toFixed(4)}e^(${b.toFixed(4)}x)`,
        r2,
        predict: (x) => a * Math.exp(b * x),
        coefficients: { a, b }
    };
}

function calculateLogarithmicRegression() {
    if (dataPoints.some(p => p.x <= 0)) return null;
    
    const n = dataPoints.length;
    const sumLnX = dataPoints.reduce((sum, p) => sum + Math.log(p.x), 0);
    const sumY = dataPoints.reduce((sum, p) => sum + p.y, 0);
    const sumLnXY = dataPoints.reduce((sum, p) => sum + Math.log(p.x) * p.y, 0);
    const sumLnX2 = dataPoints.reduce((sum, p) => sum + Math.pow(Math.log(p.x), 2), 0);

    const b = (n * sumLnXY - sumLnX * sumY) / (n * sumLnX2 - sumLnX * sumLnX);
    const a = (sumY - b * sumLnX) / n;

    const yMean = sumY / n;
    const ssTotal = dataPoints.reduce((sum, p) => sum + Math.pow(p.y - yMean, 2), 0);
    const ssResidual = dataPoints.reduce((sum, p) => {
        const predicted = a + b * Math.log(p.x);
        return sum + Math.pow(p.y - predicted, 2);
    }, 0);
    const r2 = 1 - (ssResidual / ssTotal);

    if (isNaN(r2) || r2 < 0) return null;

    const sign = a >= 0 ? '+' : '';

    return {
        type: 'Logarithmic',
        equation: `y = ${b.toFixed(4)}ln(x) ${sign} ${a.toFixed(4)}`,
        r2,
        predict: (x) => a + b * Math.log(x),
        coefficients: { a, b }
    };
}

function calculatePowerRegression() {
    if (dataPoints.some(p => p.x <= 0 || p.y <= 0)) return null;
    
    const n = dataPoints.length;
    const sumLnX = dataPoints.reduce((sum, p) => sum + Math.log(p.x), 0);
    const sumLnY = dataPoints.reduce((sum, p) => sum + Math.log(p.y), 0);
    const sumLnXLnY = dataPoints.reduce((sum, p) => sum + Math.log(p.x) * Math.log(p.y), 0);
    const sumLnX2 = dataPoints.reduce((sum, p) => sum + Math.pow(Math.log(p.x), 2), 0);

    const b = (n * sumLnXLnY - sumLnX * sumLnY) / (n * sumLnX2 - sumLnX * sumLnX);
    const lnA = (sumLnY - b * sumLnX) / n;
    const a = Math.exp(lnA);

    const yMean = dataPoints.reduce((sum, p) => sum + p.y, 0) / n;
    const ssTotal = dataPoints.reduce((sum, p) => sum + Math.pow(p.y - yMean, 2), 0);
    const ssResidual = dataPoints.reduce((sum, p) => {
        const predicted = a * Math.pow(p.x, b);
        return sum + Math.pow(p.y - predicted, 2);
    }, 0);
    const r2 = 1 - (ssResidual / ssTotal);

    if (isNaN(r2) || r2 < 0) return null;

    return {
        type: 'Power',
        equation: `y = ${a.toFixed(4)}x^${b.toFixed(4)}`,
        r2,
        predict: (x) => a * Math.pow(x, b),
        coefficients: { a, b }
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

    let coefficientsHTML = '';
    
    switch(analysis.type) {
        case 'Linear':
            coefficientsHTML = `
                <div class="analysis-item">
                    <span class="analysis-label">Slope (m):</span>
                    <span class="analysis-value">${analysis.coefficients.slope.toFixed(4)}</span>
                </div>
                <div class="analysis-item">
                    <span class="analysis-label">Intercept (b):</span>
                    <span class="analysis-value">${analysis.coefficients.intercept.toFixed(4)}</span>
                </div>
            `;
            break;
        case 'Quadratic':
            coefficientsHTML = `
                <div class="analysis-item">
                    <span class="analysis-label">Coefficient a:</span>
                    <span class="analysis-value">${analysis.coefficients.a.toFixed(4)}</span>
                </div>
                <div class="analysis-item">
                    <span class="analysis-label">Coefficient b:</span>
                    <span class="analysis-value">${analysis.coefficients.b.toFixed(4)}</span>
                </div>
                <div class="analysis-item">
                    <span class="analysis-label">Coefficient c:</span>
                    <span class="analysis-value">${analysis.coefficients.c.toFixed(4)}</span>
                </div>
            `;
            break;
        case 'Exponential':
        case 'Logarithmic':
        case 'Power':
            coefficientsHTML = `
                <div class="analysis-item">
                    <span class="analysis-label">Coefficient a:</span>
                    <span class="analysis-value">${analysis.coefficients.a.toFixed(4)}</span>
                </div>
                <div class="analysis-item">
                    <span class="analysis-label">Coefficient b:</span>
                    <span class="analysis-value">${analysis.coefficients.b.toFixed(4)}</span>
                </div>
            `;
            break;
    }

    DOM.analysisContent.innerHTML = `
        <div class="analysis-box">
            <div class="analysis-item analysis-highlight">
                <span class="analysis-label" style="font-weight: 700;">Best Fit Model:</span>
                <span class="analysis-value" style="font-weight: 700;">${analysis.type}</span>
            </div>
            <div class="analysis-item">
                <span class="analysis-label">Equation:</span>
                <span class="analysis-value" style="font-family: monospace; font-size: 13px;">${analysis.equation}</span>
            </div>
            <div class="analysis-item">
                <span class="analysis-label">R² Value:</span>
                <span class="analysis-value r2-value" style="font-weight: 600;" data-r2="${r2Percent}">${r2Percent}%</span>
            </div>
            ${coefficientsHTML}
            <div class="analysis-item">
                <span class="analysis-label">Correlation:</span>
                <span class="analysis-value">${correlation}</span>
            </div>
            <p style="font-size: 11px; margin-top: 10px; color: var(--color-text-light); line-height: 1.4;">
                R² indicates goodness of fit (1.0 = perfect, 0 = poor)<br>
                The model with highest R² is automatically selected
            </p>
        </div>
    `;
}

function updateChart() {
    const canvas = DOM.dataChart;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (dataPoints.length === 0) {
        const isDark = document.body.classList.contains('dark-theme');
        ctx.fillStyle = isDark ? '#9ca3af' : '#6b7280';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No data to display. Add data points to visualize.', canvas.width / 2, canvas.height / 2);
        return;
    }

    const xs = dataPoints.map(p => p.x);
    const ys = dataPoints.map(p => p.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const padding = 60;
    const width = canvas.width - 2 * padding;
    const height = canvas.height - 2 * padding;

    const xRange = maxX - minX || 1;
    const yRange = maxY - minY || 1;
    const xPad = xRange * 0.1;
    const yPad = yRange * 0.1;

    const xMin = minX - xPad;
    const xMax = maxX + xPad;
    const yMin = minY - yPad;
    const yMax = maxY + yPad;

    function scaleX(x) {
        return padding + ((x - xMin) / (xMax - xMin)) * width;
    }

    function scaleY(y) {
        return canvas.height - padding - ((y - yMin) / (yMax - yMin)) * height;
    }

    drawAxes(ctx, padding, canvas.width, canvas.height, xMin, xMax, yMin, yMax, scaleX, scaleY);

    const analysis = performRegressionAnalysis();
    if (analysis) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        
        const numPoints = 200;
        const step = (xMax - xMin) / numPoints;
        
        for (let i = 0; i <= numPoints; i++) {
            const x = xMin + i * step;
            let y;
            
            try {
                y = analysis.predict(x);
                
                if (!isFinite(y)) continue;
                
                if (y < yMin - (yMax - yMin) * 0.5 || y > yMax + (yMax - yMin) * 0.5) {
                    continue;
                }
                
                const px = scaleX(x);
                const py = scaleY(y);
                
                if (i === 0) {
                    ctx.moveTo(px, py);
                } else {
                    ctx.lineTo(px, py);
                }
            } catch (e) {
                continue;
            }
        }
        
        ctx.stroke();
        ctx.setLineDash([]);
    }

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 8);
    gradient.addColorStop(0, '#3b82f6');
    gradient.addColorStop(1, '#1e40af');
    
    dataPoints.forEach(point => {
        const x = scaleX(point.x);
        const y = scaleY(point.y);

        ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, 2 * Math.PI);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#1e40af';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}

function drawAxes(ctx, padding, width, height, xMin, xMax, yMin, yMax, scaleX, scaleY) {
    const isDark = document.body.classList.contains('dark-theme');
    const axisColor = isDark ? '#6b7280' : '#374151';
    const gridColor = isDark ? '#374151' : '#e5e7eb';
    const textColor = isDark ? '#d1d5db' : '#1f2937';
    
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';

    for (let i = 0; i <= 5; i++) {
        const x = xMin + (xMax - xMin) * (i / 5);
        const px = scaleX(x);
        ctx.fillText(x.toFixed(1), px, height - padding + 20);

        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(px, padding);
        ctx.lineTo(px, height - padding);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
        const y = yMin + (yMax - yMin) * (i / 5);
        const py = scaleY(y);
        ctx.fillText(y.toFixed(1), padding - 10, py + 4);

        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(padding, py);
        ctx.lineTo(width - padding, py);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('X Axis', width / 2, height - 15);

    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Y Axis', 0, 0);
    ctx.restore();
}

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

function handleDownloadData() {
    if (dataPoints.length === 0) {
        showNotification('No data to download', 'error');
        return;
    }

    let csv = 'X,Y\n';
    dataPoints.forEach(point => {
        csv += `${point.x},${point.y}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showNotification('Data downloaded successfully!', 'success');
}

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

function showNotification(message, type = 'info') {
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

    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function loadSampleData() {
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

document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleDownloadData();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (dataPoints.length > 0) {
            handleClearData();
        }
    }
});

window.handleRemoveDataPoint = handleRemoveDataPoint;
window.downloadSampleCSV = downloadSampleCSV;
