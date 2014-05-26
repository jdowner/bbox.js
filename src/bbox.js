var bbox = {
  utils: {
    /**
    * Calculates the roots of a quadratic equation (a x^2 + b x + c = 0)
    *
    * The solution of the quadratic equation is typically given as,
    *
    *  x = (-b +- sqrt(b^2 - 4 a c)) / (2 a)
    *
    * However, this can lead to catastrophic round-off if b^2 >> 4 a c because
    * this results in subtracting a number very close to 'b' from 'b' in one of
    * the roots. The solution is to avoid this subtraction using the following
    * equations,
    *
    *  p = -(b + sign(b) sqrt(b^2 - 4 ac)) / 2
    *
    *  x1 = p / a
    *  x2 = c / p
    *
    */
    qroots: function(a, b, c){
      var soln = [];
      var u = b * b;
      var v = 4 * a * c;
      if(u > v){
        var p = -(b + Math.sign(b) * Math.sqrt(u - v)) / 2.0;
        var s = p / a;
        var t = c / p;
        if(s < t){
          soln.push(s);
          soln.push(t);
        }
        else {
          soln.push(t);
          soln.push(s);
        }
      }
      else if(u == v){
        soln.push(-b / (2.0 * a));
      }

      return soln;
    },

    /**
    * Returns the derivative of a cubic bezier at 't'.
    *
    * A point on a bezier curve can be represented parametrically as (x(t),
    * y(t)). This function calculates the derivatives of x(t) and y(t) and
    * returns the result in an object literal containing 'dx' and 'dy'.
    *
    */
    cubic_bezier_derivative: function(bezier, t){
      var s = 1 - t;
      var a = 3 * s * s;
      var b = 6 * s * t;
      var c = 3 * t * t;
      var dx = a * (bezier.x1 - bezier.x0) + b * (bezier.x2 - bezier.x1) + c * (bezier.x3 - bezier.x2);
      var dy = a * (bezier.y1 - bezier.y0) + b * (bezier.y2 - bezier.y1) + c * (bezier.y3 - bezier.y2);
      return {dx: dx, dy: dy}
    },

    /**
    * Returns an array of inflection points along a cubic bezier curve.
    *
    * The inflection points of the curve at the points where either the
    * derivative in the x co-ordinate or in the y co-ordinate are zero.
    *
    * The derivative of a cubic bezier is given by,
    *
    *  z'(t) = 3 (1 - t)^2 (z1 - z0) + 6 (1 - t) t (z2 - z1) + 3 t^2 (z3 - z2)
    *
    * where z represents either x or y. The equation can be put into a more
    * convenient form using a couple of transformations,
    *
    *  a = z1 - z0
    *  b = z2 - z1
    *  c = z3 - z2
    *
    * which gives,
    *
    *  z'(t) = 3 t^2 (a - 2 b + c) + 6 t (b - a) + 3 a
    *
    * Introducing another transformation,
    *
    *  u = a - b
    *  v = b - c
    *
    * gives,
    *
    *  z'(t) = 3 t^2 (u - v) - 6 t u + 3 a
    *
    * and, since we are only interested in solutions of z'(t) = 0, we can reduce
    * this to,
    *
    *  z'(t) = t^2 (u - v) - 2 t u + a
    *
    * which is the form of the equation that is used in this function.
    *
    */
    cubic_bezier_inflections: function(bezier){
      var soln = [];

      // Define a function that adds a solution if it lies in the interval [0,1]
      var push_valid_solution = function(t){
        if((0 < t) && (t < 1)){
          soln.push(t);
        }
      }

      // Find inflection points for the y co-ordinate
      var ay = bezier.y1 - bezier.y0;
      var by = bezier.y2 - bezier.y1;
      var cy = bezier.y3 - bezier.y2;

      var uy = ay - by;
      var vy = by - cy;

      var ysoln = bbox.utils.qroots((uy - vy), -2 * uy, ay);
      for(var i = 0; i < ysoln.length; i++){
        push_valid_solution(ysoln[i])
      }

      // Find inflection points for the x co-ordinate
      var ax = bezier.x1 - bezier.x0;
      var bx = bezier.x2 - bezier.x1;
      var cx = bezier.x3 - bezier.x2;

      var ux = ax - bx;
      var vx = bx - cx;

      var xsoln = bbox.utils.qroots((ux - vx), -2 * ux, ax);
      for(var i = 0; i < xsoln.length; i++){
        push_valid_solution(xsoln[i])
      }

      soln.sort();

      return soln;
    },

    /**
     * Returns a point on a cubic bezier curve.
     *
     * The bezier curve is a curve in (x, y) that is parameterized by t. This
     * function evaluates the bezier curve at x(t) and y(t) and returns the
     * results as on object literal containing 'x' and 'y'.
     *
     */
    cubic_bezier_point: function(bezier, t){
      var s = 1 - t;
      var a = s * s * s;
      var b = 3 * s * s * t;
      var c = 3 * s * t * t;
      var d = t * t * t;

      var x = a * bezier.x0 + b * bezier.x1 + c * bezier.x2 + d * bezier.x3;
      var y = a * bezier.y0 + b * bezier.y1 + c * bezier.y2 + d * bezier.y3;

      return {x: x, y: y}
    },
  },

  /**
   * Returns the bounding box of a cubic bezier curve.
   *
   */
  cubic_bezier: function(bezier){
    // The end points of the curve may define the bounding box if there are no
    // inflection points for t in (0,1) so add them to the list of critical
    // points.
    var critical = [0, 1];

    // Get the inflection points for the bezier curve and add them to the
    // critical points
    var inflections = bbox.utils.cubic_bezier_inflections(bezier);
    for(var i = 0; i < inflections.length; i++){
      critical.push(inflections[i]);
    }

    // Find the maximum/minimum for each co-ordinate. These will define the
    // edges of the bounding box.
    var p = bbox.utils.cubic_bezier_point(bezier, critical[0]);
    var minx = p.x;
    var maxx = p.x;
    var miny = p.y;
    var maxy = p.y;
    for(var i = 1; i < critical.length; i++){
      p = bbox.utils.cubic_bezier_point(bezier, critical[i]);
      minx = Math.min(minx, p.x);
      maxx = Math.max(maxx, p.x);
      miny = Math.min(miny, p.y);
      maxy = Math.max(maxy, p.y);
    }

    return {
      x: minx,
      y: miny,
      w: maxx - minx,
      h: maxy - miny
    };
  },

  /**
   * Returns the bounding box of a line.
   *
   */
  line: function(line){
    var minx = Math.min(line.x0, line.x1);
    var maxx = Math.max(line.x0, line.x1);
    var miny = Math.min(line.y0, line.y1);
    var maxy = Math.max(line.y0, line.y1);

    return {
      x: minx,
      y: miny,
      w: maxx - minx,
      h: maxy - miny
    };
  },
}
