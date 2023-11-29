//2020
var group1 = [{
    title: "Coal",
    value: 12123
},
{
    title: "Natural Gas",
    value: 3778
},
{
    title: "Petroleum",
    value: 2634
},
{
    title: "Nuclear Electric Power",
    value: 2739
},
{
    title: "Renewable Energys",
    value: 964
}
];

//2010
var group2 = [{
    title: "Coal",
    value: 16261
},
{
    title: "Natural Gas",
    value: 3309
},
{
    title: "Petroleum",
    value: 1289
},
{
    title: "Nuclear Electric Power",
    value: 6104
},
{
    title: "Renewable Energys",
    value: 1369
}
];

//2000
var group3 = [{
    title: "Coal",
    value: 20220
},
{
    title: "Natural Gas",
    value: 5293
},
{
    title: "Petroleum",
    value: 1144
},
{
    title: "Nuclear Electric Power",
    value: 7862
},
{
    title: "Renewable Energys",
    value: 1447
}
];


//1990
var group4 = [{
    title: "Coal",
    value: 19133
},
{
    title: "Natural Gas",
    value: 7528
},
{
    title: "Petroleum",
    value: 370
},
{
    title: "Nuclear Electric Power",
    value: 8434
},
{
    title: "Renewable Energys",
    value: 1720
}
];
//1980
var group5 = [{
    title: "Coal",
    value: 8229
},
{
    title: "Natural Gas",
    value: 12000
},
{
    title: "Petroleum",
    value: 184
},
{
    title: "Nuclear Electric Power",
    value: 8251
},
{
    title: "Renewable Energys",
    value: 2902
}
];

var width = 300,
    height = 300,
    radius = Math.min(width, height) / 2;

color = d3.scaleOrdinal(["#222021","#B7C9E2","#4B2D0B","#608da2","#90ee90"])
            
var pie = d3.pie()
    .value(function (d) {
        return d.value;
    })(group1);

var arc = d3.arc()
    .outerRadius(radius - 10)
    .innerRadius(0);

var svg = d3.select("#pie")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

var g = svg.selectAll("arc")
    .data(pie)
    .enter().append("g")
    .attr("class", "arc")
    .on('mouseover', function (d, i) {
        d3.select(this).transition()
            .duration('50')
            .attr('opacity', '.95');
    })
    .on('mouseout', function (d, i) {
        d3.select(this).transition()
            .duration('50')
            .attr('opacity', '1');
    })
    .attr('transform', 'translate(0, 0)');

g.append("path")
    .attr("d", arc)
    .style("fill", function (d) {
        return color(d.data.title);
    });


//added this for a legend originally. now located in html
// svg.append('g')
//     .attr('class', 'legend')
//     .selectAll('text')
//     .data(group1)
//     .enter()
//     .append('text')
//     .text(function (d) {
//         return '• ' + d.title;
//     })
//     .attr('fill', function (d) {
//         return color(d.title);
//     })
//     .attr('y', function (d, i) {
//         return 19 * (i - 2);
//     })
//     .attr('x', 55);

function changeData(data) {
    var pie = d3.pie()
        .value(function (d) {
            return d.value;
        })(data);

    path = d3.select("#pie")
        .selectAll("path")
        .data(pie); // Compute the new angles
    path.transition().duration(500).attr("d", arc); // redrawing the path with a smooth transition
}

d3.select("button#group1")
    .on("click", function () {
        changeData(group1);
    })
d3.select("button#group2")
    .on("click", function () {
        changeData(group2);
    })
d3.select("button#group3")
    .on("click", function () {
        changeData(group3)
    })
d3.select("button#group4")
    .on("click", function () {
        changeData(group4)
    })
d3.select("button#group5")
    .on("click", function () {
        changeData(group5)
    })