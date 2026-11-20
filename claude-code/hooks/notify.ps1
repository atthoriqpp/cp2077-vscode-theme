# Claude Code notifier launcher: reads the hook JSON, then hands off to popup.ps1.
# Transcript fields are pulled with regex, not ConvertFrom-Json: those lines can be megabytes and parsing them costs seconds.
[Console]::InputEncoding = [Text.Encoding]::UTF8
$j = $null
try { $j = [Console]::In.ReadToEnd() | ConvertFrom-Json } catch {}

# Skip the idle reminder (fires about 60s after Stop); keep real permission prompts
if ($j -and ($j.notification_type -eq 'idle_prompt' -or "$($j.message)" -match 'waiting for your input')) { exit 0 }

$proj = if ($j -and $j.cwd) { Split-Path $j.cwd -Leaf } else { 'Claude Code' }

# Read the last 256KB directly; Get-Content -Tail rescans the whole multi-MB file and costs seconds
$tail = @()
if ($j -and $j.transcript_path -and (Test-Path $j.transcript_path)) {
  try {
    $fs = [IO.File]::Open($j.transcript_path, 'Open', 'Read', 'ReadWrite')
    $len = [Math]::Min(262144, $fs.Length)
    [void]$fs.Seek(-$len, 'End')
    $buf = New-Object byte[] $len
    [void]$fs.Read($buf, 0, $len); $fs.Close()
    $tail = [Text.Encoding]::UTF8.GetString($buf) -split "`n"
  } catch {}
}
$unesc = { param($s) ($s -replace '\\n', ' ' -replace '\\t', ' ' -replace '\\"', '"' -replace '\\\\', '\') }

$msg = ''
if ($j -and $j.message) { $msg = $j.message }
elseif ($j -and $j.last_assistant_message) { $msg = $j.last_assistant_message }
else {
  for ($i = $tail.Count - 1; $i -ge 0 -and -not $msg; $i--) {
    if ($tail[$i] -notmatch '"type":"assistant"') { continue }
    $texts = [regex]::Matches($tail[$i], '"type":"text","text":"((?:[^"\\]|\\.)*)"')
    if ($texts.Count) { $msg = (($texts | ForEach-Object { & $unesc $_.Groups[1].Value }) -join ' ') }
  }
}
if (-not $msg) { $msg = 'Ready for your reply' }
$clean = { param($s) ($s -replace '[`*#>|]', '' -replace '^\s*[-\d.]+\s+', '' -replace '\s+', ' ').Trim() }
$msg = & $clean $msg
if ($msg.Length -gt 150) { $msg = $msg.Substring(0, 147).TrimEnd() + '...' }

# Turn duration: now minus the timestamp of the user line that started this turn
$dur = ''
for ($i = $tail.Count - 1; $i -ge 0; $i--) {
  if ($tail[$i] -match '"type":"user"' -and $tail[$i] -match '"timestamp":"([^"]+)"') {
    try {
      $span = (Get-Date) - [datetime]$matches[1]
      if ($span.TotalSeconds -ge 1) {
        $m = [int][math]::Floor($span.TotalMinutes)
        $dur = if ($m -gt 0) { "${m}m$($span.Seconds)s" } else { "$($span.Seconds)s" }
      }
    } catch {}
    break
  }
}

# Session name: the /rename title (customTitle) if set, else the auto title (aiTitle)
$sess = ''
if ($j -and $j.transcript_path -and (Test-Path $j.transcript_path)) {
  $hits = Select-String -Path $j.transcript_path -Pattern '"(customTitle|aiTitle)":"([^"]*)"' -Encoding UTF8
  $pick = ($hits | Where-Object { $_.Matches[0].Groups[1].Value -eq 'customTitle' } | Select-Object -Last 1)
  if (-not $pick) { $pick = ($hits | Where-Object { $_.Matches[0].Groups[1].Value -eq 'aiTitle' } | Select-Object -Last 1) }
  if ($pick) { $sess = $pick.Matches[0].Groups[2].Value }
}

$mode = if ($j -and $j.hook_event_name -eq 'Notification') { 'needs' } else { 'done' }
$tmp = Join-Path $env:TEMP ("claude-notify-" + [guid]::NewGuid() + '.json')
@{ mode = $mode; proj = $proj; msg = $msg; cwd = "$($j.cwd)"; sess = $sess; dur = $dur } | ConvertTo-Json | Set-Content $tmp -Encoding UTF8
$popup = Join-Path $PSScriptRoot 'popup.ps1'
Start-Process powershell.exe -WindowStyle Hidden -ArgumentList '-NoProfile', '-STA', '-File', "`"$popup`"", '-Data', "`"$tmp`""
