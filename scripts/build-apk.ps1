<#
.SYNOPSIS
    Script para compilar la APK de PANA localmente
.DESCRIPTION
    Compila la APK de Android en modo debug para pruebas locales
    sin necesidad de GitHub Actions.
#>

Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        PANA - Build APK Local                ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan

# ─── Verificar requisitos ───
$requirements = @(
    @{Name="Node.js"; Command="node --version"},
    @{Name="npm"; Command="npm --version"},
    @{Name="Java (JDK 17)"; Command="java -version 2>&1"}
)

foreach ($req in $requirements) {
    $result = Invoke-Expression $req.Command 2>$null
    if ($LASTEXITCODE -eq 0 -and $result) {
        Write-Host "✅ $($req.Name): $($result.Trim().Split("`n")[0])" -ForegroundColor Green
    } else {
        Write-Host "❌ $($req.Name) no encontrado" -ForegroundColor Red
        exit 1
    }
}

# ─── Verificar variables de entorno ───
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Archivo .env no encontrado. Copia .env.example a .env y configura las keys." -ForegroundColor Yellow
    $continue = Read-Host "¿Continuar de todas formas? (s/N)"
    if ($continue -ne "s" -and $continue -ne "S") { exit 0 }
}

# ─── Instalar dependencias ───
Write-Host ""
Write-Host "📦 Instalando dependencias npm..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error instalando dependencias" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencias instaladas" -ForegroundColor Green

# ─── Limpiar build anterior ───
Write-Host ""
Write-Host "🧹 Limpiando build anterior..." -ForegroundColor Yellow
if (Test-Path "android\app\build") {
    Remove-Item -Path "android\app\build" -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "✅ Build anterior limpiado" -ForegroundColor Green

# ─── Compilar APK Debug ───
Write-Host ""
Write-Host "🔨 Compilando APK Debug..." -ForegroundColor Yellow
Write-Host "   (Esto puede tomar varios minutos la primera vez)" -ForegroundColor DarkGray

Set-Location -Path "android"
$buildResult = ./gradlew assembleDebug 2>&1
$buildSuccess = $LASTEXITCODE -eq 0
Set-Location -Path ".."

if (-not $buildSuccess) {
    Write-Host "❌ Error en la compilación:" -ForegroundColor Red
    Write-Host "$buildResult" -ForegroundColor Red
    exit 1
}

# ─── Buscar APK generada ───
$apkPath = Get-ChildItem -Path "android\app\build\outputs\apk\debug" -Filter "*.apk" | Select-Object -First 1

if ($apkPath) {
    $destDir = "release"
    if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
    Copy-Item -Path $apkPath.FullName -Destination "$destDir\PANA-beta.apk" -Force

    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║         ✅  APK COMPILADA EXITOSAMENTE       ║" -ForegroundColor Green
    Write-Host "╠══════════════════════════════════════════════╣" -ForegroundColor Cyan
    Write-Host "║  📁 $destDir\PANA-beta.apk" -ForegroundColor White
    Write-Host "║  📏 $([math]::Round((Get-Item "$destDir\PANA-beta.apk").Length / 1MB, 2)) MB" -ForegroundColor Gray
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "║  Para instalar en tu Android:" -ForegroundColor White
    Write-Host "║  1. Copia el APK a tu teléfono" -ForegroundColor Gray
    Write-Host "║  2. Habilita 'Orígenes desconocidos'" -ForegroundColor Gray
    Write-Host "║  3. Abre el APK e instala" -ForegroundColor Gray
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "║  ¡AQUI HAY PANA PA' RATO!" -ForegroundColor Yellow
    Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
} else {
    Write-Host "❌ No se encontró el APK generado" -ForegroundColor Red
    exit 1
}
