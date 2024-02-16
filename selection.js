const selectionArea = document.getElementById("selectionArea");
const sizeIndicator = document.getElementById("sizeIndicator");
let startX, startY;

window.onmousedown = (e) => {
  startX = e.clientX;
  startY = e.clientY;
  selectionArea.style.left = `${startX}px`;
  selectionArea.style.top = `${startY}px`;
  selectionArea.style.width = "0px";
  selectionArea.style.height = "0px";
  selectionArea.style.visibility = "visible";
  sizeIndicator.style.display = "none"; // Hide initially
};

window.onmousemove = (e) => {
  if (e.buttons !== 1) return;
  const width = Math.abs(e.clientX - startX);
  const height = Math.abs(e.clientY - startY);
  selectionArea.style.width = `${width}px`;
  selectionArea.style.height = `${height}px`;
  selectionArea.style.left = `${Math.min(startX, e.clientX)}px`;
  selectionArea.style.top = `${Math.min(startY, e.clientY)}px`;

  // Update and show size indicator
  sizeIndicator.textContent = `${width} x ${height}`;
  sizeIndicator.style.display = "block";
  sizeIndicator.style.left = `${Math.min(startX, e.clientX) + width + 5}px`; // Position to the right of the selection
  sizeIndicator.style.top = `${Math.min(startY, e.clientY) + height + 5}px`; // Position below the selection
};

window.onmouseup = (e) => {
  const rect = {
    x: Math.min(startX, e.clientX),
    y: Math.min(startY, e.clientY),
    width: Math.abs(e.clientX - startX),
    height: Math.abs(e.clientY - startY),
  };
  window.api.sendSelectedArea(rect);
  selectionArea.style.visibility = "hidden";
  sizeIndicator.style.display = "none"; // Hide size indicator
  startX = startY = null; // Reset starting coordinates
};
