/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/

/*--------------------------------------------------------------------
Step 1: INITIALIZE MAP
--------------------------------------------------------------------*/
// Define access token
mapboxgl.accessToken = 'pk.eyJ1IjoicG9saW5hLWdvcm4iLCJhIjoiY201eTZhdDJyMGc1ODJrcTU0ZmVqZDhmeSJ9.b3lqv0gV68Aikf5HHMdIoQ'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

// Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/mapbox/light-v11',  // ****ADD MAP STYLE HERE *****
    center: [-79.35, 43.70],  // starting point, longitude/latitude
    zoom: 10.6 // starting zoom level
});


/*--------------------------------------------------------------------
Step 2: VIEW GEOJSON POINT DATA ON MAP
--------------------------------------------------------------------*/

// Create an empty variable to store the GeoJSON data
let viewgeojson;

// Use the fetch method to access the GeoJSON from your online repository
fetch("https://raw.githubusercontent.com/smith-lg/ggr472-lab4/refs/heads/main/data/pedcyc_collision_06-21.geojson")
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json(); // Convert the response to JSON
    })
    .then(data => {
        viewgeojson = data; // Assign the JSON data to the outer variable
        console.log(viewgeojson); // Optionally, log the data to the console

        // Wait for the map to load
        map.on('load', () => {

            // Add the GeoJSON data as a source
            map.addSource('viewgeojson', {
                type: 'geojson',
                data: viewgeojson // Use the fetched GeoJSON data
            });

            // Create a bounding box around the collision point data
            let envresult = turf.envelope(viewgeojson);
            let bboxscaled = turf.transformScale(envresult, 1.1);
            console.log(bboxscaled);

            // Extract the coordinates of the scaled bounding box
            let bboxcoords = [
                bboxscaled.geometry.coordinates[0][0][0],
                bboxscaled.geometry.coordinates[0][0][1],
                bboxscaled.geometry.coordinates[0][2][0],
                bboxscaled.geometry.coordinates[0][2][1],
            ];

            bboxgeojson = {
                "type": "Feature Collection",
                "features": [envresult]
            };

            // Generate a hex grid within the bounding box
            let hexdata = turf.hexGrid(bboxcoords, 0.5, { units: "kilometers" });

            // Add the hex grid to the map
            map.addSource('hex_data', {
                type: 'geojson',
                data: hexdata
            });

            // map.addLayer({
            //     id: 'hex_layer',
            //     type: 'fill',
            //     source: 'hex_data',
            //     paint: {
            //         'fill-color': '#888888',
            //         'fill-opacity': 0.5
            //     }
            // });

            /*--------------------------------------------------------------------
            Step 4: AGGREGATE COLLISIONS BY HEXGRID
            --------------------------------------------------------------------*/
            // Use Turf collect function to collect all '_id' properties from the collision points data for each hexagon
            let collected = turf.collect(hexdata, viewgeojson, '_id', 'collisions');
            console.log(collected); // View the collect output in the console

            /*--------------------------------------------------------------------
            Step 5: FINALIZE YOUR WEB MAP
            --------------------------------------------------------------------*/
            // Update the addLayer paint properties for your hexgrid using:
            // - an expression
            // - The COUNT attribute
            // - The maximum number of collisions found in a hexagon
            // map.setPaintProperty('hex_layer', 'fill-color', [
            //     'step',
            //     ['get', 'collisions'],
            //     '#ffffcc', // Default color
            //     1, '#ffeda0',
            //     5, '#feb24c',
            //     10, '#f03b20'
            // ]);

            let collishex = turf.collect(hexdata, viewgeojson, '_id', 'values');
            let maxcollis = 0;
            collishex.features.forEach((feature) => {
                feature.properties.COUNT = feature.properties.values.length;
                if (feature.properties.COUNT > maxcollis) {
                    console.log(feature);
                    maxcollis = feature.properties.COUNT;
                }
            });
            console.log(maxcollis);

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
                        ["get", "COUNT"],
                        "rgba(255, 255, 255, 0)",
                        1, '#FCD4B8',
                        10, '#D799A7',
                        25, '#4E60A4',
                        maxcollis, "#3A2152"
                    ],
                    "fill-opacity": 0.8
                },
                filter: ["!=", "COUNT", 0],
            });
            map.addLayer({
                id: 'coll_layer',
                type: 'circle',
                source: 'viewgeojson',
                paint: {
                    'circle-radius': 3, // Size of the circles
                    'circle-color': '#000000', // Fully black color
                    'circle-opacity': 1, // Fully opaque
                    'circle-stroke-width': 0 // No outline
                },
                layout: {
                    visibility: 'none' // Initially invisible
                }
            });
            const toggleButton = document.getElementById('toggle-car-layer');
            toggleButton.addEventListener('click', () => {
                const visibility = map.getLayoutProperty('coll_layer', 'visibility');

                // Toggle layer visibility
                if (visibility === 'visible') {
                    map.setLayoutProperty('coll_layer', 'visibility', 'none');
                    toggleButton.textContent = 'Show Collision Cases';
                } else {
                    map.setLayoutProperty('coll_layer', 'visibility', 'visible');
                    toggleButton.textContent = 'Hide Collision Cases';
                }
            });

            // Add a legend and additional functionality including pop-up windows (optional)
        });
        // Add a click event listener to the hexagon layer
        map.on('click', 'collishexfill', (e) => {
            // Get the properties of the clicked hexagon
            const properties = e.features[0].properties;
            const count = properties.COUNT; // Number of collisions

            // Get the coordinates of the clicked hexagon
            const coordinates = e.lngLat;

            // Fly to the clicked hexagon
            map.flyTo({
                center: coordinates, // Center the map on the clicked hexagon
                zoom: 13, // Adjust the zoom level
                speed: 1.2, // Control the speed of the fly-to animation
                curve: 1, // Control the curvature of the flight path
                essential: true // Ensure the animation is not interrupted
            });

            // Create a popup
            const popup = new mapboxgl.Popup({
                closeButton: true, // Show a close button
                closeOnClick: false // Don't close the popup when clicking elsewhere
            })
                .setLngLat(coordinates) // Set the popup location
                .setHTML(`<strong>Collisions:</strong> ${count}`) // Set the popup content
                .addTo(map); // Add the popup to the map

            // Zoom out when the popup is closed
            popup.on('close', () => {
                map.flyTo({
                    center: coordinates, // Keep the same center
                    zoom: 10.6, // Zoom out to the original zoom level
                    speed: 1.2, // Control the speed of the fly-to animation
                    curve: 1, // Control the curvature of the flight path
                    essential: true // Ensure the animation is not interrupted
                });
            });
        });

        // Change the cursor to a pointer when hovering over the hexagon layer
        map.on('mouseenter', 'collishexfill', () => {
            map.getCanvas().style.cursor = 'pointer';
        });

        // Change the cursor back to the default when leaving the hexagon layer
        map.on('mouseleave', 'collishexfill', () => {
            map.getCanvas().style.cursor = '';
        });
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });