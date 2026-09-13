@echo off
py "%~dp0sync_wishes.py"
if errorlevel 1 (
  echo The saved wishes were not changed.
  pause
  exit /b 1
)
py "%~dp0serve.py"
