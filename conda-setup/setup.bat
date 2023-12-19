@echo off

git pull

start runtime cmd /c "npm install && npm run dev"
