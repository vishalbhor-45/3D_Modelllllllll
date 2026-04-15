$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$gltfpack = Join-Path $scriptDir "gltfpack.exe"
$inputDir = Join-Path $scriptDir "lists"
$outputDir = "C:\Users\Vishal.Bhor\Desktop\3D_model\3D_Models\public\models"

if (!(Test-Path -LiteralPath $gltfpack)) {
  throw "gltfpack.exe not found at: $gltfpack"
}
if (!(Test-Path -LiteralPath $inputDir)) {
  throw "Input folder not found: $inputDir"
}
if (!(Test-Path -LiteralPath $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir | Out-Null
}

$glbs = Get-ChildItem -LiteralPath $inputDir -File -Filter *.glb
if ($glbs.Count -eq 0) {
  Write-Host "No .glb files found in: $inputDir"
  exit 0
}

Write-Host ("Found {0} .glb file(s) in {1}" -f $glbs.Count, $inputDir)

foreach ($f in $glbs) {
  $outPath = Join-Path $outputDir $f.Name
  # gltfpack requires output extension to be .gltf or .glb
  $tmpPath = $outPath + ".tmp.glb"

  Write-Host ""
  Write-Host ("Compressing: {0}" -f $f.FullName)
  Write-Host ("Output:      {0}" -f $outPath)

  if (Test-Path -LiteralPath $tmpPath) { Remove-Item -LiteralPath $tmpPath -Force }

  & $gltfpack `
    -i $f.FullName `
    -o $tmpPath `
    -cc `
    -tc `
    -si 1 `
    -kn `
    -v

  if ($LASTEXITCODE -ne 0) {
    throw ("gltfpack failed for: {0} (exit code {1})" -f $f.FullName, $LASTEXITCODE)
  }

  if (Test-Path -LiteralPath $outPath) { Remove-Item -LiteralPath $outPath -Force }
  Move-Item -LiteralPath $tmpPath -Destination $outPath -Force

  Write-Host ("Done: {0}" -f $outPath)
}

Write-Host ""
Write-Host "All files processed."
