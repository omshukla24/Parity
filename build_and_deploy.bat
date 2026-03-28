@echo off
SET LOG=C:\temp\parity_deploy.log
SET NODE=C:\Program Files\nodejs\node.exe
SET NPM=C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js
SET PARITY=C:\Users\user\Desktop\Lov hack s2\Parity
SET TSC=%PARITY%\node_modules\.bin\tsc.cmd
SET VITE=%PARITY%\node_modules\.bin\vite.cmd

echo === P.A.R.I.T.Y. Build + Deploy === > "%LOG%"
echo Started: %DATE% %TIME% >> "%LOG%"
echo. >> "%LOG%"

pushd "%PARITY%"
if errorlevel 1 (echo ERROR: cannot cd to parity >> "%LOG%" & exit /b 1)
echo [DIR] %CD% >> "%LOG%"

REM ── Critical: node must be in PATH so tsc.cmd / vite.cmd can call it ──
SET "PATH=C:\Program Files\nodejs;%PATH%"
echo [PATH] nodejs added to PATH >> "%LOG%"

echo [1/4] Checking node... >> "%LOG%"
"%NODE%" --version >> "%LOG%" 2>&1
if errorlevel 1 (echo ERROR: node.exe not found at %NODE% >> "%LOG%" & exit /b 1)

echo [2/4] npm install --include=dev... >> "%LOG%"
SET NODE_ENV=development
"%NODE%" "%NPM%" install --include=dev >> "%LOG%" 2>&1
echo npm install done (exit %ERRORLEVEL%) >> "%LOG%"

echo [3/4] tsc type-check (calling node directly)... >> "%LOG%"
if not exist "%PARITY%\node_modules\typescript\bin\tsc" (
  echo ERROR: typescript not installed >> "%LOG%" & popd & exit /b 1
)
"%NODE%" "%PARITY%\node_modules\typescript\bin\tsc" --noEmit >> "%LOG%" 2>&1
if errorlevel 1 (echo ERROR: TypeScript errors above >> "%LOG%" & popd & exit /b 1)
echo tsc OK >> "%LOG%"

echo [3b/4] vite build (calling node directly)... >> "%LOG%"
if not exist "%PARITY%\node_modules\vite\bin\vite.js" (
  echo ERROR: vite not installed >> "%LOG%" & popd & exit /b 1
)
"%NODE%" "%PARITY%\node_modules\vite\bin\vite.js" build >> "%LOG%" 2>&1
if errorlevel 1 (echo ERROR: vite build failed >> "%LOG%" & popd & exit /b 1)
echo vite build OK >> "%LOG%"
echo dist contents: >> "%LOG%"
dir "%PARITY%\dist" /b >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo [4/4] gcloud run deploy... >> "%LOG%"
SET GOOGLE_API_KEY=AIzaSyDHafjXHLLbxtlJpB13RbL407iifYr4wLg
SET FEATHERLESS_API_KEY=rc_44a88c8349467d94c0fa6eb2c7dd0916c27378874501bd7ad6051c1e25aff535

gcloud.cmd run deploy parity ^
  --source . ^
  --project parity-491619 ^
  --platform managed ^
  --region us-central1 ^
  --allow-unauthenticated ^
  --port 8080 ^
  --memory 1Gi ^
  --quiet ^
  --set-env-vars "GOOGLE_API_KEY=%GOOGLE_API_KEY%,FEATHERLESS_API_KEY=%FEATHERLESS_API_KEY%" >> "%LOG%" 2>&1

if errorlevel 1 (echo ERROR: gcloud deploy failed >> "%LOG%" & popd & exit /b 1)

popd
echo. >> "%LOG%"
echo === DEPLOYED SUCCESSFULLY === >> "%LOG%"
echo Finished: %DATE% %TIME% >> "%LOG%"
