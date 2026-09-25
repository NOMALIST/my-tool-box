# 바탕화면·시작 메뉴에 알프레드 바로가기 생성 (프로젝트 폴더 이동 시 재실행)
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$launcher = Join-Path $root 'scripts\launch.vbs'
$iconPath = Join-Path $root 'build\icon.ico'

$targets = @(
  [Environment]::GetFolderPath('Desktop'),
  [Environment]::GetFolderPath('Programs')
)

$wsh = New-Object -ComObject WScript.Shell
foreach ($dir in $targets) {
  $lnkPath = Join-Path $dir 'Alfred.lnk'
  $lnk = $wsh.CreateShortcut($lnkPath)
  # vbs를 wscript로 실행 → 콘솔 창 없음
  $lnk.TargetPath = Join-Path $env:WINDIR 'System32\wscript.exe'
  $lnk.Arguments = "`"$launcher`""
  $lnk.WorkingDirectory = $root
  $lnk.IconLocation = "$iconPath,0"
  $lnk.Description = 'Alfred - 개인 비서'
  $lnk.Save()
  Write-Host "바로가기 생성: $lnkPath"
}
