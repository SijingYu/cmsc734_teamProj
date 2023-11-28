const parseDate = d3.timeParse("%Y%m"); // Parse the date and value fields

// Load the CSV file
d3.csv('mainDatasets.csv').then(function(data) {
    /* ============================== Zining : Start ============================== */
    data.forEach(d => {
      d.YYYYMM = d.YYYYMM.toString()
      d.Value = +d.Value;
    });

    // Filter data for RQ3
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

    // Plot for RQ3

    createLinePlot(percentageDataRQ3, '#chart-rq3');
  
    // Filter data for RQ4
    const descriptionsRQ4 = ['Residential', 'Commercial', 'Industrial', 'Transportation']
    const releventDataRQ4 = data.filter(d => 
        ['MER_T09_08'].includes(d.orginalSource) && d.YYYYMM.slice(-2) !== '13' &&
        descriptionsRQ4.some(desc => d.Description.toLowerCase().indexOf(desc.toLowerCase()) !== -1)
    );
    releventDataRQ4.forEach(item => {
        if (isNaN(item.Value)) {
          item.Value = 0; // Replace NaN values with 0
        }
    });
    const years = releventDataRQ4.map(d => parseInt(d.YYYYMM.slice(0, 4)));

    let datasetsRQ4 = descriptionsRQ4.map(description => 
        releventDataRQ4.filter(item => item.Description.includes(description))
    );

    // Create a color scale
    const colorScaleRQ4 = d3.scaleSequential()
    .domain([d3.min(releventDataRQ4, d => d.Value), 
            0.5*(d3.min(releventDataRQ4, d => d.Value)+d3.max(releventDataRQ4, d => d.Value)), 
            d3.max(releventDataRQ4, d => d.Value)]) // Adjust domain to fit your data's range
    .interpolator(t => {
        return t < 0.5 
            ? d3.interpolateRgb("#dbdcd7", "#b3f5c1")(t * 2) // Interpolate between first and second color
            : d3.interpolateRgb("#b3f5c1", "#058a96")((t - 0.5) * 2); // Interpolate between second and third color
    });
    // Plot for RQ4
    createSpiralSubplots(datasetsRQ4, '#chart-rq4', years, colorScaleRQ4);
    createColorBar('#chart-rq4', colorScaleRQ4);

    /* ============================== Zining : End ============================== */

  });


