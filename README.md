# Lab4
This website was created as part of Lab4 for GGR472 to explore Turf.js library to integrate GIS analysis into web maps.

This website visualizes the data on vehicle collisions with cyclists or pedestrian taken from the City of Toronto Open Data: https://open.toronto.ca/dataset/motor-vehicle-collisions-involving-killed-or-seriously-injured-persons/ 

The javascript code does the following: 
- converts the data into json,
- visualizes it as points data,
- creates bboxes around the data within a 1 kilometre radius,
- calculates the number of collisions within each box.

This data is then stored as a separate variable and spatially visualized as a choropleth hexbin map.

<br>
As for interactivity:
- you can click on any hexbin to see a specific number of accidents,
- The popup will also enable a FlyTo function, which will return to the initial zoom extent once the pop-up is closed. The point data layer can be enabled using a button in the top left corner of the webmap.

<br>
The map also has a legend to connect the hexbin colour to the number range.
 
# Website Link: https://polina-gorn.github.io/Lab4/
