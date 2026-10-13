#!/bin/sh
cd "$(dirname "$0")" && npx esbuild site/src/hush3d.js --bundle --format=iife --global-name=Hush3D --minify --outfile=site/assets/hush3d.js --log-level=warning
