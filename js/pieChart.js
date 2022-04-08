const initPieChart = () => {
  var donut_chart = d3.select(".donut_chart");

  donut_chart.selectAll("*").remove();

  mainDiv = donut_chart;

  svg_pie = mainDiv
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  color = d3.scaleOrdinal().range(d3.schemeSet3);

  (width = +document.getElementsByClassName("donut_chart")[0].clientWidth),
    (height = +document.getElementsByClassName("donut_chart")[0].clientHeight),
    (radius = Math.min(width, height) / 2 + 80);
  pie = d3.pie().sort(null);

  arc = d3
    .arc()
    .innerRadius(radius - 100)
    .outerRadius(radius / 1.5 - 100);

  // Add one dot in the legend for each name.
  var size = 15;
  labels = [
    "% of population without Internet access",
    "% of population with Internet access",
  ];
  mainDiv
    .select("svg")
    .selectAll("pie_dots")
    .data(labels)
    .enter()
    .append("rect")
    .attr("class", "pie_dots")
    .attr("x", 10)
    .attr("y", function (d, i) {
      return 10 + i * (size + 5);
    }) // 100 is where the first dot appears. 25 is the distance between dots
    .attr("width", size)
    .attr("height", size)
    .style("fill", function (d, i) {
      return color(i);
    });

  // Add one dot in the legend for each name.
  mainDiv
    .select("svg")
    .selectAll("pie_labels")
    .data(labels)
    .enter()
    .append("text")
    .attr("class", "pie_labels")
    .attr("x", 10 + size * 1.2)
    .attr("y", function (d, i) {
      return 10 + i * (size + 5) + size / 2;
    }) // 100 is where the first dot appears. 25 is the distance between dots
    .style("fill", function (d, i) {
      return color(i);
    })
    .text(function (d) {
      return d;
    })
    .attr("text-anchor", "left")
    .style("alignment-baseline", "middle")
    .styles({
      "font-size": "12px",
      "font-weight": "bold",
      "text-transform": "uppercase",
      "font-family": "monospace",
    });
};

const drawPieChart = () => {
  updatePieChart("OWID_WRL");
};

updatePieChart = (iso_code) => {
  var percentage_with = percentage_data_grouped.get(iso_code).slice(-1)[0][
    "Individuals using the Internet (% of population)"
  ];
  var percentage_without = 100 - percentage_with;

  var pop_with = population_data_grouped.get(iso_code).slice(-1)[0][
    "Number of internet users (OWID based on WB & UN)"
  ];

  // percentage_with * x = pop_with
  var total_pop = pop_with / (percentage_with / 100);
  var pop_without = total_pop - pop_with;

  console.log(pop_with, total_pop);

  dataset = [
    {
      type: "% of population without Internet access",
      number: +pop_without.toFixed(0),
      percent: (+percentage_without * 100).toFixed(2),
    },
    {
      type: "% of population with Internet access",
      number: +pop_with,
      percent: (+percentage_with * 100).toFixed(2),
    },
  ];

  dataset_values = [+percentage_without, +percentage_with];

  const calculateLeft = (event, window) => {
    return event.x / window.innerWidth > 0.8
      ? event.x - 240 + "px"
      : event.x + 20 + "px";
  };

  const calculateTop = (event, window) => {
    return event.y / window.innerHeight > 0.9
      ? event.y - 60 + "px"
      : event.y + "px";
  };

  var path = svg_pie.selectAll("path.slice").data(pie(dataset_values));

  path.join(
    // General Update Pattern
    (enter) => {
      enter
        .insert("path")
        .style("fill", function (d, i) {
          return color(i);
        })
        .attr("class", "slice")
        .on("mousemove", function (event, d) {
          d3.selectAll(".info").remove();

          d3.selectAll("path").style("opacity", 0.1);
          d3.select(this).style("opacity", 1);

          d3.select("body")
            .append("div")
            .attr("class", "info")
            .html(
              `Value: ${d.value.toFixed(2)}% (${
                dataset[d.index].number
              } people) of the population is the ${dataset[d.index].type}`
            )
            .styles({
              position: "fixed",
              left: calculateLeft(event, window),
              top: calculateTop(event, window),
              "background-color": "black",
              "border-radius": "5px",
              color: "white",
              opacity: "1",
              "font-size": "1em",
              "font-weight": "bold",
              padding: "15px",
              "pointer-events": "none",
              "font-family": "monospace",
            });
        })
        .on("mouseout", function () {
          d3.selectAll("path").style("opacity", 1);

          d3.selectAll(".info").remove();
        })
        .transition()
        .duration(1000)
        .attrTween("d", function (d) {
          var i = d3.interpolate(d.endAngle, d.startAngle);
          return function (t) {
            d.startAngle = i(t);
            return arc(d);
          };
        });
    },
    (update) => {
      update
        .style("fill", function (d, i) {
          return color(i);
        })
        .transition()
        .duration(1000)
        .attrTween("d", function (d) {
          this._current = this._current || d;
          if (this._current === d) {
            var i = d3.interpolate(d.endAngle, d.startAngle);
            return function (t) {
              d.startAngle = i(t);
              return arc(d);
            };
          } else {
            var interpolate = d3.interpolate(this._current, d);
            this._current = interpolate(0);
            return function (t) {
              return arc(interpolate(t));
            };
          }
        });
    },
    (exit) =>
      exit
        .transition()
        .duration(1000)
        .attrTween("d", function (d) {
          var i = d3.interpolate(d.startAngle, d.endAngle);
          return function (t) {
            d.startAngle = i(t);
            return arc(d);
          };
        })
        .style("transform", "scale(3)")
        .style("opacity", 0)
        .remove()
  );
};
