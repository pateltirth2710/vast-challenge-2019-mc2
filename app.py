from flask import Flask, jsonify, render_template, request
from flask import send_file
import pandas as pd
import numpy as np
import json
from matplotlib import path
app = Flask(__name__)

#dataMobile_df = pd.read_csv("data\MobileSensorReadings.csv")
dataStatic_df = pd.read_csv("data/StaticSensorReadings.csv")

#----------------------------Chart 5 - Line Chart begin------------------------------
map = []
# read GeoJSON file
with open('data/StHimark.geojson') as f:
  data = json.load(f)
  for fe in data['features']:
    region = {}
    region["id"] = fe["properties"]["Id"]
    region["name"] = fe["properties"]["Nbrhood"]
    region["coordinates"] = fe["geometry"]["coordinates"][0][0]
    map.append(region)

@app.route("/getregion/<coordinates>")
def getRegionName(coordinates):
  lat,lon = coordinates.split("&")
  # iterate through geometries and check if point is within
  lat = float(lat)
  lon = float(lon)
  point = (lon, lat)
  regionName = '21'
  for region in map:
     p = path.Path(region["coordinates"])
    #  print(p.contains_points([point])[0])
     if(p.contains_points([point])[0] == True):
        regionName = region["name"]
        break
  return regionName

def processMobileReadings():
  df = pd.read_csv("data/MobileSensorReadings.csv",index_col=False)
  for index, row in df.iterrows():
    # convert the timestamp string to a datetime object
    datetime_obj = datetime.datetime.strptime(row['Timestamp'], '%Y-%m-%d %H:%M:%S')
    # convert the datetime object to a Unix timestamp (seconds since epoch)
    df.loc[index, 'time'] = time.mktime(datetime_obj.timetuple())
  df['Timestamp'] = pd.to_datetime(df['Timestamp'])
  mask = ((df['Timestamp'].dt.minute % 30 == 0) & (df['Timestamp'].dt.second == 0))
  df = df[mask]
  for index, row in df.iterrows():
    df.loc[index, 'Region'] = getRegionName(str(row['Lat'])+'&'+str(row['Long']))
  df = df.groupby('Region').filter(lambda x: x['Value'].max() > 3e-04)
  df = df.sort_values(by='time').reset_index(drop=True)
  df['p_peak'] = df['Value'] / df.groupby('Region')['Value'].transform('max')
  df['p_smooth'] = (df['p_peak'].shift() + df['p_peak'] + df['p_peak'].shift(-1)) / 3
  df['p_smooth'] = np.where(df['p_smooth'].isna(), df['p_peak'], df['p_smooth'])
  df.loc[df['time'] == 0, 'time'] = 24*60
  df['time'] = np.where(df['time'] < 3 * 60, df['time'] + 24 * 60, df['time'])
  df = df.sort_values(by=['Region', 'time']).reset_index(drop=True)
  df = df.rename(columns={'Value':'p'})
  df = df.rename(columns={'Region':'region'})
  print(df[['region', 'Timestamp', 'p', 'p_peak','p_smooth']].to_csv('data/aggregatedMobile.csv', index=False))


def processStaticReadings():
  df1 = pd.read_csv("data/StaticSensorReadings.csv",index_col=False)
  df2 = pd.read_csv("data/StaticSensorLocations.csv",index_col=False) 
  # print(str(df2['Lat'])+'&'+str(df2['Long']))
  for index, row in df2.iterrows():
    # print(str(row['Lat'])+'&'+str(row['Long']))
    df2.loc[index, 'Region'] = getRegionName(str(row['Lat'])+'&'+str(row['Long']))
  # print(df2)
  df = pd.merge(df1, df2, on='Sensor-id')
  for index, row in df.iterrows():
    # convert the timestamp string to a datetime object
    datetime_obj = datetime.datetime.strptime(row['Timestamp'], '%Y-%m-%d %H:%M:%S')
    # convert the datetime object to a Unix timestamp (seconds since epoch)
    df.loc[index, 'time'] = time.mktime(datetime_obj.timetuple())
  df.to_csv('data/mergedstatic.csv', index=False)
  
def createStaticReadingsForRidge():
  df = pd.read_csv('data/merged.csv')
  
  df['Timestamp'] = pd.to_datetime(df['Timestamp'])
  mask = ((df['Timestamp'].dt.minute % 30 == 0) & (df['Timestamp'].dt.second == 0))
  df = df[mask]
  df = df.groupby('Region').filter(lambda x: x['Value'].max() > 3e-04)
  df = df.sort_values(by='time').reset_index(drop=True)
  df['p_peak'] = df['Value'] / df.groupby('Region')['Value'].transform('max')
  df['p_smooth'] = (df['p_peak'].shift() + df['p_peak'] + df['p_peak'].shift(-1)) / 3
  df['p_smooth'] = np.where(df['p_smooth'].isna(), df['p_peak'], df['p_smooth'])
  df.loc[df['time'] == 0, 'time'] = 24*60
  df['time'] = np.where(df['time'] < 3 * 60, df['time'] + 24 * 60, df['time'])
  # df['Region'] = df.groupby('Region')['p_peak'].transform(lambda x: np.argmax(x)).astype('category')
  df = df.sort_values(by=['Region', 'time']).reset_index(drop=True)
  # print(df.to_csv('data/aggregated.csv', index=False))
  df = df.rename(columns={'Value':'p'})
  df = df.rename(columns={'Region':'region'})
  df[['region', 'Timestamp', 'p', 'p_peak','p_smooth']].to_csv('data/aggregatedStatic.csv', index=False)

