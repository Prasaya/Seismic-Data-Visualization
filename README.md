# Paleo Seismic Data Visualization

## Overview

This project is a web-based geospatial visualization tool designed for exploring Paleo Seismic fault data, focusing on the Cascadia region. It utilizes CesiumJS to render crustal fault traces from a GeoJSON dataset on an interactive 3D globe. Users can filter data, inspect individual fault properties, and explore the terrain with various base map options.

The application allows users to:
*   Visualize geological fault data in an intuitive 3D environment.
*   Dynamically filter fault lines based on their names.
*   Filter faults based on their minimum lower depth using a slider.
*   Click on individual faults to display detailed information such as dip, rake, depth, and source.
*   Navigate the globe with integrated Cesium World Terrain and choose from various imagery base layers.

## Tech Stack
*   HTML, CSS, JavaScript 
*   [CesiumJS](https://cesium.com/platform/cesiumjs/)
*   Nginx (for Docker deployment)
*   Docker

## Running the Application

### Using Docker 

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Prasaya/Seismic-Data-Visualization
    cd Seismic-Data-Visualization
    ```
2.  **Configure Cesium Ion Token**:
    Edit `js/config.js` and add your `CESIUM_ION_TOKEN` as described in the "Configuration" section.
3.  **Build the Docker image**:
    From the project's root directory:
    ```bash
    docker build -t paleo-seismic-viz .
    ```
4.  **Run the Docker container**:
    ```bash
    docker run -p 8080:80 paleo-seismic-viz
    ```

5.  **Access the application**:
    Open your web browser and navigate to `http://localhost:8080`.


## Data Source and Attribution

The fault data used in this project (`crescent_cfm_crustal_traces.geojson`) is sourced from the [CRESCENT Community Fault Model (CFM) Repository](https://github.com/cascadiaquakes/CRESCENT-CFM) .

*   **Primary Data Sources for Crustal Faults**:
    *   USGS National Seismic Hazard Map (NSHM 23) project (Hatem et al., 2022).
    *   Collaborative research by Natural Resources Canada and the GEM Foundation (Hobbs et al., in prep; Styron et al., in prep).


## License

The underlying fault data from CRESCENT-CFM is licensed separately under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).
