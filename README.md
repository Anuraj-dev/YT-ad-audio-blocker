<h1 align="center">YouTube Ad Audio Blocker</h1>

<p align="center">
  Chrome extension that mutes YouTube while an ad plays.<br />
  It doesn't skip or block the ad. It turns the sound back on when the ad ends.
</p>

<p align="center">
  <a href="#installation">Install</a>
  ·
  <a href="#known-limits">Known limits</a>
</p>

YouTube Ad Audio Blocker silences the player during ads and restores your volume afterwards. The ad still plays, so you still watch it. You just don't hear it.

It is a Manifest V3 Chrome extension. A content script runs on `youtube.com`, and a toolbar popup holds the on/off switch. There is no build step, no server and no account. You load the folder unpacked.

## What you get

- **Mutes only while an ad plays.** The script sets the page's `<video>` to `volume = 0` and `muted = true`. It also calls YouTube's own `mute()` on `#movie_player` when that method exists.
- **Detects ads three ways.** An ad counts when any one of three signals is present. The first is the `ad-showing` class on `#movie_player`. The second is a visible skip button, either `.ytp-ad-skip-button` or its container. The third is a visible `.ytp-ad-player-overlay`. The check runs on DOM mutations, on each video `loadeddata` event, and every 500 ms as a fallback.
- **Puts your volume back.** Before muting, it saves the video's `volume`. When the ad ends, it restores that level and unmutes the player.
- **Follows YouTube's page changes.** YouTube swaps pages without a full reload. The script checks `location.href` once a second. On a change, it resets its state and rebinds to the new `<video>` one second later. It also resets on YouTube's `yt-navigate-start` event.
- **One switch in the toolbar.** The popup stores `extensionEnabled` in `chrome.storage.sync`, so the setting follows your Chrome sign-in. It is on by default. Turning it off stops the observer and timers, and unmutes the player if it is muted. Turning it on starts detection again without a reload.
- **No network calls of its own.** The code makes no `fetch` or XHR requests. The only value it stores is the on/off flag.

## Installation

You install the extension unpacked. There is no store listing.

### Load it in Chrome

```sh
git clone https://github.com/Anuraj-dev/YT-ad-audio-blocker.git
```

1. Open `chrome://extensions`.
2. Turn on Developer mode.
3. Click Load unpacked and pick the cloned folder.

Reload any YouTube tabs that were open before you loaded the extension. Content scripts don't attach to pages that were already open.

Open the toolbar popup to check the switch. It should read ON.

## Permissions

- `storage` for the on/off flag.
- Host access to `*://*.youtube.com/*`, so the content script can read the player and set the video volume.

## Files

| File | Role |
| --- | --- |
| `manifest.json` | Manifest V3 config: permissions, content script match, popup and icon |
| `contentScript.js` | Ad detection, mute and restore, and page change handling |
| `popup.html`, `popup.js`, `style.css` | Toolbar popup with the ON/OFF switch |
| `icon48.png` | Toolbar icon named in `manifest.json` |
| `icon16.png`, `icon128.png` | Other icon sizes. Not referenced by the manifest |
| `icons_info.md` | Where to find replacement icons |

The three PNG files are currently text placeholders, not images. Replace them with real 16, 48 and 128 pixel PNGs. See `icons_info.md`.

## Known limits

- Ad markup changes. If muting stops, check whether `#movie_player` still gets the `ad-showing` class, and whether the skip button and overlay selectors still match.
- It does not skip ads or block ad requests. The ad plays silently.
- Restoring unmutes the player. The script saves the volume level, not the muted flag. If you muted the player yourself before an ad, it unmutes when the ad ends.
- A saved volume of 0 comes back as 50%.
- It is a personal utility. It has no store listing and no update channel. You update it with `git pull` and a reload on `chrome://extensions`.

## License

MIT. See [LICENSE](LICENSE).
