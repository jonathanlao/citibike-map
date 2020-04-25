let stations = global_stations;
let trips = global_trips;
let tripsView = false;

let mymap = L.map('mapid').setView([40.673563, -73.959635], 14);
let accessToken = 'pk.eyJ1Ijoiam9uYXRoYW5sYW8iLCJhIjoiY2s5YWJoYjdpMXE3ejNwbDJ1eWNyc25hciJ9.FIaoasirDh9FlJljk7vgXw'

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token='+accessToken+'', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 16,
    minZoom: 12,
    id: 'mapbox/dark-v10',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: accessToken
}).addTo(mymap);

// L.Routing.control({
//   router: L.Routing.mapbox(accessToken),
//   waypoints: [
//     L.latLng(40.673563, -73.959635),
//     L.latLng(40.7031724, -73.940636)
//   ],
//   //perhaps we can replace creating markers from leaflet, with this function?
//   createMarker: function() { return null; },
//   show: false
// }).addTo(mymap);

let circleInfo = {
  color: 'red',
  fillColor: '#f03',
  fillOpacity: 0.5,
  radius: 50
};

var stationIcon = L.icon({
  iconUrl: 'citibike.png',
  iconSize:     [40, 40], // size of the icon
  iconAnchor:   [20, 40], // point of the icon which will correspond to marker's location
  popupAnchor:  [0, -35] // point from which the popup should open relative to the iconAnchor
});

let CaitlinIcon = L.Icon.extend({
  options: {
      iconSize:     [30, 30],
      iconAnchor:   [15, 30],
      popupAnchor:  [0, -35]
  }
});

let caitlinSourceIcon = new CaitlinIcon({iconUrl: 'caitlin_source.png'}),
    caitlinDestinationIcon = new CaitlinIcon({iconUrl: 'caitlin_destination.png'});

let markers = [];
for (let key in stations) {
  station = stations[key]

  stationMarker = L.marker([station.latitude, station.longitude], {icon: stationIcon});
  markers.push(stationMarker)
  stationMarker.info = station;

  stationMarker.on('click', onStationClick(station));
}
let allStations = L.layerGroup(markers).addTo(mymap);

function onStationClick(station) {
  return function (e) {
    tripsView = true;
    showTrips(station);
    allStations.clearLayers();
  }
}

function getTime(seconds) {
  if (seconds > 60) {
    let minutes = Math.floor(seconds / 60);
    let remainder = seconds % 60;
    return minutes + "m" + (remainder ? remainder + "s" : "");
  }
  else {
    return seconds + "s"
  }
}

function getStationInfo(station, isDestination) {
  let id = station.id;
  let tripsFromStation = trips[id];
  let stationInfo = "<b>" + station.stationName + "</b><br>" +
    "Id: " + station.id + "<br>";
  
  if (isDestination) {
    stationInfo += "Total trips to here: " + station.trips.length + "<br>" +
      "Trip length(s) = " + station.trips.join(', ');
  }
  else {
    stationInfo += "Total trips from here: " + (tripsFromStation ? tripsFromStation.length : 0);
  }
  return stationInfo;
}

function showTrips(station) {
  let id = station.id;
  let tripsFromStation = trips[id];
  let stationInfo = getStationInfo(station)
  
  let destinationStations = {};
  if (tripsFromStation) {
    tripsFromStation.forEach(function(trip) {
      let destinationId = trip[7];
      if (!destinationStations[destinationId]) {
        destinationStations[destinationId] = {
          id: destinationId,
          stationName: trip[8],
          latitude: trip[9],
          longitude: trip[10],
          trips: []
        }
      }
      destinationStations[destinationId].trips.push(getTime(trip[0]))
    });
  }

  // Add destination station icons
  let destinationMarkers = [];
  for (let key in destinationStations) {
    destination = destinationStations[key]
    let marker = L.marker([destination.latitude, destination.longitude], {icon: caitlinDestinationIcon})
      .bindPopup(getStationInfo(destination, true))
    destinationMarkers.push(marker);
  }
  let allDestinations = L.layerGroup(destinationMarkers).addTo(mymap);

  //Add routes
  //Can't find an option to get multiple routes in a single request
  for (let key in destinationStations) {
    destination = destinationStations[key]
    getRoute(station.latitude, station.longitude, destination.latitude, destination.longitude, allDestinations)
  }

  let marker = L.marker([station.latitude, station.longitude], {icon: caitlinSourceIcon})
    .addTo(mymap)
    .bindPopup(stationInfo).openPopup()
    .on('click', function(e) {
      tripsView = false;
      allDestinations.clearLayers();
      marker.removeFrom(mymap)
      allStations = L.layerGroup(markers).addTo(mymap);
    });
}

var start = [-73.959635, 40.673563];
var end = [-73.940636, 40.7031724];

function getRoute(startLat, startLong, endLat, endLong, layerGroup) {
  var url = 'https://api.mapbox.com/directions/v5/mapbox/cycling/' + 
    startLong + ',' + startLat + ';' + endLong + ',' + endLat +
    '?geometries=geojson&access_token=' + accessToken;
  
  // make an XHR request https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
  var req = new XMLHttpRequest();
  req.open('GET', url, true);
  req.onload = function() {
    //If we goggle trips view off before we have a chance to display all the trips,
    //ignore processing the response.
    if (tripsView === false) {
      return;
    }

    var json = JSON.parse(req.response);
    let coordinates = json.routes[0].geometry.coordinates;
  
    let pointList = [];
    for (let i = 0; i < coordinates.length; ++i) {
      pointList.push([coordinates[i][1], coordinates[i][0]])
    }
  
    let polyline = new L.Polyline(pointList, {
        color: 'red',
        weight: 3,
        opacity: 0.5,
        smoothFactor: 1
    });
    layerGroup.addLayer(polyline).addTo(mymap);
  }
  req.send();
}



// var polygon = L.polygon([
//     [51.509, -0.08],
//     [51.503, -0.06],
//     [51.51, -0.047]
// ]).addTo(mymap);

// 
// polygon.bindPopup("I am a polygon.");

// var popup = L.popup()
//     .setLatLng([40.673563, -73.959635])
//     .setContent("Hi, I'm Caitlin!")
//     .openOn(mymap);

//     var popup = L.popup();

// function onMapClick(e) {
//     popup
//         .setLatLng(e.latlng)
//         .setContent("You clicked the map at " + e.latlng.toString())
//         .openOn(mymap);
// }
// mymap.on('click', onMapClick);