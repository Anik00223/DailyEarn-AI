#!/bin/bash
# Windows Service Wrapper for DailyEarn AI
# Run as Administrator to install as a Windows Service
# Usage:
#   install-service.bat    — Install as Windows service
#   uninstall-service.bat  — Remove Windows service
#   start-service.bat      — Start the service
#   stop-service.bat       — Stop the service

SERVICE_NAME="DailyEarnAI"
DISPLAY_NAME="DailyEarn AI Backend Server"
DESCRIPTION="AI-powered hyper-local daily income idea generation service"
BINARY_PATH="C:\Users\dasa8\OneDrive\Desktop\New folder (3)\scripts\start-always.bat"

case "%~1" in
    install-service.bat)
        echo "Installing Windows service: %SERVICE_NAME%"
        sc create "%SERVICE_NAME%" binPath= "%BINARY_PATH%" DisplayName= "%DISPLAY_NAME%" start= auto
        sc description "%SERVICE_NAME%" "%DESCRIPTION%"
        sc failure "%SERVICE_NAME%" reset= 60 actions= restart/5000/restart/10000/restart/30000
        echo "Service installed. Run 'net start DailyEarnAI' to start."
        ;;

    uninstall-service.bat)
        echo "Stopping and removing service: %SERVICE_NAME%"
        net stop "%SERVICE_NAME%" 2>nul
        sc delete "%SERVICE_NAME%" 2>nul
        echo "Service removed."
        ;;

    start-service.bat)
        echo "Starting service: %SERVICE_NAME%"
        net start "%SERVICE_NAME%"
        ;;

    stop-service.bat)
        echo "Stopping service: %SERVICE_NAME%"
        net stop "%SERVICE_NAME%"
        ;;

    *)
        echo "Usage: %~nx0 {install-service.bat|uninstall-service.bat|start-service.bat|stop-service.bat}"
        exit 1
        ;;
esac