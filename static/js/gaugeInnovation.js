var svg;
var m = { top: 20, right: 20, bottom: 20, left: 20 };
var g;
var color = d3.scaleOrdinal().domain([0, 4]).range(["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00"]);
var newBarData = [];
var dateColor = d3.scaleOrdinal().domain([0, 1, 2, 3, 4]).range(["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00"]);
var dates = ['06 April', '07 April', '08 April', '09 April', '10 April'];

function drawCircularBarGraph(barData, cityNameColor) {

    var X = d3.scaleBand()
        .range([Math.PI, 5 * (Math.PI / 2)])
        .domain(barData.map(d => { return d.region; }))
        .padding(0.4);

    var Y = d3.scaleRadial().range([105, 220]).domain([0, 45]);

    var barg = g.append("g").attr("class", "barg");

    barg.selectAll("barPath").data(newBarData).enter().append("path")
        .attr("fill", newBarData => { return newBarData.color.color; })
        .attr("d", d3.arc()
            .innerRadius(105)
            .outerRadius(function (d) { return Y(d.value); })
            .startAngle(function (d) { return X(d.region); })
            .endAngle(function (d) { return X(d.region) + X.bandwidth(); })
            .padAngle(0.01).padRadius(180))
        .attr("class", "barPath")
        .attr("stroke", newBarData => {
            const originalColor = newBarData.color.color;
            const hslColor = d3.hsl(originalColor);
            hslColor.l -= 0.2;
            const brightenedColor = hslColor.toString();

            return brightenedColor;
        })
        .attr("stroke-width", 3)
        .on("mouseover", function (event, d) {
            tooltip.html("<strong>Region:</strong> " + d.region + "<br><strong>Value:</strong> " + d.value)
                .style("left", event.pageX + "px")
                .style("top", event.pageY + "px")
                .style("opacity", 0.9);
        })
        .on("mouseout", function (event, d) {
            tooltip
                .style("opacity", 0);
        });


    const tooltip = d3.select("#gauge")
        .append("div")
        .style("position", "absolute")
        .attr("class", "tooltip")
        .style("border", "solid")
        .style("border-width", "4px")
        .style("border-radius", "8px")
        .style("font-size", "18px")
        .style("padding", "15px")
        .style("background-color", "white")
        .style("opacity", 0);
}

export function drawGaugeInnovationGraph(data, barData, cityNameColor) {

    newBarData = [];
    var i = 0;
    barData.forEach(element => {
        newBarData.push({ "region": element.region, "value": element.value, "color": cityNameColor[i] });
        i++;
    });

    if (g == undefined) {

        svg = d3.select('#gauge').append("svg")
            .attr("width", 500)
            .attr("height", 450)
            .attr("class", "guageSvg");

        svg
            .append("text")
            .text("Innovative Vis : ")
            .attr("x", 20)
            .attr("y", 20)
            .attr("font-size", "16px")
            .attr("font-weight", "bold");

        svg
            .append("text")
            .text("Shows relative area affected on each day")
            .attr("x", 20)
            .attr("y", 40)
            .attr("font-size", "15px");


        g = svg.append('g')
            .attr('transform', `translate(${m.left + 210},${m.top + 200})`)
            .attr('class', 'gauge');

    }
    else {
        g.selectAll(".gaugeg").remove();
    }

    var gaugeg = g.append('g').attr("class", "gaugeg");


    var factor = 15;

    const arc = d3.arc()
        .innerRadius(function (d, i) { return factor * (i + 2); }).cornerRadius(20)
        .outerRadius(function (d, i) { return factor * (i + 3) - 5; })
        .startAngle(Math.PI)
        .endAngle(5 * Math.PI / 2);

    const path = gaugeg.selectAll('path')
        .data(data)
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', function (d, i) { return '#E5E4E2'; })

    const fillArc = d3.arc()
        .innerRadius(function (d, i) { return factor * (i + 2); }).cornerRadius(20)
        .outerRadius(function (d, i) { return factor * (i + 3) - 5; })
        .startAngle(Math.PI)
        .endAngle(function (d, i) { return Math.PI + (d * 3 * (Math.PI / 200)); })

    const hoverArc = gaugeg
        .append('path')
        .attr("id", "gaugePath-vivek")
        .style("opacity", 0);


    const newPath = gaugeg.selectAll('fillPath')
        .data(data)
        .join(
            enter => enter.append('path')
                .attr('fill', function (d, i) { return dateColor(i); })
                .attr('opacity', 0.75)
                .attr('stroke', 'black')
                .attr('class', 'fillPath')
                .on('mousemove', function (e, d, i) {
                    const distanceFromCenter = Math.sqrt(Math.pow(e.offsetX - 210, 2) + Math.pow(e.offsetY - 200, 2)) - 18;
                    const temparc = d3.arc()
                        .innerRadius(distanceFromCenter)
                        .outerRadius(distanceFromCenter)
                        .startAngle(Math.PI)
                        .endAngle(5 * Math.PI / 2)

                    hoverArc
                        .attr('d', temparc)
                        .attr('fill', '#E5E4E2')
                        .attr('stroke', 'black')
                        .style("opacity", 1)

                    var percentage = parseInt(d.ratio);

                    text.text(`${percentage}%`);
                })
                .on('mouseout', function (e, d, i) {
                    hoverArc.style("opacity", 0)
                    text.text('0%');
                }),
            update => update
            .attr('fill', function (d, i) { return dateColor(i); })
            .attr('opacity', 0.75)
            .attr('stroke', 'black')
                .attr('class', 'fillPath')
                .on('mousemove', function (e, d, i) {
                    const distanceFromCenter = Math.sqrt(Math.pow(e.offsetX - 210, 2) + Math.pow(e.offsetY - 200, 2)) - 18;
                    const temparc = d3.arc()
                        .innerRadius(distanceFromCenter)
                        .outerRadius(distanceFromCenter)
                        .startAngle(Math.PI)
                        .endAngle(5 * Math.PI / 2)

                    hoverArc
                        .attr('d', temparc)
                        .attr('fill', '#E5E4E2')
                        .attr('stroke', 'black')
                        .style("opacity", 1)
                    const percentage = Math.round((d.value / d.total) * 100) + '%';
                    text.text(percentage);
                })
                .on('mouseout', function (e, d, i) {
                    hoverArc.style("opacity", 0)
                    text.text('0%');
                }),
            exit => exit.remove()
        );

    const text = gaugeg.append('text')
        .data(data)
        .attr('text-anchor', 'middle')
        .attr('font-size', '20px')
        .attr('dy', '0.3em')
        .attr('fill', '#000')
        .text('0%');


    newPath.transition().delay(500).duration(3000).attrTween('d', arcTween);

    function arcTween(d, i) {
        d = d.ratio;
        var interpolate = d3.interpolate(0, d);
        return t => fillArc(interpolate(t), i);
    }

    g.selectAll(".barg").remove();
    drawCircularBarGraph(barData, cityNameColor, newBarData);

    d3.select(".legend").remove();

    var legend = g.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(" + -180 + "," + 110 + ")");

    var legendRects = legend.selectAll("rect")
        .data(dateColor.domain())
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", function (d, i) { return i * 20; })
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", function (d) { return dateColor(d); })
        .style("opacity", 0.75)

    var legendLabels = legend.selectAll("text")
        .data(dateColor.domain())
        .enter()
        .append("text")
        .attr("x", 24)
        .attr("y", function (d, i) { return i * 20 + 9; })
        .attr("dy", ".35em")
        .text(function (d, i) { return dates[i]; });

}