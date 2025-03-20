/*--------------------------------------------------------------------
GGR472 LAB 4. By Polina Gorn
--------------------------------------------------------------------*/

mapboxgl.accessToken = 'pk.eyJ1IjoicG9saW5hLWdvcm4iLCJhIjoiY201eTZhdDJyMGc1ODJrcTU0ZmVqZDhmeSJ9.b3lqv0gV68Aikf5HHMdIoQ'; 

// Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/mapbox/light-v11',  
    center: [-79.35, 43.70],  // starting point, longitude/latitude
    zoom: 10.6 // starting zoom level
});


// empty variable to store the GeoJSON data
let viewgeojson;

// fetch method to access the GeoJSON from your online repository
fetch("https://raw.githubusercontent.com/smith-lg/ggr472-lab4/refs/heads/main/data/pedcyc_collision_06-21.geojson") // I ended up fetching the original source because when I referenced my source which was essentially a duplicate of your repository, I would get a 404 error and I did not find a way to work around it other than use a different source for the same data
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json(); // Convert the response to JSON
    })
    .then(data => {
        viewgeojson = data; // Assign the JSON data to the outer variable

        map.on('load', () => {

            // Adding data as a source
            map.addSource('viewgeojson', {
                type: 'geojson',
                data: viewgeojson // Using the fetched GeoJSON data
            });

            // Creating a bounding box around the collision point data
            let envresult = turf.envelope(viewgeojson);
            let bboxscaled = turf.transformScale(envresult, 1.1);

            // Extracting the coordinates of the  bounding box
            let bboxcoords = [
                bboxscaled.geometry.coordinates[0][0][0],
                bboxscaled.geometry.coordinates[0][0][1],
                bboxscaled.geometry.coordinates[0][2][0],
                bboxscaled.geometry.coordinates[0][2][1],
            ];

            // Generating a hex grid within the bounding box
            let hexdata = turf.hexGrid(bboxcoords, 0.5, { units: "kilometers" });

            // Using Turf collect function to collect all '_id' properties from the collision points data for each hexagon
            let collected = turf.collect(hexdata, viewgeojson, '_id', 'collisions');
           
            //this loop counts the number of collisions in each hexagon and identifies the hexagon with the biggest number of collisions.
            let collishex = turf.collect(hexdata, viewgeojson, '_id', 'values');
            let maxcollis = 0; // we create a dummy variable that will update itself with a bigger value until it reaches a hexagon with the biggest number of collisions
            collishex.features.forEach((feature) => {
                feature.properties.COUNT = feature.properties.values.length; // the loop calculates the number of collisions (values.length) in each hexagon and stores the number as a new variable COUNT.
                if (feature.properties.COUNT > maxcollis) {
                    console.log(feature);
                    maxcollis = feature.properties.COUNT; // and if the COUNT happens to be bigger than the currently saved maxcollis variable, the variable updates itself
                }
            });

            //adding the data source of the collision hexgrid and a layer to visualize it
            map.addSource("collishexgrid", {
                type: "geojson",
                data: collishex
            });

            map.addLayer({
                id: "collishexfill",
                type: "fill",
                source: "collishexgrid",
                paint: {
                    "fill-color": [
                        "step",
                        ["get", "COUNT"], // visualizing the layer using the created COUNT variable
                        "rgba(255, 255, 255, 0)", //colour for the hex with 0 collisions (transparent)
                        1, '#FCD4B8', //colour for the hex with 1-9 collisions
                        10, '#D799A7', //colour for the hex with 10-24 collisions
                        25, '#4E60A4', //colour for the hex with 25+ collisions
                        maxcollis, "#3A2152" //colour for the hex with the biggest num of collisions
                    ],
                    "fill-opacity": 0.8,
                    "fill-outline-color": "#000000" // outline for each hex for better visibility of boundaries
                },
                filter: ["!=", "COUNT", 0], // this filter does not render hexes that show counts = 0, however, i think this contradicts line 81, but deleting either messes up the code, so i am not exactly sure of the logic, but it works... i added this line first to get rid of hexbins overpopulating the map but then i realized i need borders for other values so now if I delete this line all hexbins with outlines will be visible, not just the ones that are more than 0
            });
            //adding point data layer
            map.addLayer({
                id: 'coll_layer',
                type: 'circle',
                source: 'viewgeojson',
                paint: {
                    'circle-radius': 3,
                    'circle-color': '#000000', 
                    'circle-opacity': 1
                },
                layout: {
                    visibility: 'none' // making the layer initially invisible since the interactivity implies turning the layer on
                }
            });
            //setting up an event listener that will show the point data layer upon clicking on the button
            const toggleButton = document.getElementById('toggle-car-layer');
            toggleButton.addEventListener('click', () => {
                const visibility = map.getLayoutProperty('coll_layer', 'visibility');
                // connecting toggle layer visibility to the button actions
                if (visibility === 'visible') {
                    map.setLayoutProperty('coll_layer', 'visibility', 'none');
                    toggleButton.textContent = 'Show Collision Cases';
                } else {
                    map.setLayoutProperty('coll_layer', 'visibility', 'visible');
                    toggleButton.textContent = 'Hide Collision Cases';
                }
            });
        });
        // Adding a click event listener to the hexagon layer
        map.on('click', 'collishexfill', (e) => {
            // Getting the number of collisions of the clicked hexagon
            const properties = e.features[0].properties;
            const count = properties.COUNT; 

            // Getting the coordinates of the clicked hexagon
            const coordinates = e.lngLat;

            // Flying to the clicked hexagon and adjusting zoom and animation 
            map.flyTo({
                center: coordinates, 
                zoom: 13, 
                speed: 1.2, 
                curve: 1, 
                essential: true // ensuring the animation is not interrupted
            });

            // Creating a popup
            const popup = new mapboxgl.Popup({
                closeButton: true, // Show a close button
                closeOnClick: false // Don't close the popup when clicking elsewhere
            })
                .setLngLat(coordinates) 
                .setHTML(`<strong>Collisions:</strong> ${count}`) // Setting the popup content
                .addTo(map);

            // Zooming out when the popup is closed
            popup.on('close', () => {
                map.flyTo({
                    center: coordinates, 
                    zoom: 10.6,
                    speed: 1.2,
                    curve: 1, 
                    essential: true 
                });
            });
        });

        // Change the cursor to a pointer when hovering over the hexagon to prompt interactivity
        map.on('mouseenter', 'collishexfill', () => {
            map.getCanvas().style.cursor = 'pointer';
        });

        // Change the cursor back to the default when leaving the hexagon 
        map.on('mouseleave', 'collishexfill', () => {
            map.getCanvas().style.cursor = '';
        });
    })
    //end of the fetch code, in case fetch is unsuccessful
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });