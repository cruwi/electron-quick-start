/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */

console.log("Renderer script is loaded");
ipcRenderer.on("display-captured-image", (dataUrl) => {
  const canvas = document.getElementById("imageCanvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();

  img.onload = () => {
    // Set canvas size to the image size
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw the image onto the canvas
    ctx.drawImage(img, 0, 0);

    // Optionally, resize the canvas to fit a particular area, maintaining the aspect ratio
    const maxWidth = 800; // Example: set a max width for the canvas
    const maxHeight = 600; // Example: set a max height for the canvas
    let scaleRatio = Math.min(maxWidth / img.width, maxHeight / img.height);

    canvas.style.width = img.width * scaleRatio + "px";
    canvas.style.height = img.height * scaleRatio + "px";
  };

  img.src = dataUrl; // Set the source of the image to the data URL
});
