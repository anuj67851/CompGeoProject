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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

function drawPoint(point) {
  const pointSize = 5;
  const pointColor = "red";

  // Draw the point
  ctx.beginPath();
  ctx.arc(point.x, point.y, pointSize, 0, 2 * Math.PI);
  ctx.fillStyle = pointColor;
  ctx.fill();
  ctx.closePath();
}

function drawSweepLine(oldPriority, newPriority) {
  return new Promise((resolve) => {
    const speed = 1; // Pixels per frame
    function animate() {
      clearCanvas();
      drawLines();
      intersections.forEach(drawPoint);

      // Draw the vertical line
      ctx.setLineDash([5, 15]);
      ctx.beginPath();
      ctx.moveTo(oldPriority, 0);
      ctx.lineTo(oldPriority, rect.bottom);
      ctx.strokeStyle = "black";
      ctx.stroke();
      ctx.setLineDash([]);

      // Update the position of the line
      oldPriority += speed;
      if (oldPriority >= newPriority) {
        resolve(); // Resolve the promise when the animation is complete
        return;
      }

      // Request the next frame
      requestAnimationFrame(animate);
    }

    // Start the animation
    animate();
  });
}

function drawLines() {
  lines.forEach(drawLine);
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
    drawLines();
    ctx.beginPath();
    ctx.moveTo(firstClick[0], firstClick[1]);
    ctx.lineTo(cursorX, cursorY);
    ctx.strokeStyle = 'blue';
    ctx.stroke();
  }, 10);
}

function stopDragLine(e) {
  if (isMouseWithinCanvas(e)) {
    const p1 = new Point(firstClick[0], firstClick[1]);
    const p2 = new Point(cursorX, cursorY);

    if (p1.x < p2.x) {
      lines.push(new LineSegment(p1, p2));
    } else {
      lines.push(new LineSegment(p2, p1));
    }
  }
  clearInterval(intervalLoop);
  clearCanvas();
  drawLines();
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

function clearData() {
  lines = [];
  restartAlgoClear();
}

function restartAlgoClear() {
  intersections = new Set();
  eventQueue = new PriorityQueue();
  status = [];
  clearCanvas();
}

// line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
// Determine the intersection point of two line segments
// Return FALSE if the lines don't intersect
function intersect(l1, l2) {
  let x1 = l1.start.x;
  let y1 = l1.start.y;

  let x2 = l1.end.x;
  let y2 = l1.end.y;

  let x3 = l2.start.x;
  let y3 = l2.start.y;

  let x4 = l2.end.x;
  let y4 = l2.end.y;
  // Check if none of the lines are of length 0
  if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
    return false;
  }
  let denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
  // Lines are parallel
  if (denominator === 0) {
    return false;
  }
  let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
  let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;
  // is the intersection along the segments
  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
    return false;
  }
  // Return a object with the x and y coordinates of the intersection
  let x = x1 + ua * (x2 - x1);
  let y = y1 + ua * (y2 - y1);
  return new Point(x.toFixed(2), y.toFixed(2));
}

window.onload = function () {
  init();
};

class PriorityQueue {
  constructor() {
    this.elements = [];
  }

  enqueue(element, priority) {
    this.elements.push({element, priority});
    this.elements.sort((a, b) => a.priority - b.priority);
  }

  dequeue() {
    if (this.isEmpty()) {
      return null;
    }
    return this.elements.shift();
  }

  isEmpty() {
    return this.elements.length === 0;
  }
}

function findYOnLineSegment(p, q, targetX) {
  // Destructure the endpoints
  const x1 = p.x;
  const y1 = p.y;
  const x2 = q.x;
  const y2 = q.y;
  // Check if the line segment is vertical
  if (x1 === x2) {
    // In this case, return y1 or y2 depending on the x coordinate match.
    if (x1 === targetX) {
      return y1;
    } else {
      throw new Error("The target x does not lie on the line segment.");
    }
  }
  // Calculate the slope of the line
  const slope = (y2 - y1) / (x2 - x1);
  // Calculate the y-coordinate for the target x using the equation of a line
  return y1 + slope * (targetX - x1);
}

function addLineToStatus(line, currentX) {
  status.push([line.start, line]);
  sortStatus(currentX);
}

function sortStatus(currentX) {
  function keyFunction(lineSegment) {
    const [_, line] = lineSegment;
    return findYOnLineSegment(line.start, line.end, currentX);
  }

  status.sort((a, b) => keyFunction(a) - keyFunction(b));
}

function deleteLine(line) {
  // Filter out the line from the status queue
  status = status.filter(([_, l]) => !compareLines(line, l));
}

function findLine(line) {
  // Find the index of the line in the status queue
  for (let i = 0; i < status.length; i++) {
    const [_, l] = status[i];
    if (line === l) {
      return i;
    }
  }
  return -1; // Line not found
}

