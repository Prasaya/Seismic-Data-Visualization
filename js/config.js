const config = {
    CESIUM_ION_TOKEN: 'YOUR_CESIUM_ION_TOKEN',

    GEOJSON_DATA_PATH: 'data/crescent_cfm_crustal_traces.geojson',
    
    // 3 is the asset ID for Bing Maps Aerial with Labels imagery, 1 for Cesium World Terrain, 2 for Bing Maps Aerial with no labels, 4 for Bing Maps Roads 
    DEFAULT_IMAGERY_ASSET_ID: 3, 

    DEFAULT_HIGHLIGHT_FAULT_NAME: "Metolius",
    
    INFO_BOX_DESIRED_KEYS: ["id", "name", "dip", "dip_dir", "rake", "lower_depth", "upper_depth", "source"]
};
