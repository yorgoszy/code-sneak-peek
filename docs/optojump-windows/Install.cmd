@echo off
setlocal
cd /d "%~dp0"
py -3 --version >nul 2>&1
if errorlevel 1 (
 echo Install Python 3.11 or newer from https://www.python.org/downloads/windows/
 echo Then run Install.cmd again.
 pause
 exit /b 1
)
py -3 -m venv .venv
if errorlevel 1 goto failed
.venv\Scripts\python.exe -m pip install -r requirements.txt
if errorlevel 1 goto failed
echo Installation complete. Open Start.cmd to run OptoJump.
pause
exit /b 0
:failed
echo Installation failed. Check your Internet connection and Python installation.
pause
exit /b 1
