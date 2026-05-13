@echo off
title PANA - Setup GitHub
color 0A
cls

echo ============================================
echo    PANA - Configurar GitHub
echo    "AQUI HAY PANA PA' RATO!"
echo ============================================
echo.

REM Buscar gh.exe
set GH_CMD="C:\Program Files\GitHub CLI\gh.exe"
if not exist %GH_CMD% set GH_CMD="%LOCALAPPDATA%\GitHub CLI\gh.exe"
if not exist %GH_CMD% (
    echo ERROR: GitHub CLI no encontrado en C:\Program Files\GitHub CLI\
    echo.
    echo Instalalo desde: https://cli.github.com/
    pause
    exit /b 1
)
echo GitHub CLI: %GH_CMD%
echo.

echo Paso 1: Autenticando en GitHub...
echo.
echo Ve a https://github.com/settings/tokens
echo Crea un token CLASSIC con permisos: repo, workflow
echo.
set /p GH_TOKEN="Pega el token aqui y presiona Enter: "

REM Guardar token en archivo temporal para evitar errores con caracteres especiales
echo %GH_TOKEN% > "%TEMP%\gh_token.txt"

%GH_CMD% auth login --with-token < "%TEMP%\gh_token.txt"
if errorlevel 1 (
    del "%TEMP%\gh_token.txt" 2>nul
    echo.
    echo ERROR: Token invalido. Razones posibles:
    echo - El token no es CLASSIC (ve a Settings ^> Developer settings ^> Tokens classic)
    echo - Le faltan permisos repo y workflow
    echo - Lo copiaste incompleto
    echo.
    pause
    exit /b 1
)
del "%TEMP%\gh_token.txt" 2>nul
echo Token OK
echo.

for /f "delims=" %%i in ('%GH_CMD% api user --jq .login') do set GH_USER=%%i
echo Usuario: %GH_USER%
echo.

echo Paso 2: Creando repositorio en GitHub...
cd /d "%~dp0"
%GH_CMD% repo create PANA --public --source=. --remote=origin --push --description="PANA - Tu mercado con IA para Venezuela" 2>nul
if errorlevel 1 (
    echo El repositorio ya existe. Actualizando...
    git remote remove origin 2>nul
    git remote add origin https://github.com/%GH_USER%/PANA.git
)
git add -A
git commit -m "PANA v1.0.0-beta" --allow-empty
git branch -M main
git push -u origin main --force
echo OK
echo.

echo Paso 3: API Keys (opcional - Enter para saltar cada una)
echo.
set /p S="FIREBASE_API_KEY (Enter=saltar): "
if not "%S%"=="" %GH_CMD% secret set FIREBASE_API_KEY --repo "%GH_USER%/PANA" --body "%S%" && echo OK
set /p S="FIREBASE_AUTH_DOMAIN (Enter=saltar): "
if not "%S%"=="" %GH_CMD% secret set FIREBASE_AUTH_DOMAIN --repo "%GH_USER%/PANA" --body "%S%" && echo OK
set /p S="FIREBASE_PROJECT_ID (Enter=saltar): "
if not "%S%"=="" %GH_CMD% secret set FIREBASE_PROJECT_ID --repo "%GH_USER%/PANA" --body "%S%" && echo OK
set /p S="FIREBASE_STORAGE_BUCKET (Enter=saltar): "
if not "%S%"=="" %GH_CMD% secret set FIREBASE_STORAGE_BUCKET --repo "%GH_USER%/PANA" --body "%S%" && echo OK
set /p S="FIREBASE_MESSAGING_SENDER_ID (Enter=saltar): "
if not "%S%"=="" %GH_CMD% secret set FIREBASE_MESSAGING_SENDER_ID --repo "%GH_USER%/PANA" --body "%S%" && echo OK
set /p S="FIREBASE_APP_ID (Enter=saltar): "
if not "%S%"=="" %GH_CMD% secret set FIREBASE_APP_ID --repo "%GH_USER%/PANA" --body "%S%" && echo OK
set /p S="OPENAI_API_KEY (Enter=saltar): "
if not "%S%"=="" %GH_CMD% secret set OPENAI_API_KEY --repo "%GH_USER%/PANA" --body "%S%" && echo OK
echo.

echo ============================================
echo    LISTO!
echo    https://github.com/%GH_USER%/PANA
echo.
echo    Proximo paso:
echo    GitHub.com ^> Actions ^> Run workflow
echo    ^> Descarga el APK desde Releases
echo.
echo    "AQUI HAY PANA PA' RATO!"
echo ============================================
echo.
pause
