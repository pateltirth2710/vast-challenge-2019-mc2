import { drawradar, readRadarfiles } from "./radarSupport.js";
import { drawGaugeInnovationGraph } from "./gaugeInnovation.js";

var STHIMARK_GEOJSON;
var STHIMARK_TOTAL_AREA = 0;
var mobileSensorReadings;
var selectedIDMobileSensorData;
var mobileSensorPathPlottingInterval;
var cityCoordinates = [];
var xPathScale;
var yPathScale;
var myinterval;
var timeIntervalForRoutePlotting = 100;
var timeIntervalforRadiationFlow = 50;
var mobileSensorRoutePlottingInterval
var edgePoint;
var edgePointMobileSensor;
var newtemp;
var selectedDateMobileSensorData = [];
var totalAffectdAreaRatio;
var cityNameColor = [];
var temp;
var xMax;
var xMin;
var yMax;
var yMin;
var mobileSensorRegionData = [];
var staticSensorRegionData = [];
var x = [];

const MOBILE_SENSOR_ID = 1;
const WIDTH = {

    MAP_SVG: 575,
    ROUTE_MAP_SVG: 550,
    NUCLEAR_PLANT: 30,
    HOSPITALS: 20,
    STATIC_SENSORS: 20
};

const HEIGHT = {

    MAP_SVG: 400,
    ROUTE_MAP_SVG: 400,
    NUCLEAR_PLANT: 30,
    HOSPITALS: 20,
    STATIC_SENSORS: 20,
}

const IMAGE_URL = {

    NUCLEAR_PLANT: "../../data/nuclear-plant.png",
    HOSPITALS: "../../data/hospital.png",
    STATIC_SENSORS: "../../data/static-sensor.png",
}
const CLASS = {

    MAP_SVG: "map_svg",
    ROUTE_MAP_SVG: "route_svg",
    NUCLEAR_PLANT: "nuclearplant",
    STATIC_SENSORS: "staticsensors",
    HOSPITALS: "hospitals",
    REGIONS_STATIC_MAP: "staticregions",
    REGIONS_ROUTE_MAP: "routemapregions",
    MOBILE_SENSOR_ROUTE: "mobile_sensor_route",
}

const LOCATIONS = {

    NUCLEAR_PLANT: [

        { latitude: 0.162679, longitude: -119.784825 }

    ],

    HOSPITALS: [

        { latitude: 0.180960, longitude: -119.959400 },
        { latitude: 0.153120, longitude: -119.915900 },
        { latitude: 0.151090, longitude: -119.909520 },
        { latitude: 0.121800, longitude: -119.904300 },
        { latitude: 0.134560, longitude: -119.883420 },
        { latitude: 0.182990, longitude: -119.855580 },
        { latitude: 0.041470, longitude: -119.828610 },
        { latitude: 0.065250, longitude: -119.744800 },

    ],

    STATIC_SENSORS: [

        { id: 12, latitude: 0.20764, longitude: -119.81556 },
        { id: 15, latitude: 0.16849, longitude: -119.79033 },
        { id: 13, latitude: 0.15979, longitude: -119.80715 },
        { id: 11, latitude: 0.04147, longitude: -119.82861 },
        { id: 6, latitude: 0.1218, longitude: -119.9043 },
        { id: 1, latitude: 0.15689, longitude: -119.9594 },
        { id: 9, latitude: 0.18299, longitude: -119.85558 },
        { id: 14, latitude: 0.1218, longitude: -119.79265 },
        { id: 4, latitude: 0.15109, longitude: -119.90952 },

    ]
}

const longitudeScale = d3.scaleLinear().domain([-120.0, -119.711751]).range([0, WIDTH.MAP_SVG]);
const latitudeScale = d3.scaleLinear().domain([0.238585, 0]).range([0, HEIGHT.MAP_SVG]);
const radiusScaleLow = d3.scaleLinear().domain([0, 200]).range([3, 10]);
const radiusScaleHigh = d3.scaleLinear().domain([1000, 2500]).range([20, 30]);

document.addEventListener('DOMContentLoaded', function () {
    Promise.all([d3.csv("../../data/TotalAffectedAreaRatio.csv"), d3.csv("../../data/MobileSensorRegionData.csv"), d3.csv("../../data/staticSensorRegionData.csv")])
        .then(function (values) {
            mobileSensorRegionData = values[1];
            staticSensorRegionData = values[2];
            totalAffectdAreaRatio = values[0];
            fetchGeoJSONData();
        });

    document.getElementById("date-selection").oninput = plotStartingPoints;
    document.getElementById("radiation-flow").onclick = showRadiationFlow;
    document.getElementById("show-hospitals").onclick = showHospitals;
    document.getElementById("show-static-sensors").onclick = showStaticSensors;
});

function pickElements(arr, startIndex, interval) {
    const result = [];
    for (let i = startIndex; i < arr.length; i += interval) {
        result.push(arr[i]);
    }
    return result;
}

function testRadiationFlow(data, day) {
    var dummydata = pickElements(data, 0, 30);
    var currentDate;

    if (day == "6thApril") {
        currentDate = "2020-04-06";
    }
    if (day == "7thApril") {
        currentDate = "2020-04-07";
    }
    if (day == "8thApril") {
        currentDate = "2020-04-08";
    }
    if (day == "9thApril") {
        currentDate = "2020-04-09";
    }
    if (day == "10thApril") {
        currentDate = "2020-04-10";
    }

    d3.selectAll(`.radiation_time_stamp`).remove();
    d3.selectAll(`.${CLASS.MOBILE_SENSOR_ROUTE}`).remove();
    d3.selectAll(`.mobile-sensor-id-text`).remove();

    d3.select(`.route_svg`)
        .append("g")
        .append("text")
        .text(`Radiation Flow on : `)
        .attr("x", 10)
        .attr("y", 330)
        .attr("class", "radiation_time_stamp");

    d3.select(`.route_svg`)
        .append("g")
        .append("text")
        .text(`${currentDate}`)
        .attr("x", 10)
        .attr("y", 350)
        .attr("class", "radiation_time_stamp");

    d3.selectAll(`.route_svg_circles`).remove();

    d3.select(`.route_svg`)
        .append("g")
        .selectAll(".route_svg_circles")
        .data(dummydata)
        .enter()
        .append("circle")
        .attr("cx", function (d) {

            let longitudeScale = d3.scaleLinear().domain([-120.0, -119.711751]).range([0, WIDTH.ROUTE_MAP_SVG]);
            return longitudeScale(LOCATIONS.NUCLEAR_PLANT[0].longitude);
        })
        .attr("cy", function (d) {

            let latitudeScale = d3.scaleLinear().domain([0.238585, 0]).range([0, HEIGHT.ROUTE_MAP_SVG]);
            return latitudeScale(LOCATIONS.NUCLEAR_PLANT[0].latitude);
        })
        .attr("r", 3)
        .style("fill", "red")
        .attr("class", "route_svg_circles");

    d3.select('.route_svg').selectAll(".route_svg_circles")
        .transition()
        .delay(function (d, i) {
            return (i);
        })
        .duration(500)
        .attr("cx", function (d) {
            let longitudeScale = d3.scaleLinear().domain([-120.0, -119.711751]).range([0, WIDTH.ROUTE_MAP_SVG]);
            return longitudeScale(d.long);

        })
        .attr("cy", function (d) {
            let latitudeScale = d3.scaleLinear().domain([0.238585, 0]).range([0, HEIGHT.ROUTE_MAP_SVG]);
            return latitudeScale(d.lat);
        });

}

