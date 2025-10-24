# Test Script for Implementation 1 - Claude Sonnet 4.5
# Sets up environment, runs tests, and collects metrics

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Testing Implementation 1" -ForegroundColor Cyan
Write-Host "  Claude Sonnet 4.5" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Ensure data directory exists
if (-not (Test-Path "data")) {
    New-Item -ItemType Directory -Path "data" | Out-Null
    Write-Host "✓ Created data directory" -ForegroundColor Green
}

# Test 1: Fetch Data
Write-Host "`n[TEST 1: Data Fetching]" -ForegroundColor Yellow
Write-Host "Running: node src/index.js fetch"
$fetchStart = Get-Date
& "C:\Program Files\nodejs\node.exe" src/index.js fetch
$fetchEnd = Get-Date
$fetchTime = ($fetchEnd - $fetchStart).TotalSeconds
Write-Host "✓ Fetch completed in $fetchTime seconds" -ForegroundColor Green

# Check database
if (Test-Path "data/news.db") {
    $dbSize = (Get-Item "data/news.db").Length
    Write-Host "✓ Database created ($dbSize bytes)" -ForegroundColor Green
} else {
    Write-Host "✗ Database not found" -ForegroundColor Red
}

# Test 2: Query Statistics
Write-Host "`n[TEST 2: Database Query]" -ForegroundColor Yellow
& "C:\Program Files\nodejs\node.exe" -e "const db = require('./src/db'); console.log('Total items:', db.getStats().total); db.close();"

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "  Tests Complete" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "`nFetch Time: $fetchTime seconds" -ForegroundColor Green
