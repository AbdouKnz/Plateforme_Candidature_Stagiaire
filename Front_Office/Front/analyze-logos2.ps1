Add-Type -AssemblyName System.Drawing

$base = 'd:\Asteroidea\Deploy\Plateforme_Candidature_Stagiaire\Front_Office\Front\dist\'
$files = 'OVHCloud_Logo.png','NVIDIA_Logo.png','EIT_Logo.png','BPA_Logo.png','Terna_Logo.png','EPA_Logo.png'
$out = @()

foreach ($f in $files) {
  try {
    $bmp = New-Object System.Drawing.Bitmap($base + $f)
    $w = $bmp.Width
    $h = $bmp.Height
  } catch {
    $out += ($f + ' : ERROR ' + $_.Exception.Message)
    continue
  }

  $total = 0
  $opaq =  0
  $r =  0
  $g =  0
  $b =  0
  $step = [Math]::Max(2, [int](($w + $h) / 40))

  for ($y =  0; $y -lt $h; $y += $step) {
    for ($x =  0; $x -lt $w; $x += $step) {
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
    $pct = [math]::Round(100 * $opaq / $total)
    $arow = [int]($r / $opaq)
    $agow = [int]($g / $opaq)
    $abow = [int]($b / $opaq)
    $lum = [math]::Round(0.299 * $arow + 0.587 * $agow + 0.114 * $abow)
    $out += ($f + ' : ' + $w + 'x' + $h + ' opaquePct=' + $pct + '% avgRGB=(' + $arow + ',' + $agow + ',' + $abow + ') luminance=' + $lum)
  } else {
    $out += ($f + ' : all transparent sample')
  }
  $bmp.Dispose()
}

$out | Out-File -FilePath 'd:\Asteroidea\Deploy\Plateforme_Candidature_Stagiaire\Front_Office\Front\logo-stats2.txt' -Encoding utf8
Get-Content 'd:\Asteroidea\Deploy\Plateforme_Candidature_Stagiaire\Front_Office\Front\logo-stats2.txt'