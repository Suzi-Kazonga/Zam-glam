@echo off
cd /d "C:\Users\USER\OneDrive\Desktop\final project"
del /F /Q "START_HERE.md"
del /F /Q "QUICK_START_5MIN.md"
del /F /Q "SETUP.md"
del /F /Q "PROJECT_STRUCTURE.md"
del /F /Q "API_REFERENCE.md"
del /F /Q "DATABASE.md"
del /F /Q "COMPLETION_REPORT.md"
del /F /Q "COMPLETION_SUMMARY.md"
del /F /Q "QUICK_REFERENCE.md"
echo Cleanup complete!
dir /B *.md
pause
