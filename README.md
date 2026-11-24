# cp2077-vscode-theme

A Cyberpunk 2077 / Edgerunners look for VS Code and the Claude Code CLI on Windows. Yellow, cyan and red on near-black, HUD corner cuts, and small effects that react to what you do: saving a file, typing fast, breaking the build, or waiting on Claude.

This is a fan project. It is not affiliated with or endorsed by CD Projekt Red. It uses no game art, only colours, fonts and CSS.

## What you get

**Theme (settings only)**
- Full colour set: black chrome, yellow accents, cyan strings and links, red errors, magenta numbers.
- Block cursor with smooth caret, bracket pair colours, semantic token colours.

**Skin (`cyberpunk2077.css`)**
- HUD corner cuts on the sidebar, auxiliary bar and panel.
- A faint cyan grid behind the editor text (4% opacity).
- Terminal scanlines.
- A glitch on the window title when you hover it.
- A `// QUICKHACK` header on the Command Palette and other quick inputs.
- Address labels: `//` on sidebar section headers, a `ROOT//` breadcrumb start and `NODE://` before the git branch.
- A short cyan edge flash when focus moves between the editor, terminal and sidebar.
- A faint `NIGHT CITY OS` watermark behind the code, bottom right, with two short glitch bursts every 8 seconds. It freezes while Claude is busy.
- Selections in yellow with an outline, and every other match of the selected text in cyan with an underline, so a partial pick like `SEL` in `SELECT` is easy to spot.
- Notification pop-ups get a yellow edge and a `// INCOMING MESSAGE` header. Hover tooltips get a cyan edge and a scan line that sweeps once as they open.

**Effects (`cyberpunk-fx.js`)**
- **Random glitch:** every 15 to 45 seconds one part of the window glitches, with a red and cyan colour split. About 1 in 5 hits the whole window.
- **Tab encounters:** opening, closing or switching a file has a 1 in 3 chance to glitch the editor.
- **Sandevistan trail:** every 2 to 5 minutes your mouse pointer leaves neon afterimages for about 10 seconds.
- **Upload complete:** a HUD panel when a file is saved.
- **Cyberpsychosis warning:** a red warning when the error count goes up.
- **Typing overclock:** typing 7 or more keys in a second tints the current line cyan. It clears half a second after you slow down.
- **Boot sequence:** a short "NEURAL LINK ESTABLISHED" splash when a window loads.
- **Relic malfunction:** a rare full-window glitch every 90 to 150 minutes. Run `cpRelic()` in the developer console to see it now.
- **Humanity drift:** the window has an instability level from 0 to 3. It rises with time worked without a 5 minute break (30, 60 and 90 minutes) and with the error count (any error is level 1, 5 or more is level 2). A red edge breathes faster as it climbs, glitches come more often, and level 3 adds red and cyan fringes on the code. Run `cpStage(3)` to hold a level for 30 seconds.
- **Target lock:** a cursor jump of more than 15 lines snaps cyan brackets onto the new line. It reads the `Ln` number from the status bar, so it expects the English UI.
- **Data rain:** glyphs fall over an empty editor. After 3 minutes idle they cover the whole editor with a `NEURAL LINK IDLE` tag until you touch a key or the mouse.
- **City rain:** faint cyan streaks over the editor, denser at night by your clock. `cpRain(false)` turns it off for good and `cpRain(true)` brings it back.
- **Neon flicker:** now and then the title or the active tab label stutters like a failing neon sign.
- **Link restored:** coming back to the window after 3 seconds or more away sweeps a thin cyan bar across the top.
- **Scanner chatter:** every 1.5 to 4 minutes a short NCPD dispatch shows bottom left, with a case number, unit and priority. Categories include assault, reported crime, organized crime, cyberpsycho, suspicious activity, traffic and public disturbance. Districts follow the Night City map and the sentences are original. At instability level 2 or higher many become cyberpsycho sightings. The card fades out with a short glitch. Run `cpScan()` to see one now.
- **Character lines:** 36 short original lines credited to Night City archetypes. One shows under the boot splash, one rotates on the idle screen, and one changes every 30 seconds in the status bar gap. Run `cpTick()` to change the status bar one now.

