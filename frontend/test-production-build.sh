#!/bin/bash

echo "🚀 Testing MegaVibe Production Build"
echo "======================================"

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Start preview server
    echo "🌐 Starting preview server..."
    echo "Visit http://localhost:4173 to test your production build"
    echo "Also visit http://localhost:4173/test-polyfills.html to test polyfills"
    echo ""
    echo "Press Ctrl+C to stop the server"
    
    npm run preview
else
    echo "❌ Build failed!"
    exit 1
fi