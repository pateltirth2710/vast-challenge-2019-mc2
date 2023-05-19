import { RadarChart } from "./radarchart.js"; 
var vals;

// This function is called once the HTML page is fully loaded by the browser
document.addEventListener('DOMContentLoaded', function () {
    // Hint: create or set your svg element inside this function
    
 
 
    
     
    // This will load your two CSV files and store them into two arrays.
    
 });

 export function readRadarfiles(type, id) {
    Promise.all([d3.json('../data/radarChartData.json'), d3.json('../data/radarChartDataStatic.json')])
    .then(function (values) {

       vals = values;
        
       //console.log('loaded females_data.csv and males_data.csv');
        
       drawradar(type, id);

    });
 }


export function drawradar(type, id) {

    

    //console.log(vals);

    var allval = vals[type];

    //console.log(allval);

    var val = [];

    allval.forEach(element => {
        if(element.sensor_id==id){
            //console.log(element);
            val.push(element);
        }
    });

    //console.log(val);

    var dataMap = new Map();

    val.forEach(element => {
        //console.log(element);
        if(dataMap.has(element.selected_date)){
            var temp = dataMap.get(element.selected_date);
            temp = [...temp,{ 'axis' : element.time, value : element.avg, 'date': element.selected_date }];
            dataMap.set(element.selected_date, temp);
        }
        else{
            dataMap.set(element.selected_date, [{ 'axis' : element.time, value : element.avg , 'date': element.selected_date }]);
        }
    });

    //console.log(dataMap);

    var data = [];
    dataMap.forEach(element => {
        var tempData = [];
        element.forEach(ele => {
            tempData.push(ele);
        });
        data.push(tempData);
    });

    //console.log(data);

    //Call function to draw the Radar chart
    RadarChart(".radarChart", data, type, id);
     //drawLolliPopChart();
 }
