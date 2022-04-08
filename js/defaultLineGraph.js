const defaultLineGraph = (
  data_grouped,
  line_chart_svg,
  value,
  y_title,
  area = false,
  className = "line_chart"
) => {
  // Draw the default line graph for cases

  var data = data_grouped.get("OWID_WRL");

  line_chart_svg.selectAll("*").remove(); // Remove all the elements in the svg

  line_chart_svg.attrs({
    // Set the attributes of the svg
    width: document.getElementsByClassName(className)[0].clientWidth - 30,
    height: document.getElementsByClassName(className)[0].clientHeight - 30,
  });

  var width = +line_chart_svg.attr("width"), // Get the width of the svg
    height = +line_chart_svg.attr("height"); // Get the height of the svg

  data = data.map((d) => {
    // Map the data
    return {
      // Create a new object
      date: parseDate(d.Year),
      value: +d[value],
    };
  });

  console.log(data);

  var width = +line_chart_svg.attr("width"),
    height = +line_chart_svg.attr("height"),
    margin = { top: 20, right: 20, bottom: 110, left: 80 },
    margin2 = { top: height - 80, right: 20, bottom: 30, left: 80 },
    height2 = +line_chart_svg.attr("height") - margin2.top - margin2.bottom;

  width = +line_chart_svg.attr("width") - margin.left - margin.right;
  height = +line_chart_svg.attr("height") - margin.top - margin.bottom;

  var x = d3.scaleTime().range([0, width]), // Create a time scale
    x2 = d3.scaleTime().range([0, width]), // Create a time scale
    y = d3.scaleLinear().range([height, 0]), // Create a linear scale
    y2 = d3.scaleLinear().range([height2, 0]); // Create a linear scale

  var xAxis = d3.axisBottom(x), // Create the x axis
    xAxis2 = d3.axisBottom(x2), // Create the x axis
    yAxis = d3.axisLeft(y); // Create the y axis

  var brush = d3 // Create the brush
    .brushX()
    .extent([
      [0, 0],
      [width, height2],
    ])
    .on("brush end", brushed);

  var zoom_line = d3 // Create the zoom
    .zoom()
    .scaleExtent([1, Infinity])
    .translateExtent([
      [0, 0],
      [width, height],
    ])
    .extent([
      [0, 0],
      [width, height],
    ])
    .on("zoom", zoomed); // Set the zoom

  if (area) {
    var line = d3 // Create the line
      .line()
      .x(function (d) {
        return x(d.date);
      })
      .y(function (d) {
        return y(d.value);
      });
    var line2 = d3 // Create the minigraph line
      .line()
      .x(function (d) {
        return x2(d.date);
      })
      .y(function (d) {
        return y2(d.value);
      });
  } else {
    var line = d3
      .area()
      .x(function (d) {
        return x(d.date);
      })
      .y0(y(0))
      .y1(function (d) {
        return y(d.value);
      });

    var line2 = d3
      .area()
      .x(function (d) {
        return x2(d.date);
      })
      .y0(y2(0))
      .y1(function (d) {
        return y2(d.value);
      });
  }

  var clip = line_chart_svg // Create the clip
    .append("defs")
    .append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("x", 0)
    .attr("y", 0);

  var Line_chart = line_chart_svg // Create the line chart
    .append("g")
    .attr("class", "line_chart")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("clip-path", className === "line_chart" ? "url(#clip)" : null);

  var focus = line_chart_svg // Create the focus
    .append("g")
    .attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var context = line_chart_svg // Create the context
    .append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

  // set the domain for the x and y axis
  x.domain(
    d3.extent(data, function (d) {
      return d.date;
    })
  );
  y.domain([
    0,
    area
      ? d3.max(data, function (d) {
          return d.value;
        })
      : 100,
  ]);

  // set the domain for the x and y axis for the minigraph
  x2.domain(x.domain());
  y2.domain(y.domain());

  focus
    .append("g")
    .attr("class", "axis axis--x") // Add the x axis
    .attr("transform", "translate(0," + height + ")")
    .attr("color", "white")
    .call(xAxis); // Call the x axis

  focus
    .append("g")
    .attr("class", "axis axis--y") // Add the y axis
    .attr("color", "white")
    .call(yAxis); // Call the y axis

  Line_chart.append("path")
    .datum(data)
    .attr("class", "line1")
    .attr("id", area ? "line" : "area")
    .attr("d", line); // Add the line

  context
    .append("path")
    .datum(data)
    .attr("class", "line")
    .attr("id", area ? "line1" : "area1")
    .attr("d", line2); // Add the line for the minigraph

  context
    .append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height2 + ")")
    .attr("color", "white")
    .call(xAxis2); // Add the x axis for the minigraph

  context
    .append("g")
    .attr("class", "brush")
    .call(brush)
    .call(brush.move, [x.range()[0], x.range()[1]]); // Add the brush

  line_chart_svg
    .append("rect")
    .attr("class", "zoom")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "none")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(zoom_line); // Add the zoom

  // add x and y labels
  line_chart_svg
    .append("text") // Add the x label
    .attrs({
      class: "x label",
      "text-anchor": "end",
      x: width,
      y: height,
      "font-size": "1.5em",
      "font-weight": "bold",
      fill: "white",
      "pointer-events": "none",
    })
    .styles({
      "font-family": "monospace",
      "letter-spacing": "0.5em",
      "text-transform": "uppercase",
    })
    .text("Year ⟶"); // Set the text

  line_chart_svg
    .append("text") // Add the y label
    .attrs({
      class: "y label",
      "text-anchor": "end",
      x: height - margin.top,
      y: -margin.left - 20,
      "font-size": "0.8em",
      "font-weight": "bold",
      fill: "white",
      "pointer-events": "none",
    })
    .styles({
      "font-family": "monospace",
      "letter-spacing": "0.5em",
      "text-transform": "uppercase",
      transform: "rotate(90deg)",
    })
    .text("⟵ " + y_title); // Set the text

  function brushed(e) {
    if (e.type === "zoom") return; // ignore brush-by-zoom

    var s = e.selection || x2.range();
    x.domain(s.map(x2.invert, x2));
    Line_chart.selectAll(".line1").attr("d", line);
    focus.select(".axis--x").call(xAxis);
  }

  function zoomed(e) {
    // When zoomed, do the following
    if (e.sourceEvent && e.sourceEvent.type === "brush") return; // ignore zoom-by-brush
    var t = e.transform;
    x.domain(t.rescaleX(x2).domain());
    Line_chart.select(".line1").attr("d", line);
    focus.select(".axis--x").call(xAxis);
    context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
  }

  function type(d) {
    d.date = parseDate(d.date);
    d.total_cases = +d.total_cases;
    return d;
  }
};