function showStaticSensors() {
    d3.selectAll(`.${CLASS.HOSPITALS}`).remove();
    locateStaticSensors();
}
function showHospitals() {
    d3.selectAll(`.${CLASS.STATIC_SENSORS}`).remove();
    locateHospitals();
}

function fetchGeoJSONData() {
    fetch('../../data/StHimark.json')
        .then(response => response.json())
        .then(data => {
            STHIMARK_GEOJSON = data;
            main();
        })
        .catch(error => console.log(error));
}

function locateHospitals() {
    d3.select(`.${CLASS.MAP_SVG}`)
        .selectAll(`.${CLASS.HOSPITALS}`)
        .data(LOCATIONS.HOSPITALS)
        .enter()
        .append("image")
        .attr("xlink:href", IMAGE_URL.HOSPITALS)
        .attr("x", function (d) {
            return longitudeScale(d.longitude);
        })
        .attr("y", function (d) {
            return latitudeScale(d.latitude);
        })
        .attr("width", WIDTH.HOSPITALS)
        .attr("height", HEIGHT.HOSPITALS)
        .attr("class", CLASS.HOSPITALS)
        .attr("transform", `translate(${-WIDTH.HOSPITALS / 2}, ${-HEIGHT.HOSPITALS / 2})`);
}

function locateNuclearPlant() {
    d3.select(`.${CLASS.MAP_SVG}`)
        .selectAll(`.${CLASS.NUCLEAR_PLANT}`)
        .data(LOCATIONS.NUCLEAR_PLANT)
        .enter()
        .append("image")
        .attr("xlink:href", IMAGE_URL.NUCLEAR_PLANT)
        .attr("x", function (d) {
            return longitudeScale(d.longitude);
        })
        .attr("y", function (d) {
            return latitudeScale(d.latitude);
        })
        .attr("width", WIDTH.NUCLEAR_PLANT)
        .attr("height", HEIGHT.NUCLEAR_PLANT)
        .attr("class", CLASS.NUCLEAR_PLANT)
        .attr("transform", `translate(${-WIDTH.NUCLEAR_PLANT / 2}, ${-HEIGHT.NUCLEAR_PLANT / 2})`)
        .on("mouseover", function (event, i) {

            d3.select(".tooltip")
                .style("opacity", 1)
                .html(`<b>St Himark Nuclear Plant<b>`)
                .style("height", "90px")
                .style("position", "absolute")
                .style("left", (event.pageX + 12) + "px")
                .style("top", (event.pageY) + "px")
        })
        .on("mouseout", function () {

            d3.select(".tooltip")
                .style("opacity", 0);
        });

    d3.select(`.${CLASS.ROUTE_MAP_SVG}`)
        .selectAll(`.${CLASS.NUCLEAR_PLANT}`)
        .data(LOCATIONS.NUCLEAR_PLANT)
        .enter()
        .append("image")
        .attr("xlink:href", IMAGE_URL.NUCLEAR_PLANT)
        .attr("x", function (d) {
            let longitudeScale = d3.scaleLinear().domain([-120.0, -119.711751]).range([0, WIDTH.ROUTE_MAP_SVG]);
            return longitudeScale(d.longitude);
        })
        .attr("y", function (d) {
            let latitudeScale = d3.scaleLinear().domain([0.238585, 0]).range([0, HEIGHT.ROUTE_MAP_SVG]);
            return latitudeScale(d.latitude);
        })
        .attr("width", WIDTH.NUCLEAR_PLANT)
        .attr("height", HEIGHT.NUCLEAR_PLANT)
        .attr("class", CLASS.NUCLEAR_PLANT)
        .attr("transform", `translate(${-WIDTH.NUCLEAR_PLANT / 2}, ${-HEIGHT.NUCLEAR_PLANT / 2})`);
}

function locateStaticSensors() {

    d3.select(`.${CLASS.MAP_SVG}`)
        .selectAll(`.${CLASS.STATIC_SENSORS}`)
        .data(LOCATIONS.STATIC_SENSORS)
        .enter()
        .append("image")
        .attr("xlink:href", IMAGE_URL.STATIC_SENSORS)
        .attr("x", function (d) {
            return longitudeScale(d.longitude);
        })
        .attr("y", function (d) {
            return latitudeScale(d.latitude);
        })
        .attr("width", WIDTH.STATIC_SENSORS)
        .attr("height", HEIGHT.STATIC_SENSORS)
        .attr("class", CLASS.STATIC_SENSORS)
        .attr("transform", `translate(${-WIDTH.STATIC_SENSORS / 2}, ${-HEIGHT.STATIC_SENSORS / 2})`)
        .on("click", function (d, i) {
            readRadarfiles(1, i.id);
        })
        .on("mouseover", function (event, i) {

            d3.select(".tooltip")
                .style("opacity", 1)
                .html(`Static Sensor ID : ${i.id}`)
                .style("position", "absolute")
                .style("height", "50px")
                .style("left", (event.pageX + 12) + "px")
                .style("top", (event.pageY) + "px");
        })
        .on("mouseout", function () {

            d3.select(".tooltip")
                .style("opacity", 0);
        });

}

function drawStaticMapSVG() {
    d3.select("#staticmapchart")
        .append("svg")
        .attr("width", WIDTH.MAP_SVG)
        .attr("height", HEIGHT.MAP_SVG)
        .attr("class", CLASS.MAP_SVG);

    d3.select(`.${CLASS.MAP_SVG}`)
        .append("text")
        .text("Nuclear Plant")
        .attr("x", 5)
        .attr("y", `${HEIGHT.MAP_SVG - 100}`)
        .style("font-size", "15px");

    d3.select(`.${CLASS.MAP_SVG}`)
        .append("image")
        .attr("xlink:href", IMAGE_URL.NUCLEAR_PLANT)
        .attr("x", 110)
        .attr("y", `${HEIGHT.MAP_SVG - 110}`)
        .attr("width", "25")
        .attr("height", "25")
        .attr("transform", `translate(${-WIDTH.STATIC_SENSORS / 2}, ${-HEIGHT.STATIC_SENSORS / 2})`)

    d3.select(`.${CLASS.MAP_SVG}`)
        .append("text")
        .text("Static Sensors")
        .attr("x", 5)
        .attr("y", `${HEIGHT.MAP_SVG - 70}`)
        .style("font-size", "15px");

    d3.select(`.${CLASS.MAP_SVG}`)
        .append("image")
        .attr("xlink:href", IMAGE_URL.STATIC_SENSORS)
        .attr("x", 110)
        .attr("y", `${HEIGHT.MAP_SVG - 75}`)
        .attr("width", "25")
        .attr("height", "25")
        .attr("transform", `translate(${-WIDTH.STATIC_SENSORS / 2}, ${-HEIGHT.STATIC_SENSORS / 2})`)

    d3.select(`.${CLASS.MAP_SVG}`)
        .append("text")
        .text("Intial Location of Mobile Sensors")
        .attr("x", 5)
        .attr("y", `${HEIGHT.MAP_SVG - 40}`)
        .style("font-size", "15px");

    d3.select(`.${CLASS.MAP_SVG}`)
        .append("circle")
        .attr("r", 4)
        .attr("cx", 235)
        .attr("cy", `${HEIGHT.MAP_SVG - 45}`);

    d3.select(`.${CLASS.MAP_SVG}`)
        .append("text")
        .text("Hospitals")
        .attr("x", 5)
        .attr("y", `${HEIGHT.MAP_SVG - 10}`)
        .style("font-size", "15px");

    d3.select(`.${CLASS.MAP_SVG}`)
        .append("image")
        .attr("xlink:href", IMAGE_URL.HOSPITALS)
        .attr("x", 80)
        .attr("y", `${HEIGHT.MAP_SVG - 20}`)
        .attr("width", "25")
        .attr("height", "25")
        .attr("transform", `translate(${-WIDTH.STATIC_SENSORS / 2}, ${-HEIGHT.STATIC_SENSORS / 2})`)
}

