updateLineChartSvg = (
  data_grouped,
  line_chart_svg,
  value,
  id,
  area = false,
  reset = false,
  className = "line_chart"
) => {
  var width = +line_chart_svg.attr("width"),
    height = +line_chart_svg.attr("height");

  // if reset is true, then we load the world data
  if (reset) {
    id = "OWID_WRL";
  }

  // get the data
  var data = data_grouped.get(id);

  data = data.map((d) => {
    // Map the data
    return {
      // Create a new object
      date: parseDate(d.Year),
      value: +d[value],
    };
  });

  if (!data.length) {
    line_chart_svg
      .append("text")
      .attr("class", "no-data")
      .attr("x", 0)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .transition()
      .duration(1000)
      .ease(d3.easeElastic)
      .attr("x", width / 2)
      .attr("font-size", "20px")
      .attr("fill", "red")
      .attr("font-weight", "bold")
      .attr("font-family", "monospace")
      .text(`No data available for ${id}`);
  } else {
    line_chart_svg
      .selectAll(".no-data")
      .transition()
      .duration(750)
      .attr("y", 0)
      .remove();
  }

  width = +line_chart_svg.attr("width");

  var height = +line_chart_svg.attr("height"),
    margin = { top: 20, right: 20, bottom: 110, left: 80 },
    margin2 = { top: height - 80, right: 20, bottom: 30, left: 80 };

  height2 = +line_chart_svg.attr("height") - margin2.top - margin2.bottom;

  width = +line_chart_svg.attr("width") - margin.left - margin.right;
  height = +line_chart_svg.attr("height") - margin.top - margin.bottom;

  // calculate the x and y scales

  var x = d3.scaleTime().range([0, width]),
    y = d3.scaleLinear().range([height, 0]);
  var x2 = d3.scaleTime().range([0, width]),
    y2 = d3.scaleLinear().range([height2, 0]);

  // calculate the x and y axis

  var xAxis = d3.axisBottom(x),
    xAxis2 = d3.axisBottom(x2),
    yAxis = d3.axisLeft(y);

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

  line_chart_svg
    .select("#clip")
    .select("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 0)
    .attr("y", 0);

  var Line_chart = line_chart_svg.select(".line_chart");

  var focus = line_chart_svg
    .select(".focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var context = line_chart_svg
    .select(".context")
    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

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
  x2.domain(x.domain());
  y2.domain(y.domain());

  // transition the x and y axis

  focus.select(".axis--x").transition().duration(750).call(xAxis);

  focus.select(".axis--y").transition().duration(750).call(yAxis);

  // transition the lines

  Line_chart_animate = Line_chart.selectAll(".line1").datum(data);

  Line_chart_animate.enter()
    .append("path")
    .attr("class", "line1")
    .attr("id", area ? "line" : "area")
    .merge(Line_chart_animate)
    .transition()
    .duration(2000)
    .attr("d", line);

  var context_path = context.selectAll(".line").data([data]);

  context_path
    .enter()
    .append("path")
    .attr("class", "line")
    .attr("id", area ? "line1" : "area1")
    .merge(context_path)
    .transition()
    .duration(2000)
    .attr("d", line2);

  // transition the axes for the mini chart

  context.select(".axis--x").transition().duration(750).call(xAxis2);

  console.log(x.domain(), y.domain());

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
    context.select(".brush").call(brush);

    line_chart_svg.select(".zoom").call(zoom_line);
  }

  function brushed(e) {
    if (e.type === "zoom") return; // ignore brush-by-zoom

    var s = e.selection || x2.range();
    x.domain(s.map(x2.invert, x2));
    Line_chart.selectAll(".line1").attr("d", line);
    focus.select(".axis--x").call(xAxis);
  }

  /**
   * Function to zoom the chart based on the brush, to make the dashboard bidirectional, it even updates the
   * scalar circles as well as the other line chart
   */
  function zoomed(e) {
    if (e.type === "brush") return; // ignore zoom-by-brush
    var t = e.transform;
    x.domain(t.rescaleX(x2).domain());
    Line_chart.selectAll(".line1").attr("d", line);
    focus.select(".axis--x").call(xAxis);
    context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
  }
};
