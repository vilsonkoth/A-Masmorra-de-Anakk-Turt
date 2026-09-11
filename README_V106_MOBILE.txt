ANAKK TUR V106 MOBILE
======================

This package is the mobile web project based on V105.

Included:
- Embedded asset baseline under public/embedded-assets/
- Existing browser backup import/export system from V105
- Mobile viewport CSS
- Existing opening video/assets from the source project, if present

For Netlify:
- If deploying the source project, build command: npm run build
- Publish directory: dist

The embedded assets are part of the deployed project, so a fresh mobile browser
does not need the user to import the baseline assets just to see the standard game art.
User-created/custom browser data should still be transported using the game's backup
import/export feature.
