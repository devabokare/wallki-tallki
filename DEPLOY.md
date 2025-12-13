# SecurePTT Deployment Guide

## 1. Web Deployment (The Core)

This Node.js server serves the React Frontend and the Downloadable Native Clients.

### Build & Run
1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Build Frontend**:
    *You must provide your Gemini API Key during the build process.*
    ```bash
    export API_KEY="your_actual_api_key_here"
    npm run build
    ```
    *(On Windows PowerShell: `$env:API_KEY="key"; npm run build`)*

3.  **Start Server**:
    ```bash
    npm start
    ```
    The app is now live at `http://localhost:3000`.

### Hosting (VPS / Cloud)
1.  Run `npm run bundle`.
2.  Upload `secure-ptt-host.zip` to your server.
3.  Unzip, install dependencies, build with API key, and start (use PM2 for persistence).
4.  **Important**: You must use HTTPS (SSL) for Microphone access to work on the web.

---

## 2. Native Mobile Client (Android)

Once your Web App is deployed (e.g., at `https://my-secure-ptt.com`), you can build the mobile app.

1.  **Update URL**:
    Edit `mobile/lib/main.dart` and change `_appUrl` to your deployed HTTPS URL.

2.  **Build APK**:
    ```bash
    cd mobile
    flutter build apk --release
    ```

3.  **Host the File**:
    Copy `mobile/build/app/outputs/flutter-apk/app-release.apk` to the root `downloads/` folder and rename it to `secure-ptt.apk`.

---

## 3. Native Desktop Client (Windows)

1.  **Update URL**:
    Edit `electron/main.cjs` and change `APP_URL` to your deployed HTTPS URL.

2.  **Build EXE**:
    ```bash
    cd electron
    npm install
    npm run dist
    ```

3.  **Host the File**:
    Copy the `.exe` file from `electron/dist/` to the root `downloads/` folder and rename it to `secure-ptt-setup.exe`.

---

## 4. Verification

1.  Restart the Node server.
2.  Go to **Settings** in the web app.
3.  Click the **Native Client Downloads** buttons.
4.  Ensure the files download correctly.
