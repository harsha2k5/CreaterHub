@echo off
echo ========================================================
echo Pushing CreatorHub Platform Code to GitHub Repository
echo Repository: https://github.com/harsha2k5/CreaterHub
echo ========================================================

cd /d "e:\InSpark\creator hub"

git init
git config user.name "harsha2k5"
git config user.email "harsha2k5@users.noreply.github.com"
git add .
git commit -m "Initial commit: Full-stack Brand x Creator Platform with Express, SQLite, React, Leaflet & Escrow"
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/harsha2k5/CreaterHub.git
git push -u origin main

echo ========================================================
echo Process Finished!
echo ========================================================
pause
