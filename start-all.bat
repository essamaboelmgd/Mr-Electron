@echo off

start cmd /k "cd api && npm run dev"
start cmd /k "cd landingpage && npm run dev"
start cmd /k "cd student && npm run dev"
start cmd /k "cd admin && npm run dev"

pause
