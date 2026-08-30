# Windows 安装入口：转发到 setup.mjs
$ErrorActionPreference = "Stop"
node (Join-Path $PSScriptRoot "setup.mjs") @args
exit $LASTEXITCODE
