@echo off
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"
echo [Mobile Runner] Active Java version:
java -version
echo.
echo [Mobile Runner] Launching Capacitor Android...
npx cap run android
