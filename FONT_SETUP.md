# Font Setup Instructions

## Step 1: Download Font Files

You need to download the font files for **Lora** and **Inter**:

### Option A: Google Fonts (Recommended)

1. **Lora Font:**
   - Visit: https://fonts.google.com/specimen/Lora
   - Click "Download family"
   - Extract the ZIP file

2. **Inter Font:**
   - Visit: https://fonts.google.com/specimen/Inter
   - Click "Download family"
   - Extract the ZIP file

### Option B: Direct Links

- **Lora:** https://github.com/cyrealtype/Lora
- **Inter:** https://github.com/rsms/inter

## Step 2: Create Fonts Directory

Create the following directory structure in your project:

```
Lolo/
├── assets/
│   └── fonts/
│       ├── Lora-Regular.ttf
│       ├── Lora-Bold.ttf
│       ├── Lora-SemiBold.ttf
│       ├── Inter-Regular.ttf
│       ├── Inter-Medium.ttf
│       ├── Inter-SemiBold.ttf
│       └── Inter-Bold.ttf
```

## Step 3: Copy Font Files

Copy the following font files from the downloaded ZIP files to `assets/fonts/`:

**From Lora:**
- `Lora-Regular.ttf` → `assets/fonts/Lora-Regular.ttf`
- `Lora-Bold.ttf` → `assets/fonts/Lora-Bold.ttf`
- `Lora-SemiBold.ttf` → `assets/fonts/Lora-SemiBold.ttf`

**From Inter:**
- `Inter-Regular.ttf` → `assets/fonts/Inter-Regular.ttf`
- `Inter-Medium.ttf` → `assets/fonts/Inter-Medium.ttf`
- `Inter-SemiBold.ttf` → `assets/fonts/Inter-SemiBold.ttf`
- `Inter-Bold.ttf` → `assets/fonts/Inter-Bold.ttf`

## Step 4: Update app.json

Make sure your `app.json` includes the fonts in the asset bundle:

```json
{
  "expo": {
    "assetBundlePatterns": ["**/*"]
  }
}
```

(This should already be set in your current `app.json`)

## Step 5: Restart Your App

After adding the font files:

1. Stop your Expo development server (Ctrl+C)
2. Clear the cache: `npx expo start --clear`
3. Restart the app

## Font Usage in Code

The fonts are now loaded and can be used with:

- **Lora:** `fontFamily: 'Lora'` (for titles and emphasized text)
- **Inter:** `fontFamily: 'Inter'` (for body text)

The code already references these fonts in:
- `src/screens/AuthScreen.tsx`
- `src/screens/LogDateScreen.tsx`

## Troubleshooting

If fonts don't load:

1. **Check file paths:** Make sure font files are in `assets/fonts/` directory
2. **Check file names:** File names must match exactly (case-sensitive)
3. **Clear cache:** Run `npx expo start --clear`
4. **Rebuild:** For native builds, you may need to rebuild the app
5. **Check console:** Look for font loading errors in the console

## Alternative: Using System Fonts

If you prefer not to bundle custom fonts, you can use system fonts:

- Replace `fontFamily: 'Lora'` with `fontFamily: 'serif'` (iOS) or remove it (uses default)
- Replace `fontFamily: 'Inter'` with `fontFamily: 'sans-serif'` (iOS) or remove it

However, this won't give you the exact Lora and Inter fonts across all platforms.

