var data = [{
    "date": "2020",
    "Coal": 8229, 
    "Natural Gas": 12000,
    "Petroleum": 184, 
    "Nuclear Electric Power": 8251, 
    "Renewable Energys": 2902
}, {
    "date": "2010",
    "Coal": 19133, 
    "Natural Gas": 7528,
    "Petroleum": 370, 
    "Nuclear Electric Power": 8434, 
    "Renewable Energys": 1720
}, {
    "date": "2000",
    "Coal": 20220,
    "Natural Gas": 5293,
    "Petroleum": 1144, 
    "Nuclear Electric Power": 7862, 
    "Renewable Energys": 1447
}, {
    "date": "1990",
    "Coal": 16261, 
    "Natural Gas": 3309,
    "Petroleum": 1289, 
    "Nuclear Electric Power": 6104, 
    "Renewable Energys": 1369
}, {
    "date": "1980",
    "Coal": 12123, 
    "Natural Gas": 3778,
    "Petroleum": 2634, 
    "Nuclear Electric Power": 2739, 
    "Renewable Energys": 964
}, {
    "date": "1970",
    "Coal": 7227, 
    "Natural Gas": 4053,
    "Petroleum": 2117, 
    "Nuclear Electric Power": 239, 
    "Renewable Energys": 851
}, {
    "date": "1960",
    "Coal": 4228, 
    "Natural Gas": 1785,
    "Petroleum": 553, 
    "Nuclear Electric Power": 6, 
    "Renewable Energys": 499
}, {
    "date": "1950",
    "Coal": 2199, 
    "Natural Gas": 650,
    "Petroleum": 472, 
    "Nuclear Electric Power": 0, 
    "Renewable Energys": 333
}];
var key = ["Coal", "Natural Gas", "Petroleum", "Nuclear Electric Power", "Renewable Energys"]
var initStackedBarChart = {
    draw: function (config) {
        me = this,
            domEle = config.element,
            stackKey = config.key,
            data = config.data,
            margin = {
                top: 20,
                right: 40,
                bottom: 30,
                left: 40
            },
            parseDate2 = d3.timeParse("%Y");

        var legendRectSize = 17;
        var legendSpacing = 4;

        //making graph responsive
        default_width = 800;
        default_height = 500;
        default_ratio = default_width / default_height;

        // Determine current size, which determines vars
        function set_size() {
            current_width = window.innerWidth;
            current_height = window.innerHeight;
            current_ratio = current_width / current_height;
            // Check if height is limiting factor
            if (current_ratio > default_ratio) {
                h = default_height;
                w = default_width;
                // Else width is limiting
            } else {
                w = current_width;
                h = w / default_ratio;
                legendSpacing = 2;
                legendRectSize = 7;
            }
            // Set new width and height based on graph dimensions
            width = w - margin.left - margin.right;
            height = h - margin.top - margin.bottom;
        };
        set_size();
        //end responsive graph code
        const tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(d => {
            return `
                <div>${d}</div>`;
        });


        xScale = d3.scaleLinear().rangeRound([0, width]),
            yScale = d3.scaleBand().rangeRound([height, 0]).padding(0.1),
            color = d3.scaleOrdinal(["#222021","#B7C9E2","#4B2D0B","#608da2","#90ee90"])
            xAxis = d3.axisBottom(xScale).ticks(5),
            yAxis = d3.axisLeft(yScale).tickFormat(d3.timeFormat("%Y")),
            svg = d3.select("#" + domEle).append("svg")
            .attr("width", 1000 + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            svg.call(tip);

        var stack = d3.stack()
            .keys(stackKey)
            .order(d3.stackOrder)
            .offset(d3.stackOffsetNone);

        var layers = stack(data);

        //sorts data by date- lowest to highest
        data.sort(function (a, b) {
            return a.date - b.date;
        });
        yScale.domain(data.map(function (d) {
            return parseDate2(d.date);
        }));

        //x max
        xScale.domain([0, d3.max(layers[layers.length - 1], function (d) {
            return 40000;
        })]).nice();

        var layer = svg.selectAll(".layer")
            .data(layers)
            .enter().append("g")
            .attr("class", "layer")
            .style("fill", function (d, i) {
                return color(i);
            });

        var div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        layer.selectAll("rect")
            .data(function (d) {
                return d;
            })
            .enter().append("rect")
            .attr("y", function (d) {
                return yScale(parseDate2(d.data.date));
            })
            .attr("x", function (d) {
                return xScale(d[0]);
            })
            .attr("height", yScale.bandwidth())
            .attr("width", function (d) {
                return xScale(d[1]) - xScale(d[0])
            })
            .on('mouseover', function (d, i) {
                d3.select(this).transition()
                    .duration('200')
                    .attr('opacity', '.7');
                div.transition()
                    .duration(200)
                    .style("opacity", .9);
                let num = (d[1] - d[0]).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
                div.html(num)
                    .style("left", (d3.pageX + 10) + "px")
                    .style("top", (d3.pageY - 15) + "px");
                console.log(d)
                console.log(i)
                console.log(d3.pageX)
                tip.show(i[1]-i[0], this);
            })
            .on('mouseout', function (d, i) {
                d3.select(this).transition()
                    .duration('200')
                    .attr('opacity', '1');
                div.transition()
                    .duration('200')
                    .style("opacity", 0);
                tip.hide(i[1]-i[0], this);
            });

        svg.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + (height + 5) + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "axis axis--y")
            .attr("transform", "translate(0,0)")
            .call(yAxis);

        var legend = svg.selectAll('.legend-bar')
            .data(color.domain())
            .enter()
            .append('g')
            .attr('class', 'legend-bar')
            .attr('transform', function (d, i) {
                var height = legendRectSize + legendSpacing;
                var offset = height * color.domain().length / 2;
                var horz = width - 40;
                var vert = i * height + 7;
                return 'translate(' + horz + ',' + vert + ')';
            });

        legend.append('rect')
            .attr('width', legendRectSize)
            .attr('height', legendRectSize)
            .style('fill', color)
            .style('stroke', color);

        legend.append('text')
            .attr('x', legendRectSize + legendSpacing)
            .attr('y', legendRectSize - legendSpacing)
            .text(function (d) {
                return key[d]
            });


    }

}
initStackedBarChart.draw({
    data: data,
    key: key,
    element: 'stacked-bar'
});