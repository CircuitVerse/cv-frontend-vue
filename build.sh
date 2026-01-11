#!/bin/bash


if [ $# -gt 0 ]; then
  versions=("$@")
else
  versions=($(jq -r '.[].version' version.json))
fi


for version in "${versions[@]}"; do
  echo "Building for version: $version"
  
  VITE_SIM_VERSION="$version" npx vite build
  
  # Flatten output: move nested index.html to parent
  if [ -f "dist/simulatorvue/$version/$version/index.html" ]; then
    mv "dist/simulatorvue/$version/$version/index.html" "dist/simulatorvue/$version/index.html"
    rmdir "dist/simulatorvue/$version/$version"
  fi
  
  #Build status
  if [ $? -ne 0 ]; then
    echo "Build failed for version: $version"
    exit 1
  fi
done

echo "All builds completed successfully"
