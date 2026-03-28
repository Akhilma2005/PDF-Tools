#!/bin/bash
set -e

echo "Installing dependencies..."
npm install

echo "Checking for pdftoppm..."
if command -v pdftoppm &> /dev/null; then
  echo "pdftoppm already available at: $(which pdftoppm)"
else
  echo "pdftoppm not found"
fi

echo "Checking for soffice..."
if command -v soffice &> /dev/null; then
  echo "soffice already available at: $(which soffice)"
else
  echo "soffice not found"
fi

echo "Build complete."
