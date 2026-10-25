$ErrorActionPreference = "Stop"

Set-Location -LiteralPath $PSScriptRoot

$localNodePath = Join-Path $env:LOCALAPPDATA "Programs\nodejs"
if (Test-Path -LiteralPath (Join-Path $localNodePath "node.exe")) {
    $env:Path = "$localNodePath;$env:Path"
}

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) {
    Write-Host "Node.js 20 or later is required. Install it from https://nodejs.org/, restart PowerShell, and run this script again." -ForegroundColor Yellow
    exit 1
}

$nodeMajor = [int](& node -p "process.versions.node.split('.')[0]")
if ($nodeMajor -lt 20) {
    Write-Host "Node.js 20 or later is required; detected version $(& node --version)." -ForegroundColor Yellow
    exit 1
}

if (-not $env:GEMINI_API_KEY) {
    Write-Host "A fresh Gemini key enables AI plans. The key you previously pasted in chat is exposed: revoke it first." -ForegroundColor Yellow
    $secureKey = Read-Host "Paste a NEW Gemini API key (input is hidden; press Enter to skip)" -AsSecureString
    $keyPointer = [IntPtr]::Zero
    try {
        if ($secureKey.Length -gt 0) {
            $keyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
            $env:GEMINI_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($keyPointer)
        }
    } finally {
        if ($keyPointer -ne [IntPtr]::Zero) {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($keyPointer)
        }
        $secureKey.Dispose()
    }
}

$env:HOST = "0.0.0.0"

try {
    Write-Host "Starting PocketSmart AI for devices on your private Wi-Fi. Keep this terminal open." -ForegroundColor Green
    Write-Host "The server will print the phone-ready address when it starts." -ForegroundColor Green
    & npm.cmd start
} finally {
    Remove-Item Env:\HOST -ErrorAction SilentlyContinue
    if (-not [Environment]::GetEnvironmentVariable('GEMINI_API_KEY', 'User')) {
        Remove-Item Env:\GEMINI_API_KEY -ErrorAction SilentlyContinue
    }
}
