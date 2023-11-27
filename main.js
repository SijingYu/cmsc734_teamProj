const parseDate = d3.timeParse("%Y%m"); // Parse the date and value fields

// Load the CSV file
d3.csv('mainDatasets.csv').then(function(data) {
    /* ============================== Zining : Start ============================== */
    data.forEach(d => {
      d.YYYYMM = d.YYYYMM.toString()
      d.Value = +d.Value;
    });

    // Filter valid data only
    const validData = data.filter(d => {
        return d.YYYYMM && !isNaN(d.YYYYMM) && !isNaN(d.Value);
    });

    // Filter data for relevant originalSource values
    const descriptionsRQ3 = ['Coal', 'Natural Gas', 'Petroleum', 'Renewable Energy', 'Electricity Sales'];
    const releventDataRQ3 = data.filter(d => 
        ['MER_T02_02', 'MER_T02_03', 'MER_T02_04'].includes(d.orginalSource) &&
        d.YYYYMM.slice(-2) === '13' &&
        descriptionsRQ3.some(desc => d.Description.toLowerCase().indexOf(desc.toLowerCase()) !== -1)
    );
    // Aggregate data by year and source
    const aggregatedDataRQ3 = d3.rollups(releventDataRQ3, 
        v => {
            const totalValue = d3.sum(v, d => d.Value);
            const electricitySalesValue = d3.sum(v, d => d.Description.includes('Electricity Sales') ? d.Value : 0);
            const coalValue = d3.sum(v, d => d.Description.includes('Coal') ? d.Value : 0);
            const naturalGasValue = d3.sum(v, d => d.Description.includes('Natural Gas') ? d.Value : 0);
            const renewableEnergyValue = d3.sum(v, d => d.Description.includes('Renewable Energy') ? d.Value : 0);
            const petroleumValue = d3.sum(v, d => d.Description.includes('Petroleum') ? d.Value : 0);

            // Create an array with the values and then sort it
            const values = [electricitySalesValue, coalValue, petroleumValue, naturalGasValue, renewableEnergyValue].sort((a, b) => b - a);
            // Rank of electricitySalesValue (index in sorted array + 1)
            const rank = values.indexOf(electricitySalesValue) + 1;

            return {
                totalValue: totalValue,
                electricitySalesValue: electricitySalesValue,
                coalValue: coalValue,
                petroleumValue: petroleumValue,
                naturalGasValue: naturalGasValue,
                renewableEnergyValue: renewableEnergyValue,
                rank: rank
              };
        }, 
        d => d.YYYYMM.slice(0, 4), // Extract year as a number
        d => d.orginalSource
        );
    // Calculate percentage for each year and source
    const percentageDataRQ3 = aggregatedDataRQ3.map(([year, sources]) => {
        return sources.map(([source, values]) => {
            let sector;
            switch (source) {
            case 'MER_T02_02':
                sector = 'Residential';
                break;
            case 'MER_T02_03':
                sector = 'Commercial';
                break;
            case 'MER_T02_04':
                sector = 'Industrial';
                break;
            default:
                sector = source; // Default case if the source is none of the above
            }
            return {
                year: year,
                source: sector,
                rank: values.rank,
                percentage: (values.electricitySalesValue / values.totalValue) * 100
            };
        });
    }).flat();
    createLinePlot(percentageDataRQ3, '#chart-rq3');
  
    // Filter data for the scatter plot (originalSource is 'MER_T02_03')
    const scatterPlotData = validData.filter(d => d.orginalSource === 'MER_T02_03');
    createScatterPlot(scatterPlotData, '#chart-scatter');

    /* ============================== Zining : End ============================== */

  });

