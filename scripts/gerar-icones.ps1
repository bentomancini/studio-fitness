param()
# Gera os icones do PWA (PNG) usando System.Drawing do Windows.
# Uso: powershell -File scripts/gerar-icones.ps1
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$dir = Join-Path $root "public\icons"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

$verde      = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 74, 222, 128))
$verdeClaro = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 134, 239, 172))
$zinc900    = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 24, 24, 27))
$branco     = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 255, 255))

function Desenhar([int]$L, [string]$arquivo, [bool]$mostrarBorda) {
  $bmp = New-Object System.Drawing.Bitmap($L, $L)
  $graf = [System.Drawing.Graphics]::FromImage($bmp)
  $graf.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

  # fundo: quadrado arredondado (cantos ~22%)
  $raio = [single](22 * $L / 100)
  $caminho = New-Object System.Drawing.Drawing2D.GraphicsPath
  $caminho.AddArc(0, 0, $raio * 2, $raio * 2, 180, 90)
  $caminho.AddArc($L - $raio * 2, 0, $raio * 2, $raio * 2, 270, 90)
  $caminho.AddArc($L - $raio * 2, $L - $raio * 2, $raio * 2, $raio * 2, 0, 90)
  $caminho.AddArc(0, $L - $raio * 2, $raio * 2, $raio * 2, 90, 90)
  $caminho.CloseFigure()
  $graf.FillPath($zinc900, $caminho)

  $cx = $L / 2.0
  $cy = $L / 2.0
  $u = $L / 128.0   # unidade — centraliza o desenho com folga para "maskable"

  # placas (anilhas) de cada lado, empilhadas em 2
  $pAlt = 34 * $u
  $pLarg = 13 * $u
  foreach ($lado in @(-1, 1)) {
    $baseX = $cx + $lado * (44 * $u)
    $graf.FillRectangle($verde, [single]($baseX - $pLarg), [single]($cy - $pAlt / 2), [single]$pLarg, [single]$pAlt)
    $graf.FillRectangle($verde, [single]($baseX), [single]($cy - $pAlt / 2), [single]$pLarg, [single]$pAlt)
  }

  # barra central
  $graf.FillRectangle($branco, [single]($cx - 34 * $u), [single]($cy - 4 * $u), [single](68 * $u), [single](8 * $u))
  # traco de "mao no meio" (verde claro) para dar cara de halter/barra de peso
  $graf.FillRectangle($verdeClaro, [single]($cx - 8 * $u), [single]($cy - 6 * $u), [single](16 * $u), [single](12 * $u))

  $graf.Dispose()
  $bmp.Save($arquivo, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

Desenhar 512 (Join-Path $dir "icon-512.png")
Desenhar 192 (Join-Path $dir "icon-192.png")
Desenhar 180 (Join-Path $dir "apple-touch-icon.png")
Write-Output "Icones gerados em public/icons/"