# =============================================================================
#  scripts/push-to-github.ps1
#
#  Prepares this project, commits everything and pushes it to GitHub.
#
#  How to run (open PowerShell inside the project root):
#     powershell -ExecutionPolicy Bypass -File .\scripts\push-to-github.ps1
#
#  It is safe to run more than once.
# =============================================================================

$ErrorActionPreference = 'Continue'

$RepoUrl = 'https://github.com/abdi1367-Developer/chatbot.git'
$Branch  = 'main'
$Message = 'feat: smart chatbot for Iran Currency & Gold Exchange (Persian search engine, topic menus, responsive UI)'

function Step([string]$text) { Write-Host "`n==> $text" -ForegroundColor Cyan }
function Ok([string]$text)   { Write-Host "    [ok] $text" -ForegroundColor Green }
function Warn([string]$text) { Write-Host "    [!!] $text" -ForegroundColor Yellow }
function Die([string]$text) {
  Write-Host "    [xx] $text" -ForegroundColor Red
  exit 1
}

# -----------------------------------------------------------------------------
# 1) project root
# -----------------------------------------------------------------------------
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
Step "Project root: $root"

if (-not (Test-Path '.\package.json')) {
  Die 'package.json not found. Run this script from inside the chatbot project.'
}

# -----------------------------------------------------------------------------
# 2) is git installed?
# -----------------------------------------------------------------------------
Step 'Checking git...'
$gitVersion = (git --version) 2>$null
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($gitVersion)) {
  Warn 'Git is not installed on this computer.'
  Warn 'Install it from https://git-scm.com/download/win , restart the terminal and run again.'
  exit 1
}
Ok $gitVersion

# -----------------------------------------------------------------------------
# 3) logo sanity check (a PNG badly named logo.svg will not render)
# -----------------------------------------------------------------------------
Step 'Checking the logo file...'
$nodeVersion = (node -v) 2>$null
if ($LASTEXITCODE -eq 0 -and (Test-Path '.\scripts\prepare-logo.mjs')) {
  node .\scripts\prepare-logo.mjs
  Ok 'logo check finished (see the messages above)'
} else {
  Warn 'Node.js was not found - skipping the automatic logo fix.'
}
if (-not (Test-Path '.\public\logo.png') -and (Test-Path '.\public\logo.svg')) {
  Warn 'public/logo.png does not exist yet.'
  Warn 'If public/logo.svg is really a PNG, rename it to public/logo.png before pushing.'
}

# -----------------------------------------------------------------------------
# 4) initialise the repository if necessary
# -----------------------------------------------------------------------------
Step 'Preparing the repository...'
if (-not (Test-Path '.\.git')) {
  # -b is supported by git 2.28+ ; fall back to plain init on older versions
  git init -b $Branch 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    git init 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { Die 'git init failed.' }
  }
  Ok "new git repository created (branch: $Branch)"
} else {
  Ok 'existing git repository reused'
}

# -----------------------------------------------------------------------------
# 5) make sure a commit identity exists (Git refuses to commit without one)
# -----------------------------------------------------------------------------
$name  = (git config user.name)  2>$null
$email = (git config user.email) 2>$null
if ([string]::IsNullOrWhiteSpace($name)) {
  git config user.name 'abdi1367-Developer'
  Warn 'git user.name was not set -> configured locally as "abdi1367-Developer"'
}
if ([string]::IsNullOrWhiteSpace($email)) {
  git config user.email 'abdi1367-Developer@users.noreply.github.com'
  Warn 'git user.email was not set -> configured locally (you can change it later)'
}

# -----------------------------------------------------------------------------
# 6) remote
# -----------------------------------------------------------------------------
Step 'Configuring remote "origin"...'
$remotes = @(git remote 2>$null)
if ($remotes -contains 'origin') {
  git remote set-url origin $RepoUrl
  Ok "origin updated -> $RepoUrl"
} else {
  git remote add origin $RepoUrl
  if ($LASTEXITCODE -ne 0) { Die 'Could not add the remote.' }
  Ok "origin added -> $RepoUrl"
}

# -----------------------------------------------------------------------------
# 7) stage + commit
# -----------------------------------------------------------------------------
Step 'Staging all files...'
git add -A
if ($LASTEXITCODE -ne 0) { Die 'git add failed.' }

$pending = (git status --porcelain) 2>$null
if ([string]::IsNullOrWhiteSpace($pending)) {
  Warn 'Nothing new to commit.'
} else {
  git commit -m $Message | Out-Null
  if ($LASTEXITCODE -ne 0) { Die 'git commit failed.' }
  Ok 'commit created'
}

# make sure we are on the wanted branch (safe now that a commit exists)
git branch -M $Branch 2>&1 | Out-Null
Ok "branch: $Branch"

# -----------------------------------------------------------------------------
# 8) push
# -----------------------------------------------------------------------------
Step "Pushing to origin/$Branch ..."
Write-Host '    (GitHub may ask you to sign in - a browser window or a token may appear)' -ForegroundColor DarkGray
git push -u origin $Branch

if ($LASTEXITCODE -ne 0) {
  Write-Host ''
  Warn 'Push failed. Most common reasons:'
  Warn '  1) You have not signed in to GitHub yet.'
  Warn '     -> run:  git config --global credential.helper manager'
  Warn '     -> then run this script again and sign in in the browser.'
  Warn '  2) GitHub needs a Personal Access Token instead of your password.'
  Warn '     -> https://github.com/settings/tokens  (scope: repo)'
  Warn '  3) The remote repository is not empty / has a different history.'
  Warn '     -> run:  git pull --rebase origin main   and then push again.'
  exit 1
}

Write-Host ''
Ok 'Everything pushed successfully.'
Write-Host ''
Write-Host 'Next step: deploy it on Vercel' -ForegroundColor Cyan
Write-Host '  https://vercel.com/new  ->  Import Git Repository  ->  Deploy' -ForegroundColor Cyan
