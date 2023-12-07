const runButton = document.getElementById("run-button");
const clearButton = document.getElementById("clear-button");
const pauseButton = document.getElementById("pause-button");
const resumeButton = document.getElementById("resume-button");
const stepButton = document.getElementById("step-button");
const randomButton = document.getElementById("random-button");
const intersectionHtml = document.getElementById("result");
const eventHtml = document.getElementById("event");
const statusHtml = document.getElementById("status");
let currentlyActiveLine = "";
let isAnimating = false;
let currentEventPoint = null;
const PauseStatus = {
  PAUSED: 'pause',
  RESUME: 'resume',
  STEP: 'step',
};
let pauseStatus = PauseStatus.RESUME;

function drawCanvasCoordinates() {
  const canvas = document.getElementById('canvas');
  const context = canvas.getContext('2d');

  // Function to draw text at specified coordinates
  function drawText(x, y, text) {
    context.font = '12px Arial';
    context.fillStyle = "black";
    context.fillText(text, x, y);
  }

  // Draw the four corner coordinates
  drawText(10, 20, 'Top Left (0, 0)');
  drawText(canvas.width - 110, 20, `Top Right (${canvas.width}, 0)`);
  drawText(10, canvas.height - 10, `Bottom Left (0, ${canvas.height - 10})`);
  drawText(canvas.width - 140, canvas.height - 10, `Bottom Right (${canvas.width}, ${canvas.height})`);
}

