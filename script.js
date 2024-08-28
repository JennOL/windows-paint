// CONSTANTS
const MODES = {
  DRAW: "draw",
  ERASE: "erase",
  RECTANGLE: "rectangle",
  ELLIPSIS: "ellipsis",
  PICKER: "picker",
};

// UTILITIES
const $ = (el) => document.querySelector(el);
const $$ = (el) => document.querySelectorAll(el);

// ELEMENTS
const $canvas = $("#canva_to_draw");
const $colorPicker = $("#color-picker");
const $clearBtn = $("#clear-btn");
const $drawBtn = $("#draw-btn");
const $rectangleBtn = $("#rectangle-btn");
const $eraseBtn = $("#erase-btn");
const $pickerBtn = $("#picker-btn");

const ctx = $canvas.getContext("2d");

// STATE
let isDrawing = false;
let startX, startY;
let lastX = 0;
let lastY = 0;
let mode = MODES.DRAW;
let imageData;
let isShiftPressed = false;

// EVENTS
$canvas.addEventListener("mousedown", startDrawing);
$canvas.addEventListener("mousemove", draw);
$canvas.addEventListener("mouseup", stopDrawing);
$canvas.addEventListener("mouseleave", stopDrawing);

$colorPicker.addEventListener("change", handleChangeColor);
$clearBtn.addEventListener("click", clearCanvas);

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);

$rectangleBtn.addEventListener("click", () => {
  setMode(MODES.RECTANGLE);
});

$drawBtn.addEventListener("click", () => {
  setMode(MODES.DRAW);
});

$eraseBtn.addEventListener("click", () => {
  setMode(MODES.ERASE);
});

$pickerBtn.addEventListener("click", () => {
  setMode(MODES.PICKER);
});

// METHODS
function startDrawing(event) {
  isDrawing = true;
  const { offsetX, offsetY } = event;

  //guardar las coordenadas iniciales
  [startX, startY] = [offsetX, offsetY];
  [lastX, lastY] = [offsetX, offsetY];

  imageData = ctx.getImageData(0, 0, $canvas.width, $canvas.height);
}

function draw(event) {
  if (!isDrawing) return;

  const { offsetX, offsetY } = event;

  if (mode === MODES.DRAW || mode === MODES.ERASE) {
    // comenzar un trazado
    ctx.beginPath();

    // mover el trazado a las coordenadas actuales
    ctx.moveTo(lastX, lastY);

    // dibujar una linea entre coordenads actuales y las nuevas
    ctx.lineTo(offsetX, offsetY);

    ctx.stroke();

    // actualizar las ultimas coordenadas
    [lastX, lastY] = [offsetX, offsetY];

    return;
  }

  if (mode === MODES.RECTANGLE) {
    ctx.putImageData(imageData, 0, 0);

    // startX -> coordenada inicial de
    let width = offsetX - startX;
    let height = offsetY - startY;

    if (isShiftPressed) {
      const sideLength = Math.min(Math.abs(width), Math.abs(height));

      width = width > 0 ? sideLength : -sideLength;
      height = height > 0 ? sideLength : -sideLength;
    }

    ctx.beginPath();
    ctx.rect(startX, startY, width, height);
    ctx.stroke();

    return;
  }
}

function stopDrawing() {
  isDrawing = false;
}

function handleChangeColor() {
  const { value } = $colorPicker;
  ctx.strokeStyle = value;
}

function clearCanvas() {
  // tambien ayuda a limpiar parte del canvas
  // con las herramienta de seleccion
  $clearBtn.classList.add("active");
  ctx.clearRect(0, 0, $canvas.width, $canvas.height);
}

async function setMode(newMode) {
  mode = newMode;

  // para limpiar el boton activo actual
  $("button.active")?.classList.remove("active");

  if (mode === MODES.DRAW) {
    $drawBtn.classList.add("active");
    $canvas.style.cursor = "crosshair";
    ctx.globalCompositeOperation = "source-over";
    ctx.lineWidth = 2;
    return;
  }

  if (mode === MODES.RECTANGLE) {
    $rectangleBtn.classList.add("active");
    $canvas.style.cursor = "nw_resize";
    ctx.globalCompositeOperation = "source-over";
    ctx.lineWidth = 2;
    return;
  }

  if (mode === MODES.ERASE) {
    $eraseBtn.classList.add("active");
    $canvas.style.cursor = 'url("icons/eraser_cursor.png") 0 24, default';
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = 20;
    return;
  }

  if (mode === MODES.PICKER) {
    $pickerBtn.classList.add("active");
    const eyeDropper = new window.EyeDropper();

    try {
      const result = await eyeDropper.open();

      const { sRGBHex } = result;

      ctx.strokeStyle = sRGBHex;
      $colorPicker.value = sRGBHex;

      setMode(previous_mode);
    } catch (error) {
      // si ha habido un error o el usuario no ha recuperado ningun color
    }
    return;
  }
}

function handleKeyDown({ key }) {
  isShiftPressed = key === "Shift";
}

function handleKeyUp({ key }) {
  if (key === "Shift") isShiftPressed = false;
}

// INIT
setMode(MODES.DRAW);

if (typeof window.EyeDropper !== "undefined") {
  $pickerBtn.removeAttribute("disabled");
}
