import requests
import json


def get_stations():
    response = requests.get("https://feeds.citibikenyc.com/stations/stations.json")

    if response.status_code != 200:
        print('Error fetching stations data')
        return
    
    stations = json.loads(response.text)
    station_list = stations['stationBeanList']

    stations_dict = {}
    for station in station_list:
        id = str(station['id'])
        stations_dict[id] = station
    
    stations_file = open("stations.js", "w")
    stations_file.write('let global_stations = ' + json.dumps(stations_dict))
    stations_file.close()

    # with open("stations.json", "w") as write_file:
    #     json.dump(stations['stationBeanList'], write_file)


if __name__ == "__main__":
    get_stations()