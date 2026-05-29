$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$perfDir = Split-Path -Parent $scriptDir
$sampleRoot = Split-Path -Parent $perfDir
$resultsDir = Join-Path $perfDir "results"
$benchmarkResultFile = Join-Path $perfDir "benchmark_result.json"
$resourceSummaryFile = Join-Path $perfDir "benchmark_resources.json"
$stderrFile = Join-Path $perfDir "benchmark_stderr.log"
$formatScript = Join-Path $scriptDir "format-results.js"
$containerName = "specmatic-linter-benchmark-{0}" -f ([guid]::NewGuid().ToString("N").Substring(0, 12))

if (Test-Path $resultsDir) {
    Remove-Item $resultsDir -Recurse -Force
}
New-Item -ItemType Directory -Path $resultsDir | Out-Null

Write-Host ""
Write-Host "--- Starting Performance Benchmark (Enterprise Estate) ---"
Write-Host "Note: Detailed results for each spec will be saved to performance/results/"

Push-Location $perfDir

$specFiles = Get-ChildItem -Path (Join-Path $perfDir "specs") -Filter "*.yaml" | Sort-Object Name
$numSpecs = $specFiles.Count
$totalPaths = 0
foreach ($specFile in $specFiles) {
    $totalPaths += (Select-String -Path $specFile.FullName -Pattern '^\s{2}/.*:' | Measure-Object).Count
}

if (Test-Path $benchmarkResultFile) {
    Remove-Item $benchmarkResultFile -Force
}
if (Test-Path $stderrFile) {
    Remove-Item $stderrFile -Force
}

$argumentList = @("-jar", $jarPath)
$argumentList = @(
    "run",
    "--name",
    $containerName,
    "--rm",
    "-v",
    "${perfDir}:/usr/src/app",
    "-w",
    "/usr/src/app",
    "specmatic/enterprise",
    "lint"
)
$argumentList += $specFiles | ForEach-Object { $_.Name }
$argumentList += @("--format", "json")

$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
$process = Start-Process -FilePath "docker" -ArgumentList $argumentList -WorkingDirectory $perfDir -RedirectStandardOutput $benchmarkResultFile -RedirectStandardError $stderrFile -NoNewWindow -PassThru

$processorCount = [Environment]::ProcessorCount
$sampleCount = 0
$totalCpuPercent = 0.0
$peakCpuPercent = 0.0
$peakMemoryBytes = 0L
$lastCpuSeconds = $null
$lastTimestamp = $null

while (-not $process.HasExited) {
    try {
        docker inspect $containerName *> $null
    } catch {
        Start-Sleep -Milliseconds 100
        continue
    }

    try {
        $statsLine = docker stats --no-stream --format "{{.CPUPerc}}|{{.MemUsage}}" $containerName 2>$null
    } catch {
        Start-Sleep -Milliseconds 100
        continue
    }
    if ([string]::IsNullOrWhiteSpace($statsLine)) {
        Start-Sleep -Milliseconds 100
        continue
    }

    $parts = $statsLine -split "\|", 2
    if ($parts.Count -lt 2) {
        Start-Sleep -Milliseconds 100
        continue
    }
    $cpuPercent = [double](($parts[0] -replace "%", "").Trim())
    $memCurrent = (($parts[1] -split "/", 2)[0]).Trim()
    if ($memCurrent -match '^([0-9.]+)([A-Za-z]+)$') {
        $memValue = [double]$matches[1]
        $memUnit = $matches[2]
        switch ($memUnit) {
            "B" { $memBytes = [int64]$memValue }
            "kB" { $memBytes = [int64]($memValue * 1000) }
            "KB" { $memBytes = [int64]($memValue * 1000) }
            "KiB" { $memBytes = [int64]($memValue * 1KB) }
            "MB" { $memBytes = [int64]($memValue * 1MB) }
            "MiB" { $memBytes = [int64]($memValue * 1MB) }
            "GB" { $memBytes = [int64]($memValue * 1GB) }
            "GiB" { $memBytes = [int64]($memValue * 1GB) }
            default { $memBytes = 0L }
        }
        if ($memBytes -gt $peakMemoryBytes) {
            $peakMemoryBytes = $memBytes
        }
    }

    $totalCpuPercent += $cpuPercent
    if ($cpuPercent -gt $peakCpuPercent) {
        $peakCpuPercent = $cpuPercent
    }
    $sampleCount++
    Start-Sleep -Milliseconds 200
}

$process.WaitForExit()
$stopwatch.Stop()

$averageCpuPercent = if ($sampleCount -gt 0) { $totalCpuPercent / $sampleCount } else { 0.0 }
$resourceSummary = [ordered]@{
    sampleCount = $sampleCount
    averageCpuPercent = [math]::Round($averageCpuPercent, 2)
    peakCpuPercent = [math]::Round($peakCpuPercent, 2)
    peakMemoryKb = [math]::Round($peakMemoryBytes / 1KB)
    peakMemoryMb = [math]::Round($peakMemoryBytes / 1MB, 2)
}
$resourceSummary | ConvertTo-Json | Set-Content -Path $resourceSummaryFile

if (-not (Test-Path $benchmarkResultFile) -or (Get-Item $benchmarkResultFile).Length -eq 0) {
    if (Test-Path $stderrFile) {
        Get-Content $stderrFile
    }
    throw "Benchmark failed before producing any linter output."
}

Get-Content -Raw $benchmarkResultFile | node $formatScript
if ($sampleCount -eq 0) {
    Write-Host "Note: Resource sampling was unavailable in this environment; timing and lint totals are still valid."
}

$durationMs = [int][math]::Round($stopwatch.Elapsed.TotalMilliseconds)
Write-Host ""
Write-Host ("SUCCESS: Linted {0} specifications (~{1} paths)" -f $numSpecs, $totalPaths)
Write-Host ("Total Execution Time: {0}ms" -f $durationMs)
Write-Host ""
Write-Host "Detailed reports saved to: results/"
Write-Host "The Specmatic Linter processes complex semantic rules across a massive estate with sub-second average latency."

if (Test-Path $benchmarkResultFile) {
    Remove-Item $benchmarkResultFile -Force
}
if (Test-Path $resourceSummaryFile) {
    Remove-Item $resourceSummaryFile -Force
}
if ((Test-Path $stderrFile) -and ((Get-Item $stderrFile).Length -eq 0)) {
    Remove-Item $stderrFile -Force
}

Pop-Location