function createMapProjectionScale(STHIMARK_GEOJSON) {
    xMax = STHIMARK_GEOJSON.geometries[0].coordinates[0][0][0];
    xMin = STHIMARK_GEOJSON.geometries[0].coordinates[0][0][0];
    yMax = STHIMARK_GEOJSON.geometries[0].coordinates[0][0][1];
    yMin = STHIMARK_GEOJSON.geometries[0].coordinates[0][0][1];

    for (var i = 0; i < STHIMARK_GEOJSON.geometries.length; i++) {
        var city_coordinates = STHIMARK_GEOJSON.geometries[i].coordinates[0];

        city_coordinates.forEach(element => {

            if (element[0] > xMax)
                xMax = element[0];

            if (element[0] < xMin)
                xMin = element[0];

            if (element[1] > yMax)
                yMax = element[1];

            if (element[1] < yMin)
                yMin = element[1];

        });
    }

    xPathScale = d3.scaleLinear().domain([xMin, xMax]).range([0, WIDTH.MAP_SVG]);
    yPathScale = d3.scaleLinear().domain([yMax, yMin]).range([0, HEIGHT.MAP_SVG]);
}

function getCoordinatesOfAllPaths(STHIMARK_GEOJSON) {
    for (var i = 0; i < STHIMARK_GEOJSON.geometries.length; i++) {
        var regionCoordinates = [];
        var regionCoordinates = STHIMARK_GEOJSON.geometries[i].coordinates[0];
        cityCoordinates.push(regionCoordinates);
    }
}

function plotPathsStaticMapChart(cityCoordinates) {
    var line = d3.line()
        .x(d => xPathScale(d[0]))
        .y(d => yPathScale(d[1]));

    d3.select(`.${CLASS.MAP_SVG}`)
        .selectAll(`.${CLASS.REGIONS_STATIC_MAP}`)
        .data(cityCoordinates)
        .join(
            function (enter) {
                return enter
                    .append("path")
                    .attr("class", `${CLASS.REGIONS_STATIC_MAP}`)
                    .attr("d", (d) => line(d))
                    .attr("stroke", "black")
                    .attr("stroke-width", 1)
                    .attr("fill", function (d) {
                        return getCityNameColor(JSON.stringify(d))[1];
                    });
            },
            function (update) {
                return update
                    .append("path")
                    .attr("class", `${CLASS.REGIONS_STATIC_MAP}`)
                    .attr("d", (d) => line(d))
                    .attr("stroke", "black")
                    .attr("stroke-width", 1)
                    .attr("fill", "#F0F0F0");
            }
        )
        .on("mouseover", function (d, i) {

            var name = getCityNameColor(JSON.stringify(i))[0];
            plotNameOfRegions(name);
            onClickFunction(name)
            d3.select(this)
                .attr("stroke", "black")
                .attr("stroke-width", 3)
                .attr("fill", "#175FB1")
                .style("margin", "2px");
        })
        .on("mouseout", function (d, i) {
            onClickFunctionReset()
            d3.select(this)
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .attr("fill", getCityNameColor(JSON.stringify(i))[1]);

            d3.selectAll(".regionname").remove();
        })
        .on("click", function (d, i) {
            var [regionName, regionColor, regionPath] = getCityNameColor(JSON.stringify(i))

            fillColorInGaugeSVGMap(regionPath, regionColor);
            regionClickEvent(regionName, regionColor)
            var name = getCityNameColor(JSON.stringify(i))[0];
            plotInnovationChart(name);

        });
}

function fillColorInGaugeSVGMap(regionPath, regionColor) {

    let gaugeSVGPaths = d3.selectAll(".gauge_svg_regions")._groups[0];
    d3.selectAll(gaugeSVGPaths).attr("fill", "#C5C5C5");

    for (var i = 0; i < gaugeSVGPaths.length; i++) {

        if (JSON.stringify(gaugeSVGPaths[i].__data__) == regionPath) {
            d3.select(gaugeSVGPaths[i]).attr("fill", regionColor);
        }
    }

}

function plotNameOfRegions(name) {
    d3.selectAll(".regionname").remove();

    d3.select(`.${CLASS.MAP_SVG}`)
        .append("text")
        .attr("class", "regionname")
        .text(`Selected Region : `)
        .attr("x", 450)
        .attr("y", 20)
        .attr("font-size", "15px");

    d3.select(`.${CLASS.MAP_SVG}`)
        .append("text")
        .attr("class", "regionname")
        .text(`${name}`)
        .attr("x", 450)
        .attr("y", 40)
        .attr("font-size", "15px");
}

function getCityNameColor(path) {
    for (var i = 0; i < cityNameColor.length; i++) {
        if (cityNameColor[i].path_element === path) {
            return [cityNameColor[i].name, cityNameColor[i].color, cityNameColor[i].path_element];
        }
    }
}

function plotPathsRouteMapChart(cityCoordinates) {
    let xPathScale = d3.scaleLinear().domain([xMin, xMax]).range([0, WIDTH.ROUTE_MAP_SVG]);
    let yPathScale = d3.scaleLinear().domain([yMax, yMin]).range([0, HEIGHT.ROUTE_MAP_SVG]);

    var line = d3.line()
        .x(d => xPathScale(d[0]))
        .y(d => yPathScale(d[1]));

    d3.select(`.${CLASS.ROUTE_MAP_SVG}`)
        .selectAll(`.${CLASS.REGIONS_ROUTE_MAP}`)
        .data(cityCoordinates)
        .join(
            function (enter) {
                return enter
                    .append("path")
                    .attr("class", `${CLASS.REGIONS_ROUTE_MAP}`)
                    .attr("d", function (d) {
                        return line(d)
                    })
                    .attr("stroke", "black")
                    .attr("stroke-width", 1)
                    .attr("fill", function (d) {
                        return "#C5C5C5";
                    });
            },
            function (update) {
                return update
                    .append("path")
                    .attr("class", `${CLASS.REGIONS_ROUTE_MAP}`)
                    .attr("d", (d) => line(d))
                    .attr("stroke", "black")
                    .attr("stroke-width", 1)
                    .attr("fill", function (d) {
                        return getCityNameColor(JSON.stringify(d))[1];
                    });
            }
        );
}

