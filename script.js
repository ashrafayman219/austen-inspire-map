// display variables
var displayMap;
var view;

function loadModule(moduleName) {
  return new Promise((resolve, reject) => {
    require([moduleName], (module) => {
      if (module) {
        resolve(module);
      } else {
        reject(new Error(`Module not found: ${moduleName}`));
      }
    }, (error) => {
      reject(error);
    });
  });
}

async function initializeMap() {
  try {
    if (!view) {
      const [esriConfig, Map, MapView, intl, GeoJSONLayer, GroupLayer] = await Promise.all([
        loadModule("esri/config"),
        loadModule("esri/Map"),
        loadModule("esri/views/MapView"),
        loadModule("esri/intl"),
        loadModule("esri/layers/GeoJSONLayer"),
        loadModule("esri/layers/GroupLayer"),
      ]);

      // intl.setLocale("ar");
      esriConfig.apiKey =
        "AAPK756f006de03e44d28710cb446c8dedb4rkQyhmzX6upFiYPzQT0HNQNMJ5qPyO1TnPDSPXT4EAM_DlQSj20ShRD7vyKa7a1H";

      displayMap = new Map({
        basemap: "topo-vector",
      });

      view = new MapView({
        center: [117.1, 5.2], // longitude, latitude, centered on Sabah
        container: "displayMap",
        map: displayMap,
        zoom: 6,
      });

      await view.when();

      //add widgets
      addWidgets()
      .then(([view, displayMap]) => {
        console.log("Widgets Returned From Require Scope", view, displayMap);
        // You can work with the view object here
      })
      .catch((error) => {
        // Handle any errors here
      });


      //display geojsons
      displayLayers()
        .then(([view, displayMap, gL]) => {
          // console.log("gL Returned From Require Scope", gra);
          // You can work with the view object here
        })
        .catch((error) => {
          // Handle any errors here
        });
    }
    // updated start of return array
    return [view, displayMap]; // You can return the view object
    // updated end of return array
  } catch (error) {
    console.error("Error initializing map:", error);
    throw error; // Rethrow the error to handle it further, if needed
  }
}

// calling
initializeMap()
  .then(() => {
    console.log("Map Returned From Require Scope", displayMap);
    // You can work with the view object here
  })
  .catch((error) => {
    // Handle any errors here
  });

