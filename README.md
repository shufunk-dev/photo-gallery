# Photo Gallery

A fast, fully-featured, cross-platform local photo gallery and organizer built with Node.js and Vanilla JS/CSS. 

This application allows you to view your photos by reading your local folder structure with support for unlimited folder nesting. It features powerful organization tools like drag-and-drop, UI file uploading, and offline AI facial recognition.

## Features
- **Unlimited Folder Nesting**: Create as many folders and sub-folders as you want to organize your photos perfectly (e.g., `Vacation/2026/Hawaii/Beach`).
- **Drag and Drop Organization**: Seamlessly drag folders into other folders, or drag individual (and batched) photos directly into folders to instantly reorganize your files on disk.
- **Direct UI Uploading**: Upload photos directly into any folder directly from the web interface.
- **AI Facial Recognition**: Scan your local gallery to detect and cluster identical faces automatically. Runs 100% offline via WebGL graphics acceleration.
- **Edit Mode & Batch Actions**: Select multiple photos at once to mass move or delete them.
- **Cross-Platform**: Works natively on Windows, macOS, and Linux with dedicated one-click startup scripts.
- **Premium UI**: Dark mode, smooth CSS micro-animations, and a beautiful Lightbox for viewing photos.
- **Auto-Updating**: The startup scripts automatically check GitHub for updates and install new dependencies every time you launch the app.

## Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.

## Setup & Running
1. Clone this repository to your local machine.
2. Start the server using the provided scripts (they will automatically install required dependencies like `express` and `multer` for you):
   - **Windows:** Double-click `start_gallery.bat`.
   - **macOS:** Double-click `start_gallery.command` (you may need to run `chmod +x start_gallery.command` first).
   - **Linux:** Run `./start_gallery.sh` from the terminal (you may need to run `chmod +x start_gallery.sh` first).
3. Open your web browser and navigate to `http://localhost:3000`.

## Adding & Organizing Photos
Drop your images (JPG, PNG, GIF, WEBP) anywhere into the `photos/` directory, or use the **Upload Photos** button in the app.
- You can create new folders and reorganize your photos directly from the web interface using drag-and-drop or the **Edit** button.
- The sidebar will automatically indent and map your entire nested folder structure!