// function callMobileSensorRouteIntervalFunction(data)
// {   
//     edgePointMobileSensor = 1000;
//     mobileSensorPathPlottingInterval = setInterval(function(){
//         plotRouteOfSelectedMobileSensor(data);
//     }, 500)
// }

function plotRouteOfSelectedMobileSensor(selectedMobileSensorData) {
    d3.selectAll(`.route_svg_circles`).remove();
    d3.selectAll(`.radiation_time_stamp`).remove();


    var dataToBePlotted = [];
    dataToBePlotted.push(selectedMobileSensorData);

    let longitudeScale = d3.scaleLinear().domain([-120.0, -119.711751]).range([0, WIDTH.ROUTE_MAP_SVG]);
    let latitudeScale = d3.scaleLinear().domain([0.238585, 0]).range([0, HEIGHT.ROUTE_MAP_SVG]);

    var pathline = d3.line()
        .x(function (d) { return longitudeScale(parseFloat(d["long"])); })
        .y(function (d) { return latitudeScale(parseFloat(d["lat"])); });

    d3.select(`.${CLASS.ROUTE_MAP_SVG}`)
        .selectAll(`.${CLASS.MOBILE_SENSOR_ROUTE}`)
        .data(dataToBePlotted)
        .join(
            function (enter) {
                return enter
                    .append("path")
                    .attr("class", `${CLASS.MOBILE_SENSOR_ROUTE}`)
                    .attr("d", (d) => {
                        return pathline(d)
                    })
                    .attr("stroke", "red")
                    .attr("stroke-width", 3)
                    .attr("fill", "none");
            },
            function (update) {
                return update
                    .attr("class", `${CLASS.MOBILE_SENSOR_ROUTE}`)
                    .attr("d", (d) => {
                        return pathline(d)
                    })
                    .attr("stroke", "red")
                    .attr("stroke-width", 3)
                    .attr("fill", "none");
            }
        );
}

function getCityTotalArea() {

    var pathElements = d3.selectAll(`.${CLASS.REGIONS_STATIC_MAP}`)._groups[0];

    for (var i = 0; i < pathElements.length; i++) {
        var path = pathElements[i];
        let pathWidth = path.getBBox().width;
        let pathHeight = path.getBBox().height;
        let area = pathWidth * pathHeight;
        STHIMARK_TOTAL_AREA += area;
    }

    return STHIMARK_TOTAL_AREA;
}

function drawStaticRouteMapSVG() {
    d3.select("#routemapchart")
        .append("svg")
        .attr("width", WIDTH.ROUTE_MAP_SVG)
        .attr("height", HEIGHT.ROUTE_MAP_SVG)
        .attr("class", CLASS.ROUTE_MAP_SVG);
}

