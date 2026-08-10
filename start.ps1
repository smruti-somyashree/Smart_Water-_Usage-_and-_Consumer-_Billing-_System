Write-Host "Starting Smart Water System (Backend + Frontend)..." -ForegroundColor Cyan
$root = $PSScriptRoot
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; mvn spring-boot:run -o"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; npm run dev"
Write-Host "Launched both backend and frontend servers!" -ForegroundColor Green
