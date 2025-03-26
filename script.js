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
      const [esriConfig, Map, MapView, intl, GeoJSONLayer, GroupLayer, Graphic, reactiveUtils, promiseUtils] = await Promise.all([
        loadModule("esri/config"),
        loadModule("esri/Map"),
        loadModule("esri/views/MapView"),
        loadModule("esri/intl"),
        loadModule("esri/layers/GeoJSONLayer"),
        loadModule("esri/layers/GroupLayer"),
        loadModule("esri/Graphic"),
        loadModule("esri/core/reactiveUtils"),
        loadModule("esri/core/promiseUtils"),
      ]);

      // intl.setLocale("ar");
      esriConfig.apiKey =
        "AAPK756f006de03e44d28710cb446c8dedb4rkQyhmzX6upFiYPzQT0HNQNMJ5qPyO1TnPDSPXT4EAM_DlQSj20ShRD7vyKa7a1H";

      displayMap = new Map({
        basemap: "topo-vector",
      });

      view = new MapView({
        center: [116.97091064453123, 4.699251422769522], // longitude, latitude, centered on Sabah
        container: "displayMap",
        map: displayMap,
        zoom: 8,
      });

      view.constraints = {
        // geometry: { // Constrain lateral movement to Lower Manhattan
        //   type: "extent",
        //   xmin: -74.020,
        //   ymin:  40.700,
        //   xmax: -73.971,
        //   ymax:  40.73
        // },
        minScale: 2311162.217155, // User cannot zoom out beyond a scale of 1:500,000
        // maxScale: 0, // User can overzoom tiles
        // rotationEnabled: false // Disables map rotation
      };

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
            // console.log(graphic, "graphic")
            if (graphic.geometry) {
              // console.log("this is not graphic")
              if (graphic.geometry.type === "point") {
                view.goTo(
                  {
                    target: graphic,
                    zoom: 15
                  },
                  {
                    duration: 3000,
                  }
                );
              } else{
                view.goTo(
                  {
                    target: graphic,
                  },
                  {
                    duration: 3000,
                  }
                );
              }
            }
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


    // Define a popup template for Customer Locations Layers
    const popupTemplateCustomerLocations = {
      title: "CUSTOMER LOCATION <br> Premise Number: {premisenum}",
      outFields: ["*"],
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
            {
              fieldName: "expression/BillingDistrict",
              label: "Billing District"
            },
            {
              fieldName: "expression/OperationalDistrict",
              label: "Operational District"
            },
            {
              fieldName: "expression/DMA",
              label: "DMA"
            },
            {
              fieldName: "accnum",
              label: "Account Number"
            },
            {
              fieldName: "supdat",
              label: "Start Date"
            },
            {
              fieldName: "closeaccdat",
              label: "End Date"
            },
            {
              fieldName: "expression/CustomerStatus",
              label: "Customer Status"
            },
            {
              fieldName: "congrp_descr",
              label: "Customer Group"
            },
            {
              fieldName: "contyp_descr",
              label: "Customer Type"
            },
            {
              fieldName: "expression/MasterRound",
              label: "Meter Round"
            },
            {
              fieldName: "mtrnum",
              label: "Meter Number"
            },
            {
              fieldName: "mtrmake_descr",
              label: "Meter Make"
            },
            {
              fieldName: "expression/MeterSize",
              label: "Meter Size"
            },
            {
              fieldName: "expression/MeterType",
              label: "Meter Type"
            },
            {
              fieldName: "expression/MeterStatus",
              label: "Meter Status"
            },
            {
              fieldName: "expression/MasterMeterStatus",
              label: "Master Meter Status"
            },
            {
              fieldName: "expression/staticField",
              label: "Layer Name"
            },
            {
              fieldName: "siteID",
              label: "ItemID"
            },
            {
              fieldName: "gID",
              label: "ObjectID"
            },
            {
              fieldName: "X",
              label: "Longitude (Dec Deg.)"
            },
            {
              fieldName: "Y",
              label: "Latitude (Dec Deg.)"
            },
            // Add more fields as needed
          ]
        }
      ],
      expressionInfos: [
        {
          name: "BillingDistrict",
          title: "Billing District",
          expression: "Text($feature.regioncode, '00') + ' ' + $feature.regionname"
        },
        {
          name: "OperationalDistrict",
          title: "Operational District",
          expression: "Text($feature.regioncode, '00') + ' ' + $feature.regionname"
        },
        {
          name: "DMA",
          title: "DMA",
          expression: "Text($feature.sitecode, '00') + ' ' + $feature.sitename"
        },
        {
          name: "CustomerStatus",
          title: "Customer Status",
          expression: "Text($feature.consta, '00') + ' ' + $feature.consta_descr"
        },
        {
          name: "MeterSize",
          title: "Meter Size",
          expression: "Text($feature.mtrsiz, '00') + ' ' + $feature.mtrsiz_descr"
        },
        {
          name: "MeterType",
          title: "Meter Type",
          expression: "Text($feature.mtrtyp, '00') + ' ' + $feature.mtrtyp_descr"
        },
        {
          name: "MeterStatus",
          title: "Meter Status",
          expression: "Text($feature.mtrstat, '00') + ' ' + $feature.mtrstat_descr"
        },
        {
          name: "MasterMeterStatus",
          title: "Master Meter Status",
          expression: "Text($feature.masmtrstat, '00') + ' ' + $feature.masmtrstat_descr"
        },
        {
          name: "staticField",
          title: "Layer Name",
          expression: "'Customer Locations'"
        },
        {
          name: "MasterRound",
          title: "Master Round",
          expression: "$feature.zonnum + '-' + Text($feature.blknum, '00') + '-' + $feature.rounum"
        },
      ]
    };
    const labelClassCustomerLocations = {  // autocasts as new LabelClass()
      symbol: {
        type: "text",  // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        font: {  // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 7
         }
      },
      labelPlacement: "center-center",
      labelExpressionInfo: {
        expression: "Text($feature.sitecode, '00') + ' ' + $feature.sitename"
        // expression: "$feature.sitename + TextFormatting.NewLine + $feature.Division"
      },
      maxScale: 0,
      minScale: 17055.954822,
      // where: "Conference = 'AFC'"
    };
    // sublayer.labelingInfo = [ labelClassCustomerLocations ];

    // Define a popup template for DMZ Critical Points Layers
    const popupTemplateDMZCriticalPoints = {
      title: "DMZ CRITICAL POINT <br> Site: {site}",
      outFields: ["*"],
      content: [
        {
          type: "fields",
          fieldInfos: [
            {
              fieldName: "expression/staticField",
              label: "Layer Name"
            },
            {
              fieldName: "siteID",
              label: "ItemID"
            },
            {
              fieldName: "gID",
              label: "ObjectID"
            },
            {
              fieldName: "X",
              label: "Longitude (Dec Deg.)"
            },
            {
              fieldName: "Y",
              label: "Latitude (Dec Deg.)"
            },
            // Add more fields as needed
          ]
        }
      ],
      expressionInfos: [
        {
          name: "staticField",
          title: "Layer Name",
          expression: "'DMZ Critical Points'"
        },
      ]
    };
    const labelClassDMZCriticalPoints= {  // autocasts as new LabelClass()
      symbol: {
        type: "text",  // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        font: {  // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 7
         }
      },
      labelPlacement: "center-center",
      labelExpressionInfo: {
        expression: "Text($feature.site, '00')"
        // expression: "$feature.sitename + TextFormatting.NewLine + $feature.Division"
      },
      maxScale: 0,
      minScale: 17055.954822,
      // where: "Conference = 'AFC'"
    };
    // sublayer.labelingInfo = [ labelClassDMZCriticalPoints ];

    // Define a popup template for KTM Layers
    const popupTemplateKTM = {
      title: "TRUNK MAIN METER POINT <br> Site: {site}",
      outFields: ["*"],
      content: [
        {
          type: "fields",
          fieldInfos: [
            {
              fieldName: "meter_make_descr",
              label: "Meter Make"
            },
            {
              fieldName: "meter_type_descr",
              label: "Meter Type"
            },
            {
              fieldName: "serial_number",
              label: "Serial Number"
            },
            {
              fieldName: "inst_date",
              label: "Install Date"
            },
            {
              fieldName: "serial_number",
              label: "Data Logger"
            },
            {
              fieldName: "expression/LoggerType",
              label: "Logger Type"
            },
            {
              fieldName: "last_loggedtime",
              label: "Last Received Date/Time"
            },
            {
              fieldName: "mp_type_descr",
              label: "Meter Point Type"
            },
            {
              fieldName: "main_pipe_dn",
              label: "Main Pipe Nom Diam"
            },
            {
              fieldName: "bypass",
              label: "Bypass"
            },
            {
              fieldName: "bypass_pipe_dn",
              label: "Bypass Nom Diam"
            },
            {
              fieldName: "meter_locn_descr",
              label: "Meter Location"
            },
            {
              fieldName: "expression/staticField",
              label: "Layer Name"
            },
            {
              fieldName: "siteID",
              label: "ItemID"
            },
            {
              fieldName: "gID",
              label: "ObjectID"
            },
            {
              fieldName: "X",
              label: "Longitude (Dec Deg.)"
            },
            {
              fieldName: "Y",
              label: "Latitude (Dec Deg.)"
            },
            // Add more fields as needed
          ]
        }
      ],
      expressionInfos: [
        {
          name: "LoggerType",
          title: "Logger Type",
          expression: "$feature.make + ' ' + $feature.model"
        },
        {
          name: "staticField",
          title: "Layer Name",
          expression: "'Trunk Main Meter Points'"
        },
      ]
    };
    const labelClassKTM= {  // autocasts as new LabelClass()
      symbol: {
        type: "text",  // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        font: {  // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 7
         }
      },
      labelPlacement: "center-center",
      labelExpressionInfo: {
        expression: "Text($feature.site, '00')"
        // expression: "$feature.sitename + TextFormatting.NewLine + $feature.Division"
      },
      maxScale: 0,
      minScale: 17055.954822,
      // where: "Conference = 'AFC'"
    };
    // sublayer.labelingInfo = [ labelClassKTM ];

    // Define a popup template for Reservoirs Layers
    const popupTemplateReservoirs = {
      title: "SERVICE RESERVOIR <br> Site: {site}",
      outFields: ["*"],
      content: [
        {
          type: "fields",
          fieldInfos: [
            {
              fieldName: "capacity",
              label: "Capacity (m3)"
            },
            {
              fieldName: "twl",
              label: "Top Water Level (m)"
            },
            {
              fieldName: "bwl",
              label: "Bottom Water Level (m)"
            },
            {
              fieldName: "serial_number",
              label: "Data Logger"
            },
            {
              fieldName: "expression/LoggerType",
              label: "Logger Type"
            },
            {
              fieldName: "last_loggedtime",
              label: "Last Received Date/Time"
            },
            {
              fieldName: "expression/staticField",
              label: "Layer Name"
            },
            {
              fieldName: "siteID",
              label: "ItemID"
            },
            {
              fieldName: "gID",
              label: "ObjectID"
            },
            {
              fieldName: "X",
              label: "Longitude (Dec Deg.)"
            },
            {
              fieldName: "Y",
              label: "Latitude (Dec Deg.)"
            },
            // Add more fields as needed
          ]
        }
      ],
      expressionInfos: [
        {
          name: "LoggerType",
          title: "Logger Type",
          expression: "$feature.make + ' ' + $feature.model + ' ' + $feature.sub_model"
        },
        {
          name: "staticField",
          title: "Layer Name",
          expression: "'Reservoirs'"
        },
      ]
    };
    const labelClassReservoirs= {  // autocasts as new LabelClass()
      symbol: {
        type: "text",  // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        font: {  // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 7
         }
      },
      labelPlacement: "center-center",
      labelExpressionInfo: {
        expression: "Text($feature.site, '00')"
        // expression: "$feature.sitename + TextFormatting.NewLine + $feature.Division"
      },
      maxScale: 0,
      minScale: 17055.954822,
      // where: "Conference = 'AFC'"
    };
    // sublayer.labelingInfo = [ labelClassReservoirs ];


    // Define a popup template for WTP Layers
    const popupTemplateWTP = {
      title: "WATER TREATMENT PLANT <br> Site: {site}",
      outFields: ["*"],
      content: [
        {
          type: "fields",
          fieldInfos: [
            {
              fieldName: "expression/staticField",
              label: "Layer Name"
            },
            {
              fieldName: "siteID",
              label: "ItemID"
            },
            {
              fieldName: "gID",
              label: "ObjectID"
            },
            {
              fieldName: "X",
              label: "Longitude (Dec Deg.)"
            },
            {
              fieldName: "Y",
              label: "Latitude (Dec Deg.)"
            },
            // Add more fields as needed
          ]
        }
      ],
      expressionInfos: [
        {
          name: "staticField",
          title: "Layer Name",
          expression: "'Water Treatment Plant'"
        },
      ]
    };
    const labelClassWTP= {  // autocasts as new LabelClass()
      symbol: {
        type: "text",  // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        font: {  // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 7
          }
      },
      labelPlacement: "center-center",
      labelExpressionInfo: {
        expression: "Text($feature.site, '00')"
        // expression: "$feature.sitename + TextFormatting.NewLine + $feature.Division"
      },
      maxScale: 0,
      minScale: 17055.954822,
      // where: "Conference = 'AFC'"
    };
    // sublayer.labelingInfo = [ labelClassWTP ];
    

    // Define a popup template for DMZBoundaries Layers
    const popupTemplateDMZBoundaries = {
      title: "DMZ BOUNDARY <br> Site: {site}",
      outFields: ["*"],
      content: [
        {
          type: "fields",
          fieldInfos: [
            {
              fieldName: "siteID",
              label: "DMZ ID"
            },
            {
              fieldName: "sitecode",
              label: "DMZ Code"
            },
            {
              fieldName: "sitename",
              label: "DMZ Name"
            },
            {
              fieldName: "status_descr",
              label: "NRW Status"
            },
            {
              fieldName: "category_name",
              label: "Opretional Status"
            },
            {
              fieldName: "mLength",
              label: "Main Length (m)"
            },
            {
              fieldName: "premises",
              label: "Premises"
            },
            {
              fieldName: "accounts",
              label: "Accounts"
            },
            {
              fieldName: "meters",
              label: "Meters"
            },
            {
              fieldName: "expression/staticField",
              label: "Layer Name"
            },
            {
              fieldName: "siteID",
              label: "ItemID"
            },
            {
              fieldName: "gID",
              label: "ObjectID"
            },
            // Add more fields as needed
          ]
        }
      ],
      expressionInfos: [
        {
          name: "staticField",
          title: "Layer Name",
          expression: "'DMZ Boundaries'"
        },
      ]
    };
    const labelClassDMZBoundaries = {  // autocasts as new LabelClass()
      symbol: {
        type: "text",  // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        font: {  // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 10
         }
      },
      labelPlacement: "always-horizontal",
      labelExpressionInfo: {
        expression: "$feature.sitename"
        // expression: "$feature.sitename + TextFormatting.NewLine + $feature.Division"
      },
      maxScale: 0,
      minScale: 17055.954822,
      // where: "Conference = 'AFC'"
    };
    // sublayer.labelingInfo = [ labelClassDMZBoundaries ];


    // Define a popup template for DMZ Meter Points Layers
    const popupTemplateDMZMeterPoints = {
      title: "DMZ METER POINT <br> Site: {site}",
      outFields: ["*"],
      content: [
        {
          type: "fields",
          fieldInfos: [
            {
              fieldName: "meter_make_descr",
              label: "Meter Make"
            },
            {
              fieldName: "meter_type_descr",
              label: "Meter Type"
            },
            {
              fieldName: "serial_number",
              label: "Serial Number"
            },
            {
              fieldName: "inst_date",
              label: "Install Date"
            },
            {
              fieldName: "serial_number",
              label: "Data Logger"
            },
            {
              fieldName: "expression/LoggerType",
              label: "Logger Type"
            },
            {
              fieldName: "last_loggedtime",
              label: "Last Received Date/Time"
            },
            {
              fieldName: "mp_type_descr",
              label: "Meter Point Type"
            },
            {
              fieldName: "main_pipe_dn",
              label: "Main Pipe Nom Diam"
            },
            {
              fieldName: "bypass",
              label: "Bypass"
            },
            {
              fieldName: "bypass_pipe_dn",
              label: "Bypass Nom Diam"
            },
            {
              fieldName: "meter_locn_descr",
              label: "Meter Location"
            },
            {
              fieldName: "strainer",
              label: "Strainer"
            },
            {
              fieldName: "strain_dn_descr",
              label: "Strainer Nom Diam"
            },
            {
              fieldName: "expression/staticField",
              label: "Layer Name"
            },
            {
              fieldName: "siteID",
              label: "ItemID"
            },
            {
              fieldName: "gID",
              label: "ObjectID"
            },
            {
              fieldName: "X",
              label: "Longitude (Dec Deg.)"
            },
            {
              fieldName: "Y",
              label: "Latitude (Dec Deg.)"
            },
            // Add more fields as needed
          ]
        }
      ],
      expressionInfos: [
        {
          name: "LoggerType",
          title: "Logger Type",
          expression: "$feature.make + ' ' + $feature.model"
        },
        {
          name: "staticField",
          title: "Layer Name",
          expression: "'DMZ Meter Points'"
        },
      ]
    };
    const labelClassDMZMeterPoints= {  // autocasts as new LabelClass()
      symbol: {
        type: "text",  // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        font: {  // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 7
         }
      },
      labelPlacement: "center-center",
      labelExpressionInfo: {
        expression: "Text($feature.site, '00')"
        // expression: "$feature.sitename + TextFormatting.NewLine + $feature.Division"
      },
      maxScale: 0,
      minScale: 17055.954822,
      // where: "Conference = 'AFC'"
    };
    // sublayer.labelingInfo = [ labelClassDMZMeterPoints ];


    // Define a popup template for Transmission Main Meter Points Layers
    const popupTemplateTransmissionMainMeterPoints = {
      title: "TRANSMISSION MAIN METER POINT <br> Site: {site}",
      outFields: ["*"],
      content: [
        {
          type: "fields",
          fieldInfos: [
            {
              fieldName: "meter_make_descr",
              label: "Meter Make"
            },
            {
              fieldName: "meter_type_descr",
              label: "Meter Type"
            },
            {
              fieldName: "serial_number",
              label: "Serial Number"
            },
            {
              fieldName: "inst_date",
              label: "Install Date"
            },
            {
              fieldName: "serial_number",
              label: "Data Logger"
            },
            {
              fieldName: "expression/LoggerType",
              label: "Logger Type"
            },
            {
              fieldName: "last_loggedtime",
              label: "Last Received Date/Time"
            },
            {
              fieldName: "mp_type_descr",
              label: "Meter Point Type"
            },
            {
              fieldName: "main_pipe_dn",
              label: "Main Pipe Nom Diam"
            },
            {
              fieldName: "bypass",
              label: "Bypass"
            },
            {
              fieldName: "bypass_pipe_dn",
              label: "Bypass Nom Diam"
            },
            {
              fieldName: "meter_locn_descr",
              label: "Meter Location"
            },
            {
              fieldName: "expression/staticField",
              label: "Layer Name"
            },
            {
              fieldName: "siteID",
              label: "ItemID"
            },
            {
              fieldName: "gID",
              label: "ObjectID"
            },
            {
              fieldName: "X",
              label: "Longitude (Dec Deg.)"
            },
            {
              fieldName: "Y",
              label: "Latitude (Dec Deg.)"
            },
            // Add more fields as needed
          ]
        }
      ],
      expressionInfos: [
        {
          name: "LoggerType",
          title: "Logger Type",
          expression: "$feature.make + ' ' + $feature.model"
        },
        {
          name: "staticField",
          title: "Layer Name",
          expression: "'Transmission Main Meter Points'"
        },
      ]
    };
    const labelClassTransmissionMainMeterPoints= {  // autocasts as new LabelClass()
      symbol: {
        type: "text",  // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        font: {  // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 7
         }
      },
      labelPlacement: "center-center",
      labelExpressionInfo: {
        expression: "Text($feature.site, '00')"
        // expression: "$feature.sitename + TextFormatting.NewLine + $feature.Division"
      },
      maxScale: 0,
      minScale: 17055.954822,
      // where: "Conference = 'AFC'"
    };
    // sublayer.labelingInfo = [ labelClassTransmissionMainMeterPoints ];



    // Define a popup template for Water Mains Layers
    const popupTemplateWaterMains = {
      title: "WATER MAINS <br> Site: {site}",
      outFields: ["*"],
      content: [
        {
          type: "fields",
          fieldInfos: [
            {
              fieldName: "pipe_type_descr",
              label: "Pipe Type"
            },
            {
              fieldName: "pipe_dn_descr",
              label: "Pipe Value"
            },
            {
              fieldName: "mLength",
              label: "Length"
            },
            {
              fieldName: "pipe_mat_descr",
              label: "Pipe Mat"
            },
            {
              fieldName: "expression/staticField",
              label: "Layer Name"
            },
            {
              fieldName: "siteID",
              label: "ItemID"
            },
            {
              fieldName: "gID",
              label: "ObjectID"
            },
            // Add more fields as needed
          ]
        }
      ],
      expressionInfos: [
        {
          name: "staticField",
          title: "Layer Name",
          expression: "'Water Mains'"
        },
      ]
    };
    const labelClassWaterMains= {  // autocasts as new LabelClass()
      symbol: {
        type: "text",  // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        font: {  // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 7
         }
      },
      labelPlacement: "center-along",
      labelExpressionInfo: {
        expression: "Text($feature.site, '00')"
        // expression: "$feature.sitename + TextFormatting.NewLine + $feature.Division"
      },
      maxScale: 0,
      minScale: 17055.954822,
      // where: "Conference = 'AFC'"
    };
    // sublayer.labelingInfo = [ labelClassWaterMains ];





    // Define a popup template for Work Orders Layers
    const popupTemplateWorkOrders = {
      title: "Work Order (New System) <br> Work Order Number: {workorder_dbID}",
      outFields: ["*"],
      content: [
        {
          type: "fields",
          fieldInfos: [
            {
              fieldName: "careline_num",
              label: "Careline Number"
            },
            {
              fieldName: "reportedby_descr",
              label: "Reported By"
            },
            {
              fieldName: "status_descr",
              label: "Work Order Status"
            },
            {
              fieldName: "Reinstatement Type",
              label: "Reinstatement Status"
            },
            {
              fieldName: "program_descr",
              label: "Program"
            },
            {
              fieldName: "contract_descr",
              label: "Contract"
            },
            {
              fieldName: "contractor_descr",
              label: "Contractor"
            },
            {
              fieldName: "status_descr",
              label: "Work Order Status"
            },
            {
              fieldName: "reported_date",
              label: "Date Reported"
            },
            {
              fieldName: "created_date",
              label: "Date Created"
            },
            {
              fieldName: "allocated_date",
              label: "Date Allocated"
            },
            {
              fieldName: "received_date",
              label: "Date Recieved"
            },
            {
              fieldName: "completed_date",
              label: "Date Completed"
            },
            {
              fieldName: "Confirmed Date",
              label: "Date Confirmed"
            },
            {
              fieldName: "approved_date",
              label: "Date Reinstatement Approved"
            },
            {
              fieldName: "cancelled_date",
              label: "Date Cancelled"
            },
            {
              fieldName: "status_descr",
              label: "Work Order Status"
            },
            {
              fieldName: "failuretype_descr",
              label: "Failur Type"
            },
            {
              fieldName: "repairtype_descr",
              label: "Repair Type"
            },
            {
              fieldName: "pipesize_descr",
              label: "Pipe Diameter (mm)"
            },
            {
              fieldName: "pipemat_descr",
              label: "Pipe Material"
            },
            {
              fieldName: "exctype_descr",
              label: "Excavation Type"
            },
            {
              fieldName: "reinstype_descr",
              label: "Reinstatement Type"
            },
            {
              fieldName: "expression/staticField",
              label: "Layer Name"
            },
            {
              fieldName: "regionID",
              label: "ItemID"
            },
            {
              fieldName: "OBJECTID",
              label: "ObjectID"
            },
            {
              fieldName: "X",
              label: "Longitude (Dec Deg.)"
            },
            {
              fieldName: "Y",
              label: "Latitude (Dec Deg.)"
            },
            // Add more fields as needed
          ]
        }
      ],
      expressionInfos: [
        {
          name: "staticField",
          title: "Layer Name",
          expression: "'Work Orders (New System)'"
        },
      ]
    };
    const labelClassWorkOrders= {  // autocasts as new LabelClass()
      symbol: {
        type: "text",  // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        font: {  // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 7
         }
      },
      labelPlacement: "center-center",
      labelExpressionInfo: {
        expression: "Text($feature.workorder_dbID, '00')"
        // expression: "$feature.sitename + TextFormatting.NewLine + $feature.Division"
      },
      maxScale: 0,
      minScale: 17055.954822,
      // where: "Conference = 'AFC'"
    };
    // sublayer.labelingInfo = [ labelClassWorkOrders ];

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
      { url: "https://services5.arcgis.com/b8igmkKBLRIL94jA/arcgis/rest/services/Sandakan/FeatureServer/296", title: "Sandakan" },
      { url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/customers_locationsLargeOne_Layer01/FeatureServer/0", title: "Kota Kinabalu" }
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
    const layersWaterMains = [
      {
        title: "Kota Kinabalu",
        subGroups: [
          { title: "Primary Transmission Main", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/WaterMain_Kota_Kinabalu_PrimaryTransmissionMain/FeatureServer/15" },
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
          { title: "Private Main", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/WaterMain_Sandakan_PrivateMain/FeatureServer/206" },

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
    const layersWaorkOrders = [
      {
        title: "Beaufort",
        subGroups: [
          { title: "Unallocated", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/Beaufort_Unallocated/FeatureServer/42" },
          { title: "Leak Repair Contractor", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/Beaufort_LeakRepairContractor/FeatureServer/47" },
        ]
      },
      {
        title: "Beluran",
        subGroups: [
          { title: "Leak Repair Contractor", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/Beluran_LeakRepairContractor/FeatureServer/54" },
        ]
      },
      {
        title: "Kinabatangan",
        subGroups: [
          { title: "Leak Repair Contractor", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/LeakRepairContractor_Kinabatangan/FeatureServer/68" },
        ]
      },
      {
        title: "Tenom",
        subGroups: [
          { title: "Leak Repair Contractor", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/LeakRepairContractor_Tenom/FeatureServer/161" },
        ]
      },
      {
        title: "Keningau",
        subGroups: [
          { title: "Unallocated", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/Unallocated_Keningau/FeatureServer/168" },
          { title: "Leak Repair Contractor", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/LeakRepairContractor_Keningau/FeatureServer/61" },
        ]
      },
      {
        title: "Kota Belud",
        subGroups: [
          { title: "Unallocated", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/Unallocated_KotaBelud/FeatureServer/172" },
          { title: "Leak Repair Contractor", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/LeakRepairContractor_KotaBelud/FeatureServer/73" },
        ]
      },
      {
        title: "Kuala Penyu",
        subGroups: [
          { title: "Unallocated", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/Unallocated_KualaPenyu/FeatureServer/176" },
          { title: "Leak Repair Contractor", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/LeakRepairContractor_KualaPenyu/FeatureServer/80" },
        ]
      },
      {
        title: "Kunak",
        subGroups: [
          { title: "Unallocated", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/Unallocated_Kunak/FeatureServer/178" },
          { title: "Leak Repair Contractor", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/LeakRepairContractor_Kunak/FeatureServer/87" },
        ]
      },
      {
        title: "Lahad Datu",
        subGroups: [
          { title: "Unallocated", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/Unallocated_LahadDatu/FeatureServer/182" },
          { title: "Leak Repair Contractor", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/LeakRepairContractor_LahadDatu/FeatureServer/94" },
        ]
      },
      {
        title: "Membakut",
        subGroups: [
          { title: "Unallocated", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/Unallocated_Membakut/FeatureServer/185" },
          { title: "Leak Repair Contractor", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/LeakRepairContractor_Membakut/FeatureServer/103" },
        ]
      },
      {
        title: "Merotai",
        subGroups: [
          { title: "Unallocated", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/Unallocated_Merotai/FeatureServer/188" },
          { title: "Leak Repair Contractor", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/LeakRepairContractor_Merotai/FeatureServer/107" },
        ]
      },
      {
        title: "Nabawan",
        subGroups: [
          { title: "Unallocated", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/Unallocated_Nabawan/FeatureServer/191" },
          { title: "Leak Repair Contractor", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/LeakRepairContractor_Nabawan/FeatureServer/114" },
        ]
      },
      {
        title: "PulauSebatik",
        subGroups: [
          { title: "Unallocated", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/Unallocated_PulauSebatik/FeatureServer/193" },
          { title: "Leak Repair Contractor", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/LeakRepairContractor_PulauSebatik/FeatureServer/118" },
        ]
      },
      {
        title: "Sook",
        subGroups: [
          { title: "Unallocated", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/Unallocated_Sook/FeatureServer/201" },
          { title: "Leak Repair Contractor", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/LeakRepairContractor_Sook/FeatureServer/141" },
        ]
      },
      {
        title: "Tambunan",
        subGroups: [
          { title: "Unallocated", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/Unallocated_Tambunan/FeatureServer/204" },
          { title: "Leak Repair Contractor", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/LeakRepairContractor_Tambunan/FeatureServer/145" },
        ]
      },
      {
        title: "Tawau",
        subGroups: [
          { title: "Unallocated", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/Unallocated_Tawau/FeatureServer/208" },
          { title: "Leak Repair Contractor", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/LeakRepairContractor_Tawau/FeatureServer/151" },
        ]
      },
      {
        title: "Semporna",
        subGroups: [
          { title: "Leak Repair Contractor", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/LeakRepairContractor_Semporna/FeatureServer/133" },
        ]
      },
      {
        title: "Sandakan",
        subGroups: [
          { title: "Unallocated", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/Unallocated_Sandakan/FeatureServer/195" },
          { title: "Leak Repair Contractor", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/LeakRepairContractor_Sandakan/FeatureServer/122" },
        ]
      },
      {
        title: "Kota Kinabalu",
        subGroups: [
          { title: "Unallocated", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/KotaKinabalu_Unallocated/FeatureServer/33" },
          { title: "JANS Internal", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/KotaKinabalu_JANSInternalWork/FeatureServer/24" },
          { title: "Leak Repair Contractor", url: "https://services3.arcgis.com/N0wDMTigPp02pamh/arcgis/rest/services/KotaKinabalu_LeakRepairContractor/FeatureServer/26" },
        ]
      },
    ];


    const staticrenderer = {
      type: "simple",
      symbol: {
        type: "simple-marker",
        style: "circle",
        color: [2, 144, 227, 0.5],
        size: 9,
        outline: {
          color: "#ffffff",
          width: 1
        }
      }
    };


    // // Consumer Meters || Customer Locations Layers
    // Create SubtypeGroupLayers for CustomerLocations
    const subtypeGroupLayersCustomerLocations = layersCustomerLocations.map(layerInfo => {
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
          sublayer.renderer = staticrenderer;
          sublayer.labelingInfo = [ labelClassCustomerLocations ];
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

    // DMZ Critical Points Layers
    // Create SubtypeGroupLayers for DMZ Critical Points
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
          sublayer.renderer = staticrenderer;
          sublayer.labelingInfo = [ labelClassDMZCriticalPoints ];
          sublayer.popupTemplate = popupTemplateDMZCriticalPoints;
        });
      });
      return layer;
    });

    const DMZCriticalPoints = new GroupLayer({
      title: "DMZ Critical Points",
      layers: subtypeGroupLayersDMZCriticalPoints,
      visible: false // Hide all sublayers initially
    });

    // KTM Layers
    // Create SubtypeGroupLayers for KTM
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
          sublayer.renderer = staticrenderer;
          sublayer.labelingInfo = [ labelClassKTM ];
          sublayer.popupTemplate = popupTemplateKTM;
        });
      });
      return layer;
    });
    const KTM = new GroupLayer({
      title: "Trunk Main Meter Points",
      layers: subtypeGroupLayersKTM,
      visible: false // Hide all sublayers initially
    });

    // Reservoirs Layers
    // Create SubtypeGroupLayers for Reservoirs
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
          sublayer.renderer = staticrenderer;
          sublayer.labelingInfo = [ labelClassReservoirs ];
          sublayer.popupTemplate = popupTemplateReservoirs;
        });
      });
      return layer;
    });
    const Reservoirs = new GroupLayer({
      title: "Reservoirs",
      layers: subtypeGroupLayersReservoirs,
      visible: false // Hide all sublayers initially
    });







    // WTP Layers
    // Create SubtypeGroupLayers for WTP
    const subtypeGroupLayersWTP = layersWTP.map(layerInfo => {
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
          sublayer.renderer = staticrenderer;
          sublayer.labelingInfo = [ labelClassWTP ];
          sublayer.popupTemplate = popupTemplateWTP;
        });
      });
      return layer;
    });

    const WTP = new GroupLayer({
      title: "Water Treatment Plant",
      layers: subtypeGroupLayersWTP,
      visible: false // Hide all sublayers initially
    });




    // DMZBoundaries Layers
    // Create SubtypeGroupLayers for DMZBoundaries
    const subtypeGroupLayersDMZBoundaries = layersDMZBoundaries.map(layerInfo => {
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
          sublayer.renderer.symbol.color.a = 0.3;
          sublayer.labelingInfo = [ labelClassDMZBoundaries ];
          sublayer.popupTemplate = popupTemplateDMZBoundaries;
        });
      });
      return layer;
    });
    const DMZBoundaries = new GroupLayer({
      title: "DMZ Boundaries",
      layers: subtypeGroupLayersDMZBoundaries,
      visible: false // Hide all sublayers initially
    });



    // DMZMeterPoints Layers
    // Create SubtypeGroupLayers for DMZMeterPoints
    const subtypeGroupLayersDMZMeterPoints = layersDMZMeterPoints.map(layerInfo => {
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
          sublayer.renderer = staticrenderer;
          sublayer.labelingInfo = [ labelClassDMZMeterPoints ];
          sublayer.popupTemplate = popupTemplateDMZMeterPoints;
        });
      });
      return layer;
    });
    const DMZMeterPoints = new GroupLayer({
      title: "DMZ Meter Points",
      layers: subtypeGroupLayersDMZMeterPoints,
      visible: false // Hide all sublayers initially
    });



    // Transmission Main Meter Points Layers
    // Create SubtypeGroupLayers for Transmission Main Meter Points
    const subtypeGroupLayersTransmissionMainMeterPoints = layersTransmissionMainMeterPoints.map(layerInfo => {
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
          sublayer.renderer = staticrenderer;
          sublayer.labelingInfo = [ labelClassTransmissionMainMeterPoints ];
          sublayer.popupTemplate = popupTemplateTransmissionMainMeterPoints;
        });
      });
      return layer;
    });
    const TransmissionMainMeterPoints = new GroupLayer({
      title: "Transmission Main Meter Points",
      layers: subtypeGroupLayersTransmissionMainMeterPoints,
      visible: false // Hide all sublayers initially
    });




    // Define a simple renderer for Water Mains
    const simpleRendererWaterMains = {
      type: "simple", // autocasts as new SimpleRenderer()
      symbol: {
        type: "simple-line", // autocasts as new SimpleFillSymbol()
        color: [166, 25, 77, 0.5],
        outline: {
          // makes the outlines of all features consistently light gray
          color: "lightgray",
          width: 1
        }
      }
    };

    let primaryTransmissionRenderer = {
      type: "simple",
      symbol: {
        type: "simple-line",  // autocasts as new SimpleLineSymbol()
        color: [0, 0, 255],
        width: "2px",
      }
    };
    let secondaryTrunkRenderer = {
      type: "simple",
      symbol: {
        type: "simple-line",  // autocasts as new SimpleLineSymbol()
        color: [255, 140, 0],
        width: "2px",
      }
    };
    let tertiaryDistributionRenderer = {
      type: "simple",
      symbol: {
        type: "simple-line",  // autocasts as new SimpleLineSymbol()
        color: [105, 105, 105],
        width: "2px",
      }
    };
    let rawWaterRenderer = {
      type: "simple",
      symbol: {
        type: "simple-line",  // autocasts as new SimpleLineSymbol()
        color: [255, 215, 0],
        width: "2px",
      }
    };
    let privateMainRenderer = {
      type: "simple",
      symbol: {
        type: "simple-line",  // autocasts as new SimpleLineSymbol()
        color: "black",
        width: "2px",
      }
    };

    // Define Renderers for Each Category
    const renderers = {
      "Primary Transmission Main": primaryTransmissionRenderer,
      "Secondary Trunk Main": secondaryTrunkRenderer,
      "Tertiary Distribution Main": tertiaryDistributionRenderer,
      "Raw Water Main": rawWaterRenderer,
      "Private Main": privateMainRenderer
    };

    // Water Mains Layers
    // Create SubtypeGroupLayers for Water Mains
    // Handle Nested Structure (WaterMain → Regions → SubtypeGroupLayers)
    // Define Water Mains Layers with structured hierarchy
    const subtypeGroupLayersWaterMains = layersWaterMains.map(region => {
      const subLayers = region.subGroups.map(subGroup => {
        const layer = new SubtypeGroupLayer({
          url: subGroup.url,
          visible: false, // Hide all sublayers initially
          title: subGroup.title,
          outFields: ["*"], // Ensure all fields are available for future use
        });
        // Placeholder for renderer setup in the future
        layer.when(() => {
          // console.log(layer, "layer");
          layer.sublayers.forEach(sublayer => {
            sublayer.visible = false;
            if (renderers[subGroup.title]) {
              sublayer.renderer = renderers[subGroup.title];
              sublayer.labelingInfo = [ labelClassWaterMains ];
              sublayer.popupTemplate = popupTemplateWaterMains;
            }
          });
        });
        return layer;
      });
      return new GroupLayer({
        title: region.title,
        layers: subLayers,
        visible: false // Hide all sublayers initially
      });
    });

    // Create the Main Water Main Group Layer
    const WaterMains = new GroupLayer({
      title: "Water Main",
      layers: subtypeGroupLayersWaterMains,
      visible: false // Hide initially
    });





    // // Work Orders Layers
    // // Create SubtypeGroupLayers for Work Orders
    const subtypeGroupLayersWorkOrders = layersWaorkOrders.map(region => {
      const subLayers = region.subGroups.map(subGroup => {
        const layer = new SubtypeGroupLayer({
          url: subGroup.url,
          visible: false, // Hide all sublayers initially
          title: subGroup.title,
          outFields: ["*"], // Ensure all fields are available for future use
        });
        // Placeholder for renderer setup in the future
        layer.when(() => {
          layer.sublayers.forEach(sublayer => {
            sublayer.visible = false;
            sublayer.renderer = staticrenderer;
            sublayer.labelingInfo = [ labelClassWorkOrders ];
            sublayer.popupTemplate = popupTemplateWorkOrders ;
            // if (renderers[subGroup.title]) {
            //   sublayer.renderer = renderers[subGroup.title];
            // }
          });
        });
        return layer;
      });
      return new GroupLayer({
        title: region.title,
        layers: subLayers,
        visible: false // Hide all sublayers initially
      });
    });

    // Create the Main Water Main Group Layer
    const WorkOrders = new GroupLayer({
      title: "Work Orders (New System)",
      layers: subtypeGroupLayersWorkOrders,
      visible: false // Hide initially
    });

    displayMap.add(WorkOrders);  // adds the layer to the map
    displayMap.add(WaterMains);  // adds the layer to the map
    displayMap.add(TransmissionMainMeterPoints);  // adds the layer to the map
    displayMap.add(DMZMeterPoints);  // adds the layer to the map
    displayMap.add(DMZBoundaries);  // adds the layer to the map
    displayMap.add(WTP);  // adds the layer to the map
    displayMap.add(Reservoirs);  // adds the layer to the map
    displayMap.add(KTM);
    displayMap.add(DMZCriticalPoints);
    displayMap.add(Customer_Locations);



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

      let basemapGallery = new BasemapGallery({
        view: view
      });
      // Add widget to the top right corner of the view
      view.ui.add(basemapGallery, {
        position: "bottom-right"
      });

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
        // showLegend: true
      });

      layerList.visibilityAppearance = "checkbox";
      layerList.listItemCreatedFunction = function(event) {
        const item = event.item;

        // Ensure actionsSections exists
        if (!item.actionsSections) {
            item.actionsSections = [];
        }
        // Define actions for subtype-group layers
        if (item.layer.type === "subtype-group") {
          item.actionsSections.push([
              {
                  title: "Go to full extent",
                  icon: "zoom-out-fixed",
                  id: "full-extent"
              }
          ]);
        }

        // Check if the layer is a top-level GroupLayer
        const isTopLevelGroupLayer = view.map.layers.includes(item.layer);

        // if (item.layer.type != "group") {
        //   // don't show legend twice
        //   item.panel = {
        //     content: "legend",
        //     open: true
        //   };
        // }

        if (item.layer.type === "group" && isTopLevelGroupLayer) {
            console.log("Top-Level GroupLayer:", item.layer.title);
            item.actionsSections.push([
                {
                    title: "Show/Hide Labels",
                    icon: "star",
                    id: "toggle-labels"
                }
            ]);
        }

        // // Add logic to ensure parent layers are turned on when a sublayer is toggled
        // item.watch("visible", (visible) => {
        //   if (visible) {
        //       // console.log(item, "item");
        //         let parentLayer = item.layer.parent;
        //         while (parentLayer) {
        //             parentLayer.visible = true;
        //             parentLayer = parentLayer.parent; // Move up the hierarchy
        //         }
        //     }
        // });

        // Watch for visibility changes
        item.watch("visible", (visible) => {
          if (visible) {
            activateParentLayers(item.layer);  // Ensure parent layers turn on
            activateChildLayers(item.layer, visible); // Ensure all sublayers turn on
          } else {
            // if the parent is turned off, ensure all sublayers are also unchecked
            deactivateChildLayers(item.layer);
          }
        });
      };

      // Function to turn on parent layers when a sublayer is activated
      function activateParentLayers(layer) {
        let parentLayer = layer.parent;
        while (parentLayer) {
            parentLayer.visible = true;
            parentLayer = parentLayer.parent; // Move up the hierarchy
        }
      }

      // Recursive function to turn on all sublayers when a parent is activated
      function activateChildLayers(layer, visible) {
        if (layer.sublayers) {
            layer.visible = visible; // Turn on/off each child layer
            // layer.sublayers.forEach((sublayer) => {
            //     sublayer.visible = visible; // Turn on/off each child layer
            //     activateChildLayers(sublayer, visible); // Recursively activate deeper sublayers
            // });
        }
      }

      // NEW: Function to ensure sublayer checkboxes are unchecked when a parent is turned off
      function deactivateChildLayers(layer) {
        if (layer.sublayers) {
            layer.sublayers.forEach((sublayer) => {
                sublayer.visible = false;  // Turn off visibility
                sublayer.listItem && (sublayer.listItem.visible = false); // Uncheck the checkbox in UI
                deactivateChildLayers(sublayer); // Recursively deactivate deeper sublayers
            });
        }
      }


      
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
          if (id === "toggle-labels") {
            console.log("Toggling labels for:", layer.title);
            toggleLayerLabels(layer, event.item);
          }
      });

      // Function to toggle labels for a layer, handling multiple hierarchy levels
      function toggleLayerLabels(layer, item) {
        let hasLabels = false;
        

        // If it's a SubtypeGroupLayer, toggle its sublayers' labels
        if (layer.type === "subtype-group" && layer.sublayers) {
            let newLabelState = !layer.sublayers.getItemAt(0)?.labelsVisible;
            // console.log(`Setting labels to: ${newLabelState} for ${layer.title}`);

            layer.sublayers.forEach((sublayer) => {
                sublayer.labelsVisible = newLabelState;
            });
            updateIconColor(item, newLabelState); // Update icon color
            layerList.renderNow(); // Refresh UI
            return;
        }

        // If it's a GroupLayer, search for SubtypeGroupLayers inside
        if (layer.type === "group") {


            layer.layers.forEach((subLayer) => {
                // console.log(subLayer, "subLayer");
                if (subLayer.type === "subtype-group" && subLayer.sublayers) {
                    let newLabelState = !subLayer.sublayers.getItemAt(0)?.labelsVisible;
                    // console.log(`Setting labels to: ${newLabelState} for ${subLayer.title}`);

                    subLayer.sublayers.forEach((sublayer) => {
                        sublayer.labelsVisible = newLabelState;
                    });
                    updateIconColor(item, newLabelState); // Update icon color
                    hasLabels = true;
                }

                if (subLayer.type === "group") {
                  // console.log("I am here now")
                  subLayer.layers.forEach((subLayer0) => {
                    if (subLayer0.type === "subtype-group" && subLayer0.sublayers) {
                      let newLabelState = !subLayer0.sublayers.getItemAt(0)?.labelsVisible;
                      // console.log(`Setting labels to: ${newLabelState} for ${subLayer0.title}`);
  
                      subLayer0.sublayers.forEach((subLayer0) => {
                        subLayer0.labelsVisible = newLabelState;
                      });
                      updateIconColor(item, newLabelState); // Update icon color
                      hasLabels = true;
                  }
                  })
                }

            });

            if (!hasLabels) {
                console.warn(`No valid sublayers with labels found in ${layer.title}`);
            }
            layerList.renderNow(); // Refresh UI
            return;
        }

        console.warn(`Layer ${layer.title} does not support labels.`);
      }


      // Function to Update Icon Color Based on Label Visibility
      function updateIconColor(item, isLabelsVisible) {
        if (!item) {
            console.warn("Item is undefined, cannot update icon.");
            return;
        }

        item.actionsSections = [[
            {
                title: isLabelsVisible ? "Hide Labels" : "Show Labels",
                icon: isLabelsVisible ? "star-f" : "star",
                id: "toggle-labels"
            }
        ]];

        layerList.renderNow(); // Refresh UI to reflect icon change
      }

      // view.ui.add([Expand5], { position: "top-left", index: 6 });
      var fullscreen = new Fullscreen({
        view: view
      });
      view.ui.add(fullscreen, "top-right");

      let legend = new Legend({
        view: view,
        container: document.getElementById("legendContainer") // Place Legend in the new container
      });
      legend.hideLayersNotInCurrentView = true;
      await view.when();
      return [view, displayMap]; // You can return the view object
    } catch (error) {
      console.error("Error initializing map:", error);
      throw error; // Rethrow the error to handle it further, if needed
    }
}




      
      // legend.when(() => {
      //   legend.activeLayerInfos.forEach((layerInfo) => {
      //     console.log(layerInfo, "layerInfo");
      //     if (layerInfo.layer.type === "feature") {
      //       updateFeatureCount(layerInfo);
      //     }
      //   });
      // });
      
      // // Function to update the feature count beside each legend item
      // function updateFeatureCount(layerInfo) {
      //   view.whenLayerView(layerInfo.layer).then((layerView) => {
      //     function refreshCount() {
      //       if (!view.updating) {
      //         layerView.queryFeatureCount().then((count) => {
      //           layerInfo.title = `${layerInfo.layer.title} (${count})`;
      //           legend.renderNow(); // Force update
      //         });
      //       }
      //     }
      
      //     // Run once and also update on extent changes
      //     refreshCount();
      //     view.watch("stationary", refreshCount);
      //   });
      // }






















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



