// Copyright 2022 Takanori Fujiwara.
// Released under the BSD 3-Clause 'New' or 'Revised' License
/// Modified source copyright
// Copyright 2022 Takanori Fujiwara.
// Released under the BSD 3-Clause 'New' or 'Revised' License

/// Original source copyright
// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/connected-scatterplot


export const connectedScatterplot = (data, {
  svgId = 'connected-scatterplot',
  x = ([x]) => x, // given d in data, returns the (quantitative) x-value
  y = ([, y]) => y, // given d in data, returns the (quantitative) y-value
  r = 3, // (fixed) radius of dots, in pixels
  title, // given d in data, returns the label
  orient = () => 'top', // given d in data, returns a label orientation (top, right, bottom, left)
  texts,
  defined, // for gaps in data
  curve = d3.curveCatmullRom, // curve generator for the line
  width = 640, // outer width, in pixels
  height = 400, // outer height, in pixels
  marginTop = 20, // top margin, in pixels
  marginRight = 20, // right margin, in pixels
  marginBottom = 30, // bottom margin, in pixels
  marginLeft = 30, // left margin, in pixels
  inset = r * 2, // inset the default range, in pixels
  insetTop = inset, // inset the default y-range
  insetRight = inset, // inset the default x-range
  insetBottom = inset, // inset the default y-range
  insetLeft = inset, // inset the default x-range
  xType = d3.scaleLinear, // type of x-scale
  xDomain, // [xmin, xmax]
  xRange = [marginLeft + insetLeft, width - marginRight - insetRight], // [left, right]
  xFormat, // a format specifier string for the x-axis
  xLabel, // a label for the x-axis
  yType = d3.scaleLinear, // type of y-scale
  yDomain, // [ymin, ymax]
  yRange = [height - marginBottom - insetBottom, marginTop + insetTop], // [bottom, top]
  yFormat, // a format specifier string for the y-axis
  yLabel, // a label for the y-axis
  fill = 'brown', // fill color of dots
  stroke = 'currentColor', // stroke color of line and dots
  strokeWidth = 2, // stroke width of line and dots
  strokeLinecap = 'round', // stroke line cap of line
  strokeLinejoin = 'round', // stroke line join of line
  halo = '#ECDEC9', // halo color for the labels
  haloWidth = 3, // halo width for the labels
  duration = 0 // intro animation in milliseconds (0 to disable)
} = {}) => {
  // Compute values.
  const X = d3.map(data, x);
  const Y = d3.map(data, y);
  const T = title == null ? null : d3.map(data, title);
  const E = texts == null ? null : d3.map(data, texts);
  const O = d3.map(data, orient);
  const I = d3.range(X.length);
  if (defined === undefined) defined = (d, i) => !isNaN(X[i]) && !isNaN(Y[i]);
  const D = d3.map(data, defined);

  // Compute default domains.
  if (xDomain === undefined) xDomain = d3.nice(...d3.extent(X), width / 80);
  if (yDomain === undefined) yDomain = d3.nice(...d3.extent(Y), height / 50);

  // Construct scales and axes.
  const xScale = xType(xDomain, xRange);
  const yScale = yType(yDomain, yRange);
  const xAxis = d3.axisBottom(xScale).ticks(width / 80, xFormat);
  const yAxis = d3.axisLeft(yScale).ticks(height / 50, yFormat);

  // Construct the line generator.
  const line = d3.line()
    .curve(curve)
    .defined(i => D[i])
    .x(i => xScale(X[i]))
    .y(i => yScale(Y[i]));

  const svg = d3.create('svg')
    .attr('id', svgId)
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])
    .attr('style', 'max-width: 100%; height: auto; height: intrinsic;');

  svg.append('g')
    .attr('transform', `translate(0,${height - marginBottom})`)
    .call(xAxis)
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('.tick line').clone()
      .attr('y2', marginTop + marginBottom - height)
      .attr('stroke-opacity', 0.1))
    .call(g => g.append('text')
      .attr('x', width-40)
      .attr('y', marginTop + marginBottom - height)
      .attr('fill', 'currentColor')
      .style("font-size", "20px")
      .attr('text-anchor', 'end')
      .attr("font-family", "Georgia")
      .text(xLabel));

  svg.append('g')
    .attr('transform', `translate(${marginLeft},0)`)
    .call(yAxis)
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('.tick line').clone()
      .attr('x2', width - marginLeft - marginRight)
      .attr('stroke-opacity', 0.1))
    .call(g => g.append('text')
      .attr("transform", "rotate(90)")  
      .attr('x', 60)
      .attr('y', -950)
      .attr('fill', 'currentColor')
      .attr('text-anchor', 'start')
      .style("font-size", "20px")
      .attr("font-family", "Georgia")
      .text(yLabel));

  const path = svg.append('path')
    .attr('fill', 'none')
    .attr('stroke', stroke)
    .attr('stroke-width', strokeWidth)
    .attr('stroke-linejoin', strokeLinejoin)
    .attr('stroke-linecap', strokeLinecap)
    .attr('d', line(I));

  svg.append('g')
    .attr('fill', fill)
    .attr('stroke', stroke)
    .attr('stroke-width', strokeWidth)
    .selectAll('circle')
    .data(I.filter(i => D[i]))
    .join('circle')
    .attr('cx', i => xScale(X[i]))
    .attr('cy', i => yScale(Y[i]))
    .attr('r', r);

  const label = svg.append('g')
    .attr('font-family', 'sans-serif')
    .attr('font-size', 12)
    .attr('stroke-linejoin', 'round')
    .selectAll('g')
    .data(I.filter(i => D[i]))
    .join('g')
    .attr('transform', i => `translate(${xScale(X[i])},${yScale(Y[i])})`);

  if (T) label.append('text')
    .text(i => T[i])
    .attr('text-anchor', 'start').attr('dy', '0.5em')
    .text(i => T[i]+"            "+E[i])
    .attr('text-anchor', 'middle').attr('dx', '0.5em')
    .call(text => text.clone(true))
    .attr('fill', 'none')
    .attr('stroke', halo)
    .attr('stroke-width', haloWidth);

  // Measure the length of the given SVG path string.
  const length = path => d3.create('svg:path').attr('d', path).node().getTotalLength();

  const animate = () => {
    if (duration > 0) {
      const l = length(line(I));

      path
        .interrupt()
        .attr('stroke-dasharray', `0,${l}`)
        .transition()
        .duration(duration)
        .ease(d3.easeLinear)
        .attr('stroke-dasharray', `${l},${l}`);

      label
        .interrupt()
        .attr('opacity', 0)
        .transition()
        .delay(i => length(line(I.filter(j => j <= i))) / l * (duration - 125))
        .attr('opacity', 1);
    }
  }

  animate();

  return Object.assign(svg.node(), {
    animate
  });
}
//import {
//  connectedScatterplot
//} from './chart.js';

const driving = await d3.csv('data/coal.csv', d3.autoType);
console.log(driving)
const button = d3.select('#connected_scattered').append('div').append('button').attr('type', 'button').text('Replay');


const play = () => {
  const chart = connectedScatterplot(driving, {
    svgId: 'connected-scatterplot',
    x: d => d.Coal,
    y: d => d.Co2,
    title: d => d.year,
    orient: d => d.side,
    texts: d => d.Event,
    yFormat: '.0f',
    xLabel: 'Coal Consumption for Electricity Generation (Thousand Short Tons)',
    yLabel: 'Co2 Emissions from Coal (Million Metric Tons)',
    width: 1000,
    height: 600,
    duration: 5000 // for the intro animation; 0 to disable
  });
  d3.select('#connected-scatterplot').remove();
  d3.select('#connected_scattered').append(() => chart);
}

play();

// replay
button.on('click', () => {
  play();
});