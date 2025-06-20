#!/bin/bash

# Simple script to test build before deployment
set -e

echo "🔍 Testing production build..."

# Clean previous build
npm run clean

# Run pre-build validation
echo "✅ Running pre-build checks..."
node prebuild-check.js

# Build the project
echo "🏗️ Building project..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "❌ Build failed - index.html not found"
    exit 1
fi

# Check for JavaScript files
js_files=$(find dist/assets -name "*.js" 2>/dev/null | wc -l)
if [ "$js_files" -eq 0 ]; then
    echo "❌ Build failed - no JavaScript files found"
    exit 1
fi

echo "📊 Build stats:"
echo "  - JS files: $js_files"
echo "  - Total size: $(du -sh dist | cut -f1)"

# Quick test for common minification issues
echo "🔍 Checking for potential minification issues..."
problematic_files=0

for js_file in dist/assets/*.js; do
    if [ -f "$js_file" ]; then
        # Check for patterns that often cause "l is not a function" errors
        if grep -q "function [a-z](" "$js_file" 2>/dev/null; then
            echo "⚠️  Warning: Single-letter function names found in $(basename "$js_file")"
            problematic_files=$((problematic_files + 1))
        fi
    fi
done

if [ "$problematic_files" -gt 0 ]; then
    echo "⚠️  $problematic_files file(s) may have minification issues"
    echo "   Consider adjusting terser options if you encounter runtime errors"
else
    echo "✅ No obvious minification issues detected"
fi

# Test if the build serves correctly
echo "🚀 Testing build server..."
npm run preview &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Test if server responds
if curl -f http://localhost:4173 > /dev/null 2>&1; then
    echo "✅ Build serves correctly"
else
    echo "❌ Build server test failed"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

# Clean up
kill $SERVER_PID 2>/dev/null || true

echo "🎉 Build test completed successfully!"
echo "Ready for deployment."