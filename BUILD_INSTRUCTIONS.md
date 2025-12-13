# Building Native Clients for SecurePTT

This guide explains how to build the Android APK and Windows EXE files and host them on your server so users can download them from the App Settings.

## 1. Prerequisites

*   **Node.js**: Installed.
*   **Flutter SDK**: Installed (for Android build).
*   **Android Studio**: Setup with SDK (for Android build).

---

## 2. Build Android APK (Mobile)

We use the Flutter wrapper located in the `mobile/` directory.

1.  **Configure URL**:
    Open `mobile/lib/main.dart` and ensure `_appUrl` points to your deployed server (e.g., `https://your-domain.com`).

2.  **Build**:
    Open a terminal in the `mobile/` directory:
    ```bash
    cd mobile
    flutter build apk --release
    ```

3.  **Locate File**:
    The built APK will be at: `mobile/build/app/outputs/flutter-apk/app-release.apk`

4.  **Deploy**:
    Create a `downloads` folder in your project root (same level as `server.js`).
    Copy `app-release.apk` to `downloads/` and rename it to `secure-ptt.apk`.

---

## 3. Build Windows EXE (Desktop)

We use the Electron wrapper located in the `electron/` directory.

1.  **Configure URL**:
    Open `electron/main.cjs` and set `APP_URL` to your deployed server URL.

2.  **Install Dependencies**:
    Open a terminal in the `electron/` directory:
    ```bash
    cd electron
    npm install
    ```

3.  **Build**:
    Run the build script:
    ```bash
    npm run dist
    ```

4.  **Locate File**:
    The installer EXE will be in the `electron/dist/` folder (e.g., `SecurePTT Setup 1.0.0.exe`).

5.  **Deploy**:
    Copy the `.exe` file to your root `downloads/` folder and rename it to `secure-ptt-setup.exe`.

---

## 4. Final Verification

1.  Ensure your server directory looks like this:
    ```
    /project-root
      /downloads
         secure-ptt.apk
         secure-ptt-setup.exe
      /dist
      server.js
      ...
    ```

2.  Restart your server (`npm start`).
3.  Open the App -> Settings -> "Native Client Downloads".
4.  Click the buttons to verify downloads work.