async function displayLayers() {
  try {
    const [reactiveUtils, GeoJSONLayer, GroupLayer, FeatureLayer, FeatureTable] = await Promise.all([
      loadModule("esri/core/reactiveUtils"),
      loadModule("esri/layers/GeoJSONLayer"),
      loadModule("esri/layers/GroupLayer"),
      loadModule("esri/layers/FeatureLayer"),
      loadModule("esri/widgets/FeatureTable"),
    ]);


    // Here I will start coding to display some layers and style them

    // List of GeoJSON URLs with Titles
    const geojsonData = [
      { title: "Reservoirs", url: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/Reservoirs.geojson" },
      { title: "DMZCriticalPoint", url: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/DMZCriticalPoint.geojson" },
      { title: "KTM", url: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/KTM.geojson" },
      { title: "TMM", url: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/TMM.geojson" },
      { title: "WTP", url: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/WTP.geojson" },
    ];

    const colors = ["#d92b30", "#3cccb4", "#ffdf3c", "#c27c30", "#f260a1"];

    const commonProperties = {
      type: "simple-marker",
      size: "8px",
      style: "square",
      outline: {  // autocasts as new SimpleLineSymbol()
        color: [ 255, 255, 0 ],
        width: 3  // points
      }
    };

    // Symbol for Interstate highways
    const fwySym = {
      ...commonProperties,
      color: colors[0]
    };

    // Symbol for U.S. Highways
    const hwySym = {
      ...commonProperties,
      color: colors[1]
    };

    // Symbol for state highways
    const stateSym = {
      ...commonProperties,
      color: colors[2]
    };

    // Symbol for other major highways
    const majorSym = {
      ...commonProperties,
      color: colors[3]
    };

    // Symbol for other major highways
    const otherSym = {
      ...commonProperties,
      color: colors[4]
    };

    // const layersRenderer = {
    //   type: "unique-value", // autocasts as new UniqueValueRenderer()
    //   legendOptions: {
    //     title: "Regions"
    //   },
    //   defaultSymbol: otherSym,
    //   defaultLabel: "Other",
    //   field: "regionID",

    //   uniqueValueInfos: [
    //     {
    //       value: "I", // code for interstates/freeways
    //       symbol: fwySym,
    //       label: "Interstate"
    //     },
    //     {
    //       value: "U", // code for U.S. highways
    //       symbol: hwySym,
    //       label: "US Highway"
    //     },
    //     {
    //       value: "S", // code for U.S. highways
    //       symbol: stateSym,
    //       label: "State Highway"
    //     },
    //     {
    //       value: "M", // code for U.S. highways
    //       symbol: majorSym,
    //       label: "Major road"
    //     }
    //   ]
    // };

    const layersRenderer = {
      type: "simple", // autocasts as new SimpleRenderer(),
      style: "circle",
      symbol: {
        type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
        size: 8,
        color: "#0290e3",
        // outline: null
        outline: {  // autocasts as new SimpleLineSymbol()
          color: [ 0, 0, 0 ],
          width: 0.5  // points
        }
      },
      label: "LL" // this will appear next to the symbol in the legend
    };

    // Object to store feature layers for future edits
    const featureLayersMap = {};

    for (const { title, url } of geojsonData) {
      const geojsonLayer = new GeoJSONLayer({ url });

      await geojsonLayer.load();

      const results = await geojsonLayer.queryFeatures();
      const features = results.features;
      if (!features.length) {
        console.warn(`No features found in ${title}`);
        continue;
      }

      // Create a FeatureLayer for the entire GeoJSON
      const featureLayer = new FeatureLayer({
        source: features,
        outFields: ["*"],
        fields: results.fields,
        objectIdField: results.fields[0].name,
        geometryType: results.geometryType,
        title: title, // Assigning the title from geojsonData,
        // renderer: layersRenderer
      });

      // Store the feature layer for future use
      featureLayersMap[url] = featureLayer;

      await featureLayer.load();


      // Create sublayers grouped by 'regionID'
      const attributeName = "regionID";  
      const uniqueValues = [...new Set(features.map(f => f.attributes[attributeName]))];

      const subLayers = uniqueValues.map(value => {
        const filteredFeatures = features.filter(f => f.attributes[attributeName] === value);
        return new FeatureLayer({
          source: filteredFeatures,
          objectIdField: results.fields[0].name,
          title: `${title} - Region ${value}`,
          outFields: ["*"],
          renderer: layersRenderer
        });
      });

      // Create a GroupLayer containing sublayers
      const groupLayer = new GroupLayer({
        title: `${title} (Grouped)`,
        // layers: [featureLayer, ...subLayers]
        layers: [...subLayers]
      });
      groupLayer.visible = false;
      displayMap.add(groupLayer);
    }

    // Store the feature layers globally for future reference
    window.featureLayersMap = featureLayersMap;
    console.log(featureLayersMap, "featureLayersMap")


    // await reservoirsGeojsonlayer.queryFeatures().then(function (results) {
    //   console.log(results, "results");
    //   const featureLayer = new FeatureLayer({
    //     source: results.features,
    //     outFields: ["*"],
    //     fields: results.fields,
    //     objectIdField: results.fields[0].name,
    //     geometryType: results.geometryType,
    //     title: reservoirsGeojsonlayer.title,
    //   });

    //   // Ensure the layer is loaded
    //   // featureLayer.when(() => {
    //     // Step 2: Query features to get the data
    //     featureLayer.queryFeatures().then((featureSet) => {
    //       console.log(featureSet, "featureSet");
    //       const features = featureSet.features;
    //       const attributeName = "regionID"; // Replace with your attribute name
    //       const uniqueValues = [...new Set(features.map(feature => feature.attributes[attributeName]))];

    //       const subLayers = uniqueValues.map(value => {
    //         const filteredFeatures = features.filter(feature => feature.attributes[attributeName] === value);
    //         return new FeatureLayer({
    //           source: filteredFeatures,
    //           objectIdField: results.fields[0].name,
    //           title: value
    //         });
    //       });

    //       // Step 3: Create a GroupLayer
    //       const groupLayer = new GroupLayer({
    //         title: reservoirsGeojsonlayer.title,
    //         layers: subLayers
    //       });
    //       displayMap.add(groupLayer);
    //     });
    //   // }).catch((error) => {
    //   //   console.error("Error loading GeoJSONLayer: ", error);
    //   // });




    //   // // Typical usage for the FeatureTable widget. This will recognize all fields in the layer if none are set.
    //   // const featureTable = new FeatureTable({
    //   //   view: view, // The view property must be set for the select/highlight to work
    //   //   layer: featureLayer,
    //   //   visibleElements: {
    //   //     header: true,
    //   //     menu: true,
    //   //     // Autocast to VisibleElements
    //   //     menuItems: {
    //   //       clearSelection: true,
    //   //       refreshData: true,
    //   //       toggleColumns: true,
    //   //       selectedRecordsShowAllToggle: true,
    //   //       selectedRecordsShowSelectedToggle: true,
    //   //       zoomToSelection: true
    //   //     },
    //   //     selectionColumn: true,
    //   //     columnMenus: true
    //   //   },
    //   //   container: document.getElementById("tableDiv")
    //   // });

    //   // displayMap.add(featureLayer);  // adds the layer to the map
    //   // arrayFeatures.push(featureLayer);
    // });
    // // featureLayers = arrayFeatures;



    await view.when();
    // return gra; // You can return the view object
  } catch (error) {
    console.error("Error initializing map:", error);
    throw error; // Rethrow the error to handle it further, if needed
  }
}


async function addWidgets() {
    try {
      // await initializeMap();

      const [
        BasemapGallery,
        Expand,
        ScaleBar,
        AreaMeasurement2D,
        Search,
        Home,
        LayerList,
        Fullscreen,
        Legend
      ] = await Promise.all([
        loadModule("esri/widgets/BasemapGallery"),
        loadModule("esri/widgets/Expand"),
        loadModule("esri/widgets/ScaleBar"),
        loadModule("esri/widgets/AreaMeasurement2D"),
        loadModule("esri/widgets/Search"),
        loadModule("esri/widgets/Home"),
        loadModule("esri/widgets/LayerList"),
        loadModule("esri/widgets/Fullscreen"),
        loadModule("esri/widgets/Legend"),
      ]);


      var search = new Search({
        //Add Search widget
        view: view,
      });
      view.ui.add(search, { position: "top-left", index: 0 }); //Add to the map

      var homeWidget = new Home({
        view: view,
      });
      view.ui.add(homeWidget, "top-left");

      var layerList = new LayerList({
        view: view,
        container: document.getElementById("layerListContainer") // Place LayerList in the new container
        // listItemCreatedFunction: function (event) {
        //   var item = event.item;
        //   // displays the legend for each layer list item
        //   item.panel = {
        //     content: "legend",
        //   };
        // },
        // showLegend: true
      });

      layerList.visibilityAppearance = "checkbox";
      // layerList.dragEnabled = true;
      // layerList.selectionMode = "multiple";

      var Expand5 = new Expand({
        view: view,
        content: layerList,
        expandIcon: "layers",
        group: "top-right",
        // expanded: false,
      });

      // view.ui.add([Expand5], { position: "top-left", index: 6 });

      var fullscreen = new Fullscreen({
        view: view
      });
      view.ui.add(fullscreen, "top-right");

      let legend = new Legend({
        view: view,
        container: document.getElementById("legendContainer") // Place Legend in the new container
      });

      await view.when();
      return [view, displayMap]; // You can return the view object
    } catch (error) {
      console.error("Error initializing map:", error);
      throw error; // Rethrow the error to handle it further, if needed
    }
}
