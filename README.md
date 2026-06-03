# Simple Local Photo Gallery

A fast, fully-featured, cross-platform local photo gallery and organizer built with Node.js and Vanilla JS/CSS. 

This application allows you to view your photos by reading your local folder structure, and it features an "Edit Mode" that lets you create new categories, batch move, and batch delete photos seamlessly.

## Features
- **Dynamic File Reading**: Automatically reads your folder structure to categorize photos into Categories and Subcategories.
- **Edit Mode & Batch Actions**: Select multiple photos at once to mass move or delete them.
- **Cross-Platform**: Works natively on Windows, macOS, and Linux.
- **Premium UI**: Dark mode, smooth CSS micro-animations, and a beautiful Lightbox for viewing photos.
- **Auto-Updating**: The startup script automatically checks GitHub for updates and installs new dependencies every time you launch the app.

## Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.

## Setup & Running
1. Clone this repository to your local machine.
2. Open a terminal in the project folder and run `npm install` to install the required `express` package.
3. Start the server:
   - **Windows:** Double-click the `start_gallery.bat` file.
   - **macOS/Linux:** Open a terminal in the directory and run `node server.js`.
4. Open your web browser and navigate to `http://localhost:3000`.

## Adding & Organizing Photos
Drop your images (JPG, PNG, GIF, WEBP) into the `photos/` directory. 
- Top-level folders become **Categories**.
- Folders inside those become **Subcategories**.
- You can also create new categories and reorganize your photos directly from the web interface using the **Edit** button!
