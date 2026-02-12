# PowerShell script to test all backend endpoints

Write-Host "=== DataViz Backend API Testing ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8000/api"

# Test 1: Health Check
Write-Host "1. Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -UseBasicParsing
    Write-Host "OK Health Check: PASSED" -ForegroundColor Green
    Write-Host "  Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "FAIL Health Check: FAILED" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Signup
Write-Host "2. Testing Signup Endpoint..." -ForegroundColor Yellow
$randomEmail = "test_$(Get-Random)@example.com"
$signupData = @{
    email = $randomEmail
    password = "TestPass123!"
    name = "Test User"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/signup" -Method POST -Body $signupData -ContentType "application/json" -UseBasicParsing
    Write-Host "OK Signup: PASSED" -ForegroundColor Green
    $signupResult = $response.Content | ConvertFrom-Json
    Write-Host "  User ID: $($signupResult.user.id)" -ForegroundColor Gray
    $global:testToken = $signupResult.access_token
} catch {
    Write-Host "FAIL Signup: FAILED" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Login
Write-Host "3. Testing Login Endpoint..." -ForegroundColor Yellow
$loginData = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $loginData -ContentType "application/json" -UseBasicParsing
    Write-Host "OK Login: PASSED" -ForegroundColor Green
    $loginResult = $response.Content | ConvertFrom-Json
    Write-Host "  Token received" -ForegroundColor Gray
    $global:authToken = $loginResult.access_token
} catch {
    Write-Host "WARN Login: FAILED (Expected if user does not exist)" -ForegroundColor Yellow
    Write-Host "  Error: $_" -ForegroundColor Gray
}
Write-Host ""

# Test 4: Data Analyze (No auth required)
Write-Host "4. Testing Data Analyze Endpoint..." -ForegroundColor Yellow
$analyzeData = @{
    dataPoints = @(
        @{ x = 1; y = 2 }
        @{ x = 2; y = 4 }
        @{ x = 3; y = 6 }
        @{ x = 4; y = 8 }
    )
} | ConvertTo-Json -Depth 3

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/data/analyze" -Method POST -Body $analyzeData -ContentType "application/json" -UseBasicParsing
    Write-Host "OK Data Analyze: PASSED" -ForegroundColor Green
    $analyzeResult = $response.Content | ConvertFrom-Json
    Write-Host "  R-squared: $($analyzeResult.rSquared)" -ForegroundColor Gray
} catch {
    Write-Host "FAIL Data Analyze: FAILED" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 5: Verify Token (if we have one)
if ($global:authToken) {
    Write-Host "5. Testing Token Verification..." -ForegroundColor Yellow
    $headers = @{
        "Authorization" = "Bearer $global:authToken"
    }
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/auth/verify" -Headers $headers -UseBasicParsing
        Write-Host "OK Token Verify: PASSED" -ForegroundColor Green
        Write-Host "  Response: $($response.Content)" -ForegroundColor Gray
    } catch {
        Write-Host "FAIL Token Verify: FAILED" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "=== Testing Complete ===" -ForegroundColor Cyan