function swap(x, y) {
  // Swap the two elements in the status queue
  const b = status[y];
  status[y] = status[x];
  status[x] = b;
}

function checkPointInIntersection(p) {
  for (const point of intersections) {
    if (point.x === p.x && point.y === p.y) {
      return true;
    }
  }
  return false;
}

function compareLines(line1, line2) {
  return line1.start.x === line2.start.x && line1.start.y === line2.start.y &&
      line1.end.x === line2.end.x && line1.end.y === line2.end.y;
}

let eventQueue = new PriorityQueue();
let intersections = new Set();
let status = [];

function removeEvents(lineBefore, lineAfter) {
  let oldEventQueue = eventQueue;
  eventQueue = new PriorityQueue();
  while (!oldEventQueue.isEmpty()) {
    let flag = true;
    const thisEvent = oldEventQueue.dequeue();
    const {element, priority} = thisEvent;
    const {point, line, event} = element;
    if (Array.isArray(line)) {
      [line1, line2] = line;
      if (compareLines(line1, lineBefore) && compareLines(line2, lineAfter)) {
        flag = false;
      }
    }
    if (flag) {
      eventQueue.enqueue(element, priority);
    }
  }
}

async function runAlgorithm() {
  restartAlgoClear();
  drawLines();

  for (let line of lines) {
    eventQueue.enqueue({
      point: line.start,
      line: line,
      event: "start",
    }, line.start.x)

    eventQueue.enqueue({
      point: line.end,
      line: line,
      event: "end",
    }, line.end.x)
  }

  let currentPriority = 0;
  while (!eventQueue.isEmpty()) {
    const thisEvent = eventQueue.dequeue();
    const {element, priority} = thisEvent;
    const {point, line, event} = element;
    await drawSweepLine(parseFloat(currentPriority), parseFloat(point.x));
    currentPriority = point.x;
    if (event === "start") {
      addLineToStatus(line, point.x);
      const idx = findLine(line);
      if (idx > 0 && idx < (status.length - 1)) {
        const lineBefore = status[idx - 1][1];
        const lineAfter = status[idx + 1][1];
        removeEvents(lineBefore, lineAfter);
      }
      if (idx > 0) {
        const lineBefore = status[idx - 1][1];
        const intersectPoint = intersect(line, lineBefore)
        if (intersectPoint && intersectPoint.x > priority) {
          eventQueue.enqueue({
            point: intersectPoint,
            line: [lineBefore, line],
            event: "intersection"
          }, intersectPoint.x)
        }
      }
      if (idx < (status.length - 1)) {
        const lineAfter = status[idx + 1][1];
        const intersectPoint = intersect(line, lineAfter)
        if (intersectPoint && intersectPoint.x > priority) {
          eventQueue.enqueue({
            point: intersectPoint,
            line: [line, lineAfter],
            event: "intersection"
          }, intersectPoint.x)
        }
      }
    } else if (event === "end") {
      const idx = findLine(line);
      if (idx > 0 && idx < (status.length - 1)) {
        const lineBefore = status[idx - 1][1];
        const lineAfter = status[idx + 1][1];
        const intersectPoint = intersect(lineBefore, lineAfter);
        if (intersectPoint && intersectPoint.x > priority) {
          eventQueue.enqueue({
            point: intersectPoint,
            line: [lineBefore, lineAfter],
            event: "intersection"
          }, intersectPoint.x)
        }
      }
      deleteLine(line)
    } else {
      intersections.add(point);
      const [line1, line2] = line;
      const lower = findLine(line1);
      const higher = findLine(line2);

      // check old events
      if (lower > 0) {
        const lineBeforeLower = status[lower - 1][1];
        const lineLower = status[lower][1];
        removeEvents(lineBeforeLower, lineLower);
      }
      if (higher < (status.length - 1)) {
        const lineAfterHigher = status[higher + 1][1];
        const lineHigher = status[higher][1];
        removeEvents(lineHigher, lineAfterHigher);
      }
      swap(lower, higher);
      if (lower > 0) {
        const line = status [lower][1];
        const lineLower = status[lower - 1][1];
        const intersectPoint = intersect(lineLower, line);
        if (intersectPoint && intersectPoint.x > priority) {
          eventQueue.enqueue({
            point: intersectPoint,
            line: [lineLower, line],
            event: "intersection"
          }, intersectPoint.x)
        }
      }
      if (higher < (status.length - 1)) {
        const line = status [higher][1];
        const lineAbove = status[higher + 1][1];
        const intersectPoint = intersect(line, lineAbove);
        if (intersectPoint && intersectPoint.x > priority) {
          eventQueue.enqueue({
            point: intersectPoint,
            line: [line, lineAbove],
            event: "intersection"
          }, intersectPoint.x)
        }
      }
    }
  }
  console.log(intersections);
}





