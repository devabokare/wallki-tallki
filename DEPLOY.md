# SecurePTT Hosting Guide

## 1. Create Deployment ZIP
To create a zip file of this application for transfer to your server:

**Mac / Linux / WSL:**
Run the following command in your terminal:
```bash
npm run bundle
```
This will create `secure-ptt-host.zip` in the project root.

**Windows (PowerShell):**
Select all files in the directory (excluding `node_modules` and `.git`), right-click, and select **Compress to ZIP file**.

## 2. Server Requirements
- **Node.js**: Version 18 or higher.
- **SSL Certificate** (Recommended): Browsers require HTTPS for Microphone access.

## 3. Deployment Steps

1. **Upload**: Upload the ZIP file to your server or VPS.
2. **Extract**: Unzip the file.
3. **Install Dependencies**:
   ```bash
   npm install
   ```
4. **Build the App**:
   Compiles the React frontend into static files.
   ```bash
   npm run build
   ```
5. **Set API Key**:
   Create a `.env` file or set the environment variable.
   ```bash
   export API_KEY="your_gemini_api_key"
   ```
6. **Start the Server**:
   ```bash
   npm start
   ```
   The app will run on `http://localhost:3000`.

## 4. Run in Background (Production)
To keep the app running after you close the terminal, use a process manager like PM2:

```bash
npm install -g pm2
pm2 start server.js --name "secure-ptt"
```

## 5. HTTPS Warning
**Important:** Push-to-Talk functionality requires access to the Microphone. Most modern browsers **block microphone access on non-secure (HTTP)** connections, except for `localhost`.

To use this on a public server, you must serve it over **HTTPS**. You can use a reverse proxy like Nginx with Certbot (Let's Encrypt).
