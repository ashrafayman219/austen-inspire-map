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
        center: [117.04781494140617, 5.224617021704047], // longitude, latitude, centered on Sabah
        container: "displayMap",
        map: displayMap,
        zoom: 8,
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
    const [reactiveUtils, GeoJSONLayer, GroupLayer, FeatureLayer, FeatureTable, SubtypeGroupLayer, SubtypeSublayer, LayerList] = await Promise.all([
      loadModule("esri/core/reactiveUtils"),
      loadModule("esri/layers/GeoJSONLayer"),
      loadModule("esri/layers/GroupLayer"),
      loadModule("esri/layers/FeatureLayer"),
      loadModule("esri/widgets/FeatureTable"),
      loadModule("esri/layers/SubtypeGroupLayer"),
      loadModule("esri/layers/support/SubtypeSublayer"),
      loadModule("esri/widgets/LayerList"),
    ]);

    // Here I will start coding to display some layers and style them


    const layersDMZMeterPoints = [
      { url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/DMZ_MeterPoints_KotaBelud/FeatureServer/0", title: "Kota Belud" },
      { url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/DMZ_MeterPoints_KotaKinabalu/FeatureServer/280", title: "Kota Kinabalu" },
      { url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/DMZ_MeterPoints_KotaMarudu/FeatureServer/317", title: "Kota Marudu" },
      { url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/DMZ_MeterPoints_Kudat/FeatureServer/340", title: "Kudat" },
      { url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/DMZ_MeterPoints_Papar/FeatureServer/388", title: "Papar" },
      { url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/DMZ_MeterPoints_Ranau/FeatureServer/425", title: "Ranau" },
      { url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/DMZ_MeterPoints_Sandakan/FeatureServer/489", title: "Sandakan" },
      { url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/DMZ_MeterPoints_Semporna/FeatureServer/526", title: "Semporna" },
      { url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/DMZ_MeterPoints_Tambunan/FeatureServer/550", title: "Tambunan" },
      { url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/DMZ_MeterPoints_Tamparuli/FeatureServer/561", title: "Tamparuli" },
      { url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/DMZ_MeterPoints_Tawau/FeatureServer/628", title: "Tawau" },
      { url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/DMZ_MeterPoints_Tuaran/FeatureServer/665", title: "Tuaran" },
      // { url: "", title: "" },
    ];
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
    const layersKTM = [
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/KTM_KotaKinabalu/FeatureServer/54", title: "Kota Kinabalu" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/KTM_Tambunan/FeatureServer/8", title: "Tambunan" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/KTM_Kudat/FeatureServer/8", title: "Kudat" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/KTM_Papar/FeatureServer/0", title: "Papar" },
      // { url: "", title: "" },
    ];
    const layersWTP = [
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/WTP_KotaKinabalu/FeatureServer/15", title: "Kota Kinabalu" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/WTP_Semporna/FeatureServer/12", title: "Semporna" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/WTP_Tambunan/FeatureServer/12", title: "Tambunan" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/WTP_Sandakan/FeatureServer/15", title: "Sandakan" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/WTP_Kudat/FeatureServer/12", title: "Kudat" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/WTP_KotaBelud/FeatureServer/12", title: "Kota Belud" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/WTP_Tuaran/FeatureServer/12", title: "Tuaran" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/WTP_Papar/FeatureServer/12", title: "Papar" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/WTP_Tamparuli/FeatureServer/12", title: "Tamparuli" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/WTP_Ranau/FeatureServer/12", title: "Ranau" },
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/WTP_KotaMarudu/FeatureServer/12", title: "Kota Marudu" },
      // { url: "", title: "" },
    ];
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
    const layersDMZBoundaries = [
      { url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/DMZ_Boundaries_Ranau/FeatureServer/458", title: "Ranau" },
      { url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/DMZ_Boundaries_Tambunan/FeatureServer/579", title: "Tambunan" },
      { url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/DMZ_Boundaries_Papar/FeatureServer/434", title: "Papar" },
      { url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/DMZ_Boundaries_Tamparuli/FeatureServer/605", title: "Tamparuli" },
      { url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/DMZ_Boundaries_KotaBelud/FeatureServer/46", title: "Kota Belud" },
      { url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/DMZ_Boundaries_KotaMarudu/FeatureServer/365", title: "Kota Marudu" },
      { url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/DMZ_Boundaries_Kudat/FeatureServer/385", title: "Kudat" },
      { url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/DMZ_Boundaries_Sandakan/FeatureServer/540", title: "Sandakan" },
      { url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/DMZ_Boundaries_Semporna/FeatureServer/567", title: "Semporna" },
      { url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/DMZ_Boundaries_Tawau/FeatureServer/677", title: "Tawau" },
      { url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/DMZ_Boundaries_KotaKinabalu/FeatureServer/339", title: "Kota Kinabalu" },
      // { url: "", title: "" },
    ];
    const layersTransmissionMainMeterPoints = [
      { url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/Transmission_Main_Meter_Points_Kudat/FeatureServer/270", title: "Kudat" },
      { url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/Transmission_Main_Meter_Points_Papar/FeatureServer/265", title: "Papar" },
      { url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/Transmission_Main_Meter_Points_KotaKinabalu/FeatureServer/281", title: "Kota Kinabalu" },
      // { url: "", title: "" },
    ];
    const waterMainLayers = [
      {
        title: "Kota Kinabalu",
        subGroups: [
          { title: "PrimaryTransmissionMain", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/WaterMain_Kota_Kinabalu_PrimaryTransmissionMain/FeatureServer/15" },
          { title: "Secondary Trunk Main", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/WaterMain_Kota_Kinabalu_SecondaryTrunkMain/FeatureServer/38" },
          { title: "Tertiary Distribution Main", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/WaterMain_Kota_Kinabalu_TertiaryDistributionMain/FeatureServer/49" },
          { title: "Raw Water Main", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/WaterMain_Kota_Kinabalu_RawWaterMain/FeatureServer/23" },
        ]
      },
      {
        title: "Kota Belud",
        subGroups: [
          { title: "Primary Transmission Main", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/WaterMain_KotaBelud_PrimaryTransmissionMain/FeatureServer/61" },
          { title: "Secondary Trunk Main", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/WaterMain_KotaBelud_SecondaryTrunkMain/FeatureServer/69" },
          { title: "Tertiary Distribution Main", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/WaterMain_KotaBelud_TertiaryDistributionMain/FeatureServer/77" }
        ]
      },
      {
        title: "Kota Marudu",
        subGroups: [
          { title: "Primary Transmission Main", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/WaterMain_KotaMarudu_PrimaryTransmissionMain/FeatureServer/93" },
          { title: "Secondary Trunk Main", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/WaterMain_KotaMarudu_SecondaryTrunkMain/FeatureServer/98" },
          { title: "Tertiary Distribution Main", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/WaterMain_KotaMarudu_TertiaryDistributionMain/FeatureServer/100" },

        ]
      },
      {
        title: "Kudat",
        subGroups: [
          { title: "Primary Transmission Main", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/WaterMain_Kudat_PrimaryTransmissionMain/FeatureServer/111" },
          { title: "Secondary Trunk Main", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/WaterMain_Kudat_SecondaryTrunkMain/FeatureServer/125" },
          { title: "Tertiary Distribution Main", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/WaterMain_Kudat_TertiaryDistributionMain/FeatureServer/134" },

        ]
      },
      {
        title: "Papar",
        subGroups: [
          { title: "Primary Transmission Main", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/WaterMain_Papar_PrimaryTransmissionMain/FeatureServer/146" },
          { title: "Secondary Trunk Main", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/WaterMain_Papar_SecondaryTrunkMain/FeatureServer/151" },
          { title: "Tertiary Distribution Main", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/WaterMain_Papar_TertiaryDistributionMain/FeatureServer/158" },

        ]
      },
      {
        title: "Ranau",
        subGroups: [
          { title: "Primary Transmission Main", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/WaterMain_Ranau_PrimaryTransmissionMain/FeatureServer/168" },
          { title: "Secondary Trunk Main", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/WaterMain_Ranau_SecondaryTrunkMain/FeatureServer/174" },
          { title: "Tertiary Distribution Main", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/WaterMain_Ranau_TertiaryDistributionMain/FeatureServer/180" },

        ]
      },
      {
        title: "Sandakan",
        subGroups: [
          { title: "Primary Transmission Main", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/WaterMain_Sandakan_PrimaryTransmissionMain/FeatureServer/196" },
          { title: "Secondary Trunk Main", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/WaterMain_Sandakan_SecondaryTrunkMain/FeatureServer/219" },
          { title: "Tertiary Distribution Main", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/WaterMain_Sandakan_TertiaryDistributionMain/FeatureServer/231" },
          { title: "PrivateMain", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/WaterMain_Sandakan_PrivateMain/FeatureServer/206" },

        ]
      },
      {
        title: "Tambunan",
        subGroups: [
          { title: "Tertiary Distribution Main", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/WaterMain_Tambunan_TertiaryDistributionMain/FeatureServer/242" },

        ]
      },
      {
        title: "Tuaran",
        subGroups: [
          { title: "Primary Transmission Main", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/WaterMain_Tuaran_PrimaryTransmissionMain/FeatureServer/254" },
          { title: "Secondary Trunk Main", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/WaterMain_Tuaran_SecondaryTrunkMain/FeatureServer/258" },
          { title: "Tertiary Distribution Main", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/WaterMain_Tuaran_TertiaryDistributionMain/FeatureServer/0" },

        ]
      },
    ];
        




    // // Consumer Meters || Customer Locations Layers
    // // Define a simple renderer for Customer Locations Layers
    // const simpleRendererCustomerLocations = {
    //   type: "simple",
    //   symbol: {
    //     type: "simple-marker",
    //     style: "circle",
    //     color: "#0290e3",
    //     size: 9,
    //     outline: {
    //       color: "#000000",
    //       width: 1
    //     }
    //   }
    // };

    // // Define a popup template for Customer Locations Layers
    // const popupTemplateCustomerLocations = {
    //   title: "CUSTOMER LOCATION <br> Premise Number: {premisenum}",
    //   content: [
    //     {
    //       type: "fields",
    //       fieldInfos: [
    //         {
    //           fieldName: "premisenum",
    //           label: "Phone Number"
    //         },
    //         {
    //           fieldName: "addr1",
    //           label: "Address 1"
    //         },
    //         {
    //           fieldName: "addr2",
    //           label: "Address 2"
    //         },
    //         {
    //           fieldName: "addr3",
    //           label: "Address 3"
    //         },
    //         {
    //           fieldName: "poscod",
    //           label: "Post Code"
    //         },
    //         {
    //           fieldName: "proptytyp",
    //           label: "Property Type"
    //         },
    //         // {
    //         //   fieldName: "",
    //         //   label: "Billing District"
    //         // },
    //         // {
    //         //   fieldName: "",
    //         //   label: "Operational District"
    //         // },
    //         // {
    //         //   fieldName: "",
    //         //   label: "WBA (Water Balance Area)"
    //         // },
    //         // {
    //         //   fieldName: "",
    //         //   label: "DMA"
    //         // }
    //         // Add more fields as needed
    //       ]
    //     }
    //   ]
    // };

    // // Create SubtypeGroupLayers for CustomerLocations


    // const subtypeGroupLayersCustomerLocations = layersCustomerLocations.map(layerInfo => {
    //   const layer = new SubtypeGroupLayer({
    //     url: layerInfo.url,
    //     visible: false, // Hide all sublayers initially
    //     title: layerInfo.title,
    //     outFields: ["*"], // Ensure all fields are available for the popup
    //     popupTemplate: popupTemplateCustomerLocations
    //   });

    //   // Apply the renderer to each sublayer
    //   layer.when(() => {
    //     layer.sublayers.forEach(sublayer => {
    //       sublayer.visible = false;
    //       sublayer.renderer = simpleRendererCustomerLocations;
    //       sublayer.popupTemplate = popupTemplateCustomerLocations;
    //     });
    //   });

    //   return layer;
    // });

    // const Customer_Locations = new GroupLayer({
    //   title: "Customer Locations",
    //   layers: subtypeGroupLayersCustomerLocations,
    //   visible: false // Hide all sublayers initially
    // });

    // // console.log(Customer_Locations, "Customer_Locations");
    // // displayMap.add(Customer_Locations);  // adds the layer to the map

    // // DMZ Critical Points Layers
    // // Create SubtypeGroupLayers for DMZ Critical Points


    // const subtypeGroupLayersDMZCriticalPoints = layersDMZCriticalPoints.map(layerInfo => {
    //   const layer = new SubtypeGroupLayer({
    //     url: layerInfo.url,
    //     visible: false, // Hide all sublayers initially
    //     title: layerInfo.title,
    //     outFields: ["*"], // Ensure all fields are available for the popup
    //     // popupTemplate: popupTemplateCustomerLocations
    //   });

    //   // Apply the renderer to each sublayer
    //   layer.when(() => {
    //     layer.sublayers.forEach(sublayer => {
    //       sublayer.visible = false;
    //       // sublayer.renderer = simpleRendererCustomerLocations;
    //       // sublayer.popupTemplate = popupTemplateCustomerLocations;
    //     });
    //   });
    //   return layer;
    // });

    // const DMZCriticalPoints = new GroupLayer({
    //   title: "DMZ Critical Points",
    //   layers: subtypeGroupLayersDMZCriticalPoints,
    //   visible: false // Hide all sublayers initially
    // });
    // // displayMap.add(DMZCriticalPoints);  // adds the layer to the map


    // // KTM Layers
    // // Create SubtypeGroupLayers for KTM


    // const subtypeGroupLayersKTM = layersKTM.map(layerInfo => {
    //   const layer = new SubtypeGroupLayer({
    //     url: layerInfo.url,
    //     visible: false, // Hide all sublayers initially
    //     title: layerInfo.title,
    //     outFields: ["*"], // Ensure all fields are available for the popup
    //     // popupTemplate: popupTemplateCustomerLocations
    //   });

    //   // Apply the renderer to each sublayer
    //   layer.when(() => {
    //     layer.sublayers.forEach(sublayer => {
    //       sublayer.visible = false;
    //       // sublayer.renderer = simpleRendererCustomerLocations;
    //       // sublayer.popupTemplate = popupTemplateCustomerLocations;
    //     });
    //   });
    //   return layer;
    // });

    // const KTM = new GroupLayer({
    //   title: "Trunk Main Meter Points",
    //   layers: subtypeGroupLayersKTM,
    //   visible: false // Hide all sublayers initially
    // });
    // // displayMap.add(KTM);  // adds the layer to the map


    // // Reservoirs Layers
    // // Create SubtypeGroupLayers for Reservoirs

    // const subtypeGroupLayersReservoirs = layersReservoirs.map(layerInfo => {
    //   const layer = new SubtypeGroupLayer({
    //     url: layerInfo.url,
    //     visible: false, // Hide all sublayers initially
    //     title: layerInfo.title,
    //     outFields: ["*"], // Ensure all fields are available for the popup
    //     // popupTemplate: popupTemplateCustomerLocations
    //   });

    //   // Apply the renderer to each sublayer
    //   layer.when(() => {
    //     layer.sublayers.forEach(sublayer => {
    //       sublayer.visible = false;
    //       // sublayer.renderer = simpleRendererCustomerLocations;
    //       // sublayer.popupTemplate = popupTemplateCustomerLocations;
    //     });
    //   });
    //   return layer;
    // });

    // const Reservoirs = new GroupLayer({
    //   title: "Reservoirs",
    //   layers: subtypeGroupLayersReservoirs,
    //   visible: false // Hide all sublayers initially
    // });


    // // WTP Layers
    // // Create SubtypeGroupLayers for WTP

    // const subtypeGroupLayersWTP = layersWTP.map(layerInfo => {
    //   const layer = new SubtypeGroupLayer({
    //     url: layerInfo.url,
    //     visible: false, // Hide all sublayers initially
    //     title: layerInfo.title,
    //     outFields: ["*"], // Ensure all fields are available for the popup
    //     // popupTemplate: popupTemplateCustomerLocations
    //   });

    //   // Apply the renderer to each sublayer
    //   layer.when(() => {
    //     layer.sublayers.forEach(sublayer => {
    //       sublayer.visible = false;
    //       // sublayer.renderer = simpleRendererCustomerLocations;
    //       // sublayer.popupTemplate = popupTemplateCustomerLocations;
    //     });
    //   });
    //   return layer;
    // });

    // const WTP = new GroupLayer({
    //   title: "Water Treatment Plant",
    //   layers: subtypeGroupLayersWTP,
    //   visible: false // Hide all sublayers initially
    // });






    // // DMZBoundaries Layers
    // // Define a simple renderer for Customer Locations Layers
    // const simpleRendererDMZBoundaries = {
    //   type: "simple", // autocasts as new SimpleRenderer()
    //   symbol: {
    //     type: "simple-fill", // autocasts as new SimpleFillSymbol()
    //     color: [166, 25, 77, 0.5],
    //     outline: {
    //       // makes the outlines of all features consistently light gray
    //       color: "lightgray",
    //       width: 1
    //     }
    //   }
    // };

    // // Create SubtypeGroupLayers for DMZBoundaries

    // const subtypeGroupLayersDMZBoundaries = layersDMZBoundaries.map(layerInfo => {
    //   const layer = new SubtypeGroupLayer({
    //     url: layerInfo.url,
    //     visible: false, // Hide all sublayers initially
    //     title: layerInfo.title,
    //     outFields: ["*"], // Ensure all fields are available for the popup
    //     // popupTemplate: popupTemplateCustomerLocations
    //   });

    //   // Apply the renderer to each sublayer
    //   layer.when(() => {
    //     layer.sublayers.forEach(sublayer => {
    //       sublayer.visible = false;
    //       sublayer.renderer = simpleRendererDMZBoundaries;
    //       // sublayer.popupTemplate = popupTemplateCustomerLocations;
    //     });
    //   });
    //   return layer;
    // });

    // const DMZBoundaries = new GroupLayer({
    //   title: "DMZ Boundaries",
    //   layers: subtypeGroupLayersDMZBoundaries,
    //   visible: false // Hide all sublayers initially
    // });



    // // DMZMeterPoints Layers
    // // Create SubtypeGroupLayers for DMZMeterPoints


    // const subtypeGroupLayersDMZMeterPoints = layersDMZMeterPoints.map(layerInfo => {
    //   const layer = new SubtypeGroupLayer({
    //     url: layerInfo.url,
    //     visible: false, // Hide all sublayers initially
    //     title: layerInfo.title,
    //     outFields: ["*"], // Ensure all fields are available for the popup
    //     // popupTemplate: popupTemplateCustomerLocations
    //   });

    //   // Apply the renderer to each sublayer
    //   layer.when(() => {
    //     layer.sublayers.forEach(sublayer => {
    //       sublayer.visible = false;
    //       // sublayer.renderer = simpleRendererDMZMeterPoints;
    //       // sublayer.popupTemplate = popupTemplateCustomerLocations;
    //     });
    //   });
    //   return layer;
    // });

    // const DMZMeterPoints = new GroupLayer({
    //   title: "DMZ Meter Points",
    //   layers: subtypeGroupLayersDMZMeterPoints,
    //   visible: false // Hide all sublayers initially
    // });




    

    // displayMap.add(DMZMeterPoints);  // adds the layer to the map
    // displayMap.add(DMZBoundaries);  // adds the layer to the map
    // displayMap.add(WTP);  // adds the layer to the map
    // displayMap.add(Reservoirs);  // adds the layer to the map
    // displayMap.add(KTM);
    // displayMap.add(DMZCriticalPoints);
    // displayMap.add(Customer_Locations);



    



// Define Group Layers with new structure for WaterMain
const groupLayers = {
  "Customer Locations": layersCustomerLocations,
  "DMZ Critical Points": layersDMZCriticalPoints,
  "KTM": layersKTM,
  "Reservoirs": layersReservoirs,
  "WTP": layersWTP,
  "DMZ Boundaries": layersDMZBoundaries,
  "DMZ Meter Points": layersDMZMeterPoints,
  "WaterMain": waterMainLayers // Special structure for nested layers
};







    // Store active layers on the map
    const activeLayers = new Map();

  const clearButton = document.getElementById("clearButton");


  // Function to Load Group Layers into the Map
async function loadGroupLayer(groupName) {
  console.log(`Loading Group: ${groupName}`);
  if (!activeLayers.has(groupName)) {
    // const [GroupLayer, SubtypeGroupLayer] = await Promise.all([
    //   loadModule("esri/layers/GroupLayer"),
    //   loadModule("esri/layers/SubtypeGroupLayer"),
    // ]);

    let layers = [];

    if (groupName === "Water Mains") {
      // Handle Nested Structure (WaterMain → Regions → SubtypeGroupLayers)
      layers = waterMainLayers.map((region) => {
        const subLayers = region.subGroups.map((subGroup) => {
          return new SubtypeGroupLayer({
            url: subGroup.url,
            visible: true,
            title: subGroup.title,
          });
        });

        return new GroupLayer({
          title: region.title,
          layers: subLayers,
          visible: true
        });
      });

      // Create the Main WaterMain Group Layer
      const waterMainGroupLayer = new GroupLayer({
        title: "WaterMain",
        layers,
        visible: true,
      });

      displayMap.add(waterMainGroupLayer);
      activeLayers.set(groupName, waterMainGroupLayer);

    } else {
      // Default Handling for Other Layers
      layers = groupLayers[groupName].map((layerInfo) => new SubtypeGroupLayer({
        url: layerInfo.url,
        visible: true,
        title: layerInfo.title,
      }));

      const newGroupLayer = new GroupLayer({
        title: groupName,
        layers,
        visible: true,
      });

      displayMap.add(newGroupLayer);
      // console.log(newGroupLayer, "newGroupLayer");
      // newGroupLayer.loadAll().catch(function(error) {
      //   // Ignore any failed sublayers
      // })
      // .then(function() {
      //   console.log("All loaded");
      //   view.goTo(
      //     {
      //       target: newGroupLayer.allLayers,
      //       // zoom: 15
      //     },
      //     {
      //       duration: 3000,
      //     }
      //   );
      // });
      activeLayers.set(groupName, newGroupLayer);
    }
  }
}




// Attach Event Listeners to Tabs
document.querySelectorAll(".layer-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const groupName = tab.getAttribute("data-group");
    loadGroupLayer(groupName);
  });
});

  // "Clear All Layers" Button - Remove all layers from the map
  clearButton.addEventListener("click", () => {
    activeLayers.forEach((layer) => displayMap.remove(layer));
    activeLayers.clear();
    console.log("All layers cleared.");
  });

    

























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
        // listItemCreatedFunction: defineActions


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
      layerList.listItemCreatedFunction = function(event) {
        const item = event.item;
    
        // Keep existing defineActions logic
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
    
        // Add logic to ensure parent layers are turned on when a sublayer is toggled
        item.watch("visible", (visible) => {
            if (visible) {
                let parentLayer = item.layer.parent;
                while (parentLayer) {
                    parentLayer.visible = true;
                    parentLayer = parentLayer.parent; // Move up the hierarchy
                }
            }
        });
    };
    
    // Keep the event listener for action triggers
    layerList.on("trigger-action", (event) => {
        const id = event.action.id;
        const layer = event.item.layer;
    
        if (id === "full-extent") {
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
    
      
    
      


      // view.ui.add([Expand5], { position: "top-left", index: 6 });

      var fullscreen = new Fullscreen({
        view: view
      });
      view.ui.add(fullscreen, "top-right");

      let legend = new Legend({
        view: view,
        container: document.getElementById("legendContainer") // Place Legend in the new container
      });



      legend.when(() => {
        legend.activeLayerInfos.forEach((layerInfo) => {
          if (layerInfo.layer.type === "feature") {
            updateFeatureCount(layerInfo);
          }
        });
      });
      
      // Function to update the feature count beside each legend item
      function updateFeatureCount(layerInfo) {
        view.whenLayerView(layerInfo.layer).then((layerView) => {
          function refreshCount() {
            if (!view.updating) {
              layerView.queryFeatureCount().then((count) => {
                layerInfo.title = `${layerInfo.layer.title} (${count})`;
                legend.renderNow(); // Force update
              });
            }
          }
      
          // Run once and also update on extent changes
          refreshCount();
          view.watch("stationary", refreshCount);
        });
      }

      

      // function updateLegendCounts() {
      //   legend.activeLayerInfos.forEach(activeLayerInfo => {
      //     console.log(activeLayerInfo, "activeLayerInfo");
      //     const layerView = activeLayerInfo.layerView;
      //     if (layerView && layerView.queryFeatures) {
      //       const query = layerView.createQuery();
      //       query.geometry = view.extent; 
      //       query.returnGeometry = false;
      //       query.outFields = ["*"];
    
      //       layerView.queryFeatures(query).then(results => {
      //         activeLayerInfo.title = `${activeLayerInfo.layer.title} (${results.features.length})`;
      //         legend.refresh();
      //       });
      //     }
      //   });
      // }
    
      // function watchLayerVisibility(layer) {
      //   console.log(layer, "layer");
      //   layer.watch("visible", (newValue) => {
      //     if (newValue) {
      //       updateLegendCounts();  // Only update when a layer is turned ON
      //     }
      //   });
    
      //   if (layer.sublayers) {
      //     layer.sublayers.forEach(sublayer => watchLayerVisibility(sublayer)); 
      //   }
      // }
    
      // view.when().then(() => {
      //   displayMap.layers.forEach(layer => {
      //     watchLayerVisibility(layer);
      //   });
      // });



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



