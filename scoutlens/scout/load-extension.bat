@echo off
echo.
echo ========================================
echo  Scout - Web3 AI Agent Extension
echo ========================================
echo.
echo To load Scout extension:
echo 1. Open Chrome browser
echo 2. Go to chrome://extensions/
echo 3. Enable "Developer mode" (top right toggle)
echo 4. Click "Load unpacked"
echo 5. Select this folder: %~dp0
echo.
echo Extension files ready:
dir /b *.js *.json *.html *.css
echo.
echo For testing:
echo - Visit crypto websites (CoinGecko, Uniswap, etc.)
echo - Click Scout icon in browser toolbar
echo - Test wallet connection and page scanning
echo.
echo Check SCOUT-README.md for detailed instructions
echo.
pause
