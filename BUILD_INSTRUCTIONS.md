# Building Native Clients for SecurePTT

This guide explains how to build the Android APK and Windows EXE files and host them on your server so users can download them directly from the App Settings menu.

## 1. Prerequisites

*   **Node.js**: Installed (for the server).
*   **Flutter SDK**: Installed (for Android build).
*   **Android Studio**: Setup with SDK (for Android build).

---

## 2. Build Android APK (Mobile)

We use the Flutter wrapper located in the `mobile/` directory.

### Step A: Configure URL
1.  Open `mobile/lib/main.dart`.
2.  Locate the `_appUrl` variable.
3.  Change it to your **deployed HTTPS server URL** (e.g., `https://your-app.com`).
    *   *Note: If testing locally on Android Emulator, keep it as `http://10.0.2.2:3000`.*

### Step B: Setup Permissions (One Time)
Ensure `mobile/android/app/src/main/AndroidManifest.xml` includes these permissions before the `<application>` tag:
```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

### Step C: Build the APK
1.  Open a terminal in the `mobile/` directory.
2.  Run the build command:
    ```bash
    flutter build apk --release
    ```

### Step D: Host the File
1.  The build process creates the file at:
    `mobile/build/app/outputs/flutter-apk/app-release.apk`
2.  Create a folder named `downloads` in your project's root directory (next to `server.js`).
3.  Copy `app-release.apk` into that folder.
4.  **Rename** it to `secure-ptt.apk`.

---

## 3. Build Windows EXE (Desktop)

We use the Electron wrapper located in the `electron/` directory.

### Step A: Configure URL
1.  Open `electron/main.cjs`.
2.  Set `APP_URL` to your deployed server URL.

### Step B: Build
1.  Open a terminal in the `electron/` directory.
2.  Run:
    ```bash
    npm install
    npm run dist
    ```

### Step C: Host the File
1.  The installer EXE will be in `electron/dist/` (e.g., `SecurePTT Setup 1.0.0.exe`).
2.  Copy it to the root `downloads/` folder.
3.  **Rename** it to `secure-ptt-setup.exe`.

---

## 4. Final Verification

1.  Your server directory should look like this:
    ```
    /project-root
      /downloads
         secure-ptt.apk
         secure-ptt-setup.exe
      /dist
      server.js
      ...
    ```

2.  Restart your server:
    ```bash
    npm start
    ```

3.  Open the App in your browser.
4.  Go to **Settings** -> **Native Client Downloads**.
5.  Click the Android or Windows button. The file should download immediately.
