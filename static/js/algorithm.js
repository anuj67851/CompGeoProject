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

intersect(new LineSegment(new Point(0, 0), new Point(1, 1)), new LineSegment(new Point(1, 0), new Point(0, 1)))