var circsvg
var xCirc
var yCirc
var ybis
var ybis2
function createDoubleCircularBarPlot() {
    const margin = { top: 10, right: 75, bottom: 0, left: 0 },

        width = 500 - margin.left - margin.right,
        height = 450 - margin.top - margin.bottom,
        innerRadius = 100,
        outerRadius = 150;

    d3.select("#circularbarplot").selectAll("svg").remove();
    // append the svg object
    circsvg = d3.select("#circularbarplot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${width / 2 + margin.left}, ${height / 2 + margin.top})`);

    var selectedDate = document.getElementById("date-selection").value

    // Define the legend data
    var legendData = [{ color: "#2d86eb", label: "Static Sensor (S)" },
    { color: "#fc5353", label: "Mobile Sensor (M)" }];

    // Define the legend group element
    var legend = circsvg.append("g")
        .attr("transform", `translate(${(width / 2) }, ${(height / 2) * -1})`);

    // Add the rectangles and text to the legend group
    legend.selectAll("rect")
        .data(legendData)
        .enter().append("rect")
        .attr("x", -60)
        .attr("y", function (d, i) { return i * 25; })
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", function (d) { return d.color; });

    legend.selectAll("text")
        .data(legendData)
        .enter().append("text")
        .attr("font-size", "13")
        .attr("x", -40)
        .attr("y", function (d, i) { return i * 25 + 12; })
        .text(function (d) { return d.label; });

       // Define the legend group element
    var heading = circsvg.append("g")
       .attr("transform", `translate(${(width / 2) * -1}, ${(height / 2) * -1})`);
    
       heading.selectAll("text")
       .data(legendData)
       .enter().append("text")
       .attr("font-size", "15")
       .attr("x", 10)
       .attr("y", 8)
       .text("Comparison of Mobile vs Static Sensor readings")
       .attr("font-weight", "bold");



    d3.json('/data/static/' + selectedDate)
        .then(function (static_data) {
            d3.json('/data/mobile/' + selectedDate)
                .then(function (mobile_data) {
                    // X scale: common for 2 data series
                    xCirc = d3.scaleBand()
                        .range([0, 2 * Math.PI])    // X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
                        .align(0)                  // This does nothing
                        .domain(static_data.map(d => d.Region)); // The domain of the X axis is the list of states.

                    // Y scale outer variable
                    yCirc = d3.scaleRadial()
                        .range([innerRadius, outerRadius])   // Domain will be define later.
                        .domain([0, 20]); // Domain of Y is from 0 to the max seen in the data

                    // Second barplot Scales
                    ybis = d3.scaleRadial()
                        .range([innerRadius, 5])   // Domain will be defined later.
                        .domain([0, 75]);

                    // Second barplot Scales
                    ybis2 = d3.scaleRadial()
                        .range([innerRadius, 10])   // Domain will be defined later.
                        .domain([0, 1400]);

                    // Add the bars
                    circsvg.append("g")
                        .selectAll("path")
                        .data(static_data)
                        .join("path")
                        .attr("fill", "#2d86eb")
                        .attr("class", "outerbar")
                        .attr("id", function (d) { return d.Region.replace(/\s+/g, '-').toLowerCase() + "st" })
                        .attr("d", d3.arc()     // imagine your doing a part of a donut plot
                            .innerRadius(innerRadius)
                            .outerRadius(function (d) {
                                return yCirc(0)
                            })
                            .startAngle(d => xCirc(d.Region))
                            .endAngle(d => xCirc(d.Region) + xCirc.bandwidth())
                            .padAngle(0.01)
                            .padRadius(innerRadius))


                    circsvg.selectAll(".outerbar")
                        .transition()
                        .duration(500)
                        .attrTween("d", function (d) {
                            var i = d3.interpolate(yCirc(0), yCirc(d['Value'])); // Interpolate between the initial and final outer radius values
                            return function (t) {
                                return d3.arc()
                                    .innerRadius(innerRadius)
                                    .outerRadius(i(t))
                                    .startAngle(xCirc(d.Region))
                                    .endAngle(xCirc(d.Region) + xCirc.bandwidth())
                                    .padAngle(0.01)
                                    .padRadius(innerRadius)();
                            }
                        })



                    circsvg.selectAll(".outerbar")
                        .on("click", function (event, d) {
                            onClickFunction(d["Region"].replace(/\s+/g, '-').toLowerCase())
                        })
                        .on("mouseover", function (event, d) {    // add a mouseover event listener
                            var value = +d['Value']
                            d3.select(this).attr("fill", "#559ff2");    // change the color of the bar on hover
                            d3.select("#cbptooltip")    // show the tooltip
                                .style("visibility", "visible")
                                .html("Value: " + value.toFixed(2) + " cpm")
                        })
                        .on("mousemove", function (d) {
                            d3.select("#cbptooltip")
                                .style("top", (event.pageY - 10) + "px")    // position the tooltip next to the mouse
                                .style("left", (event.pageX + 10) + "px")
                        })
                        .on("mouseout", function () {    // add a mouseout event listener
                            d3.select(this).attr("fill", "#2d86eb");    // change the color of the bar back to the original color
                            d3.select("#cbptooltip").style("visibility", "hidden");    // hide the tooltip
                        })




                    // Add the second series
                    circsvg.append("g")
                        .selectAll("path")
                        .data(mobile_data)
                        .join("path")
                        .attr("fill", "#fc5353")
                        .attr("class", "innerbar")
                        .attr("id", function (d) { return d.Region.replace(/\s+/g, '-').toLowerCase() + "mo" })
                        .attr("d", d3.arc()     // imagine your doing a part of a donut plot


                            .innerRadius(d => ybis(0))
                            .outerRadius(d => ybis(0))
                            .startAngle(d => xCirc(d.Region))
                            .endAngle(d => xCirc(d.Region) + xCirc.bandwidth())
                            .padAngle(0.01)
                            .padRadius(innerRadius))
                        .on("click", function (event, d) {
                            onClickFunction(d["Region"].replace(/\s+/g, '-').toLowerCase())
                        })
                        .on("mouseover", function (event, d) {    // add a mouseover event listener
                            var value = +d['Value']
                            d3.select(this).attr("fill", "#f57676");    // change the color of the bar on hover
                            d3.select("#cbptooltip")    // show the tooltip
                                .style("visibility", "visible")
                                .html("Value: " + value.toFixed(2) + " cpm")
                        })
                        .on("mousemove", function (d) {
                            d3.select("#cbptooltip")
                                .style("top", (event.pageY - 10) + "px")    // position the tooltip next to the mouse
                                .style("left", (event.pageX + 10) + "px")
                        })
                        .on("mouseout", function () {    // add a mouseout event listener
                            d3.select(this).attr("fill", "#fc5353");    // change the color of the bar back to the original color
                            d3.select("#cbptooltip").style("visibility", "hidden");    // hide the tooltip
                        })

                    circsvg.selectAll(".innerbar")
                        .transition()
                        .duration(500)
                        .attrTween("d", function (d) {
                            var oR = d3.interpolate(ybis(0), (d.Value > 100) ? ybis2(d['Value']) : ybis(d['Value'])); // Interpolate outer radius
                            return function (t) {
                                return d3.arc()
                                    .innerRadius(ybis(0))
                                    .outerRadius(oR(t))
                                    .startAngle(xCirc(d.Region))
                                    .endAngle(xCirc(d.Region) + xCirc.bandwidth())
                                    .padAngle(0.01)
                                    .padRadius(innerRadius)();
                            }
                        })


                    // Add the labels
                    circsvg.append("g")
                        .selectAll("g")
                        .data(static_data)
                        .join("g")
                        .attr("text-anchor", function (d) { return (xCirc(d.Region) + xCirc.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "end" : "start"; })
                        .attr("transform", function (d) { return "rotate(" + ((xCirc(d.Region) + xCirc.bandwidth() / 2) * 180 / Math.PI - 90) + ")" + "translate(" + (yCirc(d['Value']) + 10) + ",0)"; })
                        .append("text")
                        .attr("class", "circularBarLabel")
                        .text(d => d.Region)
                        .attr("id", function (d) { return d.Region })
                        .attr("transform", function (d) { return (xCirc(d.Region) + xCirc.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "rotate(180)" : "rotate(0)"; })
                        .style("font-size", "10px")
                        .style("font-family", "Verdana")
                        .attr("alignment-baseline", "middle")


                })
        })
}

function onClickFunction(reg) {
    var innerRadius = 100
    var outerRadius = 150
    var MobileValue = 0
    var StaticValue = 0
    reg = reg.replace(/\s+/g, '-').toLowerCase()
    circsvg.selectAll(".outerbar")
        .transition()
        .duration(500)
        .attr("d", d3.arc()
            .innerRadius(innerRadius) // increase inner radius by 1.3 times
            .outerRadius(function (d) {

                return yCirc(d['Value']);
            }) // increase outer radius by 1.3 times
            .startAngle(function (d) { return xCirc(d.Region); })
            .endAngle(function (d) { return xCirc(d.Region) + xCirc.bandwidth(); })
            .padAngle(0.01)
            .padRadius(innerRadius)
        )
        .attr("stroke", "none")  // Add a white border to the arc
        .attr("stroke-width", 0)
    circsvg.selectAll(".outerbar#" + reg + "st")
        .transition()
        .duration(500)
        .attr("d", d3.arc()
            .innerRadius(innerRadius * 1.45) // increase inner radius by 1.3 times
            .outerRadius(function (d) {
                StaticValue = +d['Value']
                return yCirc(d['Value']) * 1.45;
            }) // increase outer radius by 1.3 times
            .startAngle(function (d) {
                return xCirc(d.Region) - 0.05;
            })
            .endAngle(function (d) { return xCirc(d.Region) + 0.05 + xCirc.bandwidth(); })
            .padAngle(0.01)
            .padRadius(innerRadius * 1.45)
        )
        .attr("stroke", "white")  // Add a white border to the arc
        .attr("stroke-width", 1)

    circsvg.selectAll(".innerbar")
        .transition()
        .duration(500)
        .attr("d", d3.arc()
            .innerRadius(d => ybis(0))
            .outerRadius(function (d) {
                if (d['Value'] > 100) {
                    return ybis2(d['Value'])
                }
                return ybis(d['Value'])
            })
            .startAngle(d => xCirc(d.Region))
            .endAngle(d => xCirc(d.Region) + xCirc.bandwidth())
            .padAngle(0.01)
            .padRadius(innerRadius)
        )
        .attr("stroke", "white")  // Add a white border to the arc
        .attr("stroke-width", 0)

    circsvg.selectAll(".innerbar#" + reg + "mo")
        .transition()
        .duration(500)
        .attr("d", d3.arc()
            .innerRadius(d => ybis(0) * 1.45)
            .outerRadius(function (d) {
                MobileValue = +d['Value']
                if (d['Value'] > 100) {
                    return ybis2(d['Value']) * 1.45
                }
                return ybis(d['Value']) * 1.45
            })
            .startAngle(d => (xCirc(d.Region) - 0.05))
            .endAngle(d => xCirc(d.Region) + 0.05 + xCirc.bandwidth())
            .padAngle(0.01)
            .padRadius(innerRadius)
        )
        .attr("stroke", "white")  // Add a white border to the arc
        .attr("stroke-width", 1)

    circsvg.selectAll(".cbpText").remove()

    circsvg
        .append("text")
        .attr("class", "cbpText")
        .attr("x", -20)
        .attr("y", -10)
        .html("S: " + StaticValue.toFixed(2))
    circsvg
        .append("text")
        .attr("class", "cbpText")
        .attr("x", -20)
        .attr("y", 10)
        .html("M: " + MobileValue.toFixed(2))
}

function onClickFunctionReset() {
    var innerRadius = 100
    var outerRadius = 150
    circsvg.selectAll(".outerbar")
        .transition()
        .duration(500)
        .attr("d", d3.arc()
            .innerRadius(innerRadius) // increase inner radius by 1.3 times
            .outerRadius(function (d) {
                return yCirc(d['Value']);
            }) // increase outer radius by 1.3 times
            .startAngle(function (d) { return xCirc(d.Region); })
            .endAngle(function (d) { return xCirc(d.Region) + xCirc.bandwidth(); })
            .padAngle(0.01)
            .padRadius(innerRadius)
        )
        .attr("stroke", "none")  // Add a white border to the arc
        .attr("stroke-width", 0)


    circsvg.selectAll(".innerbar")
        .transition()
        .duration(500)
        .attr("d", d3.arc()
            .innerRadius(d => ybis(0))
            .outerRadius(function (d) {
                if (d['Value'] > 100) {
                    return ybis2(d['Value'])
                }
                return ybis(d['Value'])
            })
            .startAngle(d => xCirc(d.Region))
            .endAngle(d => xCirc(d.Region) + xCirc.bandwidth())
            .padAngle(0.01)
            .padRadius(innerRadius)
        )
        .attr("stroke", "white")  // Add a white border to the arc
        .attr("stroke-width", 0)

}




function getSelectedDate() {
    return document.getElementById("date-selection").value;
}

function getSelectedMobileID() {
    return document.getElementById("mobile-sensor-selection").value;
}

async function getSelectedMobileSensorData(date, id) {
    var day;

    if (date === "2020-04-06")
        day = "6thApril";

    if (date === "2020-04-07")
        day = "7thApril";

    if (date === "2020-04-08")
        day = "8thApril";

    if (date === "2020-04-09")
        day = "9thApril";

    if (date === "2020-04-10")
        day = "10thApril";


    await d3.json('/data/mobile_sensor_date/' + "mobile_sensor_reading_" + day + ".json/id/" + id)
        .then(function (data) {
            plotRouteOfSelectedMobileSensor(data);
        })

}

async function getFirstLocations(date) {
    var day;

    if (date === "2020-04-06")
        day = "6thApril";

    if (date === "2020-04-07")
        day = "7thApril";

    if (date === "2020-04-08")
        day = "8thApril";

    if (date === "2020-04-09")
        day = "9thApril";

    if (date === "2020-04-10")
        day = "10thApril";

    await d3.json('/data/first_mobile_sensor_date/' + "mobile_sensor_reading_" + day + ".json/")
        .then(function (data) {
            plotStartingPointsOfMobileSensors(data);
        })
}

function plotStartingPointsOfMobileSensors(data) {

    d3.select(`.${CLASS.MAP_SVG}`)
        .append("g")
        .selectAll("dots")
        .data(data)
        .join(
            enter =>
                enter
                    .append("circle")
                    .attr("cx", function (d) {
                        return longitudeScale(d["long"])
                    })
                    .attr("cy", function (d) {
                        return latitudeScale(d["lat"])
                    })
                    .attr("stroke", "black")
                    .attr("stroke-width", 1)
                    .attr("fill", "black")
                    .attr("r", 3.5),

            update =>
                update
                    .append("circle")
                    .attr("cx", function (d) {
                        return longitudeScale(d["long"])
                    })
                    .attr("cy", function (d) {
                        return latitudeScale(d["lat"])
                    })
                    .attr("r", 3.5)
                    .attr("stroke", "black")
                    .attr("stroke-width", 2)
                    .attr("fill", "black")
        )
        .on("mouseover", function (event, i) {

            d3.select(".tooltip")
                .style("opacity", 1)
                .html(`Sensor ID : <br> ${i.sensor_id}`)
                .style("position", "absolute")
                .style("left", (event.pageX + 12) + "px")
                .style("top", (event.pageY) + "px");
        })
        .on("mouseout", function () {

            d3.select(".tooltip")
                .style("opacity", 0)
        })
        .on("click", function (d, i) {

            d3.selectAll(".mobile-sensor-id-text").remove();

            d3.select(`.${CLASS.ROUTE_MAP_SVG}`)
                .append("text")
                .html(`Mobile Sensor ID : `)
                .attr("x", 10)
                .attr("y", `${HEIGHT.ROUTE_MAP_SVG - 50}`)
                .attr("class", "mobile-sensor-id-text");

            d3.select(`.${CLASS.ROUTE_MAP_SVG}`)
                .append("text")
                .text(`${i.sensor_id}`)
                .attr("x", 130)
                .attr("y", `${HEIGHT.ROUTE_MAP_SVG - 50}`)
                .attr("font-weight", "bold")
                .attr("class", "mobile-sensor-id-text");

            readRadarfiles(0, i.sensor_id);
            plotMobileSensorPath(i.sensor_id);
        });

}

function plotStartingPoints() {
    var selectedDate = getSelectedDate();
    getFirstLocations(selectedDate);
}

async function plotMobileSensorPath(sensor_id) {
    var selectedMobileSensorID = sensor_id;
    var selectedDate = await getSelectedDate();
    await getSelectedMobileSensorData(selectedDate, selectedMobileSensorID);
}

function showRadiationFlow() {
    var date = getSelectedDate();
    var day;

    if (date === "2020-04-06")
        day = "6thApril";

    if (date === "2020-04-07")
        day = "7thApril";

    if (date === "2020-04-08")
        day = "8thApril";

    if (date === "2020-04-09")
        day = "9thApril";

    if (date === "2020-04-10")
        day = "10thApril";

    fetchParticularDateData(day);
}

function fetchParticularDateData(day) {
    var query = '/data/mobile_sensor/' + "mobile_sensor_reading_" + day + ".json";
    d3.json(query)
        .then(function (data) {
            testRadiationFlow(data, day);
        })
}

function addToolTip() {
    var tooltip = d3.select("#staticmapchart")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("text-align", "center")
        .style("width", "100px")
        .style("height", "50px")
        .attr("transform", "translate(50,50)");
}

function asignNameColor(cityCoordinates) {
    cityNameColor.push({ path_element: JSON.stringify(cityCoordinates[0]), name: "Palace Hills", color: "#ff7f94" });
    cityNameColor.push({ path_element: JSON.stringify(cityCoordinates[1]), name: "Northwest", color: "#bf7fff" });
    cityNameColor.push({ path_element: JSON.stringify(cityCoordinates[2]), name: "Old Town", color: "#fff87f" });
    cityNameColor.push({ path_element: JSON.stringify(cityCoordinates[3]), name: "Safe Town", color: "#ff7ff0" });
    cityNameColor.push({ path_element: JSON.stringify(cityCoordinates[4]), name: "Southwest", color: "#ffc57f" });
    cityNameColor.push({ path_element: JSON.stringify(cityCoordinates[5]), name: "Downtown", color: "#7fd4ff" });
    cityNameColor.push({ path_element: JSON.stringify(cityCoordinates[6]), name: "Wilson Forest", color: "#82b97f" });
    cityNameColor.push({ path_element: JSON.stringify(cityCoordinates[7]), name: "Scenic Vista", color: "#fff87f" });
    cityNameColor.push({ path_element: JSON.stringify(cityCoordinates[8]), name: "Broadview", color: "#bf7fff" });
    cityNameColor.push({ path_element: JSON.stringify(cityCoordinates[9]), name: "Chapparal", color: "#7fffff" });
    cityNameColor.push({ path_element: JSON.stringify(cityCoordinates[10]), name: "Terrapin Springs", color: "#ffd47f" });
    cityNameColor.push({ path_element: JSON.stringify(cityCoordinates[11]), name: "Pepper Mill", color: "#ff7f7f" });
    cityNameColor.push({ path_element: JSON.stringify(cityCoordinates[12]), name: "Cheddarford", color: "#7fddff" });
    cityNameColor.push({ path_element: JSON.stringify(cityCoordinates[13]), name: "Easton", color: "#7ffff0" });
    cityNameColor.push({ path_element: JSON.stringify(cityCoordinates[14]), name: "Weston", color: "#847fff" });
    cityNameColor.push({ path_element: JSON.stringify(cityCoordinates[15]), name: "Southton", color: "#aaff7f" });
    cityNameColor.push({ path_element: JSON.stringify(cityCoordinates[16]), name: "Oak Willow", color: "#fffb7f" });
    cityNameColor.push({ path_element: JSON.stringify(cityCoordinates[17]), name: "East Parton", color: "#ffd07f" });
    cityNameColor.push({ path_element: JSON.stringify(cityCoordinates[18]), name: "West Parton", color: "#ff7f7f" });

}

function selectMultipleStates() {
    var elements = d3.select(`.${CLASS.REGIONS_STATIC_MAP}`);
}

function main() {
    //Plotting SVGs
    drawStaticMapSVG();
    drawStaticRouteMapSVG();


    //Create Map Projection and get coordinates of all paths
    createMapProjectionScale(STHIMARK_GEOJSON);
    getCoordinatesOfAllPaths(STHIMARK_GEOJSON);

    asignNameColor(cityCoordinates);

    //Plotting of Regions in Maps
    plotPathsStaticMapChart(cityCoordinates);
    // plotPathsStaticMapChart(cityCoordinates);
    plotPathsRouteMapChart(cityCoordinates);

    //Plotting of Nuclear Plant and Static Sensors
    locateNuclearPlant();
    locateStaticSensors();
    // locateHospitals();

    //Get Total area of the StHimark City.
    var STHIMARK_TOTAL_AREA = getCityTotalArea();

    // Create Circular Bar Plot
    createDoubleCircularBarPlot();

    //Plot Starting Points of Mobile Sensors
    plotStartingPoints();

    //Plotting of ToolTip Div
    addToolTip();

    var gaugebardata = getFinalDayAffectedArea();
    var barColor = cityNameColor;
    drawGaugeInnovationGraph(totalAffectdAreaRatio, gaugebardata, barColor);
    drawMapInGaugeChart();


}

function drawMapInGaugeChart() {
    let canvas = d3.select(".guageSvg");
    let gaugeSVGXScale, gaugeSVGYScale;
    gaugeSVGXScale = d3.scaleLinear().domain([xMin, xMax]).range([0, 220]);
    gaugeSVGYScale = d3.scaleLinear().domain([yMax, yMin]).range([0, 175]);

    var line = d3.line()
        .x(d => gaugeSVGXScale(d[0]))
        .y(d => gaugeSVGYScale(d[1]));

    canvas
        .selectAll(`.gauge_svg_regions`)
        .data(cityCoordinates)
        .join(
            function (enter) {
                return enter
                    .append("path")
                    .attr("class", `gauge_svg_regions`)
                    .attr("d", function (d) {
                        return line(d)
                    })
                    .attr("stroke", "black")
                    .attr("stroke-width", 1)
                    .attr("fill", function (d) {
                        return "#C5C5C5";
                    });
            },
            function (update) {
                return update
                    .append("path")
                    .attr("class", `gauge_svg_regions`)
                    .attr("d", (d) => line(d))
                    .attr("stroke", "black")
                    .attr("stroke-width", 1)
                    .attr("fill", function (d) {
                        return getCityNameColor(JSON.stringify(d))[1];
                    });
            }
        )
        .attr("transform", "translate(250, 230)");





}

function getFinalDayAffectedArea() {
    var eachRegionFinalAffectedRatio = [];
    let totalRadiationOnLastDay = 0;

    for (var i = 0; i < mobileSensorRegionData.length; i++) {

        if (mobileSensorRegionData[i].date === "2020-04-10") {
            eachRegionFinalAffectedRatio.push({ region: mobileSensorRegionData[i].region, value: parseFloat(mobileSensorRegionData[i].value) });
            totalRadiationOnLastDay += parseFloat(mobileSensorRegionData[i].value);
        }
    }

    for (var i = 0; i < eachRegionFinalAffectedRatio.length; i++) {
        let temp = (eachRegionFinalAffectedRatio[i].value / totalRadiationOnLastDay) * 100;
        eachRegionFinalAffectedRatio[i].value = temp;
    }
    return eachRegionFinalAffectedRatio;
}


function plotInnovationChart(clickedRegion) {
    
    let data = [];
    let dataToBePlotted = [];
    let totalRadiation = 0;
    let maxRadiation = 0

    for (var i = 0; i < mobileSensorRegionData.length; i++) {
        if (mobileSensorRegionData[i].region === clickedRegion) {
            data.push(mobileSensorRegionData[i]);
            totalRadiation += parseFloat(mobileSensorRegionData[i].value);

            if (parseFloat(mobileSensorRegionData[i].value) > maxRadiation)
                maxRadiation = parseFloat(mobileSensorRegionData[i].value);
        }
    }

    for (let i = 0; i < data.length; i++) {
        dataToBePlotted.push({ region: data[i].region, date: data[i].date, ratio: parseFloat(data[i].value) * 100 / (maxRadiation) });
    }
    var gaugebardata = getFinalDayAffectedArea();
    drawGaugeInnovationGraph(dataToBePlotted, gaugebardata, cityNameColor);

}

//----------------------------Chart 5 - Line Chart Begin------------------------------
$(".checkbox-menu").on("change", "input[type='checkbox']", function () {
    $(this).closest("li").toggleClass("active", this.checked);
    
    regionFilter()
});
$('select').on('change', function () {
    
    regionFilter();
    createDoubleCircularBarPlot();
});

$(document).on('click', '.allow-focus', function (e) {
    e.stopPropagation();
});

var regionsList = [];
function regionFilter() {
    var regions = document.getElementsByName("region");
    var selectedDate = document.getElementById("date-selection");
    regionsList = [];
    for (var i = 0; i < regions.length; i++) {
        if (regions[i].type === "checkbox" && regions[i].checked) {
            regionsList.push(regions[i].title);
        }
    }
    
    d3.text("/filterData", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            date: selectedDate.value,
            regions: regionsList
        })
    }).then(function (response) {
        
        initializeLineChart()
    }).catch(function (error) {
        console.log(error);
    });
}

