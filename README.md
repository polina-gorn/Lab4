# Lab4
This website was created as part of Lab4 for GGR472 to explore Turf.js library to integrate GIS analysis into web maps.

This website visualizes the data on vehicle collisions with cyclists or pedestrians taken from the City of Toronto Open Data: [Motor Vehicle Collisions Involving Killed or Seriously Injured Persons](https://open.toronto.ca/dataset/motor-vehicle-collisions-involving-killed-or-seriously-injured-persons/).

The JavaScript code does the following:
- Converts the data into JSON.
- Visualizes it as points data.
- Creates bounding boxes (bboxes) around the data within a 1-kilometre radius.
- Calculates the number of collisions within each box.

This data is then stored as a separate variable and spatially visualized as a choropleth hexbin map.

<br>

As for interactivity:
- You can click on any hexbin to see the specific number of accidents.
- The popup will also enable a FlyTo function, which will return to the initial zoom extent once the popup is closed.
- The point data layer can be enabled using a button in the top left corner of the webmap.

<br>

The map also has a legend to connect the hexbin colour to the number range.
 
# Website Link: https://polina-gorn.github.io/Lab4/
