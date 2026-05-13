<#
.SYNOPSIS
    Script para configurar el repositorio GitHub de PANA y preparar el entorno de CI/CD
.DESCRIPTION
    Este script automatiza la creación del repositorio en GitHub, configura los secrets,
    y prepara todo para el pipeline de build y distribución.
.PARAMETER RepoName
    Nombre del repositorio en GitHub (default: PANA)
.PARAMETER Visibility
    Visibilidad del repo: public o private (default: public)
.PARAMETER FirebaseToken
    Token de Firebase CI (opcional, se pedirá si no se provee)
.EXAMPLE
    .\setup-github.ps1 -RepoName "PANA-Marketplace" -Visibility public
#>

param(
    [string]$RepoName = "PANA",
    [ValidateSet("public", "private")]
    [string]$Visibility = "public",
    [string]$FirebaseToken = ""
)

Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         PANA - Setup GitHub & CI/CD         ║" -ForegroundColor Cyan
Write-Host "║    ¡AQUI HAY PANA PA' RATO!                 ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ─── Verificar GitHub CLI ───
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ GitHub CLI (gh) no está instalado." -ForegroundColor Red
    Write-Host "   Instálalo desde: https://cli.github.com/" -ForegroundColor Yellow
    Write-Host "   O usando: winget install GitHub.cli" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ GitHub CLI detectado" -ForegroundColor Green

# ─── Verificar autenticación en GitHub ───
$ghStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "📝 Autenticando en GitHub..." -ForegroundColor Yellow
    gh auth login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error de autenticación" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Autenticado en GitHub" -ForegroundColor Green

# ─── Verificar Firebase CLI ───
if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  Firebase CLI no instalado. Instálalo con: npm install -g firebase-tools" -ForegroundColor Yellow
}

# ─── Obtener usuario de GitHub ───
$githubUser = gh api user --jq '.login' 2>$null
if (-not $githubUser) {
    Write-Host "❌ No se pudo obtener el usuario de GitHub" -ForegroundColor Red
    exit 1
}

Write-Host "👤 Usuario: $githubUser" -ForegroundColor Cyan

# ─── Verificar si el repo ya existe ───
$repoExists = gh repo view "$githubUser/$RepoName" 2>$null
if ($repoExists) {
    Write-Host "⚠️  El repositorio '$RepoName' ya existe." -ForegroundColor Yellow
    $confirm = Read-Host "¿Quieres continuar con el repo existente? (s/N)"
    if ($confirm -ne "s" -and $confirm -ne "S") {
        exit 0
    }
} else {
    Write-Host "📦 Creando repositorio '$RepoName' ($Visibility)..." -ForegroundColor Yellow
    gh repo create $RepoName --$Visibility --source="C:\Users\alvat\AppData\Local\Temp\opencode\PANA" --remote=origin --push
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error creando repositorio" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Repositorio creado: https://github.com/$githubUser/$RepoName" -ForegroundColor Green
}

# ─── Configurar Secrets para GitHub Actions ───
Write-Host ""
Write-Host "🔐 Configurando GitHub Secrets para CI/CD..." -ForegroundColor Cyan
Write-Host "   (Los secrets permiten que el build use tus API keys sin exponerlas)" -ForegroundColor DarkGray
Write-Host ""

$secrets = @{
    "FIREBASE_API_KEY" = "API Key de Firebase (google-services.json → current_key)"
    "FIREBASE_AUTH_DOMAIN" = "Auth Domain (project.firebaseapp.com)"
    "FIREBASE_PROJECT_ID" = "Project ID de Firebase"
    "FIREBASE_STORAGE_BUCKET" = "Storage Bucket (project.appspot.com)"
    "FIREBASE_MESSAGING_SENDER_ID" = "Sender ID de Firebase"
    "FIREBASE_APP_ID" = "App ID de Firebase (1:123:android:abc)"
    "OPENAI_API_KEY" = "API Key de OpenAI (sk-...) para la IA"
    "GOOGLE_SERVICES_JSON" = "Contenido COMPLETO del archivo google-services.json"
}

