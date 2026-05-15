# Tauri Android APK Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate an installable Android APK from the migrated ASCII-only repo path and verify it installs and launches on Android.

**Architecture:** This is a verification workflow, not a feature change. Inspect Tauri/package configuration for stale non-ASCII paths, run existing build commands, locate the APK, install it on a connected Android target, and only edit files if observed command output proves a config or documentation fix is needed.

**Tech Stack:** Vue + Vite frontend, Tauri 2, Tauri Android plugin/tooling, npm scripts, Android SDK/ADB, Gradle.

---

## File Structure

- Inspect: `package.json` — npm scripts and Tauri dependency commands.
- Inspect: `src-tauri/tauri.conf.json` — app identifier, build settings, bundle settings.
- Inspect: `src-tauri/gen/android/` — generated Android project, output APK location after build.
- Modify only if needed: `README.md` — Android packaging instructions if build/install confirms changed workflow.
- Modify only if failure occurs: `.wolf/buglog.json` — append structured bug record for build/install errors and fixes.
- Modify after significant actions: `.wolf/memory.md` — append OpenWolf progress entries.
- Modify because new files were created: `.wolf/anatomy.md` — add entries for spec/plan docs if missing.

---

### Task 1: Inspect packaging configuration

**Files:**
- Inspect: `package.json`
- Inspect: `src-tauri/tauri.conf.json`
- Inspect: `src-tauri/gen/android/`
- Modify: `.wolf/memory.md`

- [ ] **Step 1: Check current Git state**

Run:
```bash
git status --short
```
Expected: Existing user changes visible, including `README.md`, `package.json`, `src-tauri/gen/`, and docs created for this workflow. Do not discard or overwrite unrelated changes.

- [ ] **Step 2: Inspect npm scripts**

Read `package.json`. Confirm Android build script exists or identify exact command to use. Expected relevant command shape:
```json
{
  "scripts": {
    "tauri:android:build": "tauri android build"
  }
}
```
If script name differs, use existing script. Do not rename scripts unless build output requires it.

- [ ] **Step 3: Inspect Tauri config**

Read `src-tauri/tauri.conf.json`. Confirm these values are valid and no old Chinese path appears:
```json
{
  "identifier": "com.yansi.schedule",
  "build": {
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  }
}
```
Expected: No absolute path containing old Chinese directory. If an absolute stale path appears, record it before editing.

- [ ] **Step 4: Search generated Android config for old path**

Run:
```bash
git grep -n "桌面\|Azhuomian\|D:" -- src-tauri/gen package.json src-tauri/tauri.conf.json README.md
```
Expected: No old Chinese path references that affect build. README may mention example paths; do not edit docs unless stale path would mislead packaging.

- [ ] **Step 5: Log action to OpenWolf memory**

Append one line to `.wolf/memory.md`:
```markdown
| HH:MM | inspected Tauri Android packaging config after ASCII path migration | package.json, src-tauri/tauri.conf.json, src-tauri/gen/android | ready for build or identified config issue | ~tokens |
```
Use current local time for `HH:MM`.

---

### Task 2: Run Android build and locate APK

**Files:**
- Read/execute project config from: `package.json`
- Generated output under: `src-tauri/gen/android/app/build/outputs/apk/`
- Modify on failure: `.wolf/buglog.json`
- Modify: `.wolf/memory.md`

- [ ] **Step 1: Run frontend build first**

Run:
```bash
npm run build
```
Expected: Vite build succeeds and creates `dist/`. If it fails, stop, append bug to `.wolf/buglog.json`, fix only the reported issue, then rerun this step.

- [ ] **Step 2: Run Tauri Android build**

Run whichever command exists from Task 1. Preferred:
```bash
npm run tauri:android:build
```
Fallback if no script exists:
```bash
npx tauri android build
```
Expected: Gradle/Tauri build completes without the previous Chinese-path lock error.

- [ ] **Step 3: If build fails, log before fixing**

