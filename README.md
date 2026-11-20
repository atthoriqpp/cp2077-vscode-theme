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

**Effects (`cyberpunk-fx.js`)**
- **Random glitch:** every 15 to 45 seconds one part of the window glitches, with a red and cyan colour split. About 1 in 5 hits the whole window.
- **Tab encounters:** opening, closing or switching a file has a 1 in 3 chance to glitch the editor.
- **Sandevistan trail:** every 2 to 5 minutes your mouse pointer leaves neon afterimages for about 10 seconds.
- **Upload complete:** a HUD panel when a file is saved.
- **Cyberpsychosis warning:** a red warning when the error count goes up.
- **Typing overclock:** typing 7 or more keys in a second tints the current line cyan. It clears half a second after you slow down.
- **Boot sequence:** a short "NEURAL LINK ESTABLISHED" splash when a window loads.
- **Relic malfunction:** a rare full-window glitch every 90 to 150 minutes. Run `cpRelic()` in the developer console to see it now.

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

### 3. Status line and popup (optional)

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
