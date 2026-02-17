#!/bin/bash

# Credit Intelligence Service - Setup Script

echo "════════════════════════════════════════════════════════════════"
echo "  Credit Intelligence Service - Quick Setup"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Check if virtual environment exists
if [ -d "venv" ]; then
    echo "✓ Virtual environment found"
else
    echo "→ Creating virtual environment..."
    python3 -m venv venv
    if [ $? -eq 0 ]; then
        echo "✓ Virtual environment created"
    else
        echo "✗ Failed to create virtual environment"
        exit 1
    fi
fi

# Activate virtual environment and install dependencies
echo ""
echo "→ Installing dependencies..."
./venv/bin/pip install --upgrade pip --quiet
./venv/bin/pip install -r requirements.txt --quiet

if [ $? -eq 0 ]; then
    echo "✓ Dependencies installed"
else
    echo "✗ Failed to install dependencies"
    exit 1
fi

# Run tests
echo ""
echo "→ Running tests..."
echo ""
./venv/bin/python app/test_service.py

if [ $? -eq 0 ]; then
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "  Setup Complete!"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    echo "Next steps:"
    echo ""
    echo "  1. Train ML models (optional but recommended):"
    echo "     ./venv/bin/python app/ml/train.py"
    echo ""
    echo "  2. Start the service:"
    echo "     ./venv/bin/python main.py"
    echo ""
    echo "  3. Visit http://localhost:8000/docs for API documentation"
    echo ""
else
    echo ""
    echo "✗ Tests failed. Please check the error messages above."
    exit 1
fi
