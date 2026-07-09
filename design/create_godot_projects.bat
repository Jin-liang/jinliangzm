@echo off
echo ========================================
echo   Godot Roguelike Project Creator
echo ========================================
echo.

set TARGET=D:\workgodot

if not exist "%TARGET%" (
    echo [ERROR] Directory %TARGET% does not exist!
    echo Please create D:\workgodot folder first.
    pause
    exit /b 1
)

echo Target: %TARGET%
echo.
echo Creating project folders:
echo   1. AbyssLoop
echo   2. AscensionTower
echo   3. DungeonEcho
echo   4. RelicSurvivor
echo   5. RogueliteArena
echo.

for %%d in (AbyssLoop AscensionTower DungeonEcho RelicSurvivor RogueliteArena) do (
    if not exist "%TARGET%\%%d" (
        mkdir "%TARGET%\%%d"
        echo [OK]   %%d created
    ) else (
        echo [SKIP] %%d already exists
    )
)

echo.
echo ========================================
echo   Done! 5 project folders created.
echo ========================================
echo.
pause