**Claude Code extras**
- **Heartbeat:** while Claude is working, the terminal border pulses a faint red lub-dub with a rare cyan flick. It is off when Claude is idle.
- **Turn-done sweep:** one cyan scan line crosses the terminal when Claude's turn ends, or when you press Esc to interrupt it.
- **Status line:** context size, growth since the last turn, and plan usage limits when Claude Code reports them.
- **Holo popup:** a Cyberpunk-styled popup when Claude stops or asks for attention.

## Install

### 1. Theme and skin

1. Install the extension **Custom CSS and JS Loader** (`be5invis.vscode-custom-css`).
2. Copy `vscode/cyberpunk2077.css` and `vscode/cyberpunk-fx.js` into your VS Code user folder, `%APPDATA%\Code\User\`.
3. Merge `vscode/settings.cyberpunk.jsonc` into your `settings.json`. Change the two `file:///` paths in `vscode_custom_css.imports` to your own user folder.
4. Open the Command Palette and run **Enable Custom CSS and JS**, then restart VS Code. If VS Code was installed for all users, start it as administrator for this step.
5. VS Code will warn that your installation is "corrupt". That is the loader patching `workbench.html`. Choose "Don't show again".
6. Optional fonts: Share Tech Mono, Rajdhani and Cascadia Code. Without them the fallbacks are Consolas and Bahnschrift.

After you edit the CSS or JS, run **Reload Custom CSS and JS** and restart VS Code.

### 2. Claude Code heartbeat and sweep (optional)

The effects JS runs in a sandbox with no file access, so it cannot see Claude's state directly. A hook, a tiny extension and the page pass the signal along:

```
Claude Code hook -> ~/.claude/.cc-busy file -> cc-busy-bridge extension -> hidden status bar item -> cyberpunk-fx.js -> CSS
```

1. Copy `claude-code/hooks/cc-busy.ps1` to `~/.claude/hooks/`.
2. Copy `extensions/cc-busy-bridge/` to `~/.vscode/extensions/cc-busy-bridge/`.
3. Add the hooks from `claude-code/settings.hooks.example.json` to `~/.claude/settings.json`. Replace `YOUR_NAME` with your user name. `UserPromptSubmit` writes the flag, `Stop` deletes it.
4. Restart VS Code.

The flag is a plain text file. The extension ignores a flag older than 10 minutes, in case a turn ended without the Stop hook running.

### 3. Status bar HUD (optional)

Copy `extensions/nc-district/` to `~/.vscode/extensions/nc-district/` and restart VS Code. Three items appear in the status bar:

- `DISTRICT // <NAME>`: one of the six Night City districts, picked from your open folder's name. With no folder open it shows Badlands.
- `REC hh:mm:ss`: how long Claude has worked for you today. It counts only while Claude is busy, so it needs the hook from step 2. The dot pulses while it counts. It resets each day.
- `CRED LV n`: street cred. XP comes from finished Claude turns (40 plus 1 per 3 seconds, up to 120), saves (10) and typing (0.2 per key). Level n needs 200 x n x (n - 1) XP. A level-up shows as a notification.

The extension only reads the flag file and your editor events, and keeps its numbers in VS Code's own storage. It sends nothing anywhere.

### 4. Status line and popup (optional)

Copy the other three files in `claude-code/hooks/` next to `cc-busy.ps1`, then use the `statusLine` and `Stop` or `Notification` entries from the example settings file. The popup uses WPF, so it is Windows only.

## Tuning

- Colours: the `--cp-yellow`, `--cp-cyan`, `--cp-red` variables at the top of the CSS, and the `workbench.colorCustomizations` block in the settings file.
- Corner cut size: `--cp-cut` and the `clip-path` rules for the sidebar and panel.
- Effect timing: the constants at the top of each block in `cyberpunk-fx.js` (`CHANCE`, `NEED`, `COOLDOWN` and the interval lengths).
- Grid wallpaper strength: the `4%` in the `.overflow-guard::before` rule.

## Notes

- This patches VS Code's own files. A VS Code update can undo it. Run **Enable Custom CSS and JS** again after an update.
- It is unsupported by VS Code. If something looks broken, run **Disable Custom CSS and JS** and restart.
- The hook scripts only read, write and delete plain files. They avoid low-level Windows calls on purpose, because some corporate antivirus tools quarantine those.

## Undo

Run **Disable Custom CSS and JS**, restart VS Code, and remove the block you merged into `settings.json`. Delete `~/.vscode/extensions/cc-busy-bridge/` and the Claude Code hook entries to remove the extras.
