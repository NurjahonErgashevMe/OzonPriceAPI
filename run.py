#!/usr/bin/env python3

import subprocess
import sys
import os


def install_requirements():
    """Install required packages"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✓ Requirements installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed to install requirements: {e}")
        sys.exit(1)


def check_chromedriver():
    """Check if ChromeDriver is available"""
    try:
        result = subprocess.run(["chromedriver", "--version"], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✓ ChromeDriver found: {result.stdout.strip()}")
        else:
            print("✗ ChromeDriver not found. Please install ChromeDriver")
            print("  Download from: https://chromedriver.chromium.org/")
            sys.exit(1)
    except FileNotFoundError:
        print("✗ ChromeDriver not found. Please install ChromeDriver")
        print("  Download from: https://chromedriver.chromium.org/")
        sys.exit(1)


def run_server():
    """Run the FastAPI server"""
    try:
        print("🚀 Starting Ozon Price Parser API...")
        print("📚 API Documentation: http://localhost:8000/docs")
        print("🔄 Health Check: http://localhost:8000/api/v1/health")
        print("\n" + "="*50)
        
        subprocess.run([sys.executable, "main.py"])
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped by user")
    except Exception as e:
        print(f"✗ Error running server: {e}")
        sys.exit(1)


if __name__ == "__main__":
    print("🔧 Setting up Ozon Price Parser API...")
    
    # Install requirements
    install_requirements()
    
    # Check ChromeDriver
    check_chromedriver()
    
    # Run server
    run_server()