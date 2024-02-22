/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */

console.log("Renderer script is loaded");

// Add a reference to the image on the canvas
let canvasImage = null;

const canvas = new fabric.Canvas("imageCanvas", {
  width: 800,
  height: 450,
});

// Function to delete the selected object from the canvas
function deleteSelectedObject() {
  const activeObject = canvas.getActiveObject();
  if (activeObject) {
    canvas.remove(activeObject);
    canvasImage = null; // Clear the reference if it was the image
  }
}

// Function to download the canvas as an image
function downloadCanvas() {
  // Trigger the download
  const dataURL = canvas.toDataURL({
    format: "png",
    quality: 1,
  });
  const link = document.createElement("a");
  link.download = "screenshot.png";
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Function to set the background color of the canvas
function setBackgroundColor(color) {
  canvas.backgroundColor = color;
  canvas.renderAll();
}

// Event listener for background color change
document
  .getElementById("background-color-picker")
  .addEventListener("change", function (event) {
    setBackgroundColor(event.target.value);
  });

// Event listener for the download button
document
  .getElementById("download-btn")
  .addEventListener("click", downloadCanvas);

// Event listener for keydown to listen for the delete key
document.addEventListener("keydown", function (event) {
  if (event.key === "Backspace") {
    deleteSelectedObject();
    canvas.discardActiveObject(); // Clear the selection
    canvas.requestRenderAll(); // Re-render the canvas
  }
});

ipcRenderer.on("display-captured-image", (dataUrl) => {
  // Play the screenshot sound
  const screenshotSound = new Audio("iphone-screenshot.mp3");
  screenshotSound
    .play()
    .catch((err) => console.error("Error playing sound:", err));

  // Define the desired border radius
  const borderRadius = 20; // Example border radius value

  // Create an off-screen canvas
  const offScreenCanvas = document.createElement("canvas");
  const ctx = offScreenCanvas.getContext("2d");

  // Load the image
  const img = new Image();
  img.crossOrigin = "Anonymous"; // Use this if you're loading an image from a different origin
  img.onload = function () {
    // Set the off-screen canvas dimensions to match the image
    offScreenCanvas.width = img.width;
    offScreenCanvas.height = img.height;

    // Prepare the clipping path with border radius
    ctx.beginPath();
    ctx.moveTo(borderRadius, 0);
    ctx.lineTo(img.width - borderRadius, 0);
    ctx.quadraticCurveTo(img.width, 0, img.width, borderRadius);
    ctx.lineTo(img.width, img.height - borderRadius);
    ctx.quadraticCurveTo(
      img.width,
      img.height,
      img.width - borderRadius,
      img.height
    );
    ctx.lineTo(borderRadius, img.height);
    ctx.quadraticCurveTo(0, img.height, 0, img.height - borderRadius);
    ctx.lineTo(0, borderRadius);
    ctx.quadraticCurveTo(0, 0, borderRadius, 0);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, 0, 0);

    // Use the modified image as a data URL
    const dataUrl = offScreenCanvas.toDataURL("image/png");

    // Load the modified image onto the Fabric.js canvas
    fabric.Image.fromURL(dataUrl, function (fabricImg) {
      // Optional: Define margins and calculate scale here if desired

      fabricImg.set({
        left: canvas.width / 2,
        top: canvas.height / 2,
        originX: "center",
        originY: "center",
        // Apply scale and positioning as needed
      });

      // Disable non-corner controls
      fabricImg.setControlsVisibility({
        mt: false, // Middle top disable
        mb: false, // Middle bottom disable
        ml: false, // Middle left disable
        mr: false, // Middle right disable
      });

      canvas.clear();
      canvas.add(fabricImg);
      canvasImage = fabricImg; // Update reference to the new image
      canvas.renderAll();
    });
  };

  // Append a timestamp to make the URL unique and bypass caching
  img.src = dataUrl + "?t=" + new Date().getTime();
});
