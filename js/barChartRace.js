/**
 * This function is used to render and update the bar chart races
 * @param {*} svg_race SVG element to render the bar chart on
 * @param {*} value 
 * @param {*} years 
 * @param {*} heading 
 * @param {*} csv_path 
 * @param {*} tickDuration 
 */
const restart = (
  svg_race,
  value,
  years,
  heading = "Growth of Social Media Platforms over the time",
  csv_path = "data/users-by-social-media-platform.csv",
  tickDuration = 1500
) => {
  svg_race.selectAll("*").remove();

  (w = document.getElementsByClassName("bar_chart_race")[0].clientWidth - 30),
    (h =
      document.getElementsByClassName("bar_chart_race")[0].clientHeight - 30);

  svg_race.attr("width", w).attr("height", h);

  var ticker;

  var top_n = 12;
  var height = h;
  var width = w;

  const margin = {
    top: 80,
    right: 50,
    bottom: 5,
    left: 0,
  };

  let barPadding = (height - (margin.bottom + margin.top)) / (top_n * 5);

  let title = svg_race
    .append("text")
    .attr("class", "title")
    .attr("y", 24)
    .attr("x", w / 2)
    .styles({
      "alignment-baseline": "middle",
      "text-anchor": "middle",
    })
    .html(heading);

  let year = years[0];

  d3.csv(csv_path).then(function (data) {
    //if (error) throw error;

    console.log(data);

    data.forEach((d, i) => {
      (d.value = +d[value]),
        (d.lastValue = i == 0 ? 10000 : +data[i - 1][value]),
        (d.year = +d.Year),
        (d.value = d.value > 0 ? d.value : 0),
        (d.colour = d3.hsl(Math.random() * 360, 0.75, 0.75));
    });

    console.log(data);

    let yearSlice = data
      .filter((d) => d.year == year && !isNaN(d.value))
      .sort((a, b) => b.value - a.value)
      .slice(0, top_n);

    yearSlice.forEach((d, i) => (d.rank = i));

    console.log("yearSlice: ", yearSlice);

    let x = d3
      .scaleLinear()
      .domain([0, d3.max(yearSlice, (d) => d.value)])
      .range([margin.left, width - margin.right - 65]);

    let y = d3
      .scaleLinear()
      .domain([top_n, 0])
      .range([height - margin.bottom, margin.top]);

    let xAxis = d3
      .axisTop()
      .scale(x)
      .ticks(width > 500 ? 5 : 2)
      .tickSize(-(height - margin.top - margin.bottom))
      .tickFormat((d) => d3.format(",")(d));

    svg_race
      .append("g")
      .attr("class", "axis xAxis")
      .attr("transform", `translate(0, ${margin.top})`)
      .call(xAxis)
      .selectAll(".tick line")
      .classed("origin", (d) => d == 0);

    svg_race
      .selectAll("rect.bar")
      .data(yearSlice, (d) => d.Entity)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("rx", 20)
      .attr("x", x(0) + 1)
      .attr("width", (d) => x(d.value) - x(0) - 1)
      .attr("y", (d) => y(d.rank) + 5)
      .attr("height", y(1) - y(0) - barPadding)
      .style("fill", (d) => d.colour);

    svg_race
      .selectAll("text.label")
      .data(yearSlice, (d) => d.Entity)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", (d) => x(d.value) - 8)
      .attr("y", (d) => y(d.rank) + 5 + (y(1) - y(0)) / 2 + 1)
      .style("text-anchor", "end")
      .html((d) => d.Entity);

    let yearText = svg_race
      .append("text")
      .attr("class", "yearText")
      .attr("x", width - margin.right)
      .attr("y", height - 25)
      .style("text-anchor", "end")
      .html(~~year)
      .call(halo, 10);

    ticker = d3.interval((e) => {
      yearSlice = data
        .filter((d) => d.year == year && !isNaN(d.value))
        .sort((a, b) => b.value - a.value)
        .slice(0, top_n);

      yearSlice.forEach((d, i) => (d.rank = i));

      //console.log('IntervalYear: ', yearSlice);

      x.domain([0, d3.max(yearSlice, (d) => d.value)]);

      svg_race
        .select(".xAxis")
        .transition()
        .duration(tickDuration)
        .ease(d3.easeLinear)
        .call(xAxis);

      let bars = svg_race.selectAll(".bar").data(yearSlice, (d) => d.Entity);

      bars
        .enter()
        .append("rect")
        .attr("rx", 20)
        .attr("class", (d) => `bar ${d.Entity.replace(/\s/g, "_")}`)
        .attr("x", x(0) + 1)
        .attr("width", (d) => x(d.value) - x(0) - 1)
        .attr("y", (d) => y(top_n + 1) + 5)
        .attr("height", y(1) - y(0) - barPadding)
        .style("fill", (d) => d.colour)
        .transition()
        .duration(tickDuration)
        .ease(d3.easeLinear)
        .attr("y", (d) => y(d.rank) + 5);

      bars
        .transition()
        .duration(tickDuration)
        .ease(d3.easeLinear)
        .attr("width", (d) => x(d.value) - x(0) - 1)
        .attr("y", (d) => y(d.rank) + 5);

      bars
        .exit()
        .transition()
        .duration(tickDuration)
        .ease(d3.easeLinear)
        .attr("width", (d) => x(d.value) - x(0) - 1)
        .attr("y", (d) => y(top_n + 1) + 5)
        .remove();

      let labels = svg_race
        .selectAll(".label")
        .data(yearSlice, (d) => d.Entity);

      labels
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", (d) => x(d.value) - 8)
        .attr("y", (d) => y(top_n + 1) + 5 + (y(1) - y(0)) / 2)
        .style("text-anchor", "end")
        .html((d) => d.Entity)
        .transition()
        .duration(tickDuration)
        .ease(d3.easeLinear)
        .attr("y", (d) => y(d.rank) + 5 + (y(1) - y(0)) / 2 + 1);

      labels
        .transition()
        .duration(tickDuration)
        .ease(d3.easeLinear)
        .attr("x", (d) => x(d.value) - 8)
        .attr("y", (d) => y(d.rank) + 5 + (y(1) - y(0)) / 2 + 1);

      labels
        .exit()
        .transition()
        .duration(tickDuration)
        .ease(d3.easeLinear)
        .attr("x", (d) => x(d.value) - 8)
        .attr("y", (d) => y(top_n + 1) + 5)
        .remove();

      let valueLabels = svg_race
        .selectAll(".valueLabel")
        .data(yearSlice, (d) => d.Entity);

      valueLabels
        .enter()
        .append("text")
        .attr("class", "valueLabel")
        .attr("x", (d) => x(d.value) + 5)
        .attr("y", (d) => y(top_n + 1) + 5)
        .text((d) => d3.format(",.0f")(d.lastValue))
        .transition()
        .duration(tickDuration)
        .ease(d3.easeLinear)
        .attr("y", (d) => y(d.rank) + 5 + (y(1) - y(0)) / 2 + 1);

      valueLabels
        .transition()
        .duration(tickDuration)
        .ease(d3.easeLinear)
        .attr("x", (d) => x(d.value) + 5)
        .attr("y", (d) => y(d.rank) + 5 + (y(1) - y(0)) / 2 + 1)
        .tween("text", function (d) {
          let i = d3.interpolateRound(d.lastValue, d.value);
          return function (t) {
            this.textContent = d3.format(",")(i(t));
          };
        });

      valueLabels
        .exit()
        .transition()
        .duration(tickDuration)
        .ease(d3.easeLinear)
        .attr("x", (d) => x(d.value) + 5)
        .attr("y", (d) => y(top_n + 1) + 5)
        .remove();

      yearText.html(~~year);

      if (year == years[1]) ticker.stop();
      year = d3.format(".1f")(+year + 1);
    }, tickDuration);
  });

  const halo = function (text, strokeWidth) {
    text
      .select(function () {
        return this.parentNode.insertBefore(this.cloneNode(true), this);
      })
      .style("fill", "#ffffff")
      .style("stroke", "#ffffff")
      .style("stroke-width", strokeWidth)
      .style("stroke-linejoin", "round")
      .style("opacity", 1);
  };
};
