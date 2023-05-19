var g;
var axisGrid;
function initializeRadarChart(id, cfg, radius) {
	var svg = d3.select(id).append("svg")
	.attr("width",  500)
	.attr("height", 450)
	.attr("class", "radar");
	
	
	g = svg.append("g")
		.attr("transform", "translate(" + (210) + "," + (cfg.h/2 + cfg.margin.top) + ")");

	


	axisGrid = g.append("g").attr("class", "axisWrapper");
	
	//Draw the background circles
	axisGrid.selectAll(".levels")
	   .data(d3.range(1,(cfg.levels+1)).reverse())
	   .enter()
		.append("circle")
		.transition()
		.duration(1000)
		.attr("class", "gridCircle")
		.attr("r", function(d, i){return radius/cfg.levels*d;})
		.style("fill", "#CDCDCD")
		.style("stroke", "#CDCDCD")
		.style("fill-opacity", cfg.opacityCircles)
		.style("filter" , "url(#glow)");


}


export function RadarChart(id, data, type, sensor_id) {
	

	var dates = ['06 April', '07 April', '08 April', '09 April', '10 April'];

	var cfg = {
	 w: 380,				
	 h: 330,				
	 margin: {top: 70, right: 20, bottom: 20, left: 20}, 
	 levels: 4,				
	 labelFactor: 1.15, 	
	 wrapWidth: 60, 		
	 opacityArea: 0.15, 	
	 dotRadius: 4, 			
	 opacityCircles: 0.3, 	
	 strokeWidth: 2, 		
	 color : d3.scaleOrdinal().domain([0,1,2,3,4]).range(["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00"]),
	 color1 : d3.scaleOrdinal().domain(['2020-04-06','2020-04-07', '2020-04-08', '2020-04-09', '2020-04-10'])
	 .range(["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00"])
	 
	};

	var maxValue = d3.max(data, function(i){return d3.max(i.map(function(o){return o.value;}))});
		
	var allAxis = (data[0].map(function(i, j){return i.axis})),	
		total = allAxis.length,					
		radius = Math.min(cfg.w/2, cfg.h/2), 	
		Format = d3.format('.2f'),			 	
		angleSlice = Math.PI * 2 / total;		
	

	if(g==undefined){
		initializeRadarChart(id,cfg, radius);
	}
	
	
	
	var rScale = d3.scaleLinear()
		.range([0, radius])
		.domain([0, maxValue]);
		
	

	
	axisGrid.selectAll(".axisLabel")
	   .data(d3.range(1,(cfg.levels+1)).reverse())
	   .join(
		(enter) => enter.append("text")
		.transition()
		.duration(3000)
	   .attr("class", "axisLabel")
	   .attr("x", 4)
	   .attr("y", function(d){return -d*radius/cfg.levels;})
	   .attr("dy", "0.4em")
	   .style("font-size", "12px")
	   .attr("fill", "#737373")
	   .text(function(d,i) { return Format(maxValue * d/cfg.levels); }),

	   (update) => update
	   .attr("y", 0)
	   .transition()
	   .duration(3000)
	   .attr("y", function(d){ return -d*radius/cfg.levels;})
	   .text(function(d,i) { return Format(maxValue * d/cfg.levels); }),

	   (exit) => exit.remove()
		)
	   

	g.selectAll(".axis").remove();

	var axis = axisGrid.selectAll(".axis")
		.data(allAxis)
		.enter()
		.append("g")
		.attr("class", "axis");
	
	
		//Cross Axis lines
	axis.append("line")
		.transition()
		.duration(1000)
		.attr("x1", 0)
		.attr("y1", 0)
		.attr("x2", function(d, i){ return rScale(maxValue*1.1) * Math.cos(angleSlice*i - Math.PI/2); })
		.attr("y2", function(d, i){ return rScale(maxValue*1.1) * Math.sin(angleSlice*i - Math.PI/2); })
		.attr("class", "line")
		.style("stroke", "black")
		.style("stroke-width", "2px");

	//labels
	axis.append("text")
		.transition()
		.duration(2000)
		.attr("class", "legend-time")
		.style("font-size", "14px")
		.attr("text-anchor", "middle")
		.attr("dy", "0.35em")
		.attr("x", function(d, i){ return rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice*i - Math.PI/2); })
		.attr("y", function(d, i){ return rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice*i - Math.PI/2); })
		.text(function(d){return d[0]+d[1]})
		.call(wrap, cfg.wrapWidth);

	
	// radial line
	var radarLine = d3.lineRadial()
		//.interpolate("linear-closed")
		.radius(function(d) { return rScale(d.value); })
		.angle(function(d,i) {	return i*angleSlice; });

	//Append the backgrounds	
	g.selectAll(".radarArea")
		.data(data)
		.join(
			(enter) => enter.append("path")
			.style("fill", 'lightgrey')
			.transition()
			.delay(3000)
			.duration(5000)
			.attr("class", function(d,i) {return "radarArea"})
			.attr("d", function(d,i) { return radarLine(d); })
			.style("fill", function(d,i) {  return cfg.color1(d[0].date); })
			.style("fill-opacity", cfg.opacityArea)
			,
			(update) => update
			.transition()
			.delay(3000)
			.duration(2000)
			.attr("class", "radarArea")
			.attr("d", function(d,i) { return radarLine(d); })
			.style("fill", function(d,i) { return cfg.color1(d[0].date); })
			.style("fill-opacity", cfg.opacityArea)
			,
			(exit) => exit.remove
		)
		.on('mouseover', function (d,i){
			d3.selectAll(".radarArea")
				.transition().duration(200)
				.style("fill-opacity", 0.1); 
			d3.select(this)
				.transition().duration(200)
				.style("fill-opacity", 0.7);	
		})
		.on('mouseout', function(){
			d3.selectAll(".radarArea")
				.transition().duration(200)
				.style("fill-opacity", cfg.opacityArea);
		});
		
		
	//outlines	
	g.selectAll(".radarStroke")
	.data(data)
	.join(
		(enter) => enter
		.append("path")
		.transition()
		.delay(5000)
		.duration(2000)
		.attr("class", "radarStroke")
		.attr("d", function(d,i) { return radarLine(d); })
		.style("stroke-width", cfg.strokeWidth + "px")
		.style("stroke", function(d,i) { return cfg.color1(d[0].date); })
		.style("fill", "none")
		.style("filter" , "url(#glow)"),

		(update) => update
		.transition()
		.delay(3000)
		.duration(2000)
		.attr("d", function(d,i) { return radarLine(d); })
	)
	
	d3.selectAll(".info").remove();

	var selectedInfo  = g.append("g")
	.attr("class", "info")
	.attr("transform", "translate(" + (-80) + "," + (-230) + ")");
	
	
	

		var string  = "";

		if(type==0){
			string+="Mobile Sensor : "
		}
		else{
			string += "Static Sensor : "
		}
		string += sensor_id;



		selectedInfo.selectAll("text")
		.data([string])
		.enter()
		.append("text")
		.attr("x", 25)
		.attr("y", 25)
		.attr("class", "infotext")
		.text(function(d) { return d; });

	g.selectAll(".legend").remove();

	var legend = g.append("g")
		.attr("class", "legend")
		.attr("transform", "translate(" + 180 + "," + 110 + ")");

	var legendRects = legend.selectAll("rect")
	.data(cfg.color.domain())
		.enter()
		.append("rect")
		.attr("x", 0)
		.attr("y", function(d, i) { return i * 20; })
		.attr("width", 18)
		.attr("height", 18)
		.style("fill", function(d) { return cfg.color(d); });
	  
	var legendLabels = legend.selectAll("text")
		.data(cfg.color.domain())
		.enter()
		.append("text")
		.attr("x", 24)
		.attr("y", function(d, i) { return i * 20 + 9; })
		.attr("dy", ".35em")
		.text(function(d,i) { return dates[i]; });
	  
	
	


	g.selectAll(".radarCircleWrapper").remove();

	var circleWrapper = g.selectAll(".radarCircleWrapper")
		.data(data)
		.enter().append("g")
		.attr("class", "radarCircleWrapper");
		
		circleWrapper.selectAll(".radarCircle")
		.data(function(d,i) { return d; })
		.enter().append("circle")
		.transition()
			.delay(5000)
			.duration(2000)
			.attr("class", "radarCircle")
			.attr("r", cfg.dotRadius)
			.attr("cx", function(d,i){  return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
			.attr("cy",  function(d,i){  return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
			.style("fill", function(d,i,j) { return cfg.color1(d.date); })
			.style("fill-opacity", 1);
			
		
const radarTooltip = d3.select("#radar_tooltip");
	//Append a set of invisible circles on top for the mouseover pop-up
	circleWrapper.selectAll(".radarInvisibleCircle")
		.data(function(d,i) { return d; })
		.join(
			(enter) => enter.append("circle")
			.attr("class", "radarInvisibleCircle")
			.attr("r", cfg.dotRadius*1.5)
			.attr("cx", function(d,i){ return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
			.attr("cy", function(d,i){ return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
			.style("fill", "none")
			.style("pointer-events", "all"),

			(update) => 
				update
				.attr("cx", function(d,i){ return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
				.attr("cy", function(d,i){ return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); }),

			(exit) => exit.remove()
		)
		
		.on("mouseover", function(d,i) {
			var newX =  parseFloat(d3.select(this).attr('cx')) - 10;
			var newY =  parseFloat(d3.select(this).attr('cy')) - 10;
			
			radarTooltip.html(`<b>Date: ${i.date}</b><br><b>Value: ${i.value.toFixed(2)}</b>`)
				.style("opacity", 1)
				.style("left", `${(d.pageX + 20)}px` )
				.style("top", `${(d.pageY + 20)}px` );
		})
		.on("mouseout", function(){
			radarTooltip
				.style("opacity", 0);
		});
		

		

	
	
	//Taken from http://bl.ocks.org/mbostock/7555321
	//Wraps SVG text	
	function wrap(text, width) {
	  text.each(function() {
		var text = d3.select(this),
			words = text.text().split(/\s+/).reverse(),
			word,
			line = [],
			lineNumber = 0,
			lineHeight = 1.4, // ems
			y = text.attr("y"),
			x = text.attr("x"),
			dy = parseFloat(text.attr("dy")),
			tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
			
		
		while (word = words.pop()) {
		  line.push(word);
		  tspan.text(line.join(" "));
		  if (tspan.node().getComputedTextLength() > width) {
			line.pop();
			tspan.text(line.join(" "));
			line = [word];
			tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
		  }
		}
	  });
	}//wrap	
	
}//RadarChart