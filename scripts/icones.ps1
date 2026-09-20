param()
Add-Type -AssemblyName System.Drawing
$root = Join-Path $PSScriptRoot ".."
$dir = Join-Path $root "public\icons"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

function Desenhar([int]$L) {
  $bmp = New-Object System.Drawing.Bitmap($L, $L)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = "AntiAlias"
  $u = ($L / 100.0)
  # fundo: círculo escuro
  $bg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 24, 24, 27))
  $g.FillEllipse($bg, 0, 0, $L, $L)
  # haltere: duas placas + barra
  $verde = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 62, 186, 132))
  $barra = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 250, 250, 250))
  $cx = $L / 2.0; $cy = $L / 2.0
  $al = 40 * $u   # altura das placas
  $lg = 12 * $u   # largura das placas
  $bx = $cx - 24 * $u  # inicio placas esquerda
  $g.FillRoundedRectangle = $null
  # placa esquerda
  $g.FillRectangle($verde, $bx, $cy - $al / 2, $lg, $al)
  $g.FillRectangle($verde, $bx + 2 * $lg, $cy - $al / 2, $lg, $al)
  # placa direita
  $g.FillRectangle($verde, $cx + 12 * $u, $cy - $al / 2, $lg, $al)
  $g.FillRectangle($verde, $cx + 12 * $u + 2 * $lg, $cy - $al / 2, $lg, $al)
  # barra central
  $g.FillRectangle($barra, $cx - 20 * $u, $cy - 5 * $u, 40 * $u, 10 * $u)
  $g.Dispose()
  $bmp
}

function Salvar([int]$L, [string]$nome) {
  $bmp = Desenhar $L
  $bmp.Save((Join-Path $dir $nome), [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output "gerou $nome"
}

Salvar 512 "icon-512.png"
Salvar 192 "icon-192.png"
Salvar 180 "apple-touch-icon.png"
Write-Output "OK em public\icons"