Cesium.Ion.defaultAccessToken = config.CESIUM_ION_TOKEN;

async function initializeCesiumViewer() {
    try {
        const terrainProvider = await Cesium.createWorldTerrainAsync();

        const viewer = new Cesium.Viewer('cesiumContainer', {
            shouldAnimate: true,
            terrainProvider: terrainProvider,
            baseLayerPicker: true,
            geocoder: true,
            homeButton: true,
            sceneModePicker: true,
            navigationHelpButton: true,
            animation: true,
            timeline: true,
            fullscreenButton: true,
        });

        try {
            const imageryLayer = await viewer.imageryLayers.addImageryProvider(
                await Cesium.IonImageryProvider.fromAssetId(config.DEFAULT_IMAGERY_ASSET_ID) 
            );
        } catch (error) {
            console.error("Error adding imagery layer with asset ID 3:", error);
        }

        // Load the GeoJSON data
        const geoJsonDataSource = Cesium.GeoJsonDataSource.load(config.GEOJSON_DATA_PATH, { 
            stroke: Cesium.Color.HOTPINK,
            fill: Cesium.Color.PINK.withAlpha(0.5),
            strokeWidth: 3
        });

        viewer.dataSources.add(geoJsonDataSource);

        // UI Elements and Filtering Logic
        const propertyNameSelect = document.getElementById('propertyNameSelect');
        const lowerDepthSlider = document.getElementById('lowerDepthSlider');
        const lowerDepthValueDisplay = document.getElementById('lowerDepthValue');

        let allEntities = [];
        let uniqueFaultNames = new Set();

        let selectedEntity = null; 

        const defaultStrokeColor = Cesium.Color.HOTPINK;
        const highlightedStrokeColor = Cesium.Color.YELLOW;

        function updateSliderDisplay(slider, display, unit) {
            display.textContent = `${slider.value} ${unit}`;
        }

        // Function to display feature properties in the infoBox
        function displayFeatureInfo(entity) {
            const infoBox = document.getElementById('infoBox');
            if (entity && entity.properties) {
                const entityProperties = entity.properties;
                const currentValues = entityProperties.getValue(viewer.clock.currentTime);
                let content = '<h2>Feature Information</h2>';
                let propertiesFound = false;

                if (currentValues) {
                    for (const key in currentValues) {
                        if (currentValues.hasOwnProperty(key) && config.INFO_BOX_DESIRED_KEYS.includes(key)) { 
                            const value = currentValues[key];
                            if (value !== undefined && value !== null && String(value).trim() !== '') {
                                content += `<p><strong>${key.replace(/_/g, ' ')}:</strong> ${value}</p>`;
                                propertiesFound = true;
                            }
                        }
                    }
                }

                if (!propertiesFound) {
                    content += '<p>No displayable properties found for this feature, or properties are empty.</p>';
                }
                infoBox.innerHTML = content;
            } else {
                infoBox.innerHTML = '<h2>Feature Information</h2><p>Click on a feature to see its details here, or no valid entity provided.</p>';
            }
        }

        geoJsonDataSource.then(dataSource => {
            const entities = dataSource.entities.values;
            allEntities = entities;

            let minLowerDepth = Infinity;
            let maxLowerDepth = -Infinity;

            entities.forEach(entity => {
                if (entity.properties) {
                    const faultName = entity.properties.name ? entity.properties.name.getValue() : null;
                    if (faultName) {
                        uniqueFaultNames.add(faultName);
                    }

                    const lowerDepth = entity.properties.lower_depth ? entity.properties.lower_depth.getValue() : null;
                    if (lowerDepth !== null) {
                        minLowerDepth = Math.min(minLowerDepth, lowerDepth);
                        maxLowerDepth = Math.max(maxLowerDepth, lowerDepth);
                    }
                }
            });

            uniqueFaultNames.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                propertyNameSelect.appendChild(option);
            });

            // Add "ALL_FAULTS" option
            propertyNameSelect.value = "ALL_FAULTS"; 

            if (isFinite(minLowerDepth) && isFinite(maxLowerDepth)) {
                lowerDepthSlider.min = Math.floor(minLowerDepth);
                lowerDepthSlider.max = Math.ceil(maxLowerDepth);
                // Set default to min
                lowerDepthSlider.value = Math.floor(minLowerDepth); 
                updateSliderDisplay(lowerDepthSlider, lowerDepthValueDisplay, 'km');
            }
            applyFilters(); 

            // Find and highlight default fault name 
            const initiallySelectedEntity = allEntities.find(entity => {
                const props = entity.properties;
                if (props && props.name) {
                    const nameValue = props.name.getValue(viewer.clock.currentTime);
                    return nameValue === config.DEFAULT_HIGHLIGHT_FAULT_NAME; 
                }
                return false;
            });

            if (initiallySelectedEntity) {
                 if (initiallySelectedEntity.polyline) {
                    initiallySelectedEntity.polyline.material = highlightedStrokeColor;
                }
                selectedEntity = initiallySelectedEntity;
                displayFeatureInfo(initiallySelectedEntity);
            } else {
                const infoBox = document.getElementById('infoBox');
                infoBox.innerHTML = `<h2>Feature Information</h2><p>Default fault not found in the dataset. Click on a feature to see its details.</p>`; 
            }
        });

        function applyFilters() {
            if (!allEntities.length) 
                return;

            const selectedFaultName = propertyNameSelect.value;
            const minLower = parseFloat(lowerDepthSlider.value);

            allEntities.forEach(entity => {
                let showEntity = true;
                if (selectedFaultName && selectedFaultName !== "ALL_FAULTS") {
                    const entityFaultName = entity.properties && entity.properties.name ? entity.properties.name.getValue() : null;
                    if (entityFaultName !== selectedFaultName) {
                        showEntity = false;
                    }
                }

                const upperDepth = entity.properties && entity.properties.upper_depth ? entity.properties.upper_depth.getValue() : 0;
                const lowerDepth = entity.properties && entity.properties.lower_depth ? entity.properties.lower_depth.getValue() : null;

                if (upperDepth > 0) { 
                    showEntity = false;
                }
                if (lowerDepth !== null && lowerDepth < minLower) {
                    showEntity = false;
                }
                entity.show = showEntity;
            });
        }

        propertyNameSelect.addEventListener('change', () => {
            // Apply visibility filters first
            applyFilters();

            const selectedFaultName = propertyNameSelect.value;
            const infoBox = document.getElementById('infoBox');

            // Clear previous selection highlight
            if (selectedEntity && selectedEntity.polyline) {
                if (selectedEntity.properties) {
                     selectedEntity.polyline.material = defaultStrokeColor;
                }
            }
            // Reset selected entity
            selectedEntity = null; 

            if (selectedFaultName && selectedFaultName !== "ALL_FAULTS") {
                const entityToSelect = allEntities.find(entity => {
                    if (entity.properties && entity.properties.name) {
                        const nameValue = entity.properties.name.getValue(viewer.clock.currentTime);
                        return nameValue === selectedFaultName;
                    }
                    return false;
                });

                // Check if the entity is visible
                if (entityToSelect && entityToSelect.show) { 
                    if (entityToSelect.polyline) {
                        entityToSelect.polyline.material = highlightedStrokeColor;
                    }
                    selectedEntity = entityToSelect;
                    displayFeatureInfo(entityToSelect);
                    viewer.flyTo(entityToSelect);
                } else if (entityToSelect && !entityToSelect.show) {
                    // Clear info box
                    displayFeatureInfo(null); 
                    infoBox.innerHTML = `<h2>Feature Information</h2><p>Fault is currently hidden by active filters. Adjust filters to view.</p>`;
                } else {
                    displayFeatureInfo(null); 
                    infoBox.innerHTML = `<h2>Feature Information</h2><p>Fault not found or has no geometry.</p>`;
                }
            } else { 
                // "ALL_FAULTS" selected
                displayFeatureInfo(null);
                infoBox.innerHTML = '<h2>Feature Information</h2><p>Displaying all visible faults. Click on a feature or select a specific fault name to see its details.</p>';
                viewer.flyTo(geoJsonDataSource); 
            }
        });

        lowerDepthSlider.addEventListener('input', () => {
            updateSliderDisplay(lowerDepthSlider, lowerDepthValueDisplay, 'km');
            applyFilters();

            // After applying depth filters, re-evaluate the selected fault's visibility and update infoBox if it becomes hidden/visible
            const currentFaultNameSelection = propertyNameSelect.value;
            if (selectedEntity && currentFaultNameSelection !== "ALL_FAULTS") {
                if (!selectedEntity.show) {
                    const infoBox = document.getElementById('infoBox');
                    infoBox.innerHTML = `<h2>Feature Information</h2><p>Previously selected fault is now hidden by depth filters.</p>`;
                } else {
                    // If it became visible again and was the selected one, ensure info is displayed
                    displayFeatureInfo(selectedEntity);
                }
            } else if (currentFaultNameSelection !== "ALL_FAULTS") {
                // If a specific fault was selected in dropdown but is now hidden
                const entityToCheck = allEntities.find(e => e.properties && e.properties.name && e.properties.name.getValue(viewer.clock.currentTime) === currentFaultNameSelection);
                if (entityToCheck && !entityToCheck.show) {
                    const infoBox = document.getElementById('infoBox');
                    infoBox.innerHTML = `<h2>Feature Information</h2><p>Fault is currently hidden by depth filters.</p>`;
                }
            }
        });

        viewer.flyTo(geoJsonDataSource);

        // Add an event handler for clicks
        viewer.screenSpaceEventHandler.setInputAction(function onLeftClick(movement) {
            const pickedObject = viewer.scene.pick(movement.position);
            if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.id)) {
                const pickedEntity = pickedObject.id;

                // Clear previous selection's highlight
                if (selectedEntity && selectedEntity.polyline && selectedEntity !== pickedEntity) {
                    if (selectedEntity.properties) {
                        selectedEntity.polyline.material = defaultStrokeColor;
                    }
                }

                // Highlight new selection
                if (pickedEntity.polyline) {
                    pickedEntity.polyline.material = highlightedStrokeColor;
                }
                
                selectedEntity = pickedEntity;
                displayFeatureInfo(pickedEntity);

                // Update dropdown to match clicked entity,
                const entityName = pickedEntity.properties && pickedEntity.properties.name ? pickedEntity.properties.name.getValue(viewer.clock.currentTime) : null;
                if (entityName && propertyNameSelect.value !== entityName) {
                    propertyNameSelect.value = entityName;
                }
            } else {
                // Clicked outside any entity
                if (selectedEntity && selectedEntity.polyline) {
                    if (selectedEntity.properties) {
                        selectedEntity.polyline.material = defaultStrokeColor;
                    }
                }
                selectedEntity = null;
                displayFeatureInfo(null); // Clear info box
                document.getElementById('infoBox').innerHTML = '<h2>Feature Information</h2><p>Click on a feature to see its details here.</p>';
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    } catch (error) {
        console.error("Error initializing Cesium viewer:", error);
        
        const cesiumContainer = document.getElementById('cesiumContainer');
        if (cesiumContainer) {
            cesiumContainer.innerHTML = '<p>Failed to initialize the map. Please try refreshing the page or check the console for errors.</p>';
        }
    }
}

initializeCesiumViewer();
