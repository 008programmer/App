# Magic Colour Garden

A local-first colouring and drawing game with a Three.js garden, six crayons, drawing export, and locally saved artwork.

## Run

Use Node 24.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

Open the printed URL followed by `/App/` when necessary.

## Publish

This repository targets https://008programmer.github.io/App/.
In repository Settings > Pages, select **GitHub Actions** as the build source.
The Pages workflow tests, builds, and deploys `dist` on pushes to `main`.
The original Shlok files remain in Git history and unused legacy files are not included in the deployment.

## Install and offline use

Open the deployed HTTPS site online once and wait for “Ready to play offline.”
Use your browser's Install app command, or Safari's Share > Add to Home Screen.
The game, icons, and application assets are cached for offline startup. Artwork is stored in IndexedDB; clearing browser data removes it. Download drawings to keep separate copies.

Updates show “A new garden is ready.” Select Update to save artwork and activate the new version. An unsuccessful save pauses the update.

## Verification

Production build and four saved-state tests pass. Automated headless Edge checks at `/App/` verified service worker control, manifest scope and icons, offline reload, saved colour and drawing restoration, and offline interaction without JavaScript errors. A two-build update rehearsal verified the update prompt, activation, saved artwork preservation, and offline reload of the updated build.

Native installation on physical Android/iOS devices and the deployed site still need verification. The application has a non-fatal bundle-size warning from Three.js.
