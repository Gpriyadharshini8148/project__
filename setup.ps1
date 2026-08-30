#!/usr/bin/env pwsh
# SFDC POS Playwright Framework Setup Script
# This script sets up everything needed to run the tests

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SFDC POS Playwright Framework Setup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check Node.js installation
Write-Host "[1/5] Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found! Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Install npm dependencies
Write-Host "`n[2/5] Installing npm dependencies..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "✓ npm dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to install npm dependencies!" -ForegroundColor Red
    Write-Host "Try running: npm config set strict-ssl false" -ForegroundColor Yellow
    exit 1
}

# Install Playwright browsers
Write-Host "`n[3/5] Installing Playwright browsers..." -ForegroundColor Yellow
try {
    npx playwright install chromium
    Write-Host "✓ Playwright browsers installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to install Playwright browsers!" -ForegroundColor Red
    exit 1
}

# Create .env file if it doesn't exist
Write-Host "`n[4/5] Checking .env file..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✓ .env file created from .env.example" -ForegroundColor Green
        Write-Host "  → Please edit .env with your credentials" -ForegroundColor Cyan
    } else {
        Write-Host "⚠ .env.example not found, skipping..." -ForegroundColor Yellow
    }
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

# Validate setup
Write-Host "`n[5/5] Validating setup..." -ForegroundColor Yellow
$validationPassed = $true

# Check node_modules
if (Test-Path "node_modules") {
    Write-Host "✓ node_modules folder exists" -ForegroundColor Green
} else {
    Write-Host "✗ node_modules folder missing!" -ForegroundColor Red
    $validationPassed = $false
}

# Check @playwright/test
if (Test-Path "node_modules/@playwright/test") {
    Write-Host "✓ @playwright/test installed" -ForegroundColor Green
} else {
    Write-Host "✗ @playwright/test not found!" -ForegroundColor Red
    $validationPassed = $false
}

# Check test-data folder
if (Test-Path "test-data/TestData.xlsx") {
    Write-Host "✓ TestData.xlsx found" -ForegroundColor Green
} else {
    Write-Host "⚠ TestData.xlsx not found in test-data/" -ForegroundColor Yellow
}

# Final status
Write-Host "`n========================================" -ForegroundColor Cyan
if ($validationPassed) {
    Write-Host "✓ Setup completed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "  1. Edit .env file with your credentials:" -ForegroundColor White
    Write-Host "     notepad .env" -ForegroundColor Gray
    Write-Host "`n  2. Run your first test:" -ForegroundColor White
    Write-Host "     npm run test:chrome" -ForegroundColor Gray
    Write-Host "`n  3. View test report:" -ForegroundColor White
    Write-Host "     npm run report" -ForegroundColor Gray
    Write-Host "`n  4. Read the documentation:" -ForegroundColor White
    Write-Host "     README.md" -ForegroundColor Gray
    Write-Host "`nHappy Testing! 🚀`n" -ForegroundColor Green
} else {
    Write-Host "✗ Setup failed! Please fix errors above." -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "`nFor help, check README.md troubleshooting section.`n" -ForegroundColor Yellow
    exit 1
}
