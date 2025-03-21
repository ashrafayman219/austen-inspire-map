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


              // Add hitTest functionality
      view.on("click", function (event) {
        view.hitTest(event).then(function (response) {
          if (response.results.length) {
            // Assuming you want to go to the first graphic found
            let graphic = response.results[0].graphic;
            view.goTo(
              {
                target: graphic,
                zoom: 15
              },
              {
                duration: 3000,
              }
            );
          }
        });
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
    const [reactiveUtils, GeoJSONLayer, GroupLayer, FeatureLayer, FeatureTable, SubtypeGroupLayer, SubtypeSublayer] = await Promise.all([
      loadModule("esri/core/reactiveUtils"),
      loadModule("esri/layers/GeoJSONLayer"),
      loadModule("esri/layers/GroupLayer"),
      loadModule("esri/layers/FeatureLayer"),
      loadModule("esri/widgets/FeatureTable"),
      loadModule("esri/layers/SubtypeGroupLayer"),
      loadModule("esri/layers/support/SubtypeSublayer"),
    ]);

    // Here I will start coding to display some layers and style them


    // Consumer Meters || Customer Locations Layers
    // Define a simple renderer for Customer Locations Layers
    const simpleRendererCustomerLocations = {
      type: "simple",
      symbol: {
        type: "simple-marker",
        style: "circle",
        color: "#0290e3",
        size: 9,
        outline: {
          color: "#000000",
          width: 1
        }
      }
    };

    // Define a popup template for Customer Locations Layers
    const popupTemplateCustomerLocations = {
      title: "CUSTOMER LOCATION <br> Premise Number: {premisenum}",
      content: [
        {
          type: "fields",
          fieldInfos: [
            {
              fieldName: "premisenum",
              label: "Phone Number"
            },
            {
              fieldName: "addr1",
              label: "Address 1"
            },
            {
              fieldName: "addr2",
              label: "Address 2"
            },
            {
              fieldName: "addr3",
              label: "Address 3"
            },
            {
              fieldName: "poscod",
              label: "Post Code"
            },
            {
              fieldName: "proptytyp",
              label: "Property Type"
            },
            // {
            //   fieldName: "",
            //   label: "Billing District"
            // },
            // {
            //   fieldName: "",
            //   label: "Operational District"
            // },
            // {
            //   fieldName: "",
            //   label: "WBA (Water Balance Area)"
            // },
            // {
            //   fieldName: "",
            //   label: "DMA"
            // }
            // Add more fields as needed
          ]
        }
      ]
    };

    // Create SubtypeGroupLayers for CustomerLocations
    const layersCustomerLocations = [
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/Kota_Marudu/FeatureServer/0", title: "Kota Marudu" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/Tambunan/FeatureServer/48", title: "Tambunan" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/Ranau/FeatureServer/49", title: "Ranau" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/Tamparuli/FeatureServer/72", title: "Tamparuli" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/Papar/FeatureServer/129", title: "Papar" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/Tuaran/FeatureServer/166", title: "Tuaran" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/KotaBelud/FeatureServer/196", title: "Kota Belud" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/Kudat/FeatureServer/233", title: "Kudat" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/Sandakan/FeatureServer/296", title: "Sandakan" }
    ];

    const subtypeGroupLayersCustomerLocations = layersCustomerLocations.map(layerInfo => {
      const layer = new SubtypeGroupLayer({
        url: layerInfo.url,
        visible: false, // Hide all sublayers initially
        title: layerInfo.title,
        outFields: ["*"], // Ensure all fields are available for the popup
        popupTemplate: popupTemplateCustomerLocations
      });

      // Apply the renderer to each sublayer
      layer.when(() => {
        layer.sublayers.forEach(sublayer => {
          sublayer.visible = false;
          sublayer.renderer = simpleRendererCustomerLocations;
          sublayer.popupTemplate = popupTemplateCustomerLocations;
        });
      });

      return layer;
    });

    const Customer_Locations = new GroupLayer({
      title: "Customer Locations",
      layers: subtypeGroupLayersCustomerLocations,
      visible: false // Hide all sublayers initially
    });

    // console.log(Customer_Locations, "Customer_Locations");
    // displayMap.add(Customer_Locations);  // adds the layer to the map

    // DMZ Critical Points Layers
    // Create SubtypeGroupLayers for DMZ Critical Points
    const layersDMZCriticalPoints = [
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/DMZCriticalPoint_KotaKinabalu/FeatureServer/132", title: "Kota Kinabalu" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/DMZCriticalPoint_Semporna/FeatureServer/72", title: "Semporna" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/DMZCriticalPoint_Tambunan/FeatureServer/12", title: "Tambunan" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/DMZCriticalPoint_Sandakan/FeatureServer/47", title: "Sandakan" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/DMZCriticalPoint_Kudat/FeatureServer/15", title: "Kudat" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/DMZCriticalPoint_KotaBelud/FeatureServer/45", title: "Kota Belud" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/DMZCriticalPoint_Papar/FeatureServer/12", title: "Papar" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/DMZCriticalPoint_Ranau/FeatureServer/20", title: "Ranau" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/DMZCriticalPoint_KotaMarudu/FeatureServer/19", title: "Kota Marudu" },
      // { url: "", title: "" },
    ];

    const subtypeGroupLayersDMZCriticalPoints = layersDMZCriticalPoints.map(layerInfo => {
      const layer = new SubtypeGroupLayer({
        url: layerInfo.url,
        visible: false, // Hide all sublayers initially
        title: layerInfo.title,
        outFields: ["*"], // Ensure all fields are available for the popup
        // popupTemplate: popupTemplateCustomerLocations
      });

      // Apply the renderer to each sublayer
      layer.when(() => {
        layer.sublayers.forEach(sublayer => {
          sublayer.visible = false;
          // sublayer.renderer = simpleRendererCustomerLocations;
          // sublayer.popupTemplate = popupTemplateCustomerLocations;
        });
      });
      return layer;
    });

    const DMZCriticalPoints = new GroupLayer({
      title: "DMZ Critical Points",
      layers: subtypeGroupLayersDMZCriticalPoints,
      visible: false // Hide all sublayers initially
    });
    // displayMap.add(DMZCriticalPoints);  // adds the layer to the map


    // KTM Layers
    // Create SubtypeGroupLayers for KTM
    const layersKTM = [
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/KTM_KotaKinabalu/FeatureServer/54", title: "Kota Kinabalu" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/KTM_Tambunan/FeatureServer/8", title: "Tambunan" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/KTM_Kudat/FeatureServer/8", title: "Kudat" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/KTM_Papar/FeatureServer/0", title: "Papar" },
      // { url: "", title: "" },
    ];

    const subtypeGroupLayersKTM = layersKTM.map(layerInfo => {
      const layer = new SubtypeGroupLayer({
        url: layerInfo.url,
        visible: false, // Hide all sublayers initially
        title: layerInfo.title,
        outFields: ["*"], // Ensure all fields are available for the popup
        // popupTemplate: popupTemplateCustomerLocations
      });

      // Apply the renderer to each sublayer
      layer.when(() => {
        layer.sublayers.forEach(sublayer => {
          sublayer.visible = false;
          // sublayer.renderer = simpleRendererCustomerLocations;
          // sublayer.popupTemplate = popupTemplateCustomerLocations;
        });
      });
      return layer;
    });

    const KTM = new GroupLayer({
      title: "Trunk Main Meter Points",
      layers: subtypeGroupLayersKTM,
      visible: false // Hide all sublayers initially
    });
    // displayMap.add(KTM);  // adds the layer to the map


    // Reservoirs Layers
    // Create SubtypeGroupLayers for Reservoirs
    const layersReservoirs = [
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/Reservoirs_KotaKinabalu/FeatureServer/32", title: "Kota Kinabalu" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/Reservoirs_Semporna/FeatureServer/15", title: "Semporna" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/Reservoirs_Tambunan/FeatureServer/12", title: "Tambunan" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/Reservoirs_Sandakan/FeatureServer/15", title: "Sandakan" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/Reservoirs_Kudat/FeatureServer/21", title: "Kudat" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/Reservoirs_KotaBelud/FeatureServer/15", title: "Kota Belud" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/Reservoirs_Tuaran/FeatureServer/12", title: "Tuaran" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/Reservoirs_Papar/FeatureServer/16", title: "Papar" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/Reservoirs_Tamparuli/FeatureServer/12", title: "Tamparuli" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/Reservoirs_Ranau/FeatureServer/24", title: "Ranau" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/Reservoirs_KotaMarudu/FeatureServer/0", title: "Kota Marudu" },
      // { url: "", title: "" },
    ];

    const subtypeGroupLayersReservoirs = layersReservoirs.map(layerInfo => {
      const layer = new SubtypeGroupLayer({
        url: layerInfo.url,
        visible: false, // Hide all sublayers initially
        title: layerInfo.title,
        outFields: ["*"], // Ensure all fields are available for the popup
        // popupTemplate: popupTemplateCustomerLocations
      });

      // Apply the renderer to each sublayer
      layer.when(() => {
        layer.sublayers.forEach(sublayer => {
          sublayer.visible = false;
          // sublayer.renderer = simpleRendererCustomerLocations;
          // sublayer.popupTemplate = popupTemplateCustomerLocations;
        });
      });
      return layer;
    });

    const Reservoirs = new GroupLayer({
      title: "Reservoirs",
      layers: subtypeGroupLayersReservoirs,
      visible: false // Hide all sublayers initially
    });
    displayMap.add(Reservoirs);  // adds the layer to the map
    displayMap.add(KTM);
    displayMap.add(DMZCriticalPoints);
    displayMap.add(Customer_Locations);










    // const Kota_Marudu = new SubtypeGroupLayer({
    //   url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/Kota_Marudu/FeatureServer/0",
    //   visible: false // Hide all sublayers initially
    // });

    // const Tambunan = new SubtypeGroupLayer({
    //   url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/Tambunan/FeatureServer/48",
    //   visible: false // Hide all sublayers initially
    // });

    // const Ranau = new SubtypeGroupLayer({
    //   url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/Ranau/FeatureServer/49",
    //   visible: false // Hide all sublayers initially
    // });
    
    // const Tamparuli = new SubtypeGroupLayer({
    //   url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/Tamparuli/FeatureServer/72",
    //   visible: false // Hide all sublayers initially
    // });

    // const Papar = new SubtypeGroupLayer({
    //   url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/Papar/FeatureServer/129",
    //   visible: false // Hide all sublayers initially
    // });
    
    // const Tuaran = new SubtypeGroupLayer({
    //   url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/Tuaran/FeatureServer/166",
    //   visible: false // Hide all sublayers initially
    // });

    // const Kota_Belud = new SubtypeGroupLayer({
    //   url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/KotaBelud/FeatureServer/196",
    //   visible: false // Hide all sublayers initially
    // });

    // const Kudat = new SubtypeGroupLayer({
    //   url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/Kudat/FeatureServer/233",
    //   visible: false // Hide all sublayers initially
    // });

    // const Sandakan = new SubtypeGroupLayer({
    //   url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/Sandakan/FeatureServer/296",
    //   visible: false // Hide all sublayers initially
    // });

    // const Customer_Locations = new GroupLayer({
    //   title: "Customer Locations",
    //   layers: [Kota_Marudu, Tambunan, Ranau, Tamparuli, Papar, Tuaran, Kota_Belud, Kudat, Sandakan],
    //   visible: false // Hide all sublayers initially
    // });

    // console.log(Customer_Locations, "Customer_Locations")
    // displayMap.add(Customer_Locations);  // adds the layer to the map

    




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
        container: document.getElementById("layerListContainer"), // Place LayerList in the new container,
        listItemCreatedFunction: defineActions


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

      function defineActions(event) {
        const { item } = event;
        if (item.layer.type === "subtype-group") {
          item.actionsSections = [
            [
              {
                title: "Go to full extent",
                icon: "zoom-out-fixed",
                id: "full-extent"
              }
            ]
          ];
        }
      }
      
      layerList.on("trigger-action", (event) => {
        const id = event.action.id;
        const layer = event.item.layer;
      
        if (id === "full-extent") {
          // view.goTo(layer.fullExtent)
          view.goTo(
            {
              target: layer.fullExtent,
            },
            {
              duration: 3000,
            }
          ).catch((error) => {
            if (error.name !== "AbortError") {
              console.error(error);
            }
          });
        }
      });


      
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


    // // List of GeoJSON URLs with Titles
    // const geojsonData = [
    //   { title: "Reservoirs", url: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/Reservoirs.geojson" },
    //   { title: "DMZCriticalPoint", url: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/DMZCriticalPoint.geojson" },
    //   { title: "KTM", url: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/KTM.geojson" },
    //   { title: "TMM", url: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/TMM.geojson" },
    //   { title: "WTP", url: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/WTP.geojson" },
    // ];

    // // Object to store feature layers for future edits
    // const featureLayersMap = {};

    // for (const { title, url } of geojsonData) {
    //   const geojsonLayer = new GeoJSONLayer({ url });

    //   await geojsonLayer.load();
      
    //   const results = await geojsonLayer.queryFeatures();
    //   const features = results.features;
    //   if (!features.length) {
    //     console.warn(`No features found in ${title}`);
    //     continue;
    //   }

    //   // Create a FeatureLayer for the entire GeoJSON
    //   const featureLayer = new FeatureLayer({
    //     source: features,
    //     outFields: ["*"],
    //     fields: results.fields,
    //     objectIdField: results.fields[0].name,
    //     geometryType: results.geometryType,
    //     title: title, // Assigning the title from geojsonData,
    //     // renderer: layersRenderer,
    //     visible: false // Ensure main layer is hidden initially
    //   });

    //   // Store the feature layer for future use
    //   featureLayersMap[url] = featureLayer;

    //   await featureLayer.load();


    //   // Create sublayers grouped by 'regionID'
    //   const regionAttribute = "regionID";
    //   const siteAttribute = "sitecode";

    //   const regionValues = [...new Set(features.map(f => f.attributes[regionAttribute]))];

    //   // Store sublayers for future use
    //   const regionSublayersMap = {};

    //   const regionSublayers = regionValues.map(regionValue => {
    //     const regionFeatures = features.filter(f => f.attributes[regionAttribute] === regionValue);

    //     // Further classify by 'sitecode'
    //     const siteValues = [...new Set(regionFeatures.map(f => f.attributes[siteAttribute]))];

    //     const siteSublayers = siteValues.map(siteValue => {
    //       const siteFilteredFeatures = regionFeatures.filter(f => f.attributes[siteAttribute] === siteValue);
    //       const siteLayer = new FeatureLayer({
    //         source: siteFilteredFeatures,
    //         objectIdField: results.fields[0].name,
    //         title: `Region ${regionValue} - Site ${siteValue}`,
    //         outFields: ["*"],
    //         visible: false // Hide site-level layers initially
    //       });

    //       return siteLayer;
    //     });

    //     // Store region sublayers
    //     regionSublayersMap[regionValue] = siteSublayers;

    //     return new GroupLayer({
    //       title: `Region ${regionValue}`,
    //       layers: siteSublayers, // Add only site-level sublayers
    //       visible: false // Hide region-level layers initially
    //     });
    //   });

    //   // Create a GroupLayer containing region-level sublayers
    //   const groupLayer = new GroupLayer({
    //     title: `${title} (Grouped)`,
    //     layers: regionSublayers,
    //     visible: false // Hide all sublayers initially
    //   });

    //   displayMap.add(groupLayer);

    //   // Store the sublayers for future reference
    //   featureLayersMap[title] = {
    //     featureLayer,
    //     regionSublayersMap
    //   };
    // }

    // // Store the feature layers globally for easy reference
    // window.featureLayersMap = featureLayersMap;
    // console.log(featureLayersMap, "featureLayersMap");



    // view.on("click", function (event) {
    //   view.hitTest(event).then(function (response) {
    //     if (response.results.length) {
    //       let graphic = response.results.filter(function (result) {
    //         return (
    //           result.graphic.layer === groupLayer
    //         );
    //       })[0].graphic;
    //       view.goTo(
    //         {
    //           target: graphic,
    //         },
    //         {
    //           duration: 2000,
    //         }
    //       );
    //     }
    //   });
    // });


    
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





























// const colors = ["#d92b30", "#3cccb4", "#ffdf3c", "#c27c30", "#f260a1"];

// const commonProperties = {
//   type: "simple-marker",
//   size: "8px",
//   style: "square",
//   outline: {  // autocasts as new SimpleLineSymbol()
//     color: [ 255, 255, 0 ],
//     width: 3  // points
//   }
// };

// // Symbol for Interstate highways
// const fwySym = {
//   ...commonProperties,
//   color: colors[0]
// };

// // Symbol for U.S. Highways
// const hwySym = {
//   ...commonProperties,
//   color: colors[1]
// };

// // Symbol for state highways
// const stateSym = {
//   ...commonProperties,
//   color: colors[2]
// };

// // Symbol for other major highways
// const majorSym = {
//   ...commonProperties,
//   color: colors[3]
// };

// // Symbol for other major highways
// const otherSym = {
//   ...commonProperties,
//   color: colors[4]
// };

// // const layersRenderer = {
// //   type: "unique-value", // autocasts as new UniqueValueRenderer()
// //   legendOptions: {
// //     title: "Regions"
// //   },
// //   defaultSymbol: otherSym,
// //   defaultLabel: "Other",
// //   field: "regionID",

// //   uniqueValueInfos: [
// //     {
// //       value: "I", // code for interstates/freeways
// //       symbol: fwySym,
// //       label: "Interstate"
// //     },
// //     {
// //       value: "U", // code for U.S. highways
// //       symbol: hwySym,
// //       label: "US Highway"
// //     },
// //     {
// //       value: "S", // code for U.S. highways
// //       symbol: stateSym,
// //       label: "State Highway"
// //     },
// //     {
// //       value: "M", // code for U.S. highways
// //       symbol: majorSym,
// //       label: "Major road"
// //     }
// //   ]
// // };

// const layersRenderer = {
//   type: "simple", // autocasts as new SimpleRenderer(),
//   style: "circle",
//   symbol: {
//     type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
//     size: 8,
//     color: "#0290e3",
//     // outline: null
//     outline: {  // autocasts as new SimpleLineSymbol()
//       color: [ 0, 0, 0 ],
//       width: 0.5  // points
//     }
//   },
//   label: "LL" // this will appear next to the symbol in the legend
// };



