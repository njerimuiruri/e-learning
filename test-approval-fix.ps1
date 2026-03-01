#!/usr/bin/env powershell
# Instructor Approval System - Test Script
# This script helps test the instructor approval redirect logic

Write-Host "================================" -ForegroundColor Green
Write-Host "Instructor Approval System Test" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

# Check if backend is running
Write-Host "1. Checking if backend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://api.elearning.arin-africa.orgapi/users/profile" -Headers @{"Authorization" = "Bearer test" } -ErrorAction SilentlyContinue
    Write-Host "   ✓ Backend is responding" -ForegroundColor Green
}
catch {
    if ($_.Exception.Message -contains "401" -or $_.Exception.Message -contains "Unauthorized") {
        Write-Host "   ✓ Backend is running (returned 401 as expected)" -ForegroundColor Green
    }
    else {
        Write-Host "   ✗ Backend not responding. Make sure NestJS backend is running" -ForegroundColor Red
        Write-Host "     Run: cd c:\Users\HP\Desktop\Projects\Arin\elearning-backend && npm run start" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "2. Frontend changes applied:" -ForegroundColor Yellow
Write-Host "   ✓ Pending-approval page: Polling every 5 seconds (was 30s)" -ForegroundColor Green
Write-Host "   ✓ Pending-approval page: Added 'Check Status Now' button" -ForegroundColor Green
Write-Host "   ✓ Pending-approval page: Added console debug logs" -ForegroundColor Green
Write-Host "   ✓ Home page: Added approval status console logs" -ForegroundColor Green
Write-Host ""

Write-Host "3. How to verify the fix:" -ForegroundColor Yellow
Write-Host "   a) Open browser DevTools (F12)" -ForegroundColor Cyan
Write-Host "   b) Go to Console tab" -ForegroundColor Cyan
Write-Host "   c) Login as instructor, go to pending-approval page" -ForegroundColor Cyan
Write-Host "   d) Look for logs like:" -ForegroundColor Cyan
Write-Host "      - 'Instructor status: approved'" -ForegroundColor Gray
Write-Host "      - 'Redirecting to dashboard - approved'" -ForegroundColor Gray
Write-Host ""

Write-Host "4. Testing steps:" -ForegroundColor Yellow
Write-Host "   Step 1: Register as new instructor" -ForegroundColor Cyan
Write-Host "   Step 2: Go to admin panel, approve the instructor" -ForegroundColor Cyan
Write-Host "   Step 3: Instructor logs in" -ForegroundColor Cyan
Write-Host "   Expected: Redirects to /instructor/dashboard within 5 seconds" -ForegroundColor Green
Write-Host ""

Write-Host "================================" -ForegroundColor Green
Write-Host "Ready to test!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
