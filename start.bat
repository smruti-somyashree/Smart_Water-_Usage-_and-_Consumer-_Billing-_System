@echo off
echo Starting Smart Water System (Backend + Frontend)...
start "Backend - Spring Boot" cmd /k "cd /d %~dp0backend && mvn spring-boot:run -o"
start "Frontend - React Vite" cmd /k "cd /d %~dp0frontend && npm run dev"
echo Both servers launching!