Append a bug object to `.wolf/buglog.json` using next id after `bug-058`:
```json
{
  "id": "bug-059",
  "timestamp": "2026-05-13T<current-time>",
  "error_message": "<exact command failure output>",
  "file": "<file or generated Android area involved>",
  "root_cause": "<cause proven by command output>",
  "fix": "<change made, or blocked if no fix applied>",
  "tags": ["tauri", "android", "build"],
  "related_bugs": ["bug-058"],
  "occurrences": 1,
  "last_seen": "2026-05-13T<current-time>"
}
```
Then apply minimal fix and rerun Step 1 or Step 2 as appropriate.

- [ ] **Step 4: Locate APK output**

Run:
```bash
ls src-tauri/gen/android/app/build/outputs/apk
```
Then inspect subdirectories, commonly:
```bash
ls src-tauri/gen/android/app/build/outputs/apk/universal/release
ls src-tauri/gen/android/app/build/outputs/apk/release
ls src-tauri/gen/android/app/build/outputs/apk/debug
```
Expected: At least one `.apk` file exists. Record exact path.

- [ ] **Step 5: Log build result to OpenWolf memory**

Append one line to `.wolf/memory.md`:
```markdown
| HH:MM | built Tauri Android APK from ASCII path | src-tauri/gen/android/app/build/outputs/apk | APK generated at <exact-apk-path> or build blocked by <reason> | ~tokens |
```

---

### Task 3: Install and launch APK on Android target

**Files:**
- APK from Task 2
- Modify on failure: `.wolf/buglog.json`
- Modify: `.wolf/memory.md`

- [ ] **Step 1: List connected Android targets**

Run:
```bash
adb devices
```
Expected: One target listed as `device`. If no device/emulator is listed, stop APK installation verification and report blocker. Do not claim install success.

- [ ] **Step 2: Install APK**

Run with exact APK path from Task 2:
```bash
adb install -r "<exact-apk-path>"
```
Expected: Output includes:
```text
Success
```
If install fails, append bug to `.wolf/buglog.json` with exact error and fix only proven issue.

- [ ] **Step 3: Launch app package**

Run:
```bash
adb shell monkey -p com.yansi.schedule 1
```
Expected: Monkey reports one event injected and app opens on device/emulator. If package name differs, use identifier observed in `src-tauri/tauri.conf.json` and Android manifest.

- [ ] **Step 4: Check recent crash output if launch fails**

Run:
```bash
adb logcat -d -t 200
```
Expected: No immediate fatal crash for `com.yansi.schedule`. If crash appears, append bug with exact fatal exception and fix only proven issue.

- [ ] **Step 5: Log install/launch result to OpenWolf memory**

Append one line to `.wolf/memory.md`:
```markdown
| HH:MM | verified APK install and launch | <exact-apk-path>, Android target | installed and launched com.yansi.schedule or blocked by <reason> | ~tokens |
```

---

### Task 4: Update docs/anatomy only if needed and summarize evidence

**Files:**
- Modify if workflow changed: `README.md`
- Modify because docs were created: `.wolf/anatomy.md`
- Modify: `.wolf/memory.md`

- [ ] **Step 1: Decide whether README needs change**

If build/install commands used match README, do not edit README. If README still references old path or wrong command, edit only relevant Android packaging section with exact working command:
```markdown
npm run tauri:android:build
adb install -r "src-tauri/gen/android/app/build/outputs/apk/<variant>/<name>.apk"
adb shell monkey -p com.yansi.schedule 1
```

- [ ] **Step 2: Update anatomy for created docs**

Add entries if absent:
```markdown
## docs/superpowers/specs/

- `2026-05-13-tauri-android-apk-verification-design.md` — Design for Tauri Android APK generation and device verification (~250 tok)

## docs/superpowers/plans/

- `2026-05-13-tauri-android-apk-verification.md` — Plan for Tauri Android APK build, install, and launch verification (~1700 tok)
```

- [ ] **Step 3: Log final workflow result**

Append one line to `.wolf/memory.md`:
```markdown
| HH:MM | completed Tauri Android APK verification workflow | README.md, .wolf/anatomy.md, .wolf/memory.md | success evidence recorded or blocker reported | ~tokens |
```

- [ ] **Step 4: Report concise evidence**

Final response must include:
```text
APK: <exact path or blocked>
Install: <Success or blocked/error>
Launch: <Success or blocked/error>
Changed files: <list>
```
Do not say complete unless build/install/launch evidence exists, or clearly say which step is blocked.
