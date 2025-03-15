# App Icon Change Guide for Balanza

This guide explains how to properly change the app icon for the Balanza application.

## Icon Requirements

### General Requirements
- Icons should be square (1:1 aspect ratio)
- Recommended size: 1024x1024 pixels
- Format: PNG
- Keep file size reasonable (under 500KB)

### Platform-Specific Requirements
- **iOS**: No transparency allowed in the main icon
- **Android**: Transparency is allowed in the adaptive icon

## Files to Update

When changing the app icon, you need to update the following files:

1. `assets/icon.png` - The main app icon used for iOS and as a fallback
2. `assets/adaptive-icon.png` - The adaptive icon used for Android
3. `assets/favicon.png` - The icon used for web (if applicable)
4. `assets/splash-icon.png` - The icon used on the splash screen

## Step-by-Step Guide

### 1. Prepare Your New Icons

1. Create your icon in the recommended size (1024x1024 pixels)
2. Export it in PNG format
3. Optimize the image to keep file size reasonable

### 2. Replace the Existing Icons

```bash
# Replace the main icon
cp path/to/your/new-icon.png assets/icon.png

# Replace the adaptive icon (for Android)
cp path/to/your/new-adaptive-icon.png assets/adaptive-icon.png

# Replace the favicon (for web)
cp path/to/your/new-favicon.png assets/favicon.png

# Replace the splash icon
cp path/to/your/new-splash-icon.png assets/splash-icon.png
```

### 3. Optimize Icons (Optional but Recommended)

You can use tools like `sharp-cli` to optimize your icons:

```bash
# Install sharp-cli if not already installed
npm install -g sharp-cli

# Optimize and resize icons
npx sharp -i path/to/your/new-icon.png -o assets/icon.png resize 1024 1024
npx sharp -i path/to/your/new-adaptive-icon.png -o assets/adaptive-icon.png resize 1024 1024
```

### 4. Clear Cache and Rebuild

```bash
# Clear Expo cache
npx expo start --clear
```

### 5. Test on Different Devices

Always test your new icons on both iOS and Android devices to ensure they display correctly.

## Troubleshooting

If your icon doesn't appear correctly:

1. Verify the image dimensions (should be square)
2. Check file format (must be PNG)
3. Ensure the file size isn't too large
4. Confirm the paths in app.config.js are correct
5. Clear the Expo cache and rebuild

## References

- [Expo Documentation on App Icons](https://docs.expo.dev/guides/app-icons/)
- [React Native Documentation on Images](https://reactnative.dev/docs/images) 