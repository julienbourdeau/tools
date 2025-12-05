#!/bin/sh
# Build script for Cloudflare Pages
# This script generates the artifacts manifest and copies files to the output directory

# Ensure the public directory exists
mkdir -p public

# Copy artifacts to public directory
cp -r artifacts public/

# Generate the manifest file with list of apps
echo '{"apps":[' > public/artifacts-manifest.json

first=true
for file in artifacts/*.js; do
  if [ -f "$file" ]; then
    # Extract filename without path and extension
    filename=$(basename "$file" .js)
    
    # Convert filename to display name (e.g., "counter-app" -> "Counter App")
    # Using sed for portability
    name=$(echo "$filename" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)}1')
    
    if [ "$first" = true ]; then
      first=false
    else
      echo ',' >> public/artifacts-manifest.json
    fi
    
    echo "{\"slug\":\"$filename\",\"name\":\"$name\"}" >> public/artifacts-manifest.json
  fi
done

echo ']}' >> public/artifacts-manifest.json

echo "Build complete!"
echo "Generated manifest:"
cat public/artifacts-manifest.json
