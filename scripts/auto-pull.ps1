# Bring in whatever teammates have pushed, without ever touching your own work.
#
# Five people push to one repository, and work started on a stale tree collides with
# theirs. This checks GitHub every few minutes and fast-forwards master when it is safe.
#
# It refuses to do anything clever. It pulls only when ALL of these hold:
#   * the working tree is clean  — nothing of yours can be overwritten or stashed
#   * no merge or rebase is in progress
#   * you are on master
#   * your branch has no commits of its own that GitHub lacks (no divergence)
#   * the merge is a fast-forward
# Anything else is written to the log and left alone for you to deal with.
#
# Run it by hand:  powershell -File scripts\auto-pull.ps1
# See what it did: Get-Content $env:LOCALAPPDATA\Zamglam\auto-pull.log -Tail 20
# Stop it:         Unregister-ScheduledTask -TaskName "Zamglam auto-pull" -Confirm:$false

[CmdletBinding()]
param(
    [string]$RepositoryPath = "",
    [string]$Branch = "master"
)

# The repository is the folder above this script. Worked out here rather than in the
# parameter default, where $PSScriptRoot is not always set under Windows PowerShell.
if (-not $RepositoryPath) {
    $scriptFolder = Split-Path -Parent $MyInvocation.MyCommand.Path
    $RepositoryPath = Split-Path -Parent $scriptFolder
}

$logDirectory = Join-Path $env:LOCALAPPDATA "Zamglam"
$logFile = Join-Path $logDirectory "auto-pull.log"
if (-not (Test-Path $logDirectory)) { New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null }

function Write-Log([string]$message) {
    $line = "{0}  {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $message
    Add-Content -Path $logFile -Value $line -Encoding utf8
    Write-Output $line
}

# Keep the log from growing without limit.
if ((Test-Path $logFile) -and ((Get-Item $logFile).Length -gt 256KB)) {
    Get-Content $logFile -Tail 200 | Set-Content $logFile -Encoding utf8
}

Set-Location $RepositoryPath

# The connection here drops often, so a failed fetch is normal and not worth shouting
# about: it simply tries again at the next run.
git fetch --quiet origin $Branch 2>$null
if ($LASTEXITCODE -ne 0) { Write-Log "could not reach GitHub - will try again next time"; exit 0 }

$local = (git rev-parse HEAD).Trim()
$remote = (git rev-parse "origin/$Branch").Trim()
if ($local -eq $remote) { exit 0 }   # nothing new; stay silent

$currentBranch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($currentBranch -ne $Branch) { Write-Log "skipped: on branch '$currentBranch', not $Branch"; exit 0 }

$gitDir = (git rev-parse --git-dir).Trim()
if ((Test-Path (Join-Path $gitDir "MERGE_HEAD")) -or (Test-Path (Join-Path $gitDir "rebase-merge")) -or (Test-Path (Join-Path $gitDir "rebase-apply"))) {
    Write-Log "skipped: a merge or rebase is already in progress"
    exit 0
}

# Uncommitted work is yours. Nothing is stashed, nothing is discarded.
$dirty = git status --porcelain
if ($dirty) {
    $count = ($dirty | Measure-Object -Line).Lines
    Write-Log "skipped: $count file(s) with uncommitted changes - commit them, then it pulls on its own"
    exit 0
}

# Commits of your own that GitHub has not got mean a real merge, which can conflict.
# That is a decision for you, not for a background task.
$ahead = (git rev-list --count "origin/$Branch..HEAD").Trim()
if ($ahead -ne "0") {
    Write-Log "skipped: $ahead local commit(s) not pushed - pull and merge it yourself"
    exit 0
}

$incoming = (git rev-list --count "HEAD..origin/$Branch").Trim()
git merge --ff-only "origin/$Branch" --quiet 2>$null
if ($LASTEXITCODE -eq 0) {
    $subject = (git log -1 --pretty=%s).Trim()
    Write-Log "pulled $incoming commit(s); now at $((git rev-parse --short HEAD).Trim()) - $subject"
} else {
    Write-Log "skipped: not a fast-forward - pull and merge it yourself"
}