async function switchActiveLine(next) {
  function removeClass() {
    return new Promise((resolve) => {
      if (currentlyActiveLine !== "") {
        requestAnimationFrame(() => {
          const element = document.getElementById(currentlyActiveLine);
          element.classList.remove('highlight');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  function addClass() {
    return new Promise((resolve) => {
      if (next !== "") {
        requestAnimationFrame(() => {
          const element = document.getElementById(next);
          element.classList.add('highlight');
          currentlyActiveLine = next;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  async function animate() {
    if (isAnimating) {
      return; // Wait for the previous animation to finish
    }
    isAnimating = true;
    await removeClass();
    await addClass();
    isAnimating = false;
  }

  async function pauseExecution() {
    while (pauseStatus === PauseStatus.PAUSED) {
      await sleep(100); // Adjust the sleep duration as needed
    }
  }

  if (pauseStatus === PauseStatus.PAUSED) {
    await pauseExecution();
    await switchActiveLine(next);
  } else if (pauseStatus === PauseStatus.RESUME) {
    await animate();
  } else {
    await animate();
    pauseStatus = PauseStatus.PAUSED;
  }
}

function pauseExecution() {
  pauseStatus = PauseStatus.PAUSED;
  pauseButton.disabled = true;
  resumeButton.disabled = false;
  stepButton.disabled = false;
}

function resumeExecution() {
  pauseStatus = PauseStatus.RESUME;
  pauseButton.disabled = false;
  stepButton.disabled = true;
  resumeButton.disabled = true;
}

function stepExecution() {
  pauseStatus = PauseStatus.STEP;
  pauseButton.disabled = true;
  stepButton.disabled = false;
  resumeButton.disabled = false;
}

class Point {
  x;
  y;

  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  toString() {
    return `(${this.x}, ${this.y})`;
  }
}

class LineSegment {
  start;
  end;

  constructor(start, end) {
    this.start = start;
    this.end = end;
  }

  toString() {
    return `[Start: ${this.start}, End: ${this.end}]`;
  }
}

class Intersection {
  point;
  color;

  constructor(point, color) {
    this.point = point;
    this.color = color;
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

function drawPoint(intersection) {
  const pointSize = 5;
  const pointColor = intersection.color;

  // Draw the point
  ctx.beginPath();
  ctx.arc(intersection.point.x, intersection.point.y, pointSize, 0, 2 * Math.PI);
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
        if (currentEventPoint !== null) {
          const pointSize = 3;
          const pointColor = "green";

          // Draw the point
          ctx.beginPath();
          ctx.arc(currentEventPoint.x, currentEventPoint.y, pointSize, 0, 2 * Math.PI);
          ctx.fillStyle = pointColor;
          ctx.fill();
          ctx.closePath();
        }
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
  drawCanvasCoordinates();
}

function startDragLine() {
  if (!clearButton.disabled) {
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
}

function stopDragLine(e) {
  if (!clearButton.disabled) {
    if (isMouseWithinCanvas(e)) {
      const p1 = new Point(firstClick[0], firstClick[1]);
      const p2 = new Point(cursorX, cursorY);

      if (p1.x < p2.x) {
        lines.push(new LineSegment(p1, p2));
      } else {
        lines.push(new LineSegment(p2, p1));
      }
      runButton.disabled = false;
    }
    clearInterval(intervalLoop);
    clearCanvas();
    intersections.forEach(drawPoint);
    drawLines();
  }
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
  runButton.disabled = true;
  pauseButton.disabled = true;
  resumeButton.disabled = true;
  stepButton.disabled = true;
  fitToContainer(canvas);
  rect = canvas.getBoundingClientRect();
  document.onmousemove = function (e) {
    cursorX = e.pageX - rect.left;
    cursorY = e.pageY - rect.top;
  };
  canvas.addEventListener('mousedown', startDragLine, false);
  window.addEventListener('mouseup', stopDragLine, false);
  drawCanvasCoordinates();
}

function clearData() {
  intersectionHtml.style.visibility = "hidden";
  eventHtml.style.visibility = "hidden";
  statusHtml.style.visibility = "hidden";
  runButton.disabled = true;
  lines = [];
  restartAlgoClear();
}

function restartAlgoClear() {
  intersections = new Set();
  eventQueue = new PriorityQueue();
  status = [];
  writeIntersections();
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
    writeEvents();
  }

  dequeue() {
    if (this.isEmpty()) {
      return null;
    }
    writeEvents();
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

function writeIntersections() {
  intersectionHtml.innerHTML = '';
  for (const intersection of intersections) {
    // Create a new span element
    const newSpan = document.createElement('span');
    // Change the color of the text
    newSpan.style.color = intersection.color; // You can use a function like getRandomColor() from the previous example
    // Add text content
    newSpan.textContent = intersection.point + "  ";
    // Append the new span to another HTML node
    intersectionHtml.appendChild(newSpan);
  }
  if (intersections.size > 0) {
    intersectionHtml.style.visibility = "visible";
    intersectionHtml.scrollTop = intersectionHtml.scrollHeight;
  }
}

function writeStatus() {
  statusHtml.innerHTML = '';

  if (status.length > 0) {
    statusHtml.style.visibility = "visible";
  } else {
    statusHtml.style.visibility = "hidden";
  }
  for (const entry of status) {
    // Create a new span element
    const newP = document.createElement('p');
    // Add text content
    newP.textContent = entry[1] + "  ";
    // Append the new span to another HTML node
    statusHtml.appendChild(newP);
    console.log("I am here");
  }
}

function writeEvents() {
  eventHtml.innerHTML = '';

  if (!eventQueue.isEmpty()) {
    eventHtml.style.visibility = "visible";
  } else {
    eventHtml.style.visibility = "hidden";
  }
  let firstDone = false;
  for (const theEvent of eventQueue.elements) {
    const {element, priority} = theEvent;
    const {point, line, event} = element;

    // Create a new span element
    const newP = document.createElement('p');
    if (!firstDone) {
      // Change the color of the text
      newP.style.backgroundColor = "rgba(60,181,64,0.5)"; // You can use a function like getRandomColor() from the previous example
      firstDone = true;
    }
    // Add text content
    newP.textContent = priority + " \u2192 " + event + " : " + point + " : " + line;
    // Append the new span to another HTML node
    eventHtml.appendChild(newP);
  }
}

async function runAlgorithm() {
  runButton.disabled = true;
  clearButton.disabled = true;
  resumeButton.disabled = true;
  stepButton.disabled = true;
  pauseButton.disabled = false;
  randomButton.disabled = true;
  intersectionHtml.style.visibility = "hidden";
  eventHtml.style.visibility = "hidden";
  statusHtml.style.visibility = "hidden";

  restartAlgoClear();
  drawLines();

  await switchActiveLine("initialize-event");
  await switchActiveLine("initialize-status");
  await switchActiveLine("loop-start");
  for (let line of lines) {
    await switchActiveLine("loop-create");
    await switchActiveLine("add-start");
    eventQueue.enqueue({
      point: line.start,
      line: line,
      event: "start",
    }, line.start.x)

    await switchActiveLine("add-end");
    eventQueue.enqueue({
      point: line.end,
      line: line,
      event: "end",
    }, line.end.x)
  }

  let currentPriority = 0;
  await switchActiveLine("main-loop");
  while (!eventQueue.isEmpty()) {
    await switchActiveLine("get-event");
    const thisEvent = eventQueue.dequeue();
    const {element, priority} = thisEvent;
    const {point, line, event} = element;
    currentEventPoint = point;
    await drawSweepLine(parseFloat(currentPriority), parseFloat(point.x));
    currentPriority = point.x;
    if (event === "start") {
      await switchActiveLine("if-start");
      await switchActiveLine("insert-line");
      await addLineToStatus(line, point.x);
      writeStatus();
      const idx = findLine(line);
      if (idx > 0 && idx < (status.length - 1)) {
        await switchActiveLine("find-above-below");
        const lineBefore = status[idx - 1][1];
        const lineAfter = status[idx + 1][1];
        await switchActiveLine("remove-ab-event");
        removeEvents(lineBefore, lineAfter);
      }
      await switchActiveLine("start-new-event");
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
      await switchActiveLine("if-end");
      const idx = findLine(line);
      if (idx > 0 && idx < (status.length - 1)) {
        await switchActiveLine("find-ab");
        const lineBefore = status[idx - 1][1];
        const lineAfter = status[idx + 1][1];
        const intersectPoint = intersect(lineBefore, lineAfter);
        if (intersectPoint && intersectPoint.x > priority) {
          await switchActiveLine("end-new-event");
          eventQueue.enqueue({
            point: intersectPoint,
            line: [lineBefore, lineAfter],
            event: "intersection"
          }, intersectPoint.x)
        }
      }
      await switchActiveLine("remove-line");
      deleteLine(line)
      writeStatus();
    } else {
      await switchActiveLine("if-intersect");
      intersections.add(new Intersection(point, getRandomColor()));
      writeIntersections();
      const [line1, line2] = line;
      const lower = findLine(line1);
      const higher = findLine(line2);

      await switchActiveLine("swap");
      await switchActiveLine("find-ab-intersect");
      await switchActiveLine("remove-ab-intersect")
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
      writeStatus();
      await switchActiveLine("intersect-new-event");
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
  await switchActiveLine("");
  currentEventPoint = null;
  await drawSweepLine(currentPriority, currentPriority);

  runButton.disabled = false;
  clearButton.disabled = false;
  pauseButton.disabled = true;
  resumeButton.disabled = true;
  stepButton.disabled = true;
  randomButton.disabled = false;
  writeEvents();
}

function getRandomInt(min, max) {
  // Using Math.floor() to ensure the result is an integer
  // The formula generates a random number in the range [min, max + 1)
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomInitialize() {
  let inputElement = document.getElementById("lines-input");
  // Get the value from the input and convert it to an integer
  const inputValue = parseInt(inputElement.value);

  // Check if the conversion was successful
  let counter;
  if (!isNaN(inputValue)) {
    if (inputValue > 20) {
      alert('Maximum number of lines is restricted to 20.');
    } else {
      clearCanvas();
      lines = [];
      const minX = rect.left + 1 - rect.left;
      const maxX = rect.right - 1 - rect.left;
      const minY = rect.top + 1 - rect.top;
      const maxY = rect.bottom - 1 - rect.top;

      counter = 0;
      while (counter < inputValue) {
        const p1 = new Point(getRandomInt(minX, maxX), getRandomInt(minY, maxY));
        const p2 = new Point(getRandomInt(minX, maxX), getRandomInt(minY, maxY));
        if (p1.x !== p2.x && p1.y !== p2.y) {
          if (p1.x < p2.x) {
            lines.push(new LineSegment(p1, p2));
          } else {
            lines.push(new LineSegment(p2, p1));
          }
          counter++;
        }
      }
      console.log(lines);
      drawLines();
      runButton.disabled = false;
    }
  } else {
    alert('Invalid input. Please enter a valid integer.');
  }
}

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color;
  do {
    color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
  } while (getColorLightness(color) > 125);
  return color;
}

function getColorLightness(hexColor) {
  const rgb = hexToRgb(hexColor);
  const max = Math.max(rgb.r, rgb.g, rgb.b);
  const min = Math.min(rgb.r, rgb.g, rgb.b);
  return (max + min) / 2;
}

function hexToRgb(hexColor) {
  const hex = hexColor.slice(1);
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}






