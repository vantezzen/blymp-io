<p align="center">
    <a href="https://blymp.io">
      <img src="./icon.png" alt="blymp.io logo" width="250"/>
    </a>
</p>

<h1 align="center">
  blymp.io
</h1>
<h2 align="center" style="margin-bottom:2rem">
  Easily transfer files between devices
</h2>

blymp.io is a webapp that allows you to easily transfer files between devices with high speeds.

It uses modern technologies like WebRTC, Blobs and WebSockets to allow files to be transferred as fast as possible.

You can use blymp.io by going to <https://blymp.io>

- [Quick Start](#quick-start)
- [Folder Structure](#folder-structure)

## Features
- [x] WebRTC file transfer
- [x] PWA
- [x] No registration
- [x] Privacy-oriented
- [x] Open-source
- [x] Automatic lossless compression using zlib
- [x] Developed in Typescript

## Quick Start

```bash
# Clone the repository
git clone https://github.com/vantezzen/blymp-io

# Go inside the directory
cd blymp-io

# Install dependencies
yarn (or npm install)

# Start development server
yarn dev (or npm run dev)
# This will automatically open your browser

# Build for production
yarn build (or npm run build)

# Start production server
yarn start (or npm start)
```

## Folder Structure

All the source code are inside the **src** directory.

Inside src, there is client and server directory. All the frontend code (react, css, js and any other assets) are in the client directory, backend Node.js/Express code are in the server directory.

Additional static assets are stored inside the `public` directory. Files in this folder will be copied over to the dist folder using webpack.

webpack builds production files into the `dist` directory.