var map, largeInfowindow, bounds;
var markers = [];


// Google initMap
function initMap() {
    largeInfowindow = new google.maps.InfoWindow();
    bounds = new google.maps.LatLngBounds();

    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 40.7413549,
            lng: -73.9980244
        },
        zoom: 13,
    });

    for (var i = 0; i < locations.length; i++) {
        var position = locations[i].location;
        var title = locations[i].title;
        var marker = new google.maps.Marker({
            position: position,
            map: map,
            title: title,
            animation: google.maps.Animation.DROP,
            id: i
        });
        // Append Marker
        markers.push(marker);
        bounds.extend(marker.position);
        // Open infowindow when clicked
        marker.addListener('click', function() {
            populateInfoWindow(this, largeInfowindow);
        });

    }
    map.fitBounds(bounds);

    // Apply bindings to ViewModel
    ko.applyBindings(new View_Model());
}


// Handle google map's loading error
function googleError() {
    alert("error for loading google map");
}


// Dispaly info window
function populateInfoWindow(marker, infowindow) {
    if (infowindow.marker != marker) {
        infowindow.marker = marker;

        // Set all markers animation null
        for (var m=0;m<markers.length;m++) {
            markers[m].setAnimation(null);
        }
        // Marker animation interaction
        marker.setAnimation(google.maps.Animation.BOUNCE);

        infowindow.setContent('');
        infowindow.setContent('<div><h3>' + marker.title + '</h3></div><h3>Nearby Wiki Infomation</h3><div id="pano"></div>');

        // console.log(marker.position);
        var wiki_url = "https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=" + marker.position.lat() + "%7C" + marker.position.lng() + "&gsradius=10000&gslimit=10&format=json";
        // console.log("wiki_url:" + wiki_url);

        // Handle api timeout
        var wikiRequestTimeOut = setTimeout(function(){
            $("#pano").text('Failed to load wiki resources');
        }, 8000);

        // Ajax request from wikipedia
        var jqxhr = $.ajax(wiki_url, {
            dataType: "jsonp",
            json:"wikiCallback",
        })
            .done(function(response) {
                console.log(response);
                var wikiArticles = response.query.geosearch;
                $.each(wikiArticles, function(i, article){
                    $("#pano").append('<li>' + article.title + '</li>');
                });
                clearTimeout(wikiRequestTimeOut);
            })
            .fail(function() {
                alert( "Wiki API error" );
            });

        infowindow.open(map, marker);

        // hide marker when info window close
        infowindow.addListener('closeclick', function() {
            marker.setAnimation(null);
            infowindow.setMarker = null;
        });

    }
}


// Model
var locations = [
    {title: 'Park Ave Penthouse', location: {lat: 40.7713024, lng: -73.9632393}},
    {title: 'Chelsea Loft', location: {lat: 40.7444883, lng: -73.9949465}},
    {title: 'Union Square Open Floor Plan', location: {lat: 40.7347062, lng: -73.9895759}},
    {title: 'East Village Hip Studio', location: {lat: 40.7281777, lng: -73.984377}},
    {title: 'TriBeCa Artsy Bachelor Pad', location: {lat: 40.7195264, lng: -74.0089934}},
    {title: 'Chinatown Homey Space', location: {lat: 40.7180628, lng: -73.9961237}}
];


// Location with marker
var Loc = function(data){
    var self = this;
    self.title = ko.observable(data.title);
    self.position = ko.observable(data.position);
    self.marker = '';
};


// Make ViewModel
var View_Model = function () {
    var self = this;
    // location list
    self.locList = [];
    locations.forEach(function(item){
        self.locList.push(new Loc(item));
    });
    // Add marker to locList
    for (var i=0;i<self.locList.length;i++){
        self.locList[i].marker = markers[i];
    }

    // console.log(self.locList);
    // Bind list item to marker info window
    self.goToMarker = function (clickedLoc) {
        var clickedLocTitle = clickedLoc.title();
        // console.log(clickedLocTitle);
        for(var key in markers) {
            if(clickedLocTitle === markers[key].title) {
            map.panTo(markers[key].position);
            map.setZoom(14);
            map.panBy(0,-150);
            populateInfoWindow(markers[key], largeInfowindow);
            }
        }
    };

    // click humburger button to toggle list
    self.showOrHideList = function() {
        var state = document.getElementById("nav-list").style.display;
        if (state == "none") {
            document.getElementById("nav-list").style.display = "block";
            $('#map-list').addClass('right');
            $('#map-list').removeClass('right-full');
        } else {
            document.getElementById("nav-list").style.display = "none";
            $('#map-list').addClass('right-full');
            $('#map-list').removeClass('right');
        }
    };

    self.filter = ko.observable('');

    // Filter the items using "filter"
    self.filteredLocList = ko.computed(function() {
        var filter = self.filter().toLowerCase();
        // console.log(filter);
        if (!filter) {
            markers.forEach(function(marker) {
                if (marker) marker.setVisible(true);
                map.fitBounds(bounds);
            });
            return self.locList;
        } else {
            return ko.utils.arrayFilter(self.locList, function(loc) {
                var title = loc.title().toLowerCase();
                var filterIsInTitle = title.indexOf(filter) >= 0;
                // console.log(filterIsInTitle);
                if (loc.marker) loc.marker.setVisible(filterIsInTitle);
                    // console.log(marker);
                return filterIsInTitle;
            });
        }
    });
};