// Functions
// RQ3 Function (Zining)
function createLinePlot(filteredData, selector) {
    // Set the dimensions of the canvas / graph
    const textWidth = document.querySelector(selector).offsetWidth;
    const margin = {top: 30, right: 50, bottom: 80, left: 60},
          width = textWidth - margin.left - margin.right,
          height = 600 - margin.top - margin.bottom;
  
    // Append the SVG object to the body of the page for the line plot
    const svgLine = d3.select(selector)
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Set the color scale
    const color = d3.scaleOrdinal(d3.schemePaired);

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
            .transition()
            .duration(50)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")))
            .selectAll("text") 
            .style("font-family", "Georgia")
            .style("font-size", "18px");
        svgLine.append('text')
            .attr('class', 'x label')
            .attr("transform", `translate(0, ${height})`)
            .style("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", 50)
            .text("Year");

        // Add Y axis
        const y = d3.scaleLinear()
            .domain([d3.min(data, d => d.rank), d3.max(data, d => d.rank)])
            .range([0, height]);
        // Determine unique integer ranks for y-axis ticks
        const uniqueRanks = Array.from(new Set(data.map(d => d.rank)));
        svgLine.append("g")
            .transition()
            .duration(50)
            .call(d3.axisLeft(y).tickValues(uniqueRanks).tickFormat(d3.format("d")))
            .selectAll("text") 
            .style("font-family", "Georgia")
            .style("font-size", "18px");
        svgLine.append('text')
            .attr('class', 'y label')
            .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle")
            .attr("y", -40)
            .attr("x", -height / 2)
            .text("Rank");

        // Calculate the radius scale
        const radiusScale = d3.scaleLinear()
            .domain([d3.min(data, d => d.percentage), d3.max(data, d => d.percentage)])
            .range([d3.min(data, d => d.percentage)*0.2, d3.max(data, d => d.percentage)*0.2]);
        
        // Draw the lines and circles for each group
        const sources = Array.from(new Set(data.map(d => d.source)));
        sources.forEach(source => {
            const dataFiltered = data.filter(d => d.source === source);
            
            // Line
            const line = d3.line()
                .x(d => x(d.year))
                .y(d => y(d.rank));

            const linePath = svgLine.append("path")
                .datum(dataFiltered)
                .attr("fill", "none")
                .attr("stroke", color(source))
                .attr("stroke-width", 1.5)
                .attr("d", line)
                .attr("stroke-dasharray", function() {
                    const length = this.getTotalLength(); 
                    return `${length} ${length}`;
                })
                .attr("stroke-dashoffset", function() {
                    return this.getTotalLength();
                });
            // Animate the line drawing
            linePath.transition()
                .duration(2000)
                .attr("stroke-dashoffset", 0);
        
            // Circles
            dataFiltered.forEach((d, i) => {
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

            // Create a legend group
            const legend = svgLine.append("g")
            .attr("class", "legend")
            .attr("transform", "translate(" + (width - 120) + "," + (height - 120) + ")"); 

            // Add legend items
            sources.forEach((source, index) => {
                // Colored marker for each source
                legend.append("circle")
                    .attr("cx", 5) // Center of the circle, x-coordinate
                    .attr("cy", index * 25 + 5) // Center of the circle, y-coordinate
                    .attr("r", 5) // Radius of the circle
                    .style("fill", color(source)); // Use the same color scale as the lines

                // Text label for each source
                legend.append("text")
                    .attr("x", 20) // Position text right of the rectangle
                    .attr("y", index * 25 + 10) // Vertically align text with rectangle
                    .text(source)
                    .style("font-size", "16px")
                    .style("font-family", "Georgia")
                    .style("text-anchor", "start");
            });
        });
    }
    // Initial data filtering for 1950 to 1970
    const initialData = filteredData.filter(d => d.year >= 1950 && d.year <= 1970);
    
    updatePlot(initialData);
    // Define the text content as an array of lines
    const textLines = [
        "From 1950 to 1970, electricity consumption",
        "was relatively low across residential,",
        "commercial, and industrial sectors, averaging",
        "only about 10% and ranking between 3rd",
        "and 5th among five energy types."
    ];
    // Append a text element at the desired position
    const textBox = svgLine.append("text")
        .attr("x", 20) // X position of the text box
        .attr("y", 80) // Y position of the text box
        .style("font-size", "18px")
        .style("fill", "#3AB2C7")
        .style("opacity", 0);
    // Add tspan elements for each line
    textLines.forEach((line, index) => {
        textBox.append("tspan")
            .attr("x", 420) // X position of each line
            .attr("dy", index === 0 ? 0 : "1.2em") // Offset for line spacing (except first line)
            .text(line);
    });
    textBox.transition()
            .duration(1000) // Duration of the transition in milliseconds
            .style("opacity", 1); 

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
        // Define the text content as an array of lines
        const textLines = [
            "Electricity consumption has grown",
            "significantly over time, with the",
            "commercialsector now accounting",
            "for almost half of the total",
            "energy use, a surge from just",
            "over 40% since the 1990s."
        ];
        // Append a text element at the desired position
        const textBox = svgLine.append("text")
            .attr("x", 20) // X position of the text box
            .attr("y", 20) // Y position of the text box
            .style("font-size", "18px")
            .style("fill", "#89CCC4")
            .style("opacity", 0); // Start with opacity 0 for the transition
        // Add tspan elements for each line
        textLines.forEach((line, index) => {
            textBox.append("tspan")
                .attr("x", 20) // X position of each line
                .attr("dy", index === 0 ? 0 : "1.2em") // Offset for line spacing (except first line)
                .text(line);
        });
        // Create a transition to fade in the text
        textBox.transition()
            .duration(1000) // Duration of the transition in milliseconds
            .style("opacity", 1); // Final opacity is 1 (fully visible)
        } else {
        // When the chart is not in the viewport, revert to the initial data
        const initialData = filteredData.filter(d => d.year >= 1950 && d.year <= 1970);
        updatePlot(initialData);
        // Define the text content as an array of lines
        const textLines = [
            "From 1950 to 1970, electricity consumption",
            "was relatively low across residential,",
            "commercial, and industrial sectors, averaging",
            "only about 10% and ranking between 3rd",
            "and 5th among five energy types."
        ];
        // Append a text element at the desired position
        const textBox = svgLine.append("text")
            .attr("x", 20) // X position of the text box
            .attr("y", 80) // Y position of the text box
            .style("font-size", "18px")
            .style("fill", "#3AB2C7")
            .style("opacity", 0); 
        // Add tspan elements for each line
        textLines.forEach((line, index) => {
            textBox.append("tspan")
                .attr("x", 420) // X position of each line
                .attr("dy", index === 0 ? 0 : "1.2em") // Offset for line spacing (except first line)
                .text(line);
        });
        textBox.transition()
            .duration(1000) // Duration of the transition in milliseconds
            .style("opacity", 1); 
        }
    }
    });

    


}
  
