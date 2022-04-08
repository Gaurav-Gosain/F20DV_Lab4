const drawMap = (globe = false) => {
  map.select("*").remove();
  // The svg
  const svg_map = map.append("svg");

  svg_map
    .attrs({
      width: document.getElementsByClassName("map")[0].clientWidth,
      height: document.getElementsByClassName("map")[0].clientHeight,
    })
    .styles({
      "border-radius": "20px",
    });

  (width = +svg_map.attr("width")), (height = +svg_map.attr("height"));

  if (globe) {
    projection = d3
      .geoOrthographic()
      .scale(200)
      .translate([width / 2, height / 2]);
  } else {
    projection = d3.geoMercator().translate([width / 2, height / 2]);
  }

  var path = d3.geoPath().projection(projection);

  if (globe) {
    active = null;
    active_k = null;
    // add a circle at the center of the map
    svg_map.append("circle").attrs({
      cx: +svg_map.attr("width") / 2,
      cy: +svg_map.attr("height") / 2,
      r: path.projection().scale(),
      // fill: '#151515'
      "stroke-width": 2,
      stroke: "white",
    });

    svg_map.call(
      d3
        .drag()
        .on("drag", (e) => {
          if (!active) {
            const rotate = projection.rotate();
            const k = 75 / projection.scale();
            projection.rotate([rotate[0] + e.dx * k, rotate[1] - e.dy * k]);
            path = d3.geoPath().projection(projection);
            svg_map.selectAll("path").attr("d", path);
          }
        })
        .on("start", (e) => {
          g.selectAll("circle")
            .transition()
            .duration(200)
            .attr("r", 0)
            .remove();
        })
        .on("end", () => {
          d3.selectAll(".country").each((d) => {
            centroid = projection(d3.geoCentroid(d)); // get the centroid of the country

            g.append("circle")
              .attrs({
                class: "dot_1",
                cx: centroid[0], // set the x position of the circle to the centroid's x
                cy: centroid[1], // set the y position of the circle to the centroid's y
                r: 0,
                fill: "whitesmoke",
                stroke: "black",
                "stroke-width": "0.5px",
                opacity: 0.5,
                id: d.id + "_circle",
              })
              .styles({
                "pointer-events": "none",
              })
              .transition()
              .duration(1000)
              .attrs({
                // set the radius of the circle to the value of the country's population
                r: (dd) => {
                  return percentage_data_grouped.get(d.id)
                    ? circle_scale(
                        d3.max(
                          percentage_data_grouped.get(d.id),
                          (d) =>
                            +d[
                              "Individuals using the Internet (% of population)"
                            ]
                        )
                      )
                    : 0;
                },
              });
          });
        })
    );
  }

  g = svg_map.append("g");

  let zoom = d3.zoom().on("zoom", handleZoom);

  function handleZoom(e) {
    active_k = !globe && e.transform;
    !active && !globe && d3.select("svg g").attr("transform", active_k);
  }
  function initZoom() {
    d3.select("svg").call(zoom);
  }

  var iso_code_list = [];

  // Load external data and boot
  d3.json("data/world.geojson").then(async function (map_data) {
    var percentage_data = await d3.csv(
      "data/share-of-individuals-using-the-internet.csv"
    );

    // console.log(percentage_data);

    percentage_data_grouped = d3.group(percentage_data, function (d) {
      return d.Code;
    });

    var population_data = await d3.csv(
      "data/number-of-internet-users-by-country.csv"
    );

    // console.log(percentage_data);

    population_data_grouped = d3.group(population_data, function (d) {
      return d.Code;
    });

    // console.log(population_data)

    var broadband_data = await d3.csv(
      "data/broadband-penetration-by-country.csv"
    );

    broadband_data_grouped = d3.group(broadband_data, function (d) {
      return d.Code;
    });

    var mobile_data = await d3.csv(
      "data/mobile-cellular-subscriptions-per-100-people.csv"
    );

    // console.log(percentage_data);

    mobile_data_grouped = d3.group(mobile_data, function (d) {
      return d.Code;
    });

    var percentage_colors = d3 // Create a color scale for the area of the place
      .scaleSqrt()
      .domain([0, 100])
      .range(["white", "#BC9E82"]);

    // Draw the map
    function reset(d) {
      g.selectAll(".active")
        .attr("fill", (d) =>
          percentage_colors(
            d3.max(
              percentage_data_grouped
                .get(d.id)
                .map(
                  (d) => d["Individuals using the Internet (% of population)"]
                )
            )
          )
        )
        .classed("active", (active = false));
      g.transition()
        .duration(500)
        .attr("transform", active_k ? active_k : "");
      d3.select("svg").call(zoom);
      svg_map
        .append("text")
        .attrs({
          class: "name",
          x: width / 2,
          y: 0,
          "text-anchor": "middle",
          "dominant-baseline": "middle",
          "font-size": "0.5em",
          "font-weight": "bold",
          fill: "white",
          "pointer-events": "none",
          "font-family": "monospace",
        })
        .styles({
          opacity: 0.5,
          "letter-spacing": "0.05em",
          stroke: "#141414aa",
          "stroke-width": "2px",
        })
        .transition()
        .duration(750)
        .attrs({
          y: 20,
          "font-size": "2.5em",
        })
        .styles({
          opacity: 1,
        })
        .text("World");

      updateLineChartSvg(
        percentage_data_grouped,
        line_chart_svg,
        "Individuals using the Internet (% of population)",
        "OWID_WRL"
      );
      updateLineChartSvg(
        population_data_grouped,
        line_chart2_svg,
        "Number of internet users (OWID based on WB & UN)",
        "OWID_WRL",
        (area = true)
      );
      updateLineChartSvg(
        broadband_data_grouped,
        line_chart3_svg,
        "Fixed broadband subscriptions (per 100 people)",
        "OWID_WRL",
        (area = true)
      );
      updateLineChartSvg(
        mobile_data_grouped,
        line_chart4_svg,
        "Mobile cellular subscriptions (per 100 people)",
        "OWID_WRL",
        (area = true)
      );
      updatePieChart("OWID_WRL");
    }

    map_data.features.forEach((d) => {
      iso_code_list.push(d.id);
    });

    g.append("g")
      .selectAll("path")
      .data(map_data.features)
      .join("path")
      .attr("class", "country")
      .attr("id", function (d) {
        return d.id;
      })
      .attr("d", null)
      .on("click", function (e, d) {
        // when clicked on the map, update the line chart and pie chart
        svg_map
          .selectAll(".name")
          .transition()
          .duration(750)
          .attrs({
            y: 0,
          })
          .styles({
            opacity: 0,
          })
          .remove();

        if (active === d) {
          svg_map.select("circle").transition().duration(1000).attrs({
            opacity: 1,
          });
          return reset(d);
        }

        updateLineChartSvg(
          percentage_data_grouped,
          line_chart_svg,
          "Individuals using the Internet (% of population)",
          d.id
        );
        updateLineChartSvg(
          population_data_grouped,
          line_chart2_svg,
          "Number of internet users (OWID based on WB & UN)",
          d.id,
          (area = true)
        );
        updateLineChartSvg(
          broadband_data_grouped,
          line_chart3_svg,
          "Fixed broadband subscriptions (per 100 people)",
          d.id,
          (area = true)
        );
        updateLineChartSvg(
          mobile_data_grouped,
          line_chart4_svg,
          "Mobile cellular subscriptions (per 100 people)",
          d.id,
          (area = true)
        );
        updatePieChart(d.id);

        svg_map.select("circle").transition().duration(100).attrs({
          opacity: 0,
        });

        svg_map
          .append("text")
          .attrs({
            class: "name",
            x: width / 2,
            y: 0,
            "text-anchor": "middle",
            "dominant-baseline": "middle",
            "font-size": "0.5em",
            "font-weight": "bold",
            fill: "white",
            "pointer-events": "none",
            "font-family": "monospace",
          })
          .styles({
            opacity: 0.5,
            "letter-spacing": "0.05em",
            stroke: "#141414aa",
            "stroke-width": "2px",
          })
          .transition()
          .duration(750)
          .attrs({
            y: 20,
            "font-size": "2.5em",
          })
          .styles({
            opacity: 1,
          })
          .text(d.properties.name);

        g.selectAll(".active")
          .attr("fill", function (d) {
            current_data = percentage_data_grouped.get(d.id);
            if (current_data) {
              return percentage_colors(
                d3.max(
                  current_data.map(
                    (d) => d["Individuals using the Internet (% of population)"]
                  )
                )
              );
            } else {
              return "white";
            }
          })
          .classed("active", false);
        d3.select(this)
          .attr("fill", "brown")
          .classed("active", (active = d)); // changed selection to id

        var b = path.bounds(d);

        g.transition()
          .duration(750)
          .attr(
            // zoom in to the selected country
            "transform",
            "translate(" +
              projection.translate() + // translate to center of screen
              ")" +
              "scale(" +
              0.95 /
                Math.max(
                  (b[1][0] - b[0][0]) / width, // scale to fit width
                  (b[1][1] - b[0][1]) / height // scale to fit height
                ) +
              ")" +
              "translate(" +
              -(b[1][0] + b[0][0]) / 2 + // translate to center of screen
              "," +
              -(b[1][1] + b[0][1]) / 2 + // translate to center of screen
              ")"
          );
      })
      .on("mousemove", function (event, d) {
        d3.selectAll(".tooltip").remove();

        if (percentage_data_grouped.get(d.id) !== undefined) {
          hide_world_tooltip = true;

          label = map
            .append("div")
            .styles({
              position: "absolute",
              "font-weight": "bold",
              "text-align": "center",
              "background-color": "white",
              "border-radius": "20px",
              padding: "5px",
              border: "solid",
              "border-width": "1px",
              "border-color": "black",
              "pointer-events": "none",
              "z-index": "100",
              opacity: "0.8",
              color: "black",
              "font-family": "monospace",
              "font-size": "1.5em",
              left: event.pageX + 20 + "px",
              top: event.pageY + "px",
            })
            .attrs({
              class: "tooltip",
            })
            .html(
              `Country Name: ${d.properties.name} (${d.id})`
              // <hr>Population: ${population.get(d.id)}
              // <br>People Vaccinated:${people_vaccinated.get(d.id)}
              // <br>People Fully Vaccinated:${people_fully_vaccinated.get(
              //             d.id
              //         )}
              // <br>Total Cases: ${total_cases.get(d.id)}
              // <br>Total Deaths: ${total_deaths.get(d.id)}`
            );
          // .append("div")
          // .styles({
          //     "text-transform": "uppercase",
          //     "font-size": ".8em",
          // })
          // .html(
          //     `<hr>The above data corresponds to the timeline ${date_range.get(d.id)[0]
          //     } - ${date_range.get(d.id)[1]}`
          // );
        } else {
          d3.select(this).style("cursor", "not-allowed").on("click", null);
        }
      })
      .on("mouseout", function (e, d) {
        d3.selectAll(".tooltip").remove();
      })
      .transition()
      .duration(750)
      // .attr("fill", (d) => pop_colors(d.properties.POP2005))
      .attr("fill", function (d) {
        current_data = percentage_data_grouped.get(d.id);
        if (current_data) {
          return percentage_colors(
            d3.max(
              current_data.map(
                (d) => d["Individuals using the Internet (% of population)"]
              )
            )
          );
        } else {
          d3.select(this).styles({
            "pointer-events": "none",
            cursor: "disabled",
          });
          return "white";
        }
      })
      .attr("d", path)
      .style("stroke", "black")
      .style("stroke-width", "0.2px");

    parseDate = d3.timeParse("%Y"); // Parse the year

    circle_scale = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(percentage_data_grouped.values(), (d) =>
          d3.max(
            d,
            (d) => d["Individuals using the Internet (% of population)"]
          )
        ),
      ])
      .range([1, 10]);

    d3.selectAll(".country").each((d) => {
      console.log("hello");

      centroid = projection(d3.geoCentroid(d)); // get the centroid of the country

      g.append("circle")
        .attrs({
          class: "dot_1",
          cx: centroid[0], // set the x position of the circle to the centroid's x
          cy: centroid[1], // set the y position of the circle to the centroid's y
          r: 0,
          fill: "whitesmoke",
          stroke: "black",
          "stroke-width": "0.5px",
          opacity: 0.5,
          id: d.id + "_circle",
        })
        .styles({
          "pointer-events": "none",
        })
        .transition()
        .duration(1000)
        .attrs({
          // set the radius of the circle to the value of the country's population
          r: (dd) => {
            return percentage_data_grouped.get(d.id)
              ? circle_scale(
                  d3.max(
                    percentage_data_grouped.get(d.id),
                    (d) =>
                      +d["Individuals using the Internet (% of population)"]
                  )
                )
              : 0;
          },
        });
    });

    defaultLineGraph(
      percentage_data_grouped,
      line_chart_svg,
      "Individuals using the Internet (% of population)",
      "% of Internet Users"
    );
    defaultLineGraph(
      population_data_grouped,
      line_chart2_svg,
      "Number of internet users (OWID based on WB & UN)",
      "No. of Internet Users",
      (area = true)
    );
    defaultLineGraph(
      broadband_data_grouped,
      line_chart3_svg,
      "Fixed broadband subscriptions (per 100 people)",
      "Broadband subscriptions / 100 people",
      (area = true),
      (className = "line_chart3")
    );
    defaultLineGraph(
      mobile_data_grouped,
      line_chart4_svg,
      "Mobile cellular subscriptions (per 100 people)",
      "Cellular subscriptions / 100 people",
      (area = true),
      (className = "line_chart4")
    );

    drawPieChart();
  });

  svg_map
    .append("text")
    .attrs({
      class: "name",
      x: width / 2,
      y: 0,
      "text-anchor": "middle",
      "dominant-baseline": "middle",
      "font-size": "0.5em",
      "font-weight": "bold",
      fill: "white",
      "pointer-events": "none",
      "font-family": "monospace",
    })
    .styles({
      opacity: 0.5,
      "letter-spacing": "0.05em",
      stroke: "#141414aa",
      "stroke-width": "2px",
    })
    .transition()
    .duration(750)
    .attrs({
      y: 20,
      "font-size": "2.5em",
    })
    .styles({
      opacity: 1,
    })
    .text("World");

  initZoom();
};
