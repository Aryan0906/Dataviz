// ============================================
// Login Page - JavaScript
// ============================================

// ============================================
// DOM ELEMENTS
// ============================================

const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const rememberMeCheckbox = document.getElementById('rememberMe');
const errorMessage = document.getElementById('errorMessage');
const themeToggle = document.getElementById('themeToggle');

// ============================================
// DEMO CREDENTIALS
// ============================================

const DEMO_CREDENTIALS = {
    username: 'demo',
    password: 'demo123'
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    initializeTheme();
    checkExistingSession();
    initializeEventListeners();
});

// ============================================
// EVENT LISTENERS
// ============================================

function initializeEventListeners() {
    loginForm.addEventListener('submit', handleLogin);
    themeToggle.addEventListener('click', toggleTheme);

    // Load saved username if "Remember me" was checked
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername) {
        usernameInput.value = savedUsername;
        rememberMeCheckbox.checked = true;
    }
}

// ============================================
// LOGIN HANDLING
// ============================================

function handleLogin(e) {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    // Clear previous error
    hideError();

    // Validation
    if (!username || !password) {
        showError('Please enter both username and password');
        return;
    }

    // Check credentials
    if (username === DEMO_CREDENTIALS.username && password === DEMO_CREDENTIALS.password) {
        // Successful login
        handleSuccessfulLogin(username);
    } else {
        // Failed login
        showError('Invalid username or password. Please try the demo credentials.');
        
        // Shake animation for error feedback
        loginForm.classList.add('shake');
        setTimeout(() => {
            loginForm.classList.remove('shake');
        }, 500);
    }
}

function handleSuccessfulLogin(username) {
    // Save username if "Remember me" is checked
    if (rememberMeCheckbox.checked) {
        localStorage.setItem('rememberedUsername', username);
    } else {
        localStorage.removeItem('rememberedUsername');
    }

    // Save session
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('username', username);
    sessionStorage.setItem('loginTime', new Date().toISOString());

    // Show success message
    showSuccess('Login successful! Redirecting...');

    // Redirect to main page after a short delay
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// ============================================
// SESSION CHECK
// ============================================

function checkExistingSession() {
    // If already logged in, redirect to main page
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
        window.location.href = 'index.html';
    }
}

// ============================================
// ERROR/SUCCESS MESSAGES
// ============================================

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.className = 'error-message error';
    errorMessage.style.display = 'block';
}

function showSuccess(message) {
    errorMessage.textContent = message;
    errorMessage.className = 'error-message success';
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
}

// ============================================
// THEME MANAGEMENT
// ============================================

function initializeTheme() {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.body.classList.add('dark-theme');
        themeToggle.querySelector('.theme-icon').textContent = '☀️';
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');

    // Update icon
    themeToggle.querySelector('.theme-icon').textContent = isDark ? '☀️' : '🌙';

    // Save preference
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Add shake animation on error
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
        20%, 40%, 60%, 80% { transform: translateX(10px); }
    }
    .shake {
        animation: shake 0.5s;
    }
`;
document.head.appendChild(style);
