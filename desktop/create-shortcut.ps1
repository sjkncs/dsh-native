$ErrorActionPreference = "Stop"
# Create a desktop shortcut that launches the Electron wrapper from this folder.
# Paths are resolved relative to this script's location, so it works from any clone.
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$electronExe = Join-Path $here "node_modules\electron\dist\electron.exe"
if (-not (Test-Path $electronExe)) {
    Write-Error "Electron not found. Run 'npm install' in this folder first."
}
$desktop = [Environment]::GetFolderPath("Desktop")
$lnk = Join-Path $desktop "DeepSeek Harness.lnk"
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($lnk)
$shortcut.TargetPath = $electronExe
$shortcut.Arguments = "`"$here`""
$shortcut.WorkingDirectory = $here
$shortcut.Save()
Write-Output "shortcut created at $lnk"
