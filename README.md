bbox.js
==================================================

This is a small library that allows you to calculate the axis-aligned bounding
box of an SVG path. The path is assumed to be in absolute co-ordinates and use
only the (M)ove, (L)ine, and (C)ubic operators.

The library is intended to be very easy to use. You pass a string containing an
SVG path to the appropriate function and get an axis-aligned bounding box back.
E.g.

```
var box = bbox.path('M 230 -1031 C 232 -1032, 235 -1032, 238 -1032');
```

And really that is it; you pass in a path and get an AABB back. There are some
other functions used to perform the calculations that you might find useful.
E.g. if you want to know where the inflection points of cubic Bezier curve are
you can use,

```
var bezier = {
  x0: 0, y0: 0,  // start
  x1: 1, y1: 1,  // 1st control point
  x2: 1, y2: 2,  // 2nd control point
  x3: 0, y3: 1}; // end

// A point on the Bezier curve is given by (x(t), y(t)) where t is on [0,1],
// t = 0 is the start and t = 1 is the end. This function returns the values of
// t where inflection points occur.
var inflections = bbox.utils.cubic_bezier_inflections(bezier);

// To get the actual inflection points,
var points = [];
for(var i = 0; i < inflections.length; i++){
  points.push(bbox.utils.cubic_bezier_point(bezier, inflections[i]));
}
```
