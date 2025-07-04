#!/bin/bash

# Script to remove sensitive environment files from Git history
# This should be used with caution as it rewrites Git history

set -e

echo "⚠️  WARNING: This script will rewrite Git history ⚠️"
echo "This is a destructive operation and should only be used when necessary."
echo "All team members will need to clone the repository again after this operation."
echo ""
echo "Press Ctrl+C now to abort, or Enter to continue..."
read

# Files to remove from Git history
FILES_TO_REMOVE=(
  "frontend/.env"
  "frontend/.env.development"
  "frontend/.env.production"
  "frontend/.env.local"
  "backend/.env"
  "contracts/.env"
)

# Create a temporary directory for BFG
mkdir -p tmp
cd tmp

# Check if bfg.jar exists, if not download it
if [ ! -f bfg.jar ]; then
  echo "Downloading BFG Repo-Cleaner..."
  curl -L https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar -o bfg.jar
fi

cd ..

# Create a mirror of the repository
echo "Creating a mirror of the repository..."
git clone --mirror .git temp.git

# Use BFG to remove the files
echo "Removing sensitive files from Git history..."
for file in "${FILES_TO_REMOVE[@]}"; do
  echo "Processing $file..."
  java -jar tmp/bfg.jar --delete-files "$file" temp.git
done

# Clean up and apply changes
cd temp.git
echo "Cleaning up repository..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Instructions for the user
echo ""
echo "✅ Process completed."
echo ""
echo "To complete the process, you need to push the changes:"
echo ""
echo "  cd temp.git"
echo "  git push --force"
echo ""
echo "IMPORTANT: After pushing, all team members should:"
echo "1. Commit or stash their local changes"
echo "2. Run: git fetch origin"
echo "3. Run: git reset --hard origin/main (or your main branch name)"
echo "4. OR clone the repository again"
echo ""
echo "This is necessary because this operation rewrites Git history."