#!/bin/bash

versions=($(jq -r '.[].version' version.json | tr -d '\r'))

for version in "${versions[@]}"; do
  echo "Building for version: $version"
  
  bunx --bun vite build --config vite.config."$version".ts
  
  if [ $? -ne 0 ]; then
    echo "Build failed for version: $version"
    exit 1
  fi
done

echo "All builds completed successfully"