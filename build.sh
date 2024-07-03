
versions=("v0" "v1" )

for version in "${versions[@]}"; do
  echo "Building for version: $version"
  npx vite build --config vite.config.$version.ts
  if [ $? -ne 0 ]; then
    echo "Build failed for version: $version"
    exit 1
  fi
done

echo "All builds completed successfully"
