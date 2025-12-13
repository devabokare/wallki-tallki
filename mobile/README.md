# SecurePTT Mobile Wrapper

This directory contains the Flutter code to wrap the SecurePTT React application into a native Android/iOS app.

## Prerequisites

1.  **Flutter SDK**: Installed and configured ([flutter.dev](https://flutter.dev)).
2.  **Deployed Web App**: Your React app must be running (either locally or deployed to a URL like Vercel/Netlify).

## Configuration

1.  Open `lib/main.dart`.
2.  Locate the `_appUrl` variable.
3.  Update it to your hosted URL:
    ```dart
    final String _appUrl = 'https://your-secure-ptt-app.com';
    ```
    *Note: If testing on Android Emulator with a locally running server, use `http://10.0.2.2:3000`.*

## Native Permissions Setup

### Android (`android/app/src/main/AndroidManifest.xml`)
Ensure these permissions are added before the `<application>` tag:
```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.CAMERA" />
```

### iOS (`ios/Runner/Info.plist`)
Add these keys to enable permissions:
```xml
<key>NSMicrophoneUsageDescription</key>
<string>We need access to the microphone for Push-to-Talk communication.</string>
<key>NSCameraUsageDescription</key>
<string>We need access to the camera for profile photos.</string>
```

## Running the App

1.  Navigate to the mobile directory:
    ```bash
    cd mobile
    ```
2.  Get dependencies:
    ```bash
    flutter pub get
    ```
3.  Run on connected device/emulator:
    ```bash
    flutter run
    ```

## Build for Release

**Android (APK/Bundle):**
```bash
flutter build apk --release
```

**iOS (IPA):**
```bash
flutter build ipa --release
```