function addRigdeLineChart(name) {
    var regions = document.getElementsByName("region");
    regionsList = [];
    for (var i = 0; i < regions.length; i++) {
        if (regions[i].type === "checkbox" && regions[i].title === name) {
            regions[i].checked = true;
        }
    }
    for (var i = 0; i < regions.length; i++) {
        if (regions[i].type === "checkbox" && regions[i].checked) {
            regionsList.push(regions[i].title);
        }
    }
    var selectedDate = document.getElementById("date-selection");
    

    d3.text("/filterData", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            date: selectedDate.value,
            regions: regionsList
        })
    }).then(function (response) {
        initializeLineChart()
    }).catch(function (error) {
        console.log(error);
    });
}

function regionClickEvent(name, color) {
    addRigdeLineChart(name);
    onClickFunction(name)
}

var lineChartSvg;
var margin = { top: 50, right: 10, bottom: 30, left: 90 },
    width = 1150 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var overlap = 0.6;

var formatTime = d3.timeFormat('%I %p');

var x = function (d) { return d.time; },
    xScale = d3.scaleTime().range([0, width]),
    xValue = function (d) { return xScale(x(d)); },
    xAxis = d3.axisBottom(xScale).tickFormat(formatTime);

var y = function (d) { return d.value; },
    yScale = d3.scaleLinear(),
    yValue = function (d) { return yScale(y(d)); };