foreach ($secret in $secrets.Keys) {
    $desc = $secrets[$secret]
    $existing = gh secret list --repo "$githubUser/$RepoName" --jq ".[] | select(.name == \"$secret\")" 2>$null
    if ($existing) {
        Write-Host "   ✓ $secret ya configurado" -ForegroundColor DarkGray
        continue
    }
    Write-Host "   → $secret - $desc" -ForegroundColor Yellow
    $value = Read-Host "     Valor (Enter para saltar)"
    if ($value -and $value -ne "") {
        gh secret set $secret --repo "$githubUser/$RepoName" --body "$value" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "     ✅ Configurado" -ForegroundColor Green
        } else {
            Write-Host "     ❌ Error" -ForegroundColor Red
        }
    } else {
        Write-Host "     ⏭️  Saltado" -ForegroundColor DarkGray
    }
}

# ─── Firebase Token (necesario para App Distribution) ───
$existingFirebaseToken = gh secret list --repo "$githubUser/$RepoName" --jq ".[] | select(.name == \"FIREBASE_TOKEN\")" 2>$null
if (-not $existingFirebaseToken) {
    Write-Host ""
    Write-Host "🔑 Firebase CI Token:" -ForegroundColor Yellow
    Write-Host "   Para distribuir la app automáticamente necesitas un token de Firebase:" -ForegroundColor DarkGray
    Write-Host "   firebase login:ci" -ForegroundColor White
    $fbToken = Read-Host "   Token (Enter para saltar)"
    if ($fbToken -and $fbToken -ne "") {
        gh secret set FIREBASE_TOKEN --repo "$githubUser/$RepoName" --body "$fbToken" 2>$null
        Write-Host "   ✅ Token configurado" -ForegroundColor Green
    }
}

# ─── Firebase App Distribution group ───
Write-Host ""
Write-Host "👥 Firebase App Distribution:" -ForegroundColor Yellow
Write-Host "   Crea un grupo 'beta-testers' en Firebase Console para los testers." -ForegroundColor DarkGray

# ─── Firestore Indexes ───
Write-Host ""
Write-Host "📋 Desplegando índices de Firestore..." -ForegroundColor Yellow
if (Get-Command firebase -ErrorAction SilentlyContinue) {
    firebase deploy --only firestore:indexes --project (gh secret list --repo "$githubUser/$RepoName" --jq ".[] | select(.name == \"FIREBASE_PROJECT_ID\") | .name" 2>$null) 2>$null
    Write-Host "   ✅ Índices desplegados" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Firebase CLI no disponible. Despliega manualmente: firebase deploy --only firestore:indexes" -ForegroundColor Yellow
}

# ─── Resumen ───
Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              ¡PANA ESTÁ LISTO!              ║" -ForegroundColor Cyan
Write-Host "╠══════════════════════════════════════════════╣" -ForegroundColor Cyan
Write-Host "║  Repositorio:" -ForegroundColor White
Write-Host "║  https://github.com/$githubUser/$RepoName" -ForegroundColor Cyan
Write-Host "║" -ForegroundColor Cyan
Write-Host "║  Próximos pasos:" -ForegroundColor White
Write-Host "║  1. Sube tu código: git push -u origin main" -ForegroundColor Gray
Write-Host "║  2. Ve a Actions → build-and-release.yml" -ForegroundColor Gray
Write-Host "║  3. Run workflow → build APK automático" -ForegroundColor Gray
Write-Host "║  4. Los testers reciben la app por Firebase" -ForegroundColor Gray
Write-Host "║" -ForegroundColor Cyan
Write-Host "║  ¡AQUI HAY PANA PA' RATO!" -ForegroundColor Yellow
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
