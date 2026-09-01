Add-Type -AssemblyName System.Drawing
$files = 'OVHCloud_Logo.png','NVIDIA_Logo.png','EIT_Logo.png','BPA_Logo.png','Terna_Logo.png','EPA_Logo.png'
$out = @()
foreach ($f in $files) {
  $bmp = New-Object System.Drawing.Bitmap($f)
  $total = 0
  $opaq = 0
  $r = 0
  $g = 0
  $b = 0
  $step = [Math]::Max(2, [int](($bmp.Width + $bmp.Height) / 40))
  for ($y = 0; $y -lt $bmp.Height; $y += $step) {
    for ($x = 0; $x -lt $bmp.Width; $x += $step) {
      $p = $bmp.GetPixel($x, $y)
      $total++
      if ($p.A -gt 128) {
        $opaq++
        $r += $p.R
        $g += $p.G
        $b += $p.B
      }
    }
  }
  if ($opaq -gt 0) {
    $l1 = [math]::Round(100 * $opaq / $total)
    $rr = [int]($r / $opaq)
    $gg = [int]($g / $opaq)
    $bb = [int]($b / $opaq)
    $lum = [math]::Round(0.299 * $rr + 0.587 * $gg + 0.114 * $bb)
    $out += "$f : opaquePct=$l1% avgRGB=($rr,$gg,$bb) luminance=$lum"
  } else {
    $out += "$f : all transparent sample"
  }
  $bmp.Dispose()
}
$out | Out-File -FilePath 'logo-stats.txt' -Encoding utf8
Get-Content 'logo-stats.txt'