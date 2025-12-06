// ==========================
// CANVAS SETUP
// ==========================

// Get canvas reference from HTML
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Retrieve a pixel buffer we can modify directly
const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

// Canvas width & height (in pixels)
const Cw = canvas.width;
const Ch = canvas.height;

// ==========================
// VIEWPORT SETUP
// ==========================
//
// The viewport is a "window" in 3D space through which the camera looks.
// It is centered in front of the camera, at distance d.
// Canvas pixels are mapped to this viewport.
//

// Viewport width & height (how wide the camera sees)
const Vw = 1;
const Vh = 1;

// Distance from camera to viewport
const d = 1;

// Camera origin in 3D
const O = { x: 0, y: 0, z: 0 };

// Background color (returned when no sphere is hit)
const BACKGROUND_COLOR = { r: 0, g: 0, b: 0 };

// ==========================
// SCENE DESCRIPTION
// ==========================
//
// A simple list of spheres. Each sphere has:
// - center: 3D position
// - radius
// - color: RGB
//

const scene = {
  spheres: [
    { center: { x: 0, y: -1, z: 3 }, radius: 1, color: { r: 255, g: 0, b: 0 } }, // red sphere
    { center: { x: 2, y: 0, z: 4 }, radius: 1, color: { r: 0, g: 0, b: 255 } }, // blue sphere
    { center: { x: -2, y: 0, z: 4 }, radius: 1, color: { r: 0, g: 255, b: 0 } }, // green sphere
  ],
};

// ==========================
// VECTOR MATH HELPERS
// ==========================

// Dot product between two 3D vectors
function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

// Subtraction between two 3D vectors: a - b
function subtract(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

// ==========================
// CANVAS → VIEWPORT PROJECTION
// ==========================
//
// Converts a canvas pixel coordinate (x,y) into a direction vector D
// pointing from the camera origin O through a point on the viewport.
//

function CanvasToViewport(x, y) {
  // Scale pixel coordinates into viewport coordinates.
  // Example: left edge of canvas maps to left edge of viewport.
  return {
    x: (x * Vw) / Cw, // horizontal scaling
    y: (y * Vh) / Ch, // vertical scaling
    z: d, // viewport is always "d" units in front of camera
  };
}

// ==========================
// RAY-SPHERE INTERSECTION
// ==========================
//
// Solves the quadratic equation for intersection between a ray:
//
//     P(t) = O + tD
//
// and a sphere:
//
//     |P - C| = r
//
// Returns two possible distances t1 and t2
// (Infinity, Infinity) if no hit.
//

function IntersectRaySphere(O, D, sphere) {
  // Vector from sphere center to camera
  const CO = subtract(O, sphere.center);

  // Quadratic equation coefficients
  const a = dot(D, D); // D·D
  const b = 2 * dot(CO, D); // 2*(CO·D)
  const c = dot(CO, CO) - sphere.radius * sphere.radius;

  // Discriminant determines whether we hit the sphere
  const discriminant = b * b - 4 * a * c;

  if (discriminant < 0) {
    // no real intersections → no hit
    return [Infinity, Infinity];
  }

  const sqrtD = Math.sqrt(discriminant);

  // Two possible intersection distances
  const t1 = (-b + sqrtD) / (2 * a);
  const t2 = (-b - sqrtD) / (2 * a);

  return [t1, t2];
}

// ==========================
// TRACE A SINGLE RAY
// ==========================
//
// For a ray defined by origin O and direction D:
//
// - Check intersection with every sphere
// - Keep the closest intersection within [t_min, t_max]
// - Return the sphere's color if hit
// - Otherwise return BACKGROUND_COLOR
//

function TraceRay(O, D, t_min, t_max) {
  let closest_t = Infinity; // track nearest hit
  let closest_sphere = null; // track sphere that was hit

  // test ray against each sphere
  for (const sphere of scene.spheres) {
    const [t1, t2] = IntersectRaySphere(O, D, sphere);

    // check if first hit is valid & closest
    if (t1 >= t_min && t1 <= t_max && t1 < closest_t) {
      closest_t = t1;
      closest_sphere = sphere;
    }

    // check second hit
    if (t2 >= t_min && t2 <= t_max && t2 < closest_t) {
      closest_t = t2;
      closest_sphere = sphere;
    }
  }

  // No sphere hit → return background
  return closest_sphere ? closest_sphere.color : BACKGROUND_COLOR;
}

// ==========================
// PUT PIXEL INTO CANVAS
// ==========================
//
// Convert x,y from "centered coordinates" (−Cw/2 .. +Cw/2)
// into canvas pixel coordinates (0..Cw, 0..Ch)
//

function PutPixel(x, y, color) {
  // Convert centered coordinates to canvas coordinates
  const px = Cw / 2 + x;
  const py = Ch / 2 - y; // y-axis is inverted in canvas

  // Stay inside the canvas
  if (px < 0 || px >= Cw || py < 0 || py >= Ch) return;

  // Compute index inside pixel buffer
  const index = (px + py * Cw) * 4;

  imgData.data[index + 0] = color.r; // red
  imgData.data[index + 1] = color.g; // green
  imgData.data[index + 2] = color.b; // blue
  imgData.data[index + 3] = 255; // alpha (fully opaque)
}

// ==========================
// MAIN RENDER LOOP
// ==========================
//
// Loops over every pixel in the canvas,
// sends a ray through that pixel,
// and paints the result.
//

function render() {
  // x and y loop over centered coordinates:
  // e.g. with 800x800 canvas:
  // x goes from -400 .. +399
  for (let x = -Cw / 2; x < Cw / 2; x++) {
    for (let y = -Ch / 2; y < Ch / 2; y++) {
      // Get direction vector for ray through this pixel
      const D = CanvasToViewport(x, y);

      // Shoot ray from camera through pixel
      const color = TraceRay(O, D, 1, Infinity);

      // Paint pixel on canvas
      PutPixel(x, y, color);
    }
  }

  // Copy image buffer to canvas
  ctx.putImageData(imgData, 0, 0);
}

// Do the render!
render();