var region = function (d) { return d.key; },
    regionScale = d3.scaleBand().range([0, height]),
    regionValue = function (d) { return regionScale(region(d)); },
    regionAxis = d3.axisLeft(regionScale);

var area = d3.area()
    .x(xValue)
    .y1(yValue);

var line = area.lineY1();

function parseTime(timestamp) {
    var date = new Date(timestamp);
    return d3.timeMinute(date);
}

function row(d) {
    return {
        region: d.region,
        time: parseTime(d.Timestamp),
        value: +d.p_smooth
    };
}

function getRegionColor(region) {
    for (var i = 0; i < cityNameColor.length; i++) {
        if (cityNameColor[i].name === region)
            return cityNameColor[i].color;
    }
}

function initializeLineChart() {
    d3.select("#lineplot").selectAll("*").remove();
    lineChartSvg = d3.select("#lineplot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    d3.csv("data/aggregatedfiltered.csv", row).then((dataFlat) => {
        dataFlat.sort(function (a, b) { return a.time - b.time; });
        var data = Array.from(d3.group(dataFlat, (d) => d.region)).map(
            ([key, values]) => {
                return {
                    key: key,
                    values: values,
                };
            }
        );

        // Sort activities by peak activity time
        function peakTime(d) {
            var i = d3.scan(d.values, function (a, b) { return y(b) - y(a); });
            return d.values[i].time;
        };

        data.sort(function (a, b) { return peakTime(b) - peakTime(a); });

        xScale.domain(d3.extent(dataFlat, x));

        regionScale.domain(data.map(function (d) { return d.key; }));
        // regionScale.domain([0,20]);

        var areaChartHeight = (1 + overlap) * (height / regionScale.domain().length);

        // yScale.domain(d3.extent(dataFlat, y))
        yScale.domain([0, 1])
            .range([areaChartHeight, 0]);

        area.y0(yScale(0));

        lineChartSvg.append('g').attr('class', 'axis axis--x')
            .attr("transform", `translate(0, ${height})`)
            .call(xAxis);

        lineChartSvg.append("text")
            .attr("x", 1025)
            .attr("y", 435)
            .text("Time")
            .attr("fill", "#777");

        lineChartSvg.append('g').attr('class', 'axis axis--region')
            .call(regionAxis);

        var gRegion = lineChartSvg
            .append('g')
            .attr('class', 'regions')
            .selectAll('.region')
            .data(data)
            .enter()
            .append('g')
            .attr('class', function (d) {
                return 'region region--' + d.key;
            })
            .attr('transform', function (d) {
                var ty = regionValue(d) - regionScale.bandwidth();
                return 'translate(0,' + ty + ')';
            });

        gRegion.selectAll('.area')
            .data(function (d) { return [d.values]; })
            .join('path')
            .attr('class', 'area')
            .attr('d', area)
            .attr("fill", function (d) {
                return getRegionColor(d[0].region);
            })
            .style("opacity", "0.8")
            .transition()
            .duration(500)
            .ease(d3.easeLinear)
            .attr('d', area);

        gRegion.selectAll('.line')
            .data(function (d) { return [d.values]; })
            .join('path')
            .attr('class', 'line')
            .attr('d', line)
            .attr("stroke", function (d) {
                return getRegionColor(d[0].region);
            })
            .attr("fill", "none")
            .transition()
            .duration(500)
            .ease(d3.easeLinear)
            .attr('d', line);

        data.forEach(function (d) {
            d.values.sort(function (a, b) {
                return a.time - b.time;
            });
        });
        var hoverLine = gRegion.append('rect')
            .attr('class', 'hover-line')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 1)
            .attr('height', areaChartHeight)
            .style('opacity', 0);

        var tooltip = d3.select("#lineplot")
            .append("div")
            .style("opacity", 1)
            .style("visibility", "hidden")
            .style("position", "absolute")
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "10px");

        function getCloserTime(givenTime, data) {
            let beforeTime = null;
            for (let i = 0; i < data.length; i++) {
                const time = new Date(data[i].time);
                if (time.getTime() < givenTime.getTime()) {
                    beforeTime = time;
                }
            }
            return beforeTime;

        }
        function getRadiationValue(data, givenTime) {
            for (let i = 0; i < data.length; i++) {
                const time = new Date(data[i].time);
                if (time.getTime() === givenTime.getTime()) {
                    return data[i].value;
                }
            }
        }
        function convertDate(time) {
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            var date = new Date(time);
            var month = months[date.getMonth()];
            var day = date.getDate();
            var time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(date);
            var formattedDateTime = `${month} ${day} ${time}`;
            return formattedDateTime;
        }


        gRegion.on('mouseover', function (event, d) {
            var mouseX = d3.pointer(event, this)[0];
            hoverLine.style('opacity', 1)
                .attr('x', mouseX)
                .raise();
            tooltip.style("visibility", "visible");
        }).on('mousemove', function (event, d) {
            var mousePos = d3.pointer(event, this);
            var time = xScale.invert(mousePos[0]);
            time = getCloserTime(time, d.values);
            var rValue = getRadiationValue(d.values, time);
            rValue = rValue.toFixed(3);
            time = convertDate(time)
            tooltip.html(`Region: ${d.key}<br>Time: ${time}<br>Value: ${rValue} cpm`)
                .style("left", (event.pageX + 20) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
            .on('mouseout', function (event, d) {
                hoverLine.style('opacity', 0);
                tooltip.style("visibility", "hidden");
            });

        d3.select('body').on('click', function () {
            hoverLine.style('opacity', 0);
        });
    })
}
//----------------------------Chart 5 - Line Chart End------------------------------









