# Tauri Android APK Verification Design

## Goal

Generate an installable Android APK from the migrated ASCII-only project path and verify the app starts on a connected device or emulator.

## Approach

Use the safe verification path: inspect existing Tauri and package configuration for stale non-ASCII paths or broken Android settings, then run the normal Android build pipeline. Do not refactor UI or app logic unless the build exposes a concrete issue.

## Scope

- Check `package.json`, `src-tauri/tauri.conf.json`, and Android generated config for path-sensitive or missing values.
- Run the frontend build and Tauri Android build.
- Locate the generated APK.
- Install the APK on a connected Android target and launch it if tooling supports it.
- Record any failure in `.wolf/buglog.json` before applying a fix.
- Append progress to `.wolf/memory.md` after significant actions.

## Success Criteria

- APK is generated from the new ASCII-only path.
- APK installs on a connected device or emulator.
- App launches without immediate crash.
- Any required config/documentation fix is minimal and tied to observed build/install output.

## Testing

Run build commands from the migrated repo path. Use Android tooling to list connected targets, install the APK, and verify launch status where possible. If no device/emulator is available, stop after APK generation and report that installation verification is blocked by missing target.
