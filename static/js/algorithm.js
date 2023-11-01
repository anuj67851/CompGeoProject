class Point {
  x;
  y;

  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class LineSegment {
  start;
  end;

  constructor(start, end) {
    this.start = start;
    this.end = end;
  }
}

intersections = [];
let cursorX;
let cursorY;
const canvas = document.getElementById("canvas"); //canvas, context, other vars etc
const ctx = canvas.getContext("2d");
let rect;
let firstClick;
let intervalLoop;
let lines = []; // Store line coordinates
function drawLine(line) {
  ctx.beginPath();
  ctx.moveTo(line.start.x, line.start.y);
  ctx.lineTo(line.end.x, line.end.y);
  ctx.strokeStyle = 'blue';
  ctx.stroke();
}

function clearCanvas() {
  ctx.clearRect(0, 0, rect.width, rect.height);
}

function startDragLine() {
  firstClick = [cursorX, cursorY];
  //start the loop
  intervalLoop = setInterval(function () {
    clearCanvas();
    // Draw all stored lines
    lines.forEach(drawLine);
    ctx.beginPath();
    ctx.moveTo(firstClick[0], firstClick[1]);
    ctx.lineTo(cursorX, cursorY);
    ctx.strokeStyle = 'blue';
    ctx.stroke();
  }, 10);
}

function stopDragLine(e) {
  if (isMouseWithinCanvas(e)) {
    lines.push(new LineSegment(new Point(firstClick[0], firstClick[1]),
        new Point(cursorX, cursorY)));
  }
  clearInterval(intervalLoop);
  clearCanvas();
  lines.forEach(drawLine);
}

function isMouseWithinCanvas(e) {
  if (e) {
    const mouseX = e.pageX - rect.left;
    const mouseY = e.pageY - rect.top;
    return mouseX > 0 && mouseX < rect.width && mouseY > 0 && mouseY
        < rect.height;
  }
  return false; // No event provided, so we assume it's within the canvas
}

function fitToContainer(canvas) {
  // Make it visually fill the positioned parent
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  // ...then set the internal size to match
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}

function init() {
  fitToContainer(canvas);
  rect = canvas.getBoundingClientRect();
  document.onmousemove = function (e) {
    cursorX = e.pageX - rect.left;
    cursorY = e.pageY - rect.top;
  };
  canvas.addEventListener('mousedown', startDragLine, false);
  window.addEventListener('mouseup', stopDragLine, false);
}

init();

// line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
// Determine the intersection point of two line segments
// Return FALSE if the lines don't intersect
function intersect(l1, l2) {
  let x1 = l1.start.x
  let y1 = l1.start.y

  let x2 = l1.end.x
  let y2 = l1.end.y

  let x3 = l2.start.x
  let y3 = l2.start.y

  let x4 = l2.end.x
  let y4 = l2.end.y
  // Check if none of the lines are of length 0
  if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
    return false
  }
  let denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1))
  // Lines are parallel
  if (denominator === 0) {
    return false
  }
  let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator
  let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator
  // is the intersection along the segments
  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
    return false
  }
  // Return a object with the x and y coordinates of the intersection
  let x = x1 + ua * (x2 - x1)
  let y = y1 + ua * (y2 - y1)
  return new Point(x, y)
}





