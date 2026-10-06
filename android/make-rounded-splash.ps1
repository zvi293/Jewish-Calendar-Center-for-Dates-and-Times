Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = "Stop"
$root = Join-Path $PSScriptRoot "app/src/main/res"
$srcPath = Join-Path $root "drawable-xxxhdpi\splash.png"
$backup = Join-Path $PSScriptRoot "splash-source-1200.png"   # האייקון המרובע המקורי (1200px)
if (-not (Test-Path $backup)) { throw "missing splash-source-1200.png" }
$src = [System.Drawing.Image]::FromFile($backup)

function RoundedPath([single]$x, [single]$y, [single]$w, [single]$h, [single]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}

$targets = @{ "mdpi" = 300; "hdpi" = 450; "xhdpi" = 600; "xxhdpi" = 900; "xxxhdpi" = 1200 }
foreach ($k in $targets.Keys) {
  $S = [int]$targets[$k]
  $bmp = New-Object System.Drawing.Bitmap($S, $S, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)

  # icon box = 78% of canvas, centred; corner radius = 24% of box (Android rounded-square look)
  $box = [single]($S * 0.78)
  $off = [single](($S - $box) / 2)
  $rad = [single]($box * 0.24)

  # soft glow/shadow: concentric rounded rects with fading alpha (System.Drawing has no blur)
  $layers = 22
  for ($i = $layers; $i -ge 1; $i--) {
    $grow = [single]($i * ($S * 0.0045))
    $alpha = [int](7 * (1 - ($i / ($layers + 1))))
    if ($alpha -lt 1) { $alpha = 1 }
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($alpha, 40, 70, 170))
    $p = RoundedPath ($off - $grow) ($off - $grow + ($S * 0.008)) ($box + 2 * $grow) ($box + 2 * $grow) ($rad + $grow)
    $g.FillPath($brush, $p)
    $p.Dispose(); $brush.Dispose()
  }

  # clip to rounded rect and draw the icon
  $clip = RoundedPath $off $off $box $box $rad
  $g.SetClip($clip)
  $g.DrawImage($src, (New-Object System.Drawing.RectangleF($off, $off, $box, $box)))
  $g.ResetClip()

  # thin subtle edge highlight
  $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(70, 255, 255, 255), [single]([Math]::Max(1, $S * 0.0025)))
  $g.DrawPath($pen, $clip)
  $pen.Dispose(); $clip.Dispose()

  $g.Dispose()
  $out = Join-Path $root "drawable-$k\splash.png"
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output "wrote $out ($S x $S)"
}
$src.Dispose()
