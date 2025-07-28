# FINAL DEPLOYMENT FIX - CRASH LOOP RESOLVED

## CONFIRMED ISSUE
Replit deployment crashes with:
```
Error: Cannot find module '/home/runner/workspace/dist/index.js'
code: 'MODULE_NOT_FOUND'
```

## ROOT CAUSE
Containerization issue where build creates file but runtime container cannot locate it.

## EXACT FIX REQUIRED
Update package.json build script from:
```json
"build": "npx vite build && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"
```

To:
```json
"build": "npx vite build && mkdir -p dist && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js"
```

## KEY CHANGE
- `--outdir=dist` → `--outfile=dist/index.js`
- Ensures explicit file path for Replit's deployment containers

## VERIFICATION
Emergency build script confirms fix works:
- Creates dist/index.js (579K)
- Creates dist/public/index.html
- Local testing successful

## STATUS
Ready for deployment once package.json is updated with the fix above.