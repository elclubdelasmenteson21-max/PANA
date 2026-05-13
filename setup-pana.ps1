Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   PANA - Configurar GitHub" -ForegroundColor Cyan
Write-Host "   AQUI HAY PANA PA' RATO!" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar gh
$gh = Get-Command "gh" -ErrorAction SilentlyContinue
if (-not $gh) {
    $ghPath = "C:\Program Files\GitHub CLI\gh.exe"
    if (-not (Test-Path $ghPath)) {
        Write-Host "ERROR: GitHub CLI no encontrado" -ForegroundColor Red
        Write-Host "Instalalo desde: https://cli.github.com/" -ForegroundColor Yellow
        pause
        exit
    }
    $gh = $ghPath
}
Write-Host "GitHub CLI: $gh" -ForegroundColor Green
Write-Host ""

# Pedir token
Write-Host "Paso 1: Crea un TOKEN CLASSIC en GitHub:" -ForegroundColor White
Write-Host "  1. Ve a: https://github.com/settings/tokens" -ForegroundColor Gray
Write-Host "  2. Generate new token > Generate new token (classic)" -ForegroundColor Gray
Write-Host "  3. Nombre: PANA-Token" -ForegroundColor Gray
Write-Host "  4. Permisos: marcar repo (TODO) y workflow" -ForegroundColor Gray
Write-Host "  5. Generate token y COPIALO (empieza con ghp_)" -ForegroundColor Gray
Write-Host ""
$token = Read-Host "Pega el token aqui"

# Guardar token a archivo y usar input redirection (evita problemas de caracteres)
$token | Out-File -FilePath "$env:TEMP\gh_token.txt" -NoNewline -Encoding ascii
$result = Start-Process -FilePath $gh -ArgumentList "auth login --with-token" -RedirectStandardInput "$env:TEMP\gh_token.txt" -NoNewWindow -Wait -PassThru
Remove-Item "$env:TEMP\gh_token.txt" -Force -ErrorAction SilentlyContinue

if ($result.ExitCode -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Token invalido. Verifica:" -ForegroundColor Red
    Write-Host "  - Es un token CLASSIC (no fine-grained)" -ForegroundColor Yellow
    Write-Host "  - Tiene permisos: repo, workflow" -ForegroundColor Yellow
    Write-Host "  - Lo copiaste completo (incluye ghp_...)" -ForegroundColor Yellow
    pause
    exit
}

Write-Host "Token OK!" -ForegroundColor Green
Write-Host ""

# Obtener usuario
$user = & $gh api user --jq .login
Write-Host "Usuario: $user" -ForegroundColor Cyan
Write-Host ""

# Crear repo
Write-Host "Paso 2: Creando repositorio..." -ForegroundColor White
Set-Location -Path $PSScriptRoot
& $gh repo create PANA --public --source=. --remote=origin --push --description="PANA - Tu mercado con IA para Venezuela" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "El repo ya existe. Actualizando..." -ForegroundColor Yellow
    git remote remove origin 2>$null
    git remote add origin "https://github.com/$user/PANA.git"
}
git add -A
git commit -m "PANA v1.0.0-beta" --allow-empty
git branch -M main
git push -u origin main --force
Write-Host "Codigo subido!" -ForegroundColor Green
Write-Host ""

# Secrets
Write-Host "Paso 3: API Keys (opcional - Enter para saltar)" -ForegroundColor White
Write-Host ""
$secrets = @(
    "FIREBASE_API_KEY",
    "FIREBASE_AUTH_DOMAIN",
    "FIREBASE_PROJECT_ID",
    "FIREBASE_STORAGE_BUCKET",
    "FIREBASE_MESSAGING_SENDER_ID",
    "FIREBASE_APP_ID",
    "OPENAI_API_KEY"
)
foreach ($secret in $secrets) {
    $value = Read-Host "$secret (Enter para saltar)"
    if ($value) {
        & $gh secret set $secret --repo "$user/PANA" --body $value 2>$null
        if ($LASTEXITCODE -eq 0) { Write-Host "  OK" -ForegroundColor Green }
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "    LISTO!" -ForegroundColor Green
Write-Host "    https://github.com/$user/PANA" -ForegroundColor Cyan
Write-Host ""
Write-Host "    Siguiente: GitHub.com > Actions" -ForegroundColor White
Write-Host "    > Run workflow: build-and-release.yml" -ForegroundColor Gray
Write-Host "    > Descarga el APK desde Releases" -ForegroundColor Gray
Write-Host ""
Write-Host "    AQUI HAY PANA PA' RATO!" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
pause
