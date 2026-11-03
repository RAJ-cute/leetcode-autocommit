Add-Type -AssemblyName System.Drawing

$assetDir = Join-Path $PSScriptRoot '..\public'
$base = [System.Drawing.Bitmap]::new(512, 512)
$graphics = [System.Drawing.Graphics]::FromImage($base)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.Clear([System.Drawing.Color]::Transparent)
$graphics.ScaleTransform(4, 4)

function Add-RoundedRect($graphics, [float]$x, [float]$y, [float]$width, [float]$height, [float]$radius, [string]$hex) {
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $diameter = $radius * 2
  $path.AddArc($x, $y, $diameter, $diameter, 180, 90)
  $path.AddArc($x + $width - $diameter, $y, $diameter, $diameter, 270, 90)
  $path.AddArc($x + $width - $diameter, $y + $height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($x, $y + $height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  $brush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($hex))
  $graphics.FillPath($brush, $path)
  $brush.Dispose()
  $path.Dispose()
}

Add-RoundedRect $graphics 0 0 128 128 27 '#25305d'
Add-RoundedRect $graphics 22 23 38 38 10 '#ed6696'
Add-RoundedRect $graphics 68 20 38 38 10 '#a697df'
Add-RoundedRect $graphics 20 69 38 38 10 '#7ec7b4'
Add-RoundedRect $graphics 67 67 38 38 10 '#ffd47b'
$graphics.Dispose()

foreach ($size in @(16, 32, 48, 128)) {
  $bitmap = [System.Drawing.Bitmap]::new($size, $size)
  $resizer = [System.Drawing.Graphics]::FromImage($bitmap)
  $resizer.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $resizer.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $resizer.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $resizer.DrawImage($base, 0, 0, $size, $size)
  $bitmap.Save((Join-Path $assetDir "icon-$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $resizer.Dispose()
  $bitmap.Dispose()
}
$base.Dispose()