// RQ4 Function (Zining)
function createColorBar(selector, colorScale) {
    // Define the dimensions and position of the color bar
    var colorBarWidth = document.querySelector(selector).offsetWidth-90,
        colorBarHeight = 20,
        colorBarX = 50, // X position of the color bar
        colorBarY = 20; // Y position of the color bar

    // Select the main container and append an SVG for the color bar
    var svg = d3.select(selector)
        .append("svg")
        .attr("width", colorBarWidth + 100)
        .attr("height", colorBarHeight + 60)
        .append("g")
        .attr("transform", `translate(${colorBarX}, ${colorBarY})`);

    // Define the linear gradient
    var defs = svg.append("defs");
    var linearGradient = defs.append("linearGradient")
        .attr("id", "linear-gradient");

    // Set the colors for the gradient stops
    linearGradient.selectAll("stop")
        .data(colorScale.ticks().map((t, i, n) => ({ offset: `${100*i/n.length}%`, color: colorScale(t) })))
        .enter().append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);

    // Draw the rectangle and fill with gradient
    svg.append("rect")
        .attr("width", colorBarWidth)
        .attr("height", colorBarHeight)
        .style("fill", "url(#linear-gradient)");

    // Add min, mid, and max labels below the color bar
    var [minVal, maxVal] = colorScale.domain();

    svg.append("text")
        .attr("x", 0)
        .attr("y", colorBarHeight - 25)
        .style("text-anchor", "start")
        .style("font-size", "16px")
        .text(minVal.toFixed(2));

    svg.append("text")
        .attr("x", colorBarWidth)
        .attr("y", colorBarHeight - 25)
        .style("text-anchor", "end")
        .style("font-size", "16px")
        .text(maxVal.toFixed(2));
    
    svg.append("text")
        .attr("x", colorBarWidth - 200)
        .attr("y", colorBarHeight + 25)
        .style("text-anchor", "end")
        .style("font-size", "16px")
        .text("Average Price of Electricity (Cents per Kilowatthour)");
}

function createSpiralSubplots(datasets, selector, years, colorScale) {
    // Determine the size of each subplot based on the container width
    const totalWidth = document.querySelector(selector).offsetWidth;
    const margin = { top: 30, right: 20, bottom: 30, left: 20 },
          width = (totalWidth / datasets.length) - margin.left - margin.right,
          height = 300 - margin.top - margin.bottom;

    // Function to parse date and sort data
    const parseDate = d3.timeParse("%Y%m");
    datasets.forEach(dataRQ4 => {
        dataRQ4.forEach(d => d.date = parseDate(d.YYYYMM));
        dataRQ4.sort((a, b) => a.date - b.date);
    });

    // Function to create a single spiral graph
    function createSpiralGraph(dataRQ4, svg) {
        // Initialize the tooltip
        const tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(d => {
                return `
                    <div>
                    <strong>Year:</strong> <span>${d.YYYYMM.slice(0, 4)}</span><br>
                    <strong>Month:</strong> <span>${d.YYYYMM.slice(-2)}</span><br>
                    <strong>Price:</strong> <span>${d.Value.toFixed(2)}</span>
                    </div>`;
            });

        svg.call(tip);

        // Get sector information
        const sectorRQ4 = dataRQ4[0].Description.split(", ")[1];

        const radiusScale = d3.scaleLinear()
            .domain([Math.min(...years), Math.max(...years)])
            .range([0, width / 2]); // Adjust radius to fit within the SVG

        // Create bars with colors based on their value
        const arcGenerator = d3.arc();
        svg.selectAll("path")
            .data(dataRQ4)
            .enter()
            .append("path")
            .attr("d", d => {
                // Calculate the necessary dimensions and positions
                const year = parseInt(d.YYYYMM.slice(0, 4));
                const month = parseInt(d.YYYYMM.slice(-2));
                const startAngle = ((month - 1) / 12) * 2 * Math.PI; // Convert month to radians, starting at 0 for January
                const endAngle = (month / 12) * 2 * Math.PI; // End angle for the month
                const innerRadius = radiusScale(year); // Inner radius of the arc for the year
                const outerRadius = innerRadius + 2; // Outer radius of the arc

                // Generate the arc path
                return arcGenerator({
                startAngle: startAngle,
                endAngle: endAngle,
                innerRadius: innerRadius,
                outerRadius: outerRadius
                });
            })
            .attr("transform", (d, i) => `rotate(${90})`)
            .style("fill", "none")
            .style("stroke", d => colorScale(d.Value))
            .style("stroke-width", 1.8)//;
            .on('mouseover', function(event, d) {
                // Highlight
                d3.select(this)
                .transition()
                .duration(150)
                .attr("stroke-width", 3) // Increase stroke width
                .style("stroke", d3.color(d3.color(colorScale(d.Value)).brighter(1)).brighter(1)); // Change color
        
                tip.show(d, this);
            })
            .on('mouseout', function(event, d) {
                // Revert original curve
                d3.select(this)
                .transition()
                .duration(150)
                .attr("stroke-width", 1.8) // Revert stroke width
                .style("stroke", colorScale(d.Value));
        
                tip.hide(d, this);
            });
        
        svg.append("text")
            .attr("dy", "7.5em")
            // .attr("x", (index % 2) * (width / 2) + margin.left) // Adjust x position based on index
            // .attr("y", Math.floor(index / 2) * (height / 2) + margin.top) // Adjust y position based on index
            .attr("text-anchor", "middle") // Center the text
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text(sectorRQ4);
        
    }

    // Create an SVG container for each spiral graph
    datasets.forEach((dataRQ4, index) => {
        const svg = d3.select(selector)
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", `translate(${width / 2 + margin.left},${height / 2 + margin.top})`);

        // Create the spiral graph
        createSpiralGraph(dataRQ4, svg);
    });
}

