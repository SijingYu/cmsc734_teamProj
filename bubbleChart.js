dataset = {
    "children": [{
            "source": "Coal (1980)",
            "tribtu": 1153
        },
        {
            "source": "Natural Gas (1980)",
            "tribtu": 200
        },
        {
            "source": "Petroleum (1980)",
            "tribtu": 198
        },
        {
            "source": "Coal (1990)",
            "tribtu": 1547
        },
        {
            "source": "Natural Gas (1990)",
            "tribtu": 175
        },
        {
            "source": "Petroleum (1990)",
            "tribtu": 98
        },
        {
            "source": "Coal (2000)",
            "tribtu": 1926
        },
        {
            "source": "Natural Gas (2000)",
            "tribtu": 281
        },
        {
            "source": "Petroleum (2000)",
            "tribtu": 89
        },
        {
            "source": "Coal (2010)",
            "tribtu": 1828
        },
        {
            "source": "Natural Gas (2010)",
            "tribtu": 400
        },
        {
            "source": "Petroleum (2010)",
            "tribtu": 31
        },
        {
            "source": "Coal (2020)",
            "tribtu": 788
        },
        {
            "source": "Natural Gas (2020)",
            "tribtu": 635
        },
        {
            "source": "Petroleum (2020)",
            "tribtu": 16
        }
    ]
};

var diameter = 700;
var color = d3.scaleSequential(d3.interpolateBlues);
var color2 = d3.scaleSequential(d3.interpolateGreens);
var color3 = d3.scaleSequential(d3.interpolateGreys);

//edited the responsive bar code to apply to bubble chart
default_height = 300;
default_ratio = diameter / default_height;

// Determine current size, which determines vars
function set_size() {
    current_width = window.innerWidth;
    current_height = window.innerHeight;
    current_ratio = current_width / current_height;
    // Check if height is limiting factor
    if (current_ratio > default_ratio) {
        diameter = 1000;
        // Else width is limiting
    } else {
        diameter = 800;
    }
};
set_size();

var bubble = d3.pack(dataset)
    .size([diameter, diameter])
    .padding(.7);

var svg = d3.select("#bubble")
    .append("svg")
    .attr("width", diameter)
    .attr("height", diameter)
    .attr("class", "bubble");

var nodes = d3.hierarchy(dataset)
    .sum(function (d) {
        return d.tribtu;
    });


var node = svg.selectAll(".node")
    .data(bubble(nodes).descendants())
    .enter()
    .filter(function (d) {
        return !d.children
    })
    .append("g")
    .on('mouseover', function (d, i) {
        d3.select(this).transition()
            .duration('100')
            .attr('opacity', '.8');
    })
    .on('mouseout', function (d, i) {
        d3.select(this).transition()
            .duration('100')
            .attr('opacity', '1');
    })
    .attr("class", "node")
    .attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
    });

node.append("title")
    .text(function (d) {
        return d.source;
    });

node.append("circle")
    .attr("r", function (d) {
        return d.r;
    })
    .style("fill", function (d, i) {
        if (d.data.source.startsWith('C')){
            v = 255-d.data.tribtu/15;
            return  "rgb(0,0,"+String(v)+")";
        }else if(d.data.source.startsWith('N')){
            v = 255-d.data.tribtu/2;
            console.log("rgb(0,"+String(v)+",0)");
            return "rgb(0,"+String(v)+",0)"
        }else{
            v = 255-d.data.tribtu;
            return "rgb("+String(v)+",0,0)"
        }
    });

node.append("text")
    .attr("dy", ".2em")
    .style("text-anchor", "middle")
    .text(function (d) {
        return d.data.source;
    })
    .attr("font-size", function (d) {
        return d.r / 5;
    })
    .attr("fill", "white");

node.append("text")
    .attr("dy", "1.3em")
    .style("text-anchor", "middle")
    .text(function (d) {
        return d.data.tribtu.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
    })
    .attr("font-size", function (d) {
        return d.r / 5;
    })
    .attr("fill", "white");

d3.select(self.frameElement)
    .style("height", diameter + "px");