// RQ3 Function (Zining)
function createLinePlot(filteredData, selector) {
    // Set the dimensions of the canvas / graph
    const textWidth = document.querySelector(selector).offsetWidth;
    const margin = {top: 30, right: 50, bottom: 30, left: 50},
          width = textWidth - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;
  
    // Append the SVG object to the body of the page for the line plot
    const svgLine = d3.select(selector)
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Set the color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Initialize the tooltip
    const tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(d => {
            return `
                <div>
                <strong>Year:</strong> <span>${d.year}</span><br>
                <strong>Percentage:</strong> <span>${d.percentage.toFixed(1)}%</span><br>
                <strong>Sector:</strong> <span>${d.source}</span><br>
                <strong>Rank:</strong> <span>${d.rank}</span>
                </div>`;
        });

    svgLine.call(tip);

    // Function to check if the element is in the viewport
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
        rect.top >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
        );
    }

    let isMouseOverPlot = false;

    function updatePlot(data) {
        // Clear existing content
        svgLine.selectAll("*").remove();

        // Add X axis
        const x = d3.scaleLinear()
            .domain(d3.extent(data, d => d.year))
            .range([0, width]);
        svgLine.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d"))); // Format as a whole number

        // Add Y axis
        const y = d3.scaleLinear()
            .domain([1, d3.max(data, d => d.rank)])
            .range([1, height]);
        // Determine unique integer ranks for y-axis ticks
        const uniqueRanks = Array.from(new Set(data.map(d => d.rank)));
        svgLine.append("g")
            .call(d3.axisLeft(y).tickValues(uniqueRanks).tickFormat(d3.format("d"))); 

        // Calculate the radius scale
        const radiusScale = d3.scaleLinear()
            .domain([d3.min(data, d => d.percentage), d3.max(data, d => d.percentage)])
            .range([d3.min(data, d => d.percentage)*0.2, d3.max(data, d => d.percentage)*0.2]);
        
        // Draw the lines and circles for each group
        const sources = Array.from(new Set(data.map(d => d.source)));
        sources.forEach(source => {
            const dataFiltered = data.filter(d => d.source === source);
        // Line
        svgLine.append("path")
            .datum(dataFiltered)
            .attr("fill", "none")
            .attr("stroke", color(source))
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
            .x(d => x(d.year))
            .y(d => y(d.rank))
            );
    
        // Circles
        dataFiltered.forEach(d => {
            svgLine.append("circle")
            .attr("cx", x(d.year))
            .attr("cy", y(d.rank))
            .attr("r", radiusScale(d.percentage))
            .style("fill", color(source))
            .on('mouseover', function(event) {
                // Highlight circle
                d3.select(this)
                .transition()
                .duration(150)
                .attr("r", radiusScale(d.percentage) * 2) // Increase radius
                .style("fill", d3.color(color(source)).brighter(1))
                .style("stroke-width", "4px")
                .style("stroke", "black"); // Change color
        
                tip.show(d, this);
            })
            .on('mouseout', function(event) {
                // Revert circle to original style
                d3.select(this)
                .transition()
                .duration(150)
                .attr("r", radiusScale(d.percentage)) // Revert radius
                .style("fill", color(source))
                .style("stroke-width", "0")
                .style("stroke", null);
        
                tip.hide(d, this);
            });
        });
        });
    }
    // Initial data filtering for 1950 to 1970
    const initialData = filteredData.filter(d => d.year >= 1950 && d.year <= 1970);
    
    updatePlot(initialData);

    // Mouseover event listener for the plot
    d3.select('#chart-rq3').on('mouseover', function() {
        isMouseOverPlot = true;
    });
    
    // Mouseout event listener for the plot
    d3.select('#chart-rq3').on('mouseout', function() {
        isMouseOverPlot = false;
    });

    // Scroll event listener
    window.addEventListener('scroll', function() {
    if (isMouseOverPlot) {
        const chartElement = document.querySelector('#chart-rq3');
        if (isInViewport(chartElement)) {
        // When the chart is in the viewport, display the full data
        const fullData = filteredData.filter(d => d.year >= 1950 && d.year <= 2023);
        updatePlot(fullData);
        } else {
        // When the chart is not in the viewport, revert to the initial data
        const initialData = filteredData.filter(d => d.year >= 1950 && d.year <= 1970);
        updatePlot(initialData);
        }
    }
    });
  
    // // Add X axis
    // const x = d3.scaleLinear()
    //   .domain(d3.extent(filteredData, d => d.year))
    //   .range([0, width]);
    // svgLine.append("g")
    //   .attr("transform", `translate(0, ${height})`)
    //   .call(d3.axisBottom(x).tickFormat(d3.format("d"))); // Format as a whole number
  
    // // Add Y axis
    // const y = d3.scaleLinear()
    //   .domain([1, d3.max(filteredData, d => d.rank)])
    //   .range([1, height]);
    // // Determine unique integer ranks for y-axis ticks
    // const uniqueRanks = Array.from(new Set(filteredData.map(d => d.rank)));
    // svgLine.append("g")
    //   .call(d3.axisLeft(y).tickValues(uniqueRanks).tickFormat(d3.format("d"))); 
  
    // // Calculate the radius scale
    // const radiusScale = d3.scaleLinear()
    //   .domain([d3.min(filteredData, d => d.percentage), d3.max(filteredData, d => d.percentage)])
    //   .range([d3.min(filteredData, d => d.percentage)*0.2, d3.max(filteredData, d => d.percentage)*0.2]);
  
    // // Draw the lines and circles for each group
    // const sources = Array.from(new Set(filteredData.map(d => d.source)));
    // sources.forEach(source => {
    //   const dataFiltered = filteredData.filter(d => d.source === source);
  
    //   // Line
    //   svgLine.append("path")
    //     .datum(dataFiltered)
    //     .attr("fill", "none")
    //     .attr("stroke", color(source))
    //     .attr("stroke-width", 1.5)
    //     .attr("d", d3.line()
    //       .x(d => x(d.year))
    //       .y(d => y(d.rank))
    //     );
  
    //   // Circles
    //   dataFiltered.forEach(d => {
    //     svgLine.append("circle")
    //       .attr("cx", x(d.year))
    //       .attr("cy", y(d.rank))
    //       .attr("r", radiusScale(d.percentage))
    //       .style("fill", color(source))
    //       .on('mouseover', function(event) {
    //         // Highlight circle
    //         d3.select(this)
    //           .transition()
    //           .duration(150)
    //           .attr("r", radiusScale(d.percentage) * 2) // Increase radius
    //           .style("fill", d3.color(color(source)).brighter(1))
    //           .style("stroke-width", "4px")
    //           .style("stroke", "black"); // Change color
    
    //         tip.show(d, this);
    //       })
    //       .on('mouseout', function(event) {
    //         // Revert circle to original style
    //         d3.select(this)
    //           .transition()
    //           .duration(150)
    //           .attr("r", radiusScale(d.percentage)) // Revert radius
    //           .style("fill", color(source))
    //           .style("stroke-width", "0")
    //           .style("stroke", null);
    
    //         tip.hide(d, this);
    //       });
    //   });
    // });

  }
  
// RQ4 Function (Zining)
function createScatterPlot(filteredData, selector) {
    // Set the dimensions of the canvas / graph
    const textWidth = document.querySelector('#introduction').offsetWidth;
    const margin = {top: 30, right: 20, bottom: 30, left: 50},
          width = textWidth - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;
  
    // Append the SVG object to the body of the page for the scatter plot
    const svgScatter = d3.select(selector)
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Add X axis
    const x = d3.scaleTime()
      .domain(d3.extent(filteredData, d => parseDate(d.YYYYMM)))
      .range([0, width]);
    svgScatter.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x));
  
    // Add Y axis
    const y = d3.scaleLinear()
      .domain([0, d3.max(filteredData, d => d.Value)])
      .range([height, 0]);
    svgScatter.append("g")
      .call(d3.axisLeft(y));
  
    // Add the scatterplot points
    svgScatter.selectAll("circle")
        .data(filteredData)
        .enter().append("circle")
        .attr("r", 5)
        .attr("cx", d => x(parseDate(d.YYYYMM)))
        .attr("cy", d => y(d.Value))
        .style("fill", "#2b76b9");
}

  