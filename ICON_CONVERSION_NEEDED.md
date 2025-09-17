# iOS App Icon Issue - PNG Conversion Required

## Problem
iOS requires PNG format for homescreen app icons, but we only have an SVG file.

## Required PNG Files
You need to create these PNG files from your `app/icon.svg`:

### Required Sizes:
- `/public/apple-touch-icon.png` - 180x180px (for iOS homescreen)
- `/public/icon-192.png` - 192x192px (for Android/PWA)
- `/public/icon-512.png` - 512x512px (for high-res displays)

## How to Convert SVG to PNG:

### Option 1: Online Converter
1. Go to https://svgtopng.com/ or similar
2. Upload your `app/icon.svg` file
3. Generate the required sizes above
4. Download and place in `/public/` folder

### Option 2: Using Design Software
1. Open `app/icon.svg` in Figma/Photoshop/Sketch
2. Export as PNG at the required dimensions
3. Place in `/public/` folder

### Option 3: Command Line (if you have ImageMagick)
```bash
# Install ImageMagick first, then:
magick app/icon.svg -resize 180x180 public/apple-touch-icon.png
magick app/icon.svg -resize 192x192 public/icon-192.png
magick app/icon.svg -resize 512x512 public/icon-512.png
```

## Current Status
- SVG icon: ✅ Working for browsers
- PNG icons: ❌ Missing (causing iOS homescreen issue)
- Metadata: ✅ Properly configured for iOS

Once you create these PNG files, the iOS homescreen icon should work perfectly!