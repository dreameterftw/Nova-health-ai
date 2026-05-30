@echo off
echo ========================================
echo   NOVA V0 - Quick Deploy to Vercel
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Checking Vercel CLI...
where vercel >nul 2>&1
if %errorlevel% neq 0 (
    echo Vercel CLI not found. Installing...
    call npm install -g vercel
    if %errorlevel% neq 0 (
        echo Failed to install Vercel CLI
        pause
        exit /b 1
    )
)
echo ✓ Vercel CLI is ready
echo.

echo Step 2: Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

echo Step 3: Building for production...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed! Please fix errors and try again.
    pause
    exit /b 1
)
echo ✓ Build successful
echo.

echo Step 4: Deploying to Vercel...
echo.
echo You will need to login to Vercel first.
echo Press any key to continue...
pause >nul

call vercel login
if %errorlevel% neq 0 (
    echo Failed to login to Vercel
    pause
    exit /b 1
)

echo.
echo Deploying to production...
call vercel --prod

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   ✓ Deployment Successful!
    echo ========================================
    echo.
    echo Your app is now live!
    echo.
    echo Next steps:
    echo 1. Add environment variables in Vercel Dashboard
    echo 2. Test authentication flows
    echo 3. Test PWA install button
    echo 4. Test chat with NOVA
    echo.
    echo See DEPLOY_NOW.md for post-deployment checklist
    echo.
) else (
    echo.
    echo ========================================
    echo   ✗ Deployment Failed
    echo ========================================
    echo.
    echo Please check the error messages above.
    echo See DEPLOY_NOW.md for troubleshooting.
    echo.
)

pause
