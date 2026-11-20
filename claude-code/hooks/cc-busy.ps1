# Toggle the Claude Code busy flag the VS Code cc-busy-bridge extension watches. Benign file write/delete only.
param([string]$Action)
$flag = Join-Path $env:USERPROFILE '.claude\.cc-busy'
if ($Action -eq 'on') {
  Set-Content -Path $flag -Value (Get-Date -Format o) -Encoding ASCII
} else {
  Remove-Item -Path $flag -ErrorAction SilentlyContinue
}
