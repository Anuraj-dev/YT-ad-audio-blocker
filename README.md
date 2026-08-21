# YouTube Ad Audio Blocker

Chrome extension (Manifest V3) that mutes the YouTube player while an ad is showing, then restores the previous volume when the ad ends. It does not skip or block ads. It only kills the sound.

YouTube is a single-page app, so the content script watches `#movie_player.ad-showing`, skip-button visibility, and ad overlays, and re-binds after navigation.

## Install unpacked

1. Clone this repo.
2. Open `chrome://extensions`.
3. Turn on Developer mode.
4. Load unpacked and pick this folder.

The toolbar popup toggle is stored in `chrome.storage.sync` as `extensionEnabled` (on by default).

## Permissions

- `storage` for the on/off flag
- host access to `*.youtube.com` so the content script can read the player DOM

## Files

| File | Role |
| --- | --- |
| `manifest.json` | MV3 manifest |
| `contentScript.js` | ad detect + mute/unmute |
| `popup.html` / `popup.js` / `style.css` | toolbar toggle |
| `icon48.png` | toolbar icon |

## Limits

Ad markup changes. If mute stops firing, `#movie_player` likely dropped the `ad-showing` class or the overlay selectors moved. This is a personal utility, not a store listing.
