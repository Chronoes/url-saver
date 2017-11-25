@echo off

set install_path=%PROGRAMFILES%\url-saver

xcopy /Y /E /I "%~dp0app" "%install_path%"
del "%install_path%\url_saver.json"
ren "%install_path%\url_saver.win.json" "url_saver.json"

reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Mozilla\NativeMessagingHosts\url-saver" /ve /d "%install_path%\url_saver.json" /f

pause