def aggregateData():
  df1 = pd.read_csv('data/aggregatedMobile.csv')
  df1['Timestamp'] = pd.to_datetime(df1['Timestamp'])
  df2 = pd.read_csv('data/aggregatedStatic.csv')
  # df = pd.merge(df1, df2, on='region')
  df = pd.concat([df1, df2], axis=0)
  df_sum = df.groupby(['Timestamp', 'region'])['p','p_peak','p_smooth'].sum().reset_index()
  df_sum = df_sum.sort_values(by=['region', 'Timestamp']).reset_index(drop=True)
  df[['region', 'Timestamp', 'p', 'p_peak','p_smooth']].to_csv('data/aggregated.csv', index=False)

@app.route("/filterData", methods=['POST'])
def filterAggregatedData():
   requestdata = request.get_json()
   date = requestdata['date']
   regions = requestdata['regions']
   df = pd.read_csv('data/aggregated.csv')
   df['Timestamp'] = pd.to_datetime(df['Timestamp'])
   df_filtered = df[(df['Timestamp'].dt.date == pd.to_datetime(date).date()) & (df['region'].isin(regions))]
   df_filtered[['region', 'Timestamp', 'p', 'p_peak','p_smooth']].to_csv('data/aggregatedfiltered.csv', index=False)
   return "Success"

#----------------------------Chart 5 - Line Chart End------------------------------

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/data/8April/<filename>")
def jsonfile(filename):
    return send_file("data/8April/"+ filename,mimetype='application/json')

@app.route("/dataimage")
def dataImage():
    return send_file("data/StHimark.json",mimetype='application/json')

@app.route("/data/<imagename>")
def dataImagepng(imagename):
  return send_file("data/"+ imagename, mimetype='image/png')

@app.route("/static/js/<filename>")
def dataJsFile(filename):
  return send_file("static/js/"+ filename, mimetype='application/javascript')

@app.route("/data/mobile/<date>")
def dataMobile(date):
  # Generate some example data

  static_data = pd.read_csv("data/aggregatedMobile.csv")

  static_data = static_data.loc[static_data['Timestamp'].str.contains(date)]

  regions = ["Palace Hills","Northwest","Old Town","Safe Town","Southwest","Downtown","Wilson Forest","Scenic Vista","Broadview","Chapparal","Terrapin Springs","Pepper Mill","Cheddarford","Easton","Weston","Southton","Oak Willow","East Parton","West Parton"]

  # Compute mean of 'p' values for each region
  means = static_data.groupby('region')['p'].mean().reset_index()

  # Convert means DataFrame to JSON format
  data = means.to_dict(orient='records')

  # Add remaining regions with value of 0

  for region in regions:
    if region not in means['region'].values:
        data.append({"region": region, "p": 0})

  for region in regions:
      if region not in [d["region"] for d in data]:
          data.append({"Region": region, "Value": "0"})

  # Convert 'Value' column to a string
  data = [{"Region": d["region"], "Value": str(d["p"])} for d in data]

  #data = [{"x": i, "y": i**2} for i in range(10)]
  return jsonify(data)


@app.route("/data/mobile_sensor/<date>")
def getmobilesensordata(date):
    return send_file("data/"+ date,mimetype='application/json')

@app.route("/data/mobile_sensor_date/<file>/id/<id>")
def getmobilesensordataByid(file,id):
      data = pd.read_json("data/"+file)
      #print(data)
      #print(id)
      # print(i)
      filteredData = data.loc[data["sensor_id"] == int(id)]
      #print(filteredData)
      return filteredData.to_json(orient = 'records')
      # filteredData = data[(data['sensor_id']==id)]
      # print(filteredData)

@app.route("/data/first_mobile_sensor_date/<file>/")
def getFirstMobileSensorLocations(file):
    data = pd.read_json("data/"+file)
    # print(id)
    # print(i)
    filteredData = data.loc[data["time_stamp"] == data["time_stamp"][0]]
    #print(filteredData)
    return filteredData.to_json(orient = 'records')

      # return filteredDatas

@app.route("/data/static/<date>")
def dataStatic(date):
    # Generate some example data

    static_data = pd.read_csv("data/aggregatedStatic.csv")

    static_data = static_data.loc[static_data['Timestamp'].str.contains(date)]

    regions = ["Palace Hills","Northwest","Old Town","Safe Town","Southwest","Downtown","Wilson Forest","Scenic Vista","Broadview","Chapparal","Terrapin Springs","Pepper Mill","Cheddarford","Easton","Weston","Southton","Oak Willow","East Parton","West Parton"]

    # Compute mean of 'p' values for each region
    means = static_data.groupby('region')['p'].mean().reset_index()

    # Convert means DataFrame to JSON format
    data = means.to_dict(orient='records')

    # Add remaining regions with value of 0

    for region in regions:
      if region not in means['region'].values:
          data.append({"region": region, "p": 0})



    for region in regions:
        if region not in [d["region"] for d in data]:
            data.append({"Region": region, "Value": "0"})

    # Convert 'Value' column to a string
    data = [{"Region": d["region"], "Value": str(d["p"])} for d in data]

    #data = [{"x": i, "y": i**2} for i in range(10)]
    return jsonify(data)


if __name__ == "__main__":
    app.run(debug=True, port=5050)
