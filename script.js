// display variables
var displayMap;
var view;
var basemapWithoutLabels;
// First, create a global variable for tracking initialization
let isThematicInitialized = false;
// Add this at the beginning of your script
const originalRenderers = new Map();

const labelClassDMZBoundaries = {
  symbol: {
    type: "text",
    color: "black",
    haloColor: "white",
    haloSize: 2,
    font: {
      family: "Noto Sans",
      weight: "bold",
      size: 8,
      decoration: "none", // Can be "underline", "line-through", etc.
    },
    lineHeight: 1.2, // Adjust space between lines
  },
  labelPlacement: "always-horizontal",
  labelExpressionInfo: {
    expression: `
      var siteName = $feature.sitename;
      var nrwVol = $feature.current_nrw_vol;
      var nrwPcnt = $feature.current_nrw_pcnt;
      
      // Format NRW Volume
      var volText = When(
        IsEmpty(nrwVol) || nrwVol == null,
        "-",
        Text(Round(nrwVol, 0), "#,##0") + " m³/day"  // Add thousands separator
      );
      
      // Format NRW Percentage
      var pcntText = When(
        IsEmpty(nrwPcnt) || nrwPcnt == null,
        "-",
        Text(Round(nrwPcnt, 0), "#,##0") + "%"  // Add thousands separator
      );
      
      // Combine all lines
      var labels = [
        DefaultValue(siteName, "-"),  // Show "-" if siteName is null
        volText,
        pcntText
      ];
      
      // Return concatenated labels with line breaks
      return Concatenate(labels, TextFormatting.NewLine);
    `,
  },
  maxScale: 0,
  minScale: 36111.909643,
  where: "sitename IS NOT NULL", // Only label features with names
};

const labelClassDMZBoundariesNamesOnly = {
  // autocasts as new LabelClass()
  symbol: {
    type: "text", // autocasts as new TextSymbol()
    color: "black",
    haloColor: "white",
    haloSize: 2,
    font: {
      // autocast as new Font()
      family: "Noto Sans",
      weight: "bold",
      size: 8,
    },
  },
  labelPlacement: "always-horizontal",
  labelExpressionInfo: {
    expression: "$feature.sitename",
  },
  maxScale: 0,
  minScale: 36111.909643,
  // where: "Conference = 'AFC'"
};

// // Reservoirs Charts...
// {
//   "features": [
//     {
//       "siteID": "123",
//       "reservoirName": "Reservoir A",
//       "data": [
//         {
//           "timestamp": "2025-03-20T00:00:00Z",
//           "level": -2
//         },
//         {
//           "timestamp": "2025-03-20T12:00:00Z",
//           "level": 0
//         },
//         {
//           "timestamp": "2025-03-21T00:00:00Z",
//           "level": 1
//         }
//       ]
//     },
//     {
//       "siteID": "456",
//       "reservoirName": "Reservoir B",
//       "data": [
//         {
//           "timestamp": "2025-03-20T00:00:00Z",
//           "level": -1
//         },
//         {
//           "timestamp": "2025-03-20T12:00:00Z",
//           "level": 1
//         },
//         {
//           "timestamp": "2025-03-21T00:00:00Z",
//           "level": 0
//         }
//       ]
//     }
//   ]
// }

// // DMZ Boundaries Charts...
// {
//   "dmzBoundaries": [
//     {
//       "siteID": "123",
//       "data": [
//         {
//           "month": "Apr-24",
//           "inflow": 20,
//           "bmac": -15,
//           "nrw": 10
//         },
//         {
//           "month": "May-24",
//           "inflow": 30,
//           "bmac": 25,
//           "nrw": -20
//         },
//         {
//           "month": "Jun-24",
//           "inflow": -10,
//           "bmac": -5,
//           "nrw": 15
//         }
//         // Add more months as needed
//       ]
//     },
//     {
//       "siteID": "456",
//       "data": [
//         {
//           "month": "Apr-24",
//           "inflow": 25,
//           "bmac": -10,
//           "nrw": 5
//         },
//         {
//           "month": "May-24",
//           "inflow": 35,
//           "bmac": 20,
//           "nrw": -15
//         },
//         {
//           "month": "Jun-24",
//           "inflow": -5,
//           "bmac": 0,
//           "nrw": 10
//         }
//         // Add more months as needed
//       ]
//     }
//   ]
// }

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
      const [
        esriConfig,
        Map,
        MapView,
        intl,
        GeoJSONLayer,
        GroupLayer,
        Graphic,
        reactiveUtils,
        promiseUtils,
        VectorTileLayer,
        Basemap,
      ] = await Promise.all([
        loadModule("esri/config"),
        loadModule("esri/Map"),
        loadModule("esri/views/MapView"),
        loadModule("esri/intl"),
        loadModule("esri/layers/GeoJSONLayer"),
        loadModule("esri/layers/GroupLayer"),
        loadModule("esri/Graphic"),
        loadModule("esri/core/reactiveUtils"),
        loadModule("esri/core/promiseUtils"),
        loadModule("esri/layers/VectorTileLayer"),
        loadModule("esri/Basemap"),
      ]);

      // intl.setLocale("ar");
      esriConfig.apiKey =
        "AAPK756f006de03e44d28710cb446c8dedb4rkQyhmzX6upFiYPzQT0HNQNMJ5qPyO1TnPDSPXT4EAM_DlQSj20ShRD7vyKa7a1H";

      displayMap = new Map({
        // basemap: "topo-vector",
      });

      // create a new instance of VectorTileLayer from the vector tiles style endpoint
      basemapWithoutLabels = new VectorTileLayer({
        // esri colored pencil style
        url: "./WorldTopographicBasemMapLayerWithoutLabels.json",
        listMode: "hide",
      });
      displayMap.add(basemapWithoutLabels); // adds the layer to the map

      view = new MapView({
        center: [116.98395690917948, 5.198632359416908], // longitude, latitude, centered on Sabah
        container: "displayMap",
        map: displayMap,
        zoom: 7,
      });

      // await view.when(() => {
      //   view.ui.add("logoDiv", "top-right");
      // })

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
      view.ui.add("logoDiv", "top-right");
      //display geojsons
      await displayLayers()
        .then(([view, displayMap, gL]) => {
          // console.log("gL Returned From Require Scope", gra);
          // You can work with the view object here
        })
        .catch((error) => {
          // Handle any errors here
        });

      //add widgets
      addWidgets()
        .then(([view, displayMap]) => {
          console.log("Widgets Returned From Require Scope", view, displayMap);
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
                    zoom: 15,
                  },
                  {
                    duration: 3000,
                  }
                );
              } else {
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
    const [
      reactiveUtils,
      GeoJSONLayer,
      GroupLayer,
      FeatureLayer,
      FeatureTable,
      SubtypeGroupLayer,
      SubtypeSublayer,
      LayerList,
    ] = await Promise.all([
      loadModule("esri/core/reactiveUtils"),
      loadModule("esri/layers/GeoJSONLayer"),
      loadModule("esri/layers/GroupLayer"),
      loadModule("esri/layers/FeatureLayer"),
      loadModule("esri/widgets/FeatureTable"),
      loadModule("esri/layers/SubtypeGroupLayer"),
      loadModule("esri/layers/support/SubtypeSublayer"),
      loadModule("esri/widgets/LayerList"),
    ]);

    function formatDate(timestamp) {
      const date = new Date(timestamp);

      // Adjust for timezone offset (+8 hours)
      date.setHours(date.getHours() + 8);

      const options = {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      };

      return date.toLocaleDateString("en-GB", options).replace(",", "");
    }

    // Here I will start coding to display some layers and style them

    // const popupTemplateReservoirs = {
    //   title: "WATER TREATMENT PLANT <br> Site: {site}",
    //   outFields: ["*"],
    //   content: function (feature) {
    //     const attributes = feature.graphic.attributes;

    //     // Create the main container
    //     const container = document.createElement("div");
    //     container.classList.add("custom-popup");

    //     // Create tab buttons
    //     const tabs = document.createElement("div");
    //     tabs.classList.add("tab-buttons");

    //     const tab1Btn = document.createElement("button");
    //     tab1Btn.innerText = "General Info";
    //     tab1Btn.classList.add("active");

    //     const tab2Btn = document.createElement("button");
    //     tab2Btn.innerText = "Location";

    //     // Create tab content containers
    //     const tabContent1 = document.createElement("div");
    //     tabContent1.classList.add("tab-content", "active");
    //     tabContent1.innerHTML = `
    //       <p><strong>Layer Name:</strong> Water Treatment Plant</p>
    //       <p><strong>ItemID:</strong> ${attributes.siteID}</p>
    //       <p><strong>ObjectID:</strong> ${attributes.gID}</p>
    //     `;

    //     const tabContent2 = document.createElement("div");
    //     tabContent2.classList.add("tab-content");
    //     tabContent2.innerHTML = `
    //       <p><strong>Latitude:</strong> ${attributes.Y}</p>
    //       <p><strong>Longitude:</strong> ${attributes.X}</p>
    //     `;

    //     // Append elements
    //     tabs.appendChild(tab1Btn);
    //     tabs.appendChild(tab2Btn);
    //     container.appendChild(tabs);
    //     container.appendChild(tabContent1);
    //     container.appendChild(tabContent2);

    //     // Add event listeners for tab switching
    //     tab1Btn.addEventListener("click", () => {
    //       tab1Btn.classList.add("active");
    //       tab2Btn.classList.remove("active");
    //       tabContent1.classList.add("active");
    //       tabContent2.classList.remove("active");
    //     });

    //     tab2Btn.addEventListener("click", () => {
    //       tab2Btn.classList.add("active");
    //       tab1Btn.classList.remove("active");
    //       tabContent2.classList.add("active");
    //       tabContent1.classList.remove("active");
    //     });

    //     return container;
    //   }
    // };

    const popupTemplateReservoirs = {
      title: "SERVICE RESERVOIR <br> Site: {site}",
      outFields: ["*"],
      actions: [
        {
          id: "streetview",
          icon: "360-view",
          title: "Street View",
        },
        {
          id: "sharelocation",
          // image: "./sharelocation.png",
          icon: "pin-tear",
          title: "Share Location",
        },
      ],
      content: function (feature) {
        const attributes = feature.graphic.attributes;

        // Create the main container
        const container = document.createElement("div");
        container.classList.add("custom-popup");

        // Create tab buttons
        const tabs = document.createElement("div");
        tabs.classList.add("tab-buttons");

        const infoTabBtn = document.createElement("button");
        infoTabBtn.innerText = "Info";
        infoTabBtn.classList.add("active");

        const loggedDataTabBtn = document.createElement("button");
        loggedDataTabBtn.innerText = "Logged Data";

        const gisTabBtn = document.createElement("button");
        gisTabBtn.innerText = "GIS";

        // Create tab content containers
        const infoTabContent = document.createElement("div");
        infoTabContent.classList.add("tab-content", "active");
        infoTabContent.innerHTML = `
          <p><strong>Capacity (m3):</strong> ${attributes.capacity}</p>
          <p><strong>Top Water Level (m):</strong> ${attributes.twl}</p>
          <p><strong>Bottom Water Level (m):</strong> ${attributes.bwl}</p>
          <p><strong>Data Logger:</strong> ${attributes.serial_number}</p>
          <p><strong>Logger Type:</strong> ${attributes.make} - ${
          attributes.model
        } - ${attributes.sub_model}</p>
          <p><strong>Last Received Date/Time:</strong> ${formatDate(
            attributes.last_loggedtime
          )}</p>
        `;

        const loggedDataTabContent = document.createElement("div");
        loggedDataTabContent.classList.add("tab-content");
        loggedDataTabContent.innerHTML = `
          <!-- Future chart will be added here -->
          <canvas id="reservoirsChart" width="400" height="200"></canvas>
        `;

        const gisTabContent = document.createElement("div");
        gisTabContent.classList.add("tab-content");
        gisTabContent.innerHTML = `
          <p><strong>Layer Name:</strong> Reservoirs</p>
          <p><strong>ItemID:</strong> ${attributes.siteID}</p>
          <p><strong>ObjectID:</strong> ${attributes.gID}</p>
          <p><strong>Longitude (Dec Deg.):</strong> ${attributes.X}</p>
          <p><strong>Latitude (Dec Deg.):</strong> ${attributes.Y}</p>
        `;

        // Append elements
        tabs.appendChild(infoTabBtn);
        tabs.appendChild(loggedDataTabBtn);
        tabs.appendChild(gisTabBtn);
        container.appendChild(tabs);
        container.appendChild(infoTabContent);
        container.appendChild(loggedDataTabContent);
        container.appendChild(gisTabContent);

        // Add event listeners for tab switching
        infoTabBtn.addEventListener("click", () => {
          infoTabBtn.classList.add("active");
          loggedDataTabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          infoTabContent.classList.add("active");
          loggedDataTabContent.classList.remove("active");
          gisTabContent.classList.remove("active");
        });

        loggedDataTabBtn.addEventListener("click", () => {
          loggedDataTabBtn.classList.add("active");
          infoTabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          loggedDataTabContent.classList.add("active");
          infoTabContent.classList.remove("active");
          gisTabContent.classList.remove("active");

          // Initialize the chart
          const ctx = document
            .getElementById("reservoirsChart")
            .getContext("2d");
          new Chart(ctx, {
            type: "line",
            data: {
              labels: ["12:00 AM", "12:00 PM", "12:00 AM"],
              datasets: [
                {
                  label: "Reservoirs Level",
                  data: [-2, 0, 1, 0, -1, -2],
                  borderColor: "rgba(75, 192, 192, 1)",
                  borderWidth: 2,
                  fill: false,
                },
              ],
            },
            options: {
              scales: {
                y: {
                  title: {
                    display: true,
                    text: "Level (m)",
                  },
                },
                x: {
                  title: {
                    display: true,
                    text: "Time",
                  },
                },
              },
            },
          });
        });

        gisTabBtn.addEventListener("click", () => {
          gisTabBtn.classList.add("active");
          infoTabBtn.classList.remove("active");
          loggedDataTabBtn.classList.remove("active");
          gisTabContent.classList.add("active");
          infoTabContent.classList.remove("active");
          loggedDataTabContent.classList.remove("active");
        });

        return container;
      },
    };

    const popupTemplateCustomerLocations = {
      title: "CUSTOMER LOCATION <br> Premise Number: {premisenum}",
      outFields: ["*"],
      actions: [
        {
          id: "streetview",
          icon: "360-view",
          title: "Street View",
        },
        {
          id: "sharelocation",
          // image: "./sharelocation.png",
          icon: "pin-tear",
          title: "Share Location",
        },
      ],
      content: function (feature) {
        const attributes = feature.graphic.attributes;

        // Create the main container
        const container = document.createElement("div");
        container.classList.add("custom-popup");

        // Create tab buttons
        const tabs = document.createElement("div");
        tabs.classList.add("tab-buttons");

        const premiseInfoTabBtn = document.createElement("button");
        premiseInfoTabBtn.innerText = "Premise Info";
        premiseInfoTabBtn.classList.add("active");

        const accountInfoTabBtn = document.createElement("button");
        accountInfoTabBtn.innerText = "Account Info";

        const meterInfoTabBtn = document.createElement("button");
        meterInfoTabBtn.innerText = "Meter Info";

        const bmacTabBtn = document.createElement("button");
        bmacTabBtn.innerText = "BMAC";

        const gisTabBtn = document.createElement("button");
        gisTabBtn.innerText = "GIS";

        // Create tab content containers
        const premiseInfoTabContent = document.createElement("div");
        premiseInfoTabContent.classList.add("tab-content", "active");
        premiseInfoTabContent.innerHTML = `
          <p><strong>Premise Number:</strong> ${attributes.premisenum}</p>
          <p><strong>Address 1:</strong> ${attributes.addr1}</p>
          <p><strong>Address 2:</strong> ${attributes.addr2}</p>
          <p><strong>Address 3:</strong> ${attributes.addr3}</p>
          <p><strong>Post Code:</strong> ${attributes.poscod}</p>
          <p><strong>Property Type:</strong> ${attributes.proptytyp} - ${attributes.proptytyp_descr}</p>
          <p><strong>Billing District:</strong> ${attributes.regioncode} - ${attributes.regionname}</p>
          <p><strong>Operational District:</strong> ${attributes.regioncode} - ${attributes.regionname}</p>
          <p><strong>DMA:</strong> ${attributes.sitecode} - ${attributes.sitename}</p>
        `;

        const accountInfoTabContent = document.createElement("div");
        accountInfoTabContent.classList.add("tab-content");
        accountInfoTabContent.innerHTML = `
          <p><strong>Account Number:</strong> ${attributes.accnum}</p>
          <p><strong>Start Date:</strong> ${attributes.supdat}</p>
          <p><strong>End Date:</strong> ${attributes.closeaccdat}</p>
          <p><strong>Customer Status:</strong> ${attributes.consta} - ${attributes.consta_descr}</p>
          <p><strong>Customer Group:</strong> ${attributes.congrp_descr}</p>
          <p><strong>Customer Type:</strong> ${attributes.contyp_descr}</p>
          <p><strong>Meter Round:</strong> ${attributes.zonnum} - ${attributes.blknum} - ${attributes.rounum}</p>
        `;

        const meterInfoTabContent = document.createElement("div");
        meterInfoTabContent.classList.add("tab-content");
        meterInfoTabContent.innerHTML = `
          <p><strong>Meter Number:</strong> ${attributes.mtrnum}</p>
          <p><strong>Meter Make:</strong> ${attributes.mtrmake_descr}</p>
          <p><strong>Meter Size:</strong> ${attributes.mtrsiz} - ${attributes.mtrsiz_descr}</p>
          <p><strong>Meter Type:</strong> ${attributes.mtrtyp} - ${attributes.mtrtyp_descr}</p>
          <p><strong>Meter Status:</strong> ${attributes.mtrstat} - ${attributes.mtrstat_descr}</p>
          <p><strong>Master Meter Status:</strong> ${attributes.masmtrstat} - ${attributes.masmtrstat_descr}</p>
        `;

        const bmacTabContent = document.createElement("div");
        bmacTabContent.classList.add("tab-content");
        bmacTabContent.innerHTML = `
          <!-- Future chart will be added here -->
        `;

        const gisTabContent = document.createElement("div");
        gisTabContent.classList.add("tab-content");
        gisTabContent.innerHTML = `
          <p><strong>Layer Name:</strong> Customer Locations</p>
          <p><strong>ItemID:</strong> ${attributes.siteID}</p>
          <p><strong>ObjectID:</strong> ${attributes.gID}</p>
          <p><strong>Longitude (Dec Deg.):</strong> ${attributes.X}</p>
          <p><strong>Latitude (Dec Deg.):</strong> ${attributes.Y}</p>
        `;

        // Append elements
        tabs.appendChild(premiseInfoTabBtn);
        tabs.appendChild(accountInfoTabBtn);
        tabs.appendChild(meterInfoTabBtn);
        tabs.appendChild(bmacTabBtn);
        tabs.appendChild(gisTabBtn);
        container.appendChild(tabs);
        container.appendChild(premiseInfoTabContent);
        container.appendChild(accountInfoTabContent);
        container.appendChild(meterInfoTabContent);
        container.appendChild(bmacTabContent);
        container.appendChild(gisTabContent);

        // Add event listeners for tab switching
        premiseInfoTabBtn.addEventListener("click", () => {
          premiseInfoTabBtn.classList.add("active");
          accountInfoTabBtn.classList.remove("active");
          meterInfoTabBtn.classList.remove("active");
          bmacTabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          premiseInfoTabContent.classList.add("active");
          accountInfoTabContent.classList.remove("active");
          meterInfoTabContent.classList.remove("active");
          bmacTabContent.classList.remove("active");
          gisTabContent.classList.remove("active");
        });

        accountInfoTabBtn.addEventListener("click", () => {
          accountInfoTabBtn.classList.add("active");
          premiseInfoTabBtn.classList.remove("active");
          meterInfoTabBtn.classList.remove("active");
          bmacTabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          accountInfoTabContent.classList.add("active");
          premiseInfoTabContent.classList.remove("active");
          meterInfoTabContent.classList.remove("active");
          bmacTabContent.classList.remove("active");
          gisTabContent.classList.remove("active");
        });

        meterInfoTabBtn.addEventListener("click", () => {
          meterInfoTabBtn.classList.add("active");
          premiseInfoTabBtn.classList.remove("active");
          accountInfoTabBtn.classList.remove("active");
          bmacTabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          meterInfoTabContent.classList.add("active");
          premiseInfoTabContent.classList.remove("active");
          accountInfoTabContent.classList.remove("active");
          bmacTabContent.classList.remove("active");
          gisTabContent.classList.remove("active");
        });

        bmacTabBtn.addEventListener("click", () => {
          bmacTabBtn.classList.add("active");
          premiseInfoTabBtn.classList.remove("active");
          accountInfoTabBtn.classList.remove("active");
          meterInfoTabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          bmacTabContent.classList.add("active");
          premiseInfoTabContent.classList.remove("active");
          accountInfoTabContent.classList.remove("active");
          meterInfoTabContent.classList.remove("active");
          gisTabContent.classList.remove("active");
        });

        gisTabBtn.addEventListener("click", () => {
          gisTabBtn.classList.add("active");
          premiseInfoTabBtn.classList.remove("active");
          accountInfoTabBtn.classList.remove("active");
          meterInfoTabBtn.classList.remove("active");
          bmacTabBtn.classList.remove("active");
          gisTabContent.classList.add("active");
          premiseInfoTabContent.classList.remove("active");
          accountInfoTabContent.classList.remove("active");
          meterInfoTabContent.classList.remove("active");
          bmacTabContent.classList.remove("active");
        });

        return container;
      },
    };

    const popupTemplateDMZCriticalPoints = {
      title: "DMZ CRITICAL POINT <br> Site: {site}",
      outFields: ["*"],
      actions: [
        {
          id: "streetview",
          icon: "360-view",
          title: "Street View",
        },
        {
          id: "sharelocation",
          // image: "./sharelocation.png",
          icon: "pin-tear",
          title: "Share Location",
        },
      ],
      content: function (feature) {
        const attributes = feature.graphic.attributes;

        // Create the main container
        const container = document.createElement("div");
        container.classList.add("custom-popup");

        // Create tab buttons
        const tabs = document.createElement("div");
        tabs.classList.add("tab-buttons");

        const loggedDataTabBtn = document.createElement("button");
        loggedDataTabBtn.innerText = "Logged Data";
        loggedDataTabBtn.classList.add("active");

        const info1TabBtn = document.createElement("button");
        info1TabBtn.innerText = "Info 1";

        const gisTabBtn = document.createElement("button");
        gisTabBtn.innerText = "GIS";

        // Create tab content containers
        const loggedDataTabContent = document.createElement("div");
        loggedDataTabContent.classList.add("tab-content", "active");
        loggedDataTabContent.innerHTML = `
          <!-- Future chart will be added here -->
        `;

        const info1TabContent = document.createElement("div");
        info1TabContent.classList.add("tab-content");
        info1TabContent.innerHTML = `
          <p><strong>Data Logger:</strong> ${attributes.serial_number}</p>
          <p><strong>Logger Type:</strong> ${attributes.make} - ${
          attributes.model
        }</p>
          <p><strong>Last Received Date/Time:</strong> ${formatDate(
            attributes.last_loggedtime
          )}</p>
        `;

        const gisTabContent = document.createElement("div");
        gisTabContent.classList.add("tab-content");
        gisTabContent.innerHTML = `
          <p><strong>Layer Name:</strong> DMZ Critical Points</p>
          <p><strong>ItemID:</strong> ${attributes.siteID}</p>
          <p><strong>ObjectID:</strong> ${attributes.gID}</p>
          <p><strong>Longitude (Dec Deg.):</strong> ${attributes.X}</p>
          <p><strong>Latitude (Dec Deg.):</strong> ${attributes.Y}</p>
        `;

        // Append elements
        tabs.appendChild(loggedDataTabBtn);
        tabs.appendChild(info1TabBtn);
        tabs.appendChild(gisTabBtn);
        container.appendChild(tabs);
        container.appendChild(loggedDataTabContent);
        container.appendChild(info1TabContent);
        container.appendChild(gisTabContent);

        // Add event listeners for tab switching
        loggedDataTabBtn.addEventListener("click", () => {
          loggedDataTabBtn.classList.add("active");
          info1TabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          loggedDataTabContent.classList.add("active");
          info1TabContent.classList.remove("active");
          gisTabContent.classList.remove("active");
        });

        info1TabBtn.addEventListener("click", () => {
          info1TabBtn.classList.add("active");
          loggedDataTabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          info1TabContent.classList.add("active");
          loggedDataTabContent.classList.remove("active");
          gisTabContent.classList.remove("active");
        });

        gisTabBtn.addEventListener("click", () => {
          gisTabBtn.classList.add("active");
          loggedDataTabBtn.classList.remove("active");
          info1TabBtn.classList.remove("active");
          gisTabContent.classList.add("active");
          loggedDataTabContent.classList.remove("active");
          info1TabContent.classList.remove("active");
        });

        return container;
      },
    };

    const popupTemplateKTM = {
      title: "TRUNK MAIN METER POINT <br> Site: {site}",
      outFields: ["*"],
      actions: [
        {
          id: "streetview",
          icon: "360-view",
          title: "Street View",
        },
        {
          id: "sharelocation",
          // image: "./sharelocation.png",
          icon: "pin-tear",
          title: "Share Location",
        },
      ],
      content: function (feature) {
        const attributes = feature.graphic.attributes;

        // Create the main container
        const container = document.createElement("div");
        container.classList.add("custom-popup");

        // Create tab buttons
        const tabs = document.createElement("div");
        tabs.classList.add("tab-buttons");

        const loggedDataTabBtn = document.createElement("button");
        loggedDataTabBtn.innerText = "Logged Data";
        loggedDataTabBtn.classList.add("active");

        const monthlyAverageTabBtn = document.createElement("button");
        monthlyAverageTabBtn.innerText = "Monthly Average";

        const info1TabBtn = document.createElement("button");
        info1TabBtn.innerText = "Info 1";

        const info2TabBtn = document.createElement("button");
        info2TabBtn.innerText = "Info 2";

        const gisTabBtn = document.createElement("button");
        gisTabBtn.innerText = "GIS";

        // Create tab content containers
        const loggedDataTabContent = document.createElement("div");
        loggedDataTabContent.classList.add("tab-content", "active");
        loggedDataTabContent.innerHTML = `
          <!-- Future chart will be added here -->
        `;

        const monthlyAverageTabContent = document.createElement("div");
        monthlyAverageTabContent.classList.add("tab-content");
        monthlyAverageTabContent.innerHTML = `
          <!-- Future chart will be added here -->
        `;

        const info1TabContent = document.createElement("div");
        info1TabContent.classList.add("tab-content");
        info1TabContent.innerHTML = `
          <p><strong>Meter Make:</strong> ${attributes.meter_make_descr}</p>
          <p><strong>Meter Type:</strong> ${attributes.meter_type_descr}</p>
          <p><strong>Serial Number:</strong> ${attributes.serial_number}</p>
          <p><strong>Install Date:</strong> ${attributes.inst_date}</p>
          <p><strong>Data Logger:</strong> ${attributes.serial_number}</p>
          <p><strong>Logger Type:</strong> ${attributes.make} - ${
          attributes.model
        }</p>
          <p><strong>Last Received Date/Time:</strong> ${formatDate(
            attributes.last_loggedtime
          )}</p>
        `;

        const info2TabContent = document.createElement("div");
        info2TabContent.classList.add("tab-content");
        info2TabContent.innerHTML = `
          <p><strong>Meter Point Type:</strong> ${attributes.mp_type_descr}</p>
          <p><strong>Main Pipe Nom Diam:</strong> ${attributes.main_pipe_dn}</p>
          <p><strong>Bypass:</strong> ${attributes.bypass}</p>
          <p><strong>Bypass Nom Diam:</strong> ${attributes.bypass_pipe_dn}</p>
          <p><strong>Meter Location:</strong> ${attributes.meter_locn_descr}</p>
        `;

        const gisTabContent = document.createElement("div");
        gisTabContent.classList.add("tab-content");
        gisTabContent.innerHTML = `
          <p><strong>Layer Name:</strong> Trunk Main Meter Points</p>
          <p><strong>ItemID:</strong> ${attributes.siteID}</p>
          <p><strong>ObjectID:</strong> ${attributes.gID}</p>
          <p><strong>Longitude (Dec Deg.):</strong> ${attributes.X}</p>
          <p><strong>Latitude (Dec Deg.):</strong> ${attributes.Y}</p>
        `;

        // Append elements
        tabs.appendChild(loggedDataTabBtn);
        tabs.appendChild(monthlyAverageTabBtn);
        tabs.appendChild(info1TabBtn);
        tabs.appendChild(info2TabBtn);
        tabs.appendChild(gisTabBtn);
        container.appendChild(tabs);
        container.appendChild(loggedDataTabContent);
        container.appendChild(monthlyAverageTabContent);
        container.appendChild(info1TabContent);
        container.appendChild(info2TabContent);
        container.appendChild(gisTabContent);

        // Add event listeners for tab switching
        loggedDataTabBtn.addEventListener("click", () => {
          loggedDataTabBtn.classList.add("active");
          monthlyAverageTabBtn.classList.remove("active");
          info1TabBtn.classList.remove("active");
          info2TabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          loggedDataTabContent.classList.add("active");
          monthlyAverageTabContent.classList.remove("active");
          info1TabContent.classList.remove("active");
          info2TabContent.classList.remove("active");
          gisTabContent.classList.remove("active");
        });

        monthlyAverageTabBtn.addEventListener("click", () => {
          monthlyAverageTabBtn.classList.add("active");
          loggedDataTabBtn.classList.remove("active");
          info1TabBtn.classList.remove("active");
          info2TabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          monthlyAverageTabContent.classList.add("active");
          loggedDataTabContent.classList.remove("active");
          info1TabContent.classList.remove("active");
          info2TabContent.classList.remove("active");
          gisTabContent.classList.remove("active");
        });

        info1TabBtn.addEventListener("click", () => {
          info1TabBtn.classList.add("active");
          loggedDataTabBtn.classList.remove("active");
          monthlyAverageTabBtn.classList.remove("active");
          info2TabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          info1TabContent.classList.add("active");
          loggedDataTabContent.classList.remove("active");
          monthlyAverageTabContent.classList.remove("active");
          info2TabContent.classList.remove("active");
          gisTabContent.classList.remove("active");
        });

        info2TabBtn.addEventListener("click", () => {
          info2TabBtn.classList.add("active");
          loggedDataTabBtn.classList.remove("active");
          monthlyAverageTabBtn.classList.remove("active");
          info1TabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          info2TabContent.classList.add("active");
          loggedDataTabContent.classList.remove("active");
          monthlyAverageTabContent.classList.remove("active");
          info1TabContent.classList.remove("active");
          gisTabContent.classList.remove("active");
        });

        gisTabBtn.addEventListener("click", () => {
          gisTabBtn.classList.add("active");
          loggedDataTabBtn.classList.remove("active");
          monthlyAverageTabBtn.classList.remove("active");
          info1TabBtn.classList.remove("active");
          info2TabBtn.classList.remove("active");
          gisTabContent.classList.add("active");
          loggedDataTabContent.classList.remove("active");
          monthlyAverageTabContent.classList.remove("active");
          info1TabContent.classList.remove("active");
          info2TabContent.classList.remove("active");
        });

        return container;
      },
    };

    const popupTemplateWTP = {
      title: "WATER TREATMENT PLANT <br> Site: {site}",
      outFields: ["*"],
      actions: [
        {
          id: "streetview",
          icon: "360-view",
          title: "Street View",
        },
        {
          id: "sharelocation",
          // image: "./sharelocation.png",
          icon: "pin-tear",
          title: "Share Location",
        },
      ],
      content: function (feature) {
        const attributes = feature.graphic.attributes;

        // Create the main container
        const container = document.createElement("div");
        container.classList.add("custom-popup");

        // Create tab buttons
        const tabs = document.createElement("div");
        tabs.classList.add("tab-buttons");

        const generalInfoTabBtn = document.createElement("button");
        generalInfoTabBtn.innerText = "General Info";
        generalInfoTabBtn.classList.add("active");

        const gisTabBtn = document.createElement("button");
        gisTabBtn.innerText = "GIS";

        // Create tab content containers
        const generalInfoTabContent = document.createElement("div");
        generalInfoTabContent.classList.add("tab-content", "active");
        generalInfoTabContent.innerHTML = `
          <p><strong>Layer Name:</strong> Water Treatment Plant</p>
          <p><strong>ItemID:</strong> ${attributes.siteID}</p>
          <p><strong>ObjectID:</strong> ${attributes.gID}</p>
        `;

        const gisTabContent = document.createElement("div");
        gisTabContent.classList.add("tab-content");
        gisTabContent.innerHTML = `
          <p><strong>Layer Name:</strong> Water Treatment Plant</p>
          <p><strong>Longitude (Dec Deg.):</strong> ${attributes.X}</p>
          <p><strong>Latitude (Dec Deg.):</strong> ${attributes.Y}</p>
        `;

        // Append elements
        tabs.appendChild(generalInfoTabBtn);
        tabs.appendChild(gisTabBtn);
        container.appendChild(tabs);
        container.appendChild(generalInfoTabContent);
        container.appendChild(gisTabContent);

        // Add event listeners for tab switching
        generalInfoTabBtn.addEventListener("click", () => {
          generalInfoTabBtn.classList.add("active");
          gisTabBtn.classList.remove("active");
          generalInfoTabContent.classList.add("active");
          gisTabContent.classList.remove("active");
        });

        gisTabBtn.addEventListener("click", () => {
          gisTabBtn.classList.add("active");
          generalInfoTabBtn.classList.remove("active");
          gisTabContent.classList.add("active");
          generalInfoTabContent.classList.remove("active");
        });

        return container;
      },
    };

    const popupTemplateDMZBoundaries = {
      title: "DMZ BOUNDARY <br> Site: {site}",
      outFields: ["*"],
      actions: [
        {
          id: "streetview",
          icon: "360-view",
          title: "Street View",
        },
        {
          id: "sharelocation",
          // image: "./sharelocation.png",
          icon: "pin-tear",
          title: "Share Location",
        },
      ],
      content: function (feature) {
        const attributes = feature.graphic.attributes;

        // Create the main container
        const container = document.createElement("div");
        container.classList.add("custom-popup");

        // Create tab buttons
        const tabs = document.createElement("div");
        tabs.classList.add("tab-buttons");

        const nrwReportTabBtn = document.createElement("button");
        nrwReportTabBtn.innerText = "NRW Report";
        nrwReportTabBtn.classList.add("active");

        const loggedDataTabBtn = document.createElement("button");
        loggedDataTabBtn.innerText = "Logged Data";

        const info1TabBtn = document.createElement("button");
        info1TabBtn.innerText = "Info 1";

        const gisTabBtn = document.createElement("button");
        gisTabBtn.innerText = "GIS";

        // Create tab content containers
        const nrwReportTabContent = document.createElement("div");
        nrwReportTabContent.classList.add("tab-content", "active");
        nrwReportTabContent.innerHTML = `
          <canvas id="nrwChart" width="400" height="200"></canvas>
        `;

        const loggedDataTabContent = document.createElement("div");
        loggedDataTabContent.classList.add("tab-content");
        loggedDataTabContent.innerHTML = `
          <!-- Future chart will be added here -->
        `;

        const info1TabContent = document.createElement("div");
        info1TabContent.classList.add("tab-content");
        info1TabContent.innerHTML = `
          <p><strong>DMZ ID:</strong> ${attributes.siteID}</p>
          <p><strong>DMZ Code:</strong> ${attributes.sitecode}</p>
          <p><strong>DMZ Name:</strong> ${attributes.sitename}</p>
          <p><strong>NRW Status:</strong> ${attributes.status_descr}</p>
          <p><strong>Operational Status:</strong> ${attributes.category_name}</p>
          <p><strong>Main Length (m):</strong> </p>
          <p><strong>Premises:</strong> </p>
          <p><strong>Accounts:</strong> </p>
          <p><strong>Meters:</strong> </p>
        `;

        const gisTabContent = document.createElement("div");
        gisTabContent.classList.add("tab-content");
        gisTabContent.innerHTML = `
          <p><strong>Layer Name:</strong> DMZ Boundaries</p>
          <p><strong>ItemID:</strong> ${attributes.siteID}</p>
          <p><strong>ObjectID:</strong> ${attributes.gID}</p>
        `;

        // Append elements
        tabs.appendChild(nrwReportTabBtn);
        tabs.appendChild(loggedDataTabBtn);
        tabs.appendChild(info1TabBtn);
        tabs.appendChild(gisTabBtn);
        container.appendChild(tabs);
        container.appendChild(nrwReportTabContent);
        container.appendChild(loggedDataTabContent);
        container.appendChild(info1TabContent);
        container.appendChild(gisTabContent);

        // Add event listeners for tab switching
        nrwReportTabBtn.addEventListener("click", () => {
          nrwReportTabBtn.classList.add("active");
          loggedDataTabBtn.classList.remove("active");
          info1TabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          nrwReportTabContent.classList.add("active");
          loggedDataTabContent.classList.remove("active");
          info1TabContent.classList.remove("active");
          gisTabContent.classList.remove("active");

          // Initialize the chart
          const ctx = document.getElementById("nrwChart").getContext("2d");
          new Chart(ctx, {
            type: "bar",
            data: {
              labels: [
                "Apr-24",
                "May-24",
                "Jun-24",
                "Jul-24",
                "Aug-24",
                "Sep-24",
                "Oct-24",
                "Nov-24",
                "Dec-24",
                "Jan-25",
                "Feb-25",
                "Mar-25",
              ],
              datasets: [
                {
                  label: "Inflow",
                  data: [20, 30, -10, 40, -20, 30, 10, -30, 20, 10, -10, 30],
                  backgroundColor: "rgba(75, 192, 192, 0.6)",
                },
                {
                  label: "BMAC",
                  data: [-15, 25, -5, 35, -25, 20, 5, -20, 15, 5, -5, 25],
                  backgroundColor: "rgba(255, 159, 64, 0.6)",
                },
                {
                  label: "NRW",
                  data: [10, -20, 15, -30, 20, -10, 25, -15, 10, -5, 20, -25],
                  backgroundColor: "rgba(153, 102, 255, 0.6)",
                },
              ],
            },
            options: {
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: "Value",
                  },
                },
                x: {
                  title: {
                    display: true,
                    text: "Month-Year",
                  },
                },
              },
            },
          });
        });

        loggedDataTabBtn.addEventListener("click", () => {
          loggedDataTabBtn.classList.add("active");
          nrwReportTabBtn.classList.remove("active");
          info1TabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          loggedDataTabContent.classList.add("active");
          nrwReportTabContent.classList.remove("active");
          info1TabContent.classList.remove("active");
          gisTabContent.classList.remove("active");
        });

        info1TabBtn.addEventListener("click", () => {
          info1TabBtn.classList.add("active");
          nrwReportTabBtn.classList.remove("active");
          loggedDataTabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          info1TabContent.classList.add("active");
          nrwReportTabContent.classList.remove("active");
          loggedDataTabContent.classList.remove("active");
          gisTabContent.classList.remove("active");
        });

        gisTabBtn.addEventListener("click", () => {
          gisTabBtn.classList.add("active");
          nrwReportTabBtn.classList.remove("active");
          loggedDataTabBtn.classList.remove("active");
          info1TabBtn.classList.remove("active");
          gisTabContent.classList.add("active");
          nrwReportTabContent.classList.remove("active");
          loggedDataTabContent.classList.remove("active");
          info1TabContent.classList.remove("active");
        });

        return container;
      },
    };

    const popupTemplateDMZMeterPoints = {
      title: "DMZ METER POINT <br> Site: {site}",
      outFields: ["*"],
      actions: [
        {
          id: "streetview",
          icon: "360-view",
          title: "Street View",
        },
        {
          id: "sharelocation",
          // image: "./sharelocation.png",
          icon: "pin-tear",
          title: "Share Location",
        },
      ],
      content: function (feature) {
        const attributes = feature.graphic.attributes;

        // Create the main container
        const container = document.createElement("div");
        container.classList.add("custom-popup");

        // Create tab buttons
        const tabs = document.createElement("div");
        tabs.classList.add("tab-buttons");

        const loggedDataTabBtn = document.createElement("button");
        loggedDataTabBtn.innerText = "Logged Data";
        loggedDataTabBtn.classList.add("active");

        const monthlyAverageTabBtn = document.createElement("button");
        monthlyAverageTabBtn.innerText = "Monthly Average";

        const info1TabBtn = document.createElement("button");
        info1TabBtn.innerText = "Info 1";

        const info2TabBtn = document.createElement("button");
        info2TabBtn.innerText = "Info 2";

        const gisTabBtn = document.createElement("button");
        gisTabBtn.innerText = "GIS";

        // Create tab content containers
        const loggedDataTabContent = document.createElement("div");
        loggedDataTabContent.classList.add("tab-content", "active");
        loggedDataTabContent.innerHTML = `
          <!-- Future chart will be added here -->
        `;

        const monthlyAverageTabContent = document.createElement("div");
        monthlyAverageTabContent.classList.add("tab-content");
        monthlyAverageTabContent.innerHTML = `
          <!-- Future chart will be added here -->
        `;

        const info1TabContent = document.createElement("div");
        info1TabContent.classList.add("tab-content");
        info1TabContent.innerHTML = `
          <p><strong>Meter Make:</strong> ${attributes.meter_make_descr}</p>
          <p><strong>Meter Type:</strong> ${attributes.meter_type_descr}</p>
          <p><strong>Serial Number:</strong> ${attributes.serial_number}</p>
          <p><strong>Install Date:</strong> ${attributes.inst_date}</p>
          <p><strong>Data Logger:</strong> ${attributes.serial_number}</p>
          <p><strong>Logger Type:</strong> ${attributes.make} - ${
          attributes.model
        }</p>
          <p><strong>Last Received Date/Time:</strong> ${formatDate(
            attributes.last_loggedtime
          )}</p>
        `;

        const info2TabContent = document.createElement("div");
        info2TabContent.classList.add("tab-content");
        info2TabContent.innerHTML = `
          <p><strong>Meter Point Type:</strong> ${attributes.mp_type_descr}</p>
          <p><strong>Main Pipe Nom Diam:</strong> ${attributes.main_pipe_dn}</p>
          <p><strong>Bypass:</strong> ${attributes.bypass}</p>
          <p><strong>Bypass Nom Diam:</strong> ${attributes.bypass_pipe_dn}</p>
          <p><strong>Meter Location:</strong> ${attributes.meter_locn_descr}</p>
          <p><strong>Strainer:</strong> ${attributes.strainer}</p>
          <p><strong>Strainer Nom Diam:</strong> ${attributes.strain_dn_descr}</p>
        `;

        const gisTabContent = document.createElement("div");
        gisTabContent.classList.add("tab-content");
        gisTabContent.innerHTML = `
          <p><strong>Layer Name:</strong> DMZ Meter Points</p>
          <p><strong>ItemID:</strong> ${attributes.siteID}</p>
          <p><strong>ObjectID:</strong> ${attributes.gID}</p>
          <p><strong>Longitude (Dec Deg.):</strong> ${attributes.X}</p>
          <p><strong>Latitude (Dec Deg.):</strong> ${attributes.Y}</p>
        `;

        // Append elements
        tabs.appendChild(loggedDataTabBtn);
        tabs.appendChild(monthlyAverageTabBtn);
        tabs.appendChild(info1TabBtn);
        tabs.appendChild(info2TabBtn);
        tabs.appendChild(gisTabBtn);
        container.appendChild(tabs);
        container.appendChild(loggedDataTabContent);
        container.appendChild(monthlyAverageTabContent);
        container.appendChild(info1TabContent);
        container.appendChild(info2TabContent);
        container.appendChild(gisTabContent);

        // Add event listeners for tab switching
        loggedDataTabBtn.addEventListener("click", () => {
          loggedDataTabBtn.classList.add("active");
          monthlyAverageTabBtn.classList.remove("active");
          info1TabBtn.classList.remove("active");
          info2TabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          loggedDataTabContent.classList.add("active");
          monthlyAverageTabContent.classList.remove("active");
          info1TabContent.classList.remove("active");
          info2TabContent.classList.remove("active");
          gisTabContent.classList.remove("active");
        });

        monthlyAverageTabBtn.addEventListener("click", () => {
          monthlyAverageTabBtn.classList.add("active");
          loggedDataTabBtn.classList.remove("active");
          info1TabBtn.classList.remove("active");
          info2TabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          monthlyAverageTabContent.classList.add("active");
          loggedDataTabContent.classList.remove("active");
          info1TabContent.classList.remove("active");
          info2TabContent.classList.remove("active");
          gisTabContent.classList.remove("active");
        });

        info1TabBtn.addEventListener("click", () => {
          info1TabBtn.classList.add("active");
          loggedDataTabBtn.classList.remove("active");
          monthlyAverageTabBtn.classList.remove("active");
          info2TabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          info1TabContent.classList.add("active");
          loggedDataTabContent.classList.remove("active");
          monthlyAverageTabContent.classList.remove("active");
          info2TabContent.classList.remove("active");
          gisTabContent.classList.remove("active");
        });

        info2TabBtn.addEventListener("click", () => {
          info2TabBtn.classList.add("active");
          loggedDataTabBtn.classList.remove("active");
          monthlyAverageTabBtn.classList.remove("active");
          info1TabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          info2TabContent.classList.add("active");
          loggedDataTabContent.classList.remove("active");
          monthlyAverageTabContent.classList.remove("active");
          info1TabContent.classList.remove("active");
          gisTabContent.classList.remove("active");
        });

        gisTabBtn.addEventListener("click", () => {
          gisTabBtn.classList.add("active");
          loggedDataTabBtn.classList.remove("active");
          monthlyAverageTabBtn.classList.remove("active");
          info1TabBtn.classList.remove("active");
          info2TabBtn.classList.remove("active");
          gisTabContent.classList.add("active");
          loggedDataTabContent.classList.remove("active");
          monthlyAverageTabContent.classList.remove("active");
          info1TabContent.classList.remove("active");
          info2TabContent.classList.remove("active");
        });

        return container;
      },
    };

    const popupTemplateTransmissionMainMeterPoints = {
      title: "TRANSMISSION MAIN METER POINT <br> Site: {site}",
      outFields: ["*"],
      actions: [
        {
          id: "streetview",
          icon: "360-view",
          title: "Street View",
        },
        {
          id: "sharelocation",
          // image: "./sharelocation.png",
          icon: "pin-tear",
          title: "Share Location",
        },
      ],
      content: function (feature) {
        const attributes = feature.graphic.attributes;

        // Create the main container
        const container = document.createElement("div");
        container.classList.add("custom-popup");

        // Create tab buttons
        const tabs = document.createElement("div");
        tabs.classList.add("tab-buttons");

        const loggedDataTabBtn = document.createElement("button");
        loggedDataTabBtn.innerText = "Logged Data";
        loggedDataTabBtn.classList.add("active");

        const monthlyAverageTabBtn = document.createElement("button");
        monthlyAverageTabBtn.innerText = "Monthly Average";

        const info1TabBtn = document.createElement("button");
        info1TabBtn.innerText = "Info 1";

        const info2TabBtn = document.createElement("button");
        info2TabBtn.innerText = "Info 2";

        const gisTabBtn = document.createElement("button");
        gisTabBtn.innerText = "GIS";

        // Create tab content containers
        const loggedDataTabContent = document.createElement("div");
        loggedDataTabContent.classList.add("tab-content", "active");
        loggedDataTabContent.innerHTML = `
          <!-- Future chart will be added here -->
        `;

        const monthlyAverageTabContent = document.createElement("div");
        monthlyAverageTabContent.classList.add("tab-content");
        monthlyAverageTabContent.innerHTML = `
          <!-- Future chart will be added here -->
        `;

        const info1TabContent = document.createElement("div");
        info1TabContent.classList.add("tab-content");
        info1TabContent.innerHTML = `
          <p><strong>Meter Make:</strong> ${attributes.meter_make_descr}</p>
          <p><strong>Meter Type:</strong> ${attributes.meter_type_descr}</p>
          <p><strong>Serial Number:</strong> ${attributes.serial_number}</p>
          <p><strong>Install Date:</strong> ${attributes.inst_date}</p>
          <p><strong>Data Logger:</strong> ${attributes.serial_number}</p>
          <p><strong>Logger Type:</strong> ${attributes.make} - ${
          attributes.model
        }</p>
          <p><strong>Last Received Date/Time:</strong> ${formatDate(
            attributes.last_loggedtime
          )}</p>
        `;

        const info2TabContent = document.createElement("div");
        info2TabContent.classList.add("tab-content");
        info2TabContent.innerHTML = `
          <p><strong>Meter Point Type:</strong> ${attributes.mp_type_descr}</p>
          <p><strong>Main Pipe Nom Diam:</strong> ${attributes.main_pipe_dn}</p>
          <p><strong>Bypass:</strong> ${attributes.bypass}</p>
          <p><strong>Bypass Nom Diam:</strong> ${attributes.bypass_pipe_dn}</p>
          <p><strong>Meter Location:</strong> ${attributes.meter_locn_descr}</p>
        `;

        const gisTabContent = document.createElement("div");
        gisTabContent.classList.add("tab-content");
        gisTabContent.innerHTML = `
          <p><strong>Layer Name:</strong> Transmission Main Meter Points</p>
          <p><strong>ItemID:</strong> ${attributes.siteID}</p>
          <p><strong>ObjectID:</strong> ${attributes.gID}</p>
          <p><strong>Longitude (Dec Deg.):</strong> ${attributes.X}</p>
          <p><strong>Latitude (Dec Deg.):</strong> ${attributes.Y}</p>
        `;

        // Append elements
        tabs.appendChild(loggedDataTabBtn);
        tabs.appendChild(monthlyAverageTabBtn);
        tabs.appendChild(info1TabBtn);
        tabs.appendChild(info2TabBtn);
        tabs.appendChild(gisTabBtn);
        container.appendChild(tabs);
        container.appendChild(loggedDataTabContent);
        container.appendChild(monthlyAverageTabContent);
        container.appendChild(info1TabContent);
        container.appendChild(info2TabContent);
        container.appendChild(gisTabContent);

        // Add event listeners for tab switching
        loggedDataTabBtn.addEventListener("click", () => {
          loggedDataTabBtn.classList.add("active");
          monthlyAverageTabBtn.classList.remove("active");
          info1TabBtn.classList.remove("active");
          info2TabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          loggedDataTabContent.classList.add("active");
          monthlyAverageTabContent.classList.remove("active");
          info1TabContent.classList.remove("active");
          info2TabContent.classList.remove("active");
          gisTabContent.classList.remove("active");
        });

        monthlyAverageTabBtn.addEventListener("click", () => {
          monthlyAverageTabBtn.classList.add("active");
          loggedDataTabBtn.classList.remove("active");
          info1TabBtn.classList.remove("active");
          info2TabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          monthlyAverageTabContent.classList.add("active");
          loggedDataTabContent.classList.remove("active");
          info1TabContent.classList.remove("active");
          info2TabContent.classList.remove("active");
          gisTabContent.classList.remove("active");
        });

        info1TabBtn.addEventListener("click", () => {
          info1TabBtn.classList.add("active");
          loggedDataTabBtn.classList.remove("active");
          monthlyAverageTabBtn.classList.remove("active");
          info2TabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          info1TabContent.classList.add("active");
          loggedDataTabContent.classList.remove("active");
          monthlyAverageTabContent.classList.remove("active");
          info2TabContent.classList.remove("active");
          gisTabContent.classList.remove("active");
        });

        info2TabBtn.addEventListener("click", () => {
          info2TabBtn.classList.add("active");
          loggedDataTabBtn.classList.remove("active");
          monthlyAverageTabBtn.classList.remove("active");
          info1TabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          info2TabContent.classList.add("active");
          loggedDataTabContent.classList.remove("active");
          monthlyAverageTabContent.classList.remove("active");
          info1TabContent.classList.remove("active");
          gisTabContent.classList.remove("active");
        });

        gisTabBtn.addEventListener("click", () => {
          gisTabBtn.classList.add("active");
          loggedDataTabBtn.classList.remove("active");
          monthlyAverageTabBtn.classList.remove("active");
          info1TabBtn.classList.remove("active");
          info2TabBtn.classList.remove("active");
          gisTabContent.classList.add("active");
          loggedDataTabContent.classList.remove("active");
          monthlyAverageTabContent.classList.remove("active");
          info1TabContent.classList.remove("active");
          info2TabContent.classList.remove("active");
        });

        return container;
      },
    };

    const popupTemplateWaterMains = {
      title: "WATER MAINS <br> Site: {site}",
      outFields: ["*"],
      actions: [
        {
          id: "streetview",
          icon: "360-view",
          title: "Street View",
        },
        {
          id: "sharelocation",
          // image: "./sharelocation.png",
          icon: "pin-tear",
          title: "Share Location",
        },
      ],
      content: function (feature) {
        const attributes = feature.graphic.attributes;

        // Create the main container
        const container = document.createElement("div");
        container.classList.add("custom-popup");

        // Create tab buttons
        const tabs = document.createElement("div");
        tabs.classList.add("tab-buttons");

        const generalInfoTabBtn = document.createElement("button");
        generalInfoTabBtn.innerText = "General Info";
        generalInfoTabBtn.classList.add("active");

        const gisTabBtn = document.createElement("button");
        gisTabBtn.innerText = "GIS";

        // Create tab content containers
        const generalInfoTabContent = document.createElement("div");
        generalInfoTabContent.classList.add("tab-content", "active");
        generalInfoTabContent.innerHTML = `
          <p><strong>Pipe Type:</strong> ${attributes.pipe_type_descr}</p>
          <p><strong>Pipe Value:</strong> ${attributes.pipe_dn_descr}</p>
          <p><strong>Length:</strong> ${attributes.mLength}</p>
          <p><strong>Pipe Mat:</strong> ${attributes.pipe_mat_descr}</p>
        `;

        const gisTabContent = document.createElement("div");
        gisTabContent.classList.add("tab-content");
        gisTabContent.innerHTML = `
          <p><strong>Layer Name:</strong> Water Mains</p>
          <p><strong>ItemID:</strong> ${attributes.siteID}</p>
          <p><strong>ObjectID:</strong> ${attributes.gID}</p>
        `;

        // Append elements
        tabs.appendChild(generalInfoTabBtn);
        tabs.appendChild(gisTabBtn);
        container.appendChild(tabs);
        container.appendChild(generalInfoTabContent);
        container.appendChild(gisTabContent);

        // Add event listeners for tab switching
        generalInfoTabBtn.addEventListener("click", () => {
          generalInfoTabBtn.classList.add("active");
          gisTabBtn.classList.remove("active");
          generalInfoTabContent.classList.add("active");
          gisTabContent.classList.remove("active");
        });

        gisTabBtn.addEventListener("click", () => {
          gisTabBtn.classList.add("active");
          generalInfoTabBtn.classList.remove("active");
          gisTabContent.classList.add("active");
          generalInfoTabContent.classList.remove("active");
        });

        return container;
      },
    };

    const popupTemplateWorkOrders = {
      title: "Work Order (New System) <br> Work Order Number: {workorder_dbID}",
      outFields: ["*"],
      actions: [
        {
          id: "streetview",
          icon: "360-view",
          title: "Street View",
        },
        {
          id: "sharelocation",
          // image: "./sharelocation.png",
          icon: "pin-tear",
          title: "Share Location",
        },
      ],
      content: function (feature) {
        const attributes = feature.graphic.attributes;

        // Create the main container
        const container = document.createElement("div");
        container.classList.add("custom-popup");

        // Create tab buttons
        const tabs = document.createElement("div");
        tabs.classList.add("tab-buttons");

        const info1TabBtn = document.createElement("button");
        info1TabBtn.innerText = "Info 1";
        info1TabBtn.classList.add("active");

        const info2TabBtn = document.createElement("button");
        info2TabBtn.innerText = "Info 2";

        const info3TabBtn = document.createElement("button");
        info3TabBtn.innerText = "Info 3";

        const gisTabBtn = document.createElement("button");
        gisTabBtn.innerText = "GIS";

        // Create tab content containers
        const info1TabContent = document.createElement("div");
        info1TabContent.classList.add("tab-content", "active");
        info1TabContent.innerHTML = `
          <p><strong>Careline Number:</strong> ${attributes.careline_num}</p>
          <p><strong>Reported By:</strong> ${attributes.reportedby_descr}</p>
          <p><strong>Work Order Status:</strong> ${attributes.status_descr}</p>
          <p><strong>Reinstatement Status:</strong> ${attributes["Reinstatement Type"]}</p>
          <p><strong>Program:</strong> ${attributes.program_descr}</p>
          <p><strong>Contract:</strong> ${attributes.contract_descr}</p>
          <p><strong>Contractor:</strong> ${attributes.contractor_descr}</p>
        `;

        const info2TabContent = document.createElement("div");
        info2TabContent.classList.add("tab-content");
        info2TabContent.innerHTML = `
          <p><strong>Work Order Status:</strong> ${attributes.status_descr}</p>
          <p><strong>Date Reported:</strong> ${attributes.reported_date}</p>
          <p><strong>Date Created:</strong> ${attributes.created_date}</p>
          <p><strong>Date Allocated:</strong> ${attributes.allocated_date}</p>
          <p><strong>Date Received:</strong> ${attributes.received_date}</p>
          <p><strong>Date Completed:</strong> ${attributes.completed_date}</p>
          <p><strong>Date Confirmed:</strong> ${attributes["Confirmed Date"]}</p>
          <p><strong>Date Reinstatement Approved:</strong> ${attributes.approved_date}</p>
          <p><strong>Date Cancelled:</strong> ${attributes.cancelled_date}</p>
        `;

        const info3TabContent = document.createElement("div");
        info3TabContent.classList.add("tab-content");
        info3TabContent.innerHTML = `
          <p><strong>Work Order Status:</strong> ${attributes.status_descr}</p>
          <p><strong>Failure Type:</strong> ${attributes.failuretype_descr}</p>
          <p><strong>Repair Type:</strong> ${attributes.repairtype_descr}</p>
          <p><strong>Pipe Diameter (mm):</strong> ${attributes.pipesize_descr}</p>
          <p><strong>Pipe Material:</strong> ${attributes.pipemat_descr}</p>
          <p><strong>Excavation Type:</strong> ${attributes.exctype_descr}</p>
          <p><strong>Reinstatement Type:</strong> ${attributes.reinstype_descr}</p>
        `;

        const gisTabContent = document.createElement("div");
        gisTabContent.classList.add("tab-content");
        gisTabContent.innerHTML = `
          <p><strong>Layer Name:</strong> Work Orders (New System)</p>
          <p><strong>ItemID:</strong> ${attributes.regionID}</p>
          <p><strong>ObjectID:</strong> ${attributes.OBJECTID}</p>
          <p><strong>Longitude (Dec Deg.):</strong> ${attributes.Longitude}</p>
          <p><strong>Latitude (Dec Deg.):</strong> ${attributes.Latitude}</p>
        `;

        // Append elements
        tabs.appendChild(info1TabBtn);
        tabs.appendChild(info2TabBtn);
        tabs.appendChild(info3TabBtn);
        tabs.appendChild(gisTabBtn);
        container.appendChild(tabs);
        container.appendChild(info1TabContent);
        container.appendChild(info2TabContent);
        container.appendChild(info3TabContent);
        container.appendChild(gisTabContent);

        // Add event listeners for tab switching
        info1TabBtn.addEventListener("click", () => {
          info1TabBtn.classList.add("active");
          info2TabBtn.classList.remove("active");
          info3TabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          info1TabContent.classList.add("active");
          info2TabContent.classList.remove("active");
          info3TabContent.classList.remove("active");
          gisTabContent.classList.remove("active");
        });

        info2TabBtn.addEventListener("click", () => {
          info2TabBtn.classList.add("active");
          info1TabBtn.classList.remove("active");
          info3TabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          info2TabContent.classList.add("active");
          info1TabContent.classList.remove("active");
          info3TabContent.classList.remove("active");
          gisTabContent.classList.remove("active");
        });

        info3TabBtn.addEventListener("click", () => {
          info3TabBtn.classList.add("active");
          info1TabBtn.classList.remove("active");
          info2TabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          info3TabContent.classList.add("active");
          info1TabContent.classList.remove("active");
          info2TabContent.classList.remove("active");
          gisTabContent.classList.remove("active");
        });

        gisTabBtn.addEventListener("click", () => {
          gisTabBtn.classList.add("active");
          info1TabBtn.classList.remove("active");
          info2TabBtn.classList.remove("active");
          info3TabBtn.classList.remove("active");
          gisTabContent.classList.add("active");
          info1TabContent.classList.remove("active");
          info2TabContent.classList.remove("active");
          info3TabContent.classList.remove("active");
        });

        return container;
      },
    };

    const popupTemplateDataLoggers = {
      title: "DATA LOGGER <br> Serial Number: {serial_number}",
      outFields: ["*"],
      actions: [
        {
          id: "streetview",
          icon: "360-view",
          title: "Street View",
        },
        {
          id: "sharelocation",
          // image: "./sharelocation.png",
          icon: "pin-tear",
          title: "Share Location",
        },
      ],
      content: function (feature) {
        const attributes = feature.graphic.attributes;

        // Create the main container
        const container = document.createElement("div");
        container.classList.add("custom-popup");

        // Create tab buttons
        const tabs = document.createElement("div");
        tabs.classList.add("tab-buttons");

        const info1TabBtn = document.createElement("button");
        info1TabBtn.innerText = "Info 1";
        info1TabBtn.classList.add("active");

        const info2TabBtn = document.createElement("button");
        info2TabBtn.innerText = "Logged Data";

        const gisTabBtn = document.createElement("button");
        gisTabBtn.innerText = "GIS";

        // Create tab content containers
        const info1TabContent = document.createElement("div");
        info1TabContent.classList.add("tab-content", "active");
        info1TabContent.innerHTML = `
          <p><strong>Data Logger:</strong> ${attributes.serial_number}</p>
          <p><strong>Logger Type:</strong> ${attributes.make} ${
          attributes.model
        }</p>
          <p><strong>Group Code:</strong> ${attributes.groupcode}</p>
          <p><strong>Group Name:</strong> ${attributes.groupname}</p>
          <p><strong>Site Code:</strong> ${attributes.sitecode}</p>
          <p><strong>Site Name:</strong> ${attributes.sitename}</p>
          <p><strong>Last Received Date/Time:</strong> ${formatDate(
            attributes.last_loggedtime
          )}</p>
        `;

        const loggedDataTabContent = document.createElement("div");
        loggedDataTabContent.classList.add("tab-content");
        loggedDataTabContent.innerHTML = `
          <!-- Future chart will be added here -->
        `;

        const gisTabContent = document.createElement("div");
        gisTabContent.classList.add("tab-content");
        gisTabContent.innerHTML = `
          <p><strong>Layer Name:</strong> Data Loggers</p>
          <p><strong>ItemID:</strong> ${attributes.loggerID}</p>
          <p><strong>ObjectID:</strong> ${attributes.OBJECTID}</p>
          <p><strong>Longitude (Dec Deg.):</strong> ${attributes.X}</p>
          <p><strong>Latitude (Dec Deg.):</strong> ${attributes.Y}</p>
        `;

        // Append elements
        tabs.appendChild(info1TabBtn);
        tabs.appendChild(info2TabBtn);
        tabs.appendChild(gisTabBtn);
        container.appendChild(tabs);
        container.appendChild(info1TabContent);
        container.appendChild(loggedDataTabContent);
        container.appendChild(gisTabContent);

        // Add event listeners for tab switching
        info1TabBtn.addEventListener("click", () => {
          info1TabBtn.classList.add("active");
          info2TabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          info1TabContent.classList.add("active");
          loggedDataTabContent.classList.remove("active");
          gisTabContent.classList.remove("active");
        });

        info2TabBtn.addEventListener("click", () => {
          info2TabBtn.classList.add("active");
          info1TabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          loggedDataTabContent.classList.add("active");
          info1TabContent.classList.remove("active");
          gisTabContent.classList.remove("active");
        });

        gisTabBtn.addEventListener("click", () => {
          gisTabBtn.classList.add("active");
          info1TabBtn.classList.remove("active");
          info2TabBtn.classList.remove("active");
          gisTabContent.classList.add("active");
          info1TabContent.classList.remove("active");
          loggedDataTabContent.classList.remove("active");
        });

        return container;
      },
    };

    const popupTemplateSivMeters = {
      title: "SYSTEM INPUT VOLUME METER POINT <br> Site: {site}",
      outFields: ["*"],
      actions: [
        {
          id: "streetview",
          icon: "360-view",
          title: "Street View",
        },
        {
          id: "sharelocation",
          // image: "./sharelocation.png",
          icon: "pin-tear",
          title: "Share Location",
        },
      ],
      content: function (feature) {
        const attributes = feature.graphic.attributes;

        // Create the main container
        const container = document.createElement("div");
        container.classList.add("custom-popup");

        // Create tab buttons
        const tabs = document.createElement("div");
        tabs.classList.add("tab-buttons");

        const loggedDataTabBtn = document.createElement("button");
        loggedDataTabBtn.innerText = "Logged Data";
        loggedDataTabBtn.classList.add("active");

        const monthlyAverageTabBtn = document.createElement("button");
        monthlyAverageTabBtn.innerText = "Monthly Average";

        const info1TabBtn = document.createElement("button");
        info1TabBtn.innerText = "Info 1";

        const info2TabBtn = document.createElement("button");
        info2TabBtn.innerText = "Info 2";

        const gisTabBtn = document.createElement("button");
        gisTabBtn.innerText = "GIS";

        // Create tab content containers
        const loggedDataTabContent = document.createElement("div");
        loggedDataTabContent.classList.add("tab-content", "active");
        loggedDataTabContent.innerHTML = `
          <!-- Future chart will be added here -->
        `;

        const monthlyAverageTabContent = document.createElement("div");
        monthlyAverageTabContent.classList.add("tab-content");
        monthlyAverageTabContent.innerHTML = `
          <!-- Future chart will be added here -->
        `;

        const info1TabContent = document.createElement("div");
        info1TabContent.classList.add("tab-content");
        info1TabContent.innerHTML = `
          <p><strong>Meter Nom. Diam.:</strong> ${attributes.meter_dn}</p>
          <p><strong>Meter Make:</strong> ${attributes.meter_make_descr}</p>
          <p><strong>Meter Type:</strong> ${attributes.serial_number}</p>
          <p><strong>Serial Number:</strong> ${attributes.serial_number}</p>
          <p><strong>Install Date:</strong> ${attributes.inst_date}</p>
          <p><strong>Data Logger:</strong> ${attributes.serial_number}</p>
          <p><strong>Logger Type:</strong> ${attributes.make} - ${
          attributes.model
        }</p>
          <p><strong>Last Received Date/Time:</strong> ${formatDate(
            attributes.last_loggedtime
          )}</p>
        `;

        const info2TabContent = document.createElement("div");
        info2TabContent.classList.add("tab-content");
        info2TabContent.innerHTML = `
          <p><strong>Meter Point Type:</strong> ${attributes.mp_type_descr}</p>
          <p><strong>Main Pipe Nom Diam:</strong> ${attributes.main_pipe_dn}</p>
          <p><strong>Bypass:</strong> ${attributes.bypass}</p>
          <p><strong>Bypass Nom Diam:</strong> ${attributes.bypass_pipe_dn}</p>
          <p><strong>Meter Location:</strong> ${attributes.meter_locn_descr}</p>
        `;

        const gisTabContent = document.createElement("div");
        gisTabContent.classList.add("tab-content");
        gisTabContent.innerHTML = `
          <p><strong>Layer Name:</strong> Siv Meters Points</p>
          <p><strong>ItemID:</strong> ${attributes.siteID}</p>
          <p><strong>ObjectID:</strong> ${attributes.OBJECTID}</p>
          <p><strong>Longitude (Dec Deg.):</strong> ${attributes.X}</p>
          <p><strong>Latitude (Dec Deg.):</strong> ${attributes.Y}</p>
        `;

        // Append elements
        tabs.appendChild(loggedDataTabBtn);
        tabs.appendChild(monthlyAverageTabBtn);
        tabs.appendChild(info1TabBtn);
        tabs.appendChild(info2TabBtn);
        tabs.appendChild(gisTabBtn);
        container.appendChild(tabs);
        container.appendChild(loggedDataTabContent);
        container.appendChild(monthlyAverageTabContent);
        container.appendChild(info1TabContent);
        container.appendChild(info2TabContent);
        container.appendChild(gisTabContent);

        // Add event listeners for tab switching
        loggedDataTabBtn.addEventListener("click", () => {
          loggedDataTabBtn.classList.add("active");
          monthlyAverageTabBtn.classList.remove("active");
          info1TabBtn.classList.remove("active");
          info2TabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          loggedDataTabContent.classList.add("active");
          monthlyAverageTabContent.classList.remove("active");
          info1TabContent.classList.remove("active");
          info2TabContent.classList.remove("active");
          gisTabContent.classList.remove("active");
        });

        monthlyAverageTabBtn.addEventListener("click", () => {
          monthlyAverageTabBtn.classList.add("active");
          loggedDataTabBtn.classList.remove("active");
          info1TabBtn.classList.remove("active");
          info2TabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          monthlyAverageTabContent.classList.add("active");
          loggedDataTabContent.classList.remove("active");
          info1TabContent.classList.remove("active");
          info2TabContent.classList.remove("active");
          gisTabContent.classList.remove("active");
        });

        info1TabBtn.addEventListener("click", () => {
          info1TabBtn.classList.add("active");
          loggedDataTabBtn.classList.remove("active");
          monthlyAverageTabBtn.classList.remove("active");
          info2TabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          info1TabContent.classList.add("active");
          loggedDataTabContent.classList.remove("active");
          monthlyAverageTabContent.classList.remove("active");
          info2TabContent.classList.remove("active");
          gisTabContent.classList.remove("active");
        });

        info2TabBtn.addEventListener("click", () => {
          info2TabBtn.classList.add("active");
          loggedDataTabBtn.classList.remove("active");
          monthlyAverageTabBtn.classList.remove("active");
          info1TabBtn.classList.remove("active");
          gisTabBtn.classList.remove("active");
          info2TabContent.classList.add("active");
          loggedDataTabContent.classList.remove("active");
          monthlyAverageTabContent.classList.remove("active");
          info1TabContent.classList.remove("active");
          gisTabContent.classList.remove("active");
        });

        gisTabBtn.addEventListener("click", () => {
          gisTabBtn.classList.add("active");
          loggedDataTabBtn.classList.remove("active");
          monthlyAverageTabBtn.classList.remove("active");
          info1TabBtn.classList.remove("active");
          info2TabBtn.classList.remove("active");
          gisTabContent.classList.add("active");
          loggedDataTabContent.classList.remove("active");
          monthlyAverageTabContent.classList.remove("active");
          info1TabContent.classList.remove("active");
          info2TabContent.classList.remove("active");
        });

        return container;
      },
    };

    const popupTemplateValvesTransmissionMain = {
      title: "Valves Locations <br> Site: {markerTitle}",
      outFields: ["*"],
      actions: [
        {
          id: "streetview",
          icon: "360-view",
          title: "Street View",
        },
        {
          id: "sharelocation",
          // image: "./sharelocation.png",
          icon: "pin-tear",
          title: "Share Location",
        },
      ],
      content: function (feature) {
        const attributes = feature.graphic.attributes;

        // Create the main container
        const container = document.createElement("div");
        container.classList.add("custom-popup");

        // Create tab buttons
        const tabs = document.createElement("div");
        tabs.classList.add("tab-buttons");

        const infoTabBtn = document.createElement("button");
        infoTabBtn.innerText = "Info";
        infoTabBtn.classList.add("active");

        const gisTabBtn = document.createElement("button");
        gisTabBtn.innerText = "GIS";

        // Create tab content containers
        const infoTabContent = document.createElement("div");
        infoTabContent.classList.add("tab-content", "active");
        infoTabContent.innerHTML = `
          <p><strong>Valve ID:</strong> ${attributes.valveID}</p>
          <p><strong>Valve Status:</strong> ${attributes.valve_status_descr}</p>
          <p><strong>Valve Type:</strong> ${attributes.valve_type_descr}</p>
          <p><strong>Valve Size:</strong> ${attributes.valve_dn_descr}</p>
        `;

        const gisTabContent = document.createElement("div");
        gisTabContent.classList.add("tab-content");
        gisTabContent.innerHTML = `
          <p><strong>Layer Name:</strong> Valves Points</p>
          <p><strong>Longitude (Dec Deg.):</strong> ${attributes.X}</p>
          <p><strong>Latitude (Dec Deg.):</strong> ${attributes.Y}</p>
        `;

        // Append elements
        tabs.appendChild(infoTabBtn);
        tabs.appendChild(gisTabBtn);
        container.appendChild(tabs);
        container.appendChild(infoTabContent);
        container.appendChild(gisTabContent);

        // Add event listeners for tab switching
        infoTabBtn.addEventListener("click", () => {
          infoTabBtn.classList.add("active");
          gisTabBtn.classList.remove("active");
          infoTabContent.classList.add("active");
          gisTabContent.classList.remove("active");
        });

        gisTabBtn.addEventListener("click", () => {
          gisTabBtn.classList.add("active");
          infoTabBtn.classList.remove("active");
          gisTabContent.classList.add("active");
          infoTabContent.classList.remove("active");
        });

        return container;
      },
    };

    // // Define a popup template for Customer Locations Layers
    // const popupTemplateCustomerLocations = {
    //   title: "CUSTOMER LOCATION <br> Premise Number: {premisenum}",
    //   outFields: ["*"],
    //   content: [
    //     {
    //       type: "fields",
    //       fieldInfos: [
    //         {
    //           fieldName: "premisenum",
    //           label: "Premise Number"
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
    //         {
    //           fieldName: "expression/BillingDistrict",
    //           label: "Billing District"
    //         },
    //         {
    //           fieldName: "expression/OperationalDistrict",
    //           label: "Operational District"
    //         },
    //         {
    //           fieldName: "expression/DMA",
    //           label: "DMA"
    //         },
    //         {
    //           fieldName: "accnum",
    //           label: "Account Number"
    //         },
    //         {
    //           fieldName: "supdat",
    //           label: "Start Date"
    //         },
    //         {
    //           fieldName: "closeaccdat",
    //           label: "End Date"
    //         },
    //         {
    //           fieldName: "expression/CustomerStatus",
    //           label: "Customer Status"
    //         },
    //         {
    //           fieldName: "congrp_descr",
    //           label: "Customer Group"
    //         },
    //         {
    //           fieldName: "contyp_descr",
    //           label: "Customer Type"
    //         },
    //         {
    //           fieldName: "expression/MasterRound",
    //           label: "Meter Round"
    //         },
    //         {
    //           fieldName: "mtrnum",
    //           label: "Meter Number"
    //         },
    //         {
    //           fieldName: "mtrmake_descr",
    //           label: "Meter Make"
    //         },
    //         {
    //           fieldName: "expression/MeterSize",
    //           label: "Meter Size"
    //         },
    //         {
    //           fieldName: "expression/MeterType",
    //           label: "Meter Type"
    //         },
    //         {
    //           fieldName: "expression/MeterStatus",
    //           label: "Meter Status"
    //         },
    //         {
    //           fieldName: "expression/MasterMeterStatus",
    //           label: "Master Meter Status"
    //         },
    //         {
    //           fieldName: "expression/staticField",
    //           label: "Layer Name"
    //         },
    //         {
    //           fieldName: "siteID",
    //           label: "ItemID"
    //         },
    //         {
    //           fieldName: "gID",
    //           label: "ObjectID"
    //         },
    //         {
    //           fieldName: "X",
    //           label: "Longitude (Dec Deg.)"
    //         },
    //         {
    //           fieldName: "Y",
    //           label: "Latitude (Dec Deg.)"
    //         },
    //         // Add more fields as needed
    //       ]
    //     }
    //   ],
    //   expressionInfos: [
    //     {
    //       name: "BillingDistrict",
    //       title: "Billing District",
    //       expression: "Text($feature.regioncode, '00') + ' ' + $feature.regionname"
    //     },
    //     {
    //       name: "OperationalDistrict",
    //       title: "Operational District",
    //       expression: "Text($feature.regioncode, '00') + ' ' + $feature.regionname"
    //     },
    //     {
    //       name: "DMA",
    //       title: "DMA",
    //       expression: "Text($feature.sitecode, '00') + ' ' + $feature.sitename"
    //     },
    //     {
    //       name: "CustomerStatus",
    //       title: "Customer Status",
    //       expression: "Text($feature.consta, '00') + ' ' + $feature.consta_descr"
    //     },
    //     {
    //       name: "MeterSize",
    //       title: "Meter Size",
    //       expression: "Text($feature.mtrsiz, '00') + ' ' + $feature.mtrsiz_descr"
    //     },
    //     {
    //       name: "MeterType",
    //       title: "Meter Type",
    //       expression: "Text($feature.mtrtyp, '00') + ' ' + $feature.mtrtyp_descr"
    //     },
    //     {
    //       name: "MeterStatus",
    //       title: "Meter Status",
    //       expression: "Text($feature.mtrstat, '00') + ' ' + $feature.mtrstat_descr"
    //     },
    //     {
    //       name: "MasterMeterStatus",
    //       title: "Master Meter Status",
    //       expression: "Text($feature.masmtrstat, '00') + ' ' + $feature.masmtrstat_descr"
    //     },
    //     {
    //       name: "staticField",
    //       title: "Layer Name",
    //       expression: "'Customer Locations'"
    //     },
    //     {
    //       name: "MasterRound",
    //       title: "Master Round",
    //       expression: "$feature.zonnum + '-' + Text($feature.blknum, '00') + '-' + $feature.rounum"
    //     },
    //   ]
    // };
    const labelClassCustomerLocations = {
      // autocasts as new LabelClass()
      symbol: {
        type: "text", // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        yoffset: -6,
        font: {
          // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 7,
        },
      },
      labelPlacement: "above-center",
      labelExpressionInfo: {
        expression: "$feature.mtrnum",
        // expression: "$feature.sitename + TextFormatting.NewLine + $feature.Division"
      },
      maxScale: 0,
      minScale: 18055.9548215,
      // where: "Conference = 'AFC'"
    };

    // // Define a popup template for DMZ Critical Points Layers
    // const popupTemplateDMZCriticalPoints = {
    //   title: "DMZ CRITICAL POINT <br> Site: {site}",
    //   outFields: ["*"],
    //   content: [
    //     {
    //       type: "fields",
    //       fieldInfos: [
    //         {
    //           fieldName: "serial_number",
    //           label: "Data Logger"
    //         },
    //         {
    //           fieldName: "expression/LoggerType",
    //           label: "Logger Type"
    //         },
    //         {
    //           fieldName: "last_loggedtime",
    //           label: "Last Recieved date/Time"
    //         },
    //         {
    //           fieldName: "expression/staticField",
    //           label: "Layer Name"
    //         },
    //         {
    //           fieldName: "siteID",
    //           label: "ItemID"
    //         },
    //         {
    //           fieldName: "gID",
    //           label: "ObjectID"
    //         },
    //         {
    //           fieldName: "X",
    //           label: "Longitude (Dec Deg.)"
    //         },
    //         {
    //           fieldName: "Y",
    //           label: "Latitude (Dec Deg.)"
    //         },
    //         // Add more fields as needed
    //       ]
    //     }
    //   ],
    //   expressionInfos: [
    //     {
    //       name: "staticField",
    //       title: "Layer Name",
    //       expression: "'DMZ Critical Points'"
    //     },
    //     {
    //       name: "LoggerType",
    //       title: "Logger Type",
    //       expression: "$feature.make + ' ' + $feature.model"
    //     },
    //   ]
    // };
    const labelClassDMZCriticalPoints = {
      // autocasts as new LabelClass()
      symbol: {
        type: "text", // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        yoffset: -6,
        font: {
          // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 7,
        },
      },
      labelPlacement: "above-center",
      labelExpressionInfo: {
        expression: "$feature.sitename",
        // expression: "$feature.sitename + TextFormatting.NewLine + $feature.Division"
      },
      maxScale: 0,
      minScale: 18055.9548215,
      // where: "Conference = 'AFC'"
    };

    // // Define a popup template for KTM Layers
    // const popupTemplateKTM = {
    //   title: "TRUNK MAIN METER POINT <br> Site: {site}",
    //   outFields: ["*"],
    //   content: [
    //     {
    //       type: "fields",
    //       fieldInfos: [
    //         {
    //           fieldName: "meter_make_descr",
    //           label: "Meter Make"
    //         },
    //         {
    //           fieldName: "meter_type_descr",
    //           label: "Meter Type"
    //         },
    //         {
    //           fieldName: "serial_number",
    //           label: "Serial Number"
    //         },
    //         {
    //           fieldName: "inst_date",
    //           label: "Install Date"
    //         },
    //         {
    //           fieldName: "serial_number",
    //           label: "Data Logger"
    //         },
    //         {
    //           fieldName: "expression/LoggerType",
    //           label: "Logger Type"
    //         },
    //         {
    //           fieldName: "last_loggedtime",
    //           label: "Last Received Date/Time"
    //         },
    //         {
    //           fieldName: "mp_type_descr",
    //           label: "Meter Point Type"
    //         },
    //         {
    //           fieldName: "main_pipe_dn",
    //           label: "Main Pipe Nom Diam"
    //         },
    //         {
    //           fieldName: "bypass",
    //           label: "Bypass"
    //         },
    //         {
    //           fieldName: "bypass_pipe_dn",
    //           label: "Bypass Nom Diam"
    //         },
    //         {
    //           fieldName: "meter_locn_descr",
    //           label: "Meter Location"
    //         },
    //         {
    //           fieldName: "expression/staticField",
    //           label: "Layer Name"
    //         },
    //         {
    //           fieldName: "siteID",
    //           label: "ItemID"
    //         },
    //         {
    //           fieldName: "gID",
    //           label: "ObjectID"
    //         },
    //         {
    //           fieldName: "X",
    //           label: "Longitude (Dec Deg.)"
    //         },
    //         {
    //           fieldName: "Y",
    //           label: "Latitude (Dec Deg.)"
    //         },
    //         // Add more fields as needed
    //       ]
    //     }
    //   ],
    //   expressionInfos: [
    //     {
    //       name: "LoggerType",
    //       title: "Logger Type",
    //       expression: "$feature.make + ' ' + $feature.model"
    //     },
    //     {
    //       name: "staticField",
    //       title: "Layer Name",
    //       expression: "'Trunk Main Meter Points'"
    //     },
    //   ]
    // };
    const labelClassKTM = {
      // autocasts as new LabelClass()
      symbol: {
        type: "text", // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        yoffset: -6,
        font: {
          // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 7,
        },
      },
      labelPlacement: "above-center",
      labelExpressionInfo: {
        expression: "$feature.sitename",
        // expression: "$feature.sitename + TextFormatting.NewLine + $feature.Division"
      },
      maxScale: 0,
      minScale: 40111.909643,
      // where: "Conference = 'AFC'"
    };

    // // Define a popup template for Reservoirs Layers
    // const popupTemplateReservoirs = {
    //   title: "SERVICE RESERVOIR <br> Site: {site}",
    //   outFields: ["*"],
    //   content: [
    //     {
    //       type: "fields",
    //       fieldInfos: [
    //         {
    //           fieldName: "capacity",
    //           label: "Capacity (m3)"
    //         },
    //         {
    //           fieldName: "twl",
    //           label: "Top Water Level (m)"
    //         },
    //         {
    //           fieldName: "bwl",
    //           label: "Bottom Water Level (m)"
    //         },
    //         {
    //           fieldName: "serial_number",
    //           label: "Data Logger"
    //         },
    //         {
    //           fieldName: "expression/LoggerType",
    //           label: "Logger Type"
    //         },
    //         {
    //           fieldName: "last_loggedtime",
    //           label: "Last Received Date/Time"
    //         },
    //         {
    //           fieldName: "expression/staticField",
    //           label: "Layer Name"
    //         },
    //         {
    //           fieldName: "siteID",
    //           label: "ItemID"
    //         },
    //         {
    //           fieldName: "gID",
    //           label: "ObjectID"
    //         },
    //         {
    //           fieldName: "X",
    //           label: "Longitude (Dec Deg.)"
    //         },
    //         {
    //           fieldName: "Y",
    //           label: "Latitude (Dec Deg.)"
    //         },
    //         // Add more fields as needed
    //       ]
    //     }
    //   ],
    //   expressionInfos: [
    //     {
    //       name: "LoggerType",
    //       title: "Logger Type",
    //       expression: "$feature.make + ' ' + $feature.model + ' ' + $feature.sub_model"
    //     },
    //     {
    //       name: "staticField",
    //       title: "Layer Name",
    //       expression: "'Reservoirs'"
    //     },
    //   ]
    // };
    const labelClassReservoirs = {
      // autocasts as new LabelClass()
      symbol: {
        type: "text", // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        yoffset: -6,
        font: {
          // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 7,
        },
      },
      labelPlacement: "above-center",
      labelExpressionInfo: {
        expression: "$feature.site",
        // expression: "$feature.sitename + TextFormatting.NewLine + $feature.Division"
      },
      maxScale: 0,
      minScale: 40111.909643,
      // where: "Conference = 'AFC'"
    };

    // // Define a popup template for WTP Layers
    // const popupTemplateWTP = {
    //   title: "WATER TREATMENT PLANT <br> Site: {site}",
    //   outFields: ["*"],
    //   content: [
    //     {
    //       type: "fields",
    //       fieldInfos: [
    //         {
    //           fieldName: "expression/staticField",
    //           label: "Layer Name"
    //         },
    //         {
    //           fieldName: "siteID",
    //           label: "ItemID"
    //         },
    //         {
    //           fieldName: "gID",
    //           label: "ObjectID"
    //         },
    //         {
    //           fieldName: "X",
    //           label: "Longitude (Dec Deg.)"
    //         },
    //         {
    //           fieldName: "Y",
    //           label: "Latitude (Dec Deg.)"
    //         },
    //         // Add more fields as needed
    //       ]
    //     }
    //   ],
    //   expressionInfos: [
    //     {
    //       name: "staticField",
    //       title: "Layer Name",
    //       expression: "'Water Treatment Plant'"
    //     },
    //   ]
    // };
    const labelClassWTP = {
      // autocasts as new LabelClass()
      symbol: {
        type: "text", // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        yoffset: -6,
        font: {
          // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 7,
        },
      },
      labelPlacement: "above-center",
      labelExpressionInfo: {
        expression: "$feature.sitename",
        // expression: "$feature.sitename + TextFormatting.NewLine + $feature.Division"
      },
      maxScale: 0,
      minScale: 40111.909643,
      // where: "Conference = 'AFC'"
    };

    // // Define a popup template for DMZBoundaries Layers
    // const popupTemplateDMZBoundaries = {
    //   title: "DMZ BOUNDARY <br> Site: {site}",
    //   outFields: ["*"],
    //   content: [
    //     {
    //       type: "fields",
    //       fieldInfos: [
    //         {
    //           fieldName: "siteID",
    //           label: "DMZ ID"
    //         },
    //         {
    //           fieldName: "sitecode",
    //           label: "DMZ Code"
    //         },
    //         {
    //           fieldName: "sitename",
    //           label: "DMZ Name"
    //         },
    //         {
    //           fieldName: "status_descr",
    //           label: "NRW Status"
    //         },
    //         {
    //           fieldName: "category_name",
    //           label: "Opretional Status"
    //         },
    //         {
    //           fieldName: "mLength",
    //           label: "Main Length (m)"
    //         },
    //         {
    //           fieldName: "premises",
    //           label: "Premises"
    //         },
    //         {
    //           fieldName: "accounts",
    //           label: "Accounts"
    //         },
    //         {
    //           fieldName: "meters",
    //           label: "Meters"
    //         },
    //         {
    //           fieldName: "expression/staticField",
    //           label: "Layer Name"
    //         },
    //         {
    //           fieldName: "siteID",
    //           label: "ItemID"
    //         },
    //         {
    //           fieldName: "gID",
    //           label: "ObjectID"
    //         },
    //         // Add more fields as needed
    //       ]
    //     }
    //   ],
    //   expressionInfos: [
    //     {
    //       name: "staticField",
    //       title: "Layer Name",
    //       expression: "'DMZ Boundaries'"
    //     },
    //   ]
    // };

    // // Define a popup template for DMZ Meter Points Layers
    // const popupTemplateDMZMeterPoints = {
    //   title: "DMZ METER POINT <br> Site: {site}",
    //   outFields: ["*"],
    //   content: [
    //     {
    //       type: "fields",
    //       fieldInfos: [
    //         {
    //           fieldName: "meter_make_descr",
    //           label: "Meter Make"
    //         },
    //         {
    //           fieldName: "meter_type_descr",
    //           label: "Meter Type"
    //         },
    //         {
    //           fieldName: "serial_number",
    //           label: "Serial Number"
    //         },
    //         {
    //           fieldName: "inst_date",
    //           label: "Install Date"
    //         },
    //         {
    //           fieldName: "serial_number",
    //           label: "Data Logger"
    //         },
    //         {
    //           fieldName: "expression/LoggerType",
    //           label: "Logger Type"
    //         },
    //         {
    //           fieldName: "last_loggedtime",
    //           label: "Last Received Date/Time"
    //         },
    //         {
    //           fieldName: "mp_type_descr",
    //           label: "Meter Point Type"
    //         },
    //         {
    //           fieldName: "main_pipe_dn",
    //           label: "Main Pipe Nom Diam"
    //         },
    //         {
    //           fieldName: "bypass",
    //           label: "Bypass"
    //         },
    //         {
    //           fieldName: "bypass_pipe_dn",
    //           label: "Bypass Nom Diam"
    //         },
    //         {
    //           fieldName: "meter_locn_descr",
    //           label: "Meter Location"
    //         },
    //         {
    //           fieldName: "strainer",
    //           label: "Strainer"
    //         },
    //         {
    //           fieldName: "strain_dn_descr",
    //           label: "Strainer Nom Diam"
    //         },
    //         {
    //           fieldName: "expression/staticField",
    //           label: "Layer Name"
    //         },
    //         {
    //           fieldName: "siteID",
    //           label: "ItemID"
    //         },
    //         {
    //           fieldName: "gID",
    //           label: "ObjectID"
    //         },
    //         {
    //           fieldName: "X",
    //           label: "Longitude (Dec Deg.)"
    //         },
    //         {
    //           fieldName: "Y",
    //           label: "Latitude (Dec Deg.)"
    //         },
    //         // Add more fields as needed
    //       ]
    //     }
    //   ],
    //   expressionInfos: [
    //     {
    //       name: "LoggerType",
    //       title: "Logger Type",
    //       expression: "$feature.make + ' ' + $feature.model"
    //     },
    //     {
    //       name: "staticField",
    //       title: "Layer Name",
    //       expression: "'DMZ Meter Points'"
    //     },
    //   ]
    // };
    const labelClassDMZMeterPoints = {
      // autocasts as new LabelClass()
      symbol: {
        type: "text", // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        yoffset: -6,
        font: {
          // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 7,
        },
      },
      labelPlacement: "above-center",
      labelExpressionInfo: {
        expression: "$feature.sitename",
        // expression: "$feature.sitename + TextFormatting.NewLine + $feature.Division"
      },
      maxScale: 0,
      minScale: 18055.9548215,
      // where: "Conference = 'AFC'"
    };

    // // Define a popup template for Transmission Main Meter Points Layers
    // const popupTemplateTransmissionMainMeterPoints = {
    //   title: "TRANSMISSION MAIN METER POINT <br> Site: {site}",
    //   outFields: ["*"],
    //   content: [
    //     {
    //       type: "fields",
    //       fieldInfos: [
    //         {
    //           fieldName: "meter_make_descr",
    //           label: "Meter Make"
    //         },
    //         {
    //           fieldName: "meter_type_descr",
    //           label: "Meter Type"
    //         },
    //         {
    //           fieldName: "serial_number",
    //           label: "Serial Number"
    //         },
    //         {
    //           fieldName: "inst_date",
    //           label: "Install Date"
    //         },
    //         {
    //           fieldName: "serial_number",
    //           label: "Data Logger"
    //         },
    //         {
    //           fieldName: "expression/LoggerType",
    //           label: "Logger Type"
    //         },
    //         {
    //           fieldName: "last_loggedtime",
    //           label: "Last Received Date/Time"
    //         },
    //         {
    //           fieldName: "mp_type_descr",
    //           label: "Meter Point Type"
    //         },
    //         {
    //           fieldName: "main_pipe_dn",
    //           label: "Main Pipe Nom Diam"
    //         },
    //         {
    //           fieldName: "bypass",
    //           label: "Bypass"
    //         },
    //         {
    //           fieldName: "bypass_pipe_dn",
    //           label: "Bypass Nom Diam"
    //         },
    //         {
    //           fieldName: "meter_locn_descr",
    //           label: "Meter Location"
    //         },
    //         {
    //           fieldName: "expression/staticField",
    //           label: "Layer Name"
    //         },
    //         {
    //           fieldName: "siteID",
    //           label: "ItemID"
    //         },
    //         {
    //           fieldName: "gID",
    //           label: "ObjectID"
    //         },
    //         {
    //           fieldName: "X",
    //           label: "Longitude (Dec Deg.)"
    //         },
    //         {
    //           fieldName: "Y",
    //           label: "Latitude (Dec Deg.)"
    //         },
    //         // Add more fields as needed
    //       ]
    //     }
    //   ],
    //   expressionInfos: [
    //     {
    //       name: "LoggerType",
    //       title: "Logger Type",
    //       expression: "$feature.make + ' ' + $feature.model"
    //     },
    //     {
    //       name: "staticField",
    //       title: "Layer Name",
    //       expression: "'Transmission Main Meter Points'"
    //     },
    //   ]
    // };
    const labelClassTransmissionMainMeterPoints = {
      // autocasts as new LabelClass()
      symbol: {
        type: "text", // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        yoffset: -6,
        font: {
          // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 7,
        },
      },
      labelPlacement: "above-center",
      labelExpressionInfo: {
        expression: "$feature.sitename",
        // expression: "$feature.sitename + TextFormatting.NewLine + $feature.Division"
      },
      maxScale: 0,
      minScale: 40111.909643,
      // where: "Conference = 'AFC'"
    };

    // // Define a popup template for Water Mains Layers
    // const popupTemplateWaterMains = {
    //   title: "WATER MAINS <br> Site: {site}",
    //   outFields: ["*"],
    //   content: [
    //     {
    //       type: "fields",
    //       fieldInfos: [
    //         {
    //           fieldName: "pipe_type_descr",
    //           label: "Pipe Type"
    //         },
    //         {
    //           fieldName: "pipe_dn_descr",
    //           label: "Pipe Value"
    //         },
    //         {
    //           fieldName: "mLength",
    //           label: "Length"
    //         },
    //         {
    //           fieldName: "pipe_mat_descr",
    //           label: "Pipe Mat"
    //         },
    //         {
    //           fieldName: "expression/staticField",
    //           label: "Layer Name"
    //         },
    //         {
    //           fieldName: "siteID",
    //           label: "ItemID"
    //         },
    //         {
    //           fieldName: "gID",
    //           label: "ObjectID"
    //         },
    //         // Add more fields as needed
    //       ]
    //     }
    //   ],
    //   expressionInfos: [
    //     {
    //       name: "staticField",
    //       title: "Layer Name",
    //       expression: "'Water Mains'"
    //     },
    //   ]
    // };
    const labelClassWaterMains = {
      // autocasts as new LabelClass()
      symbol: {
        type: "text", // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        font: {
          // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 7,
        },
      },
      labelPlacement: "center-along",
      labelExpressionInfo: {
        expression: "$feature.pipe_dn + ' ' + $feature.pipe_mat",
        // expression: "$feature.sitename + TextFormatting.NewLine + $feature.Division"
      },
      maxScale: 0,
      minScale: 18055.9548215,
      // where: "Conference = 'AFC'"
    };

    // // Define a popup template for Work Orders Layers
    // const popupTemplateWorkOrders = {
    //   title: "Work Order (New System) <br> Work Order Number: {workorder_dbID}",
    //   outFields: ["*"],
    //   content: [
    //     {
    //       type: "fields",
    //       fieldInfos: [
    //         {
    //           fieldName: "careline_num",
    //           label: "Careline Number"
    //         },
    //         {
    //           fieldName: "reportedby_descr",
    //           label: "Reported By"
    //         },
    //         {
    //           fieldName: "status_descr",
    //           label: "Work Order Status"
    //         },
    //         {
    //           fieldName: "Reinstatement Type",
    //           label: "Reinstatement Status"
    //         },
    //         {
    //           fieldName: "program_descr",
    //           label: "Program"
    //         },
    //         {
    //           fieldName: "contract_descr",
    //           label: "Contract"
    //         },
    //         {
    //           fieldName: "contractor_descr",
    //           label: "Contractor"
    //         },
    //         {
    //           fieldName: "status_descr",
    //           label: "Work Order Status"
    //         },
    //         {
    //           fieldName: "reported_date",
    //           label: "Date Reported"
    //         },
    //         {
    //           fieldName: "created_date",
    //           label: "Date Created"
    //         },
    //         {
    //           fieldName: "allocated_date",
    //           label: "Date Allocated"
    //         },
    //         {
    //           fieldName: "received_date",
    //           label: "Date Recieved"
    //         },
    //         {
    //           fieldName: "completed_date",
    //           label: "Date Completed"
    //         },
    //         {
    //           fieldName: "Confirmed Date",
    //           label: "Date Confirmed"
    //         },
    //         {
    //           fieldName: "approved_date",
    //           label: "Date Reinstatement Approved"
    //         },
    //         {
    //           fieldName: "cancelled_date",
    //           label: "Date Cancelled"
    //         },
    //         {
    //           fieldName: "status_descr",
    //           label: "Work Order Status"
    //         },
    //         {
    //           fieldName: "failuretype_descr",
    //           label: "Failur Type"
    //         },
    //         {
    //           fieldName: "repairtype_descr",
    //           label: "Repair Type"
    //         },
    //         {
    //           fieldName: "pipesize_descr",
    //           label: "Pipe Diameter (mm)"
    //         },
    //         {
    //           fieldName: "pipemat_descr",
    //           label: "Pipe Material"
    //         },
    //         {
    //           fieldName: "exctype_descr",
    //           label: "Excavation Type"
    //         },
    //         {
    //           fieldName: "reinstype_descr",
    //           label: "Reinstatement Type"
    //         },
    //         {
    //           fieldName: "expression/staticField",
    //           label: "Layer Name"
    //         },
    //         {
    //           fieldName: "regionID",
    //           label: "ItemID"
    //         },
    //         {
    //           fieldName: "OBJECTID",
    //           label: "ObjectID"
    //         },
    //         {
    //           fieldName: "X",
    //           label: "Longitude (Dec Deg.)"
    //         },
    //         {
    //           fieldName: "Y",
    //           label: "Latitude (Dec Deg.)"
    //         },
    //         // Add more fields as needed
    //       ]
    //     }
    //   ],
    //   expressionInfos: [
    //     {
    //       name: "staticField",
    //       title: "Layer Name",
    //       expression: "'Work Orders (New System)'"
    //     },
    //   ]
    // };
    const labelClassWorkOrders = {
      // autocasts as new LabelClass()
      symbol: {
        type: "text", // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        yoffset: -6,
        font: {
          // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 7,
        },
      },
      labelPlacement: "center-center",
      labelExpressionInfo: {
        expression: "Text($feature.workorder_dbID, '00')",
        // expression: "$feature.sitename + TextFormatting.NewLine + $feature.Division"
      },
      maxScale: 0,
      minScale: 18055.9548215,
      // where: "Conference = 'AFC'"
    };

    const labelClassDataLoggers = {
      // autocasts as new LabelClass()
      symbol: {
        type: "text", // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        haloSize: 2,
        yoffset: -6,
        font: {
          // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 7,
        },
      },
      labelPlacement: "above-center",
      labelExpressionInfo: {
        expression: "$feature.model + ' ' + $feature.serial_number",
        // expression: "$feature.sitename + TextFormatting.NewLine + $feature.Division"
      },
      maxScale: 0,
      minScale: 18055.9548215,
      // where: "Conference = 'AFC'"
    };

    const labelClassSivMeters = {
      // autocasts as new LabelClass()
      symbol: {
        type: "text", // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        haloSize: 2,
        yoffset: -6,
        font: {
          // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 7,
        },
      },
      labelPlacement: "above-center",
      labelExpressionInfo: {
        expression: "$feature.sitename",
        // expression: "$feature.sitename + TextFormatting.NewLine + $feature.Division"
      },
      maxScale: 0,
      minScale: 40111.909643,
      // where: "Conference = 'AFC'"
    };

    const labelClassValvesTransmissionMain = {
      // autocasts as new LabelClass()
      symbol: {
        type: "text", // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        haloSize: 2,
        yoffset: -6,
        font: {
          // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 7,
        },
      },
      labelPlacement: "above-center",
      labelExpressionInfo: {
        expression: "$feature.valve_dn_descr",

        // expression: `
        //   var valveSize = $feature.valve_dn_descr;
        //   return Text(Round(valveSize, 0), "#,##0") + "%";
        // `

        // expression: "$feature.sitename + TextFormatting.NewLine + $feature.Division"
      },
      maxScale: 0,
      minScale: 18055.9548215,
      // where: "Conference = 'AFC'"
    };

    const layersDMZMeterPoints = [
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_MeterPoints_KotaBelud/FeatureServer/0",
        title: "Kota Belud",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_MeterPoints_KotaKinabalu/FeatureServer/280",
        title: "Kota Kinabalu",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_MeterPoints_KotaMarudu/FeatureServer/317",
        title: "Kota Marudu",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_MeterPoints_Kudat/FeatureServer/340",
        title: "Kudat",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_MeterPoints_Papar/FeatureServer/388",
        title: "Papar",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_MeterPoints_Ranau/FeatureServer/425",
        title: "Ranau",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_MeterPoints_Sandakan/FeatureServer/489",
        title: "Sandakan",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_MeterPoints_Semporna/FeatureServer/526",
        title: "Semporna",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_MeterPoints_Tambunan/FeatureServer/550",
        title: "Tambunan",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_MeterPoints_Tamparuli/FeatureServer/561",
        title: "Tamparuli",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_MeterPoints_Tawau/FeatureServer/628",
        title: "Tawau",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_MeterPoints_Tuaran/FeatureServer/665",
        title: "Tuaran",
      },
      // { url: "", title: "" },
    ];
    const layersCustomerLocations = [
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Kota_Marudu/FeatureServer/297",
        title: "Kota Marudu",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Tambunan/FeatureServer/544",
        title: "Tambunan",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Ranau/FeatureServer/437",
        title: "Ranau",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Tamparuli/FeatureServer/556",
        title: "Tamparuli",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Papar/FeatureServer/372",
        title: "Papar",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Tuaran/FeatureServer/585",
        title: "Tuaran",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/KotaBelud/FeatureServer/309",
        title: "Kota Belud",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Kudat/FeatureServer/356",
        title: "Kudat",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Sandakan/FeatureServer/460",
        title: "Sandakan",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/customers_locationsLargeOne_Layer01/FeatureServer/0",
        title: "Kota Kinabalu",
      },
    ];
    const layersDMZCriticalPoints = [
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZCriticalPoint_KotaKinabalu/FeatureServer/132",
        title: "Kota Kinabalu",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZCriticalPoint_Semporna/FeatureServer/308",
        title: "Semporna",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZCriticalPoint_Tambunan/FeatureServer/355",
        title: "Tambunan",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZCriticalPoint_Sandakan/FeatureServer/236",
        title: "Sandakan",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZCriticalPoint_Kudat/FeatureServer/198",
        title: "Kudat",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZCriticalPoint_KotaBelud/FeatureServer/0",
        title: "Kota Belud",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZCriticalPoint_Papar/FeatureServer/213",
        title: "Papar",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZCriticalPoint_Ranau/FeatureServer/216",
        title: "Ranau",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZCriticalPoint_KotaMarudu/FeatureServer/179",
        title: "Kota Marudu",
      },
      // { url: "", title: "" },
    ];
    const layersKTM = [
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/KTM_KotaKinabalu/FeatureServer/0",
        title: "Kota Kinabalu",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/KTM_Tambunan/FeatureServer/69",
        title: "Tambunan",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/KTM_Kudat/FeatureServer/59",
        title: "Kudat",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/KTM_Papar/FeatureServer/60",
        title: "Papar",
      },
      // { url: "", title: "" },
    ];
    const layersWTP = [
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WTP_KotaKinabalu/FeatureServer/5",
        title: "Kota Kinabalu",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WTP_Semporna/FeatureServer/28",
        title: "Semporna",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WTP_Tambunan/FeatureServer/31",
        title: "Tambunan",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WTP_Sandakan/FeatureServer/24",
        title: "Sandakan",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WTP_Kudat/FeatureServer/13",
        title: "Kudat",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WTP_KotaBelud/FeatureServer/0",
        title: "Kota Belud",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WTP_Tuaran/FeatureServer/38",
        title: "Tuaran",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WTP_Papar/FeatureServer/16",
        title: "Papar",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WTP_Tamparuli/FeatureServer/33",
        title: "Tamparuli",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WTP_Ranau/FeatureServer/20",
        title: "Ranau",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WTP_KotaMarudu/FeatureServer/9",
        title: "Kota Marudu",
      },
      // { url: "", title: "" },
    ];
    const layersReservoirs = [
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Reservoirs_KotaKinabalu/FeatureServer/32",
        title: "Kota Kinabalu",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Reservoirs_Semporna/FeatureServer/128",
        title: "Semporna",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Reservoirs_Tambunan/FeatureServer/143",
        title: "Tambunan",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Reservoirs_Sandakan/FeatureServer/113",
        title: "Sandakan",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Reservoirs_Kudat/FeatureServer/66",
        title: "Kudat",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Reservoirs_KotaBelud/FeatureServer/0",
        title: "Kota Belud",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Reservoirs_Tuaran/FeatureServer/152",
        title: "Tuaran",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Reservoirs_Papar/FeatureServer/81",
        title: "Papar",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Reservoirs_Tamparuli/FeatureServer/149",
        title: "Tamparuli",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Reservoirs_Ranau/FeatureServer/98",
        title: "Ranau",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Reservoirs_KotaMarudu/FeatureServer/49",
        title: "Kota Marudu",
      },
      // { url: "", title: "" },
    ];
    const layersDMZBoundaries = [
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_Boundaries_Ranau/FeatureServer/436",
        title: "Ranau",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_Boundaries_Tambunan/FeatureServer/567",
        title: "Tambunan",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_Boundaries_Papar/FeatureServer/388",
        title: "Papar",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_Boundaries_Tamparuli/FeatureServer/578",
        title: "Tamparuli",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_Boundaries_KotaBelud/FeatureServer/0",
        title: "Kota Belud",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_Boundaries_KotaMarudu/FeatureServer/341",
        title: "Kota Marudu",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_Boundaries_Kudat/FeatureServer/365",
        title: "Kudat",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_Boundaries_Sandakan/FeatureServer/494",
        title: "Sandakan",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_Boundaries_Semporna/FeatureServer/542",
        title: "Semporna",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_Boundaries_Tawau/FeatureServer/631",
        title: "Tawau",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_Boundaries_KotaKinabalu/FeatureServer/0",
        title: "Kota Kinabalu",
      },
      // { url: "", title: "" },
    ];
    const layersTransmissionMainMeterPoints = [
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Transmission_Main_Meter_Points_Kudat/FeatureServer/20",
        title: "Kudat",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Transmission_Main_Meter_Points_Papar/FeatureServer/21",
        title: "Papar",
      },
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Transmission_Main_Meter_Points_KotaKinabalu/FeatureServer/0",
        title: "Kota Kinabalu",
      },
      // { url: "", title: "" },
    ];
    const layersWaterMains = [
      {
        title: "Kota Kinabalu",
        subGroups: [
          {
            title: "Primary Transmission Main",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Kota_Kinabalu_PrimaryTransmissionMain/FeatureServer/0",
          },
          {
            title: "Secondary Trunk Main",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Kota_Kinabalu_SecondaryTrunkMain/FeatureServer/23",
          },
          {
            title: "Tertiary Distribution Main",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Kota_Kinabalu_TertiaryDistributionMain/FeatureServer/40",
          },
          {
            title: "Raw Water Main",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Kota_Kinabalu_RawWaterMain/FeatureServer/18",
          },
        ],
      },
      {
        title: "Kota Belud",
        subGroups: [
          {
            title: "Primary Transmission Main",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_KotaBelud_PrimaryTransmissionMain/FeatureServer/49",
          },
          {
            title: "Secondary Trunk Main",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_KotaBelud_SecondaryTrunkMain/FeatureServer/57",
          },
          {
            title: "Tertiary Distribution Main",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_KotaBelud_TertiaryDistributionMain/FeatureServer/65",
          },
        ],
      },
      {
        title: "Kota Marudu",
        subGroups: [
          {
            title: "Primary Transmission Main",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_KotaMarudu_PrimaryTransmissionMain/FeatureServer/72",
          },
          {
            title: "Secondary Trunk Main",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_KotaMarudu_SecondaryTrunkMain/FeatureServer/77",
          },
          {
            title: "Tertiary Distribution Main",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_KotaMarudu_TertiaryDistributionMain/FeatureServer/79",
          },
        ],
      },
      {
        title: "Kudat",
        subGroups: [
          {
            title: "Primary Transmission Main",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Kudat_PrimaryTransmissionMain/FeatureServer/86",
          },
          {
            title: "Secondary Trunk Main",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Kudat_SecondaryTrunkMain/FeatureServer/94",
          },
          {
            title: "Tertiary Distribution Main",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Kudat_TertiaryDistributionMain/FeatureServer/108",
          },
        ],
      },
      {
        title: "Papar",
        subGroups: [
          {
            title: "Primary Transmission Main",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Papar_PrimaryTransmissionMain/FeatureServer/117",
          },
          {
            title: "Secondary Trunk Main",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Papar_SecondaryTrunkMain/FeatureServer/122",
          },
          {
            title: "Tertiary Distribution Main",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Papar_TertiaryDistributionMain/FeatureServer/129",
          },
        ],
      },
      {
        title: "Ranau",
        subGroups: [
          {
            title: "Primary Transmission Main",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Ranau_PrimaryTransmissionMain/FeatureServer/135",
          },
          {
            title: "Secondary Trunk Main",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Ranau_SecondaryTrunkMain/FeatureServer/141",
          },
          {
            title: "Tertiary Distribution Main",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Ranau_TertiaryDistributionMain/FeatureServer/147",
          },
        ],
      },
      {
        title: "Sandakan",
        subGroups: [
          {
            title: "Primary Transmission Main",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Sandakan_PrimaryTransmissionMain/FeatureServer/153",
          },
          {
            title: "Secondary Trunk Main",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Sandakan_SecondaryTrunkMain/FeatureServer/176",
          },
          {
            title: "Tertiary Distribution Main",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Sandakan_TertiaryDistributionMain/FeatureServer/189",
          },
          {
            title: "Private Main",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Sandakan_PrivateMain/FeatureServer/166",
          },
        ],
      },
      {
        title: "Tambunan",
        subGroups: [
          {
            title: "Tertiary Distribution Main",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Tambunan_TertiaryDistributionMain/FeatureServer/201",
          },
        ],
      },
      {
        title: "Tuaran",
        subGroups: [
          {
            title: "Primary Transmission Main",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Tuaran_PrimaryTransmissionMain/FeatureServer/210",
          },
          {
            title: "Secondary Trunk Main",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Tuaran_SecondaryTrunkMain/FeatureServer/214",
          },
          {
            title: "Tertiary Distribution Main",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Tuaran_TertiaryDistributionMain/FeatureServer/221",
          },
        ],
      },
    ];
    const layersWaorkOrders = [
      {
        title: "Beaufort",
        subGroups: [
          {
            title: "Unallocated",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Beaufort_Unallocated/FeatureServer/0",
          },
          {
            title: "Leak Repair Contractor",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Beaufort_LeakRepairContractor/FeatureServer/109",
          },
        ],
      },
      {
        title: "Beluran",
        subGroups: [
          {
            title: "Leak Repair Contractor",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Beluran_LeakRepairContractor/FeatureServer/116",
          },
        ],
      },
      {
        title: "Kinabatangan",
        subGroups: [
          {
            title: "Leak Repair Contractor",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_Kinabatangan/FeatureServer/10",
          },
        ],
      },
      {
        title: "Tenom",
        subGroups: [
          {
            title: "Leak Repair Contractor",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_Tenom/FeatureServer/102",
          },
        ],
      },
      {
        title: "Keningau",
        subGroups: [
          {
            title: "Unallocated",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Unallocated_Keningau/FeatureServer/12",
          },
          {
            title: "Leak Repair Contractor",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_Keningau/FeatureServer/0",
          },
        ],
      },
      {
        title: "Kota Belud",
        subGroups: [
          {
            title: "Unallocated",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Unallocated_KotaBelud/FeatureServer/16",
          },
          {
            title: "Leak Repair Contractor",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_KotaBelud/FeatureServer/12",
          },
        ],
      },
      {
        title: "Kuala Penyu",
        subGroups: [
          {
            title: "Unallocated",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Unallocated_KualaPenyu/FeatureServer/20",
          },
          {
            title: "Leak Repair Contractor",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_KualaPenyu/FeatureServer/19",
          },
        ],
      },
      {
        title: "Kunak",
        subGroups: [
          {
            title: "Unallocated",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Unallocated_Kunak/FeatureServer/22",
          },
          {
            title: "Leak Repair Contractor",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_Kunak/FeatureServer/26",
          },
        ],
      },
      {
        title: "Lahad Datu",
        subGroups: [
          {
            title: "Unallocated",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Unallocated_LahadDatu/FeatureServer/26",
          },
          {
            title: "Leak Repair Contractor",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_LahadDatu/FeatureServer/42",
          },
        ],
      },
      {
        title: "Membakut",
        subGroups: [
          {
            title: "Unallocated",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Unallocated_Membakut/FeatureServer/29",
          },
          {
            title: "Leak Repair Contractor",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_Membakut/FeatureServer/44",
          },
        ],
      },
      {
        title: "Merotai",
        subGroups: [
          {
            title: "Unallocated",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Unallocated_Merotai/FeatureServer/32",
          },
          {
            title: "Leak Repair Contractor",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_Merotai/FeatureServer/48",
          },
        ],
      },
      {
        title: "Nabawan",
        subGroups: [
          {
            title: "Unallocated",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Unallocated_Nabawan/FeatureServer/37",
          },
          {
            title: "Leak Repair Contractor",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_Nabawan/FeatureServer/55",
          },
        ],
      },
      {
        title: "PulauSebatik",
        subGroups: [
          {
            title: "Unallocated",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Unallocated_PulauSebatik/FeatureServer/39",
          },
          {
            title: "Leak Repair Contractor",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_PulauSebatik/FeatureServer/59",
          },
        ],
      },
      {
        title: "Sook",
        subGroups: [
          {
            title: "Unallocated",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Unallocated_Sook/FeatureServer/47",
          },
          {
            title: "Leak Repair Contractor",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_Sook/FeatureServer/82",
          },
        ],
      },
      {
        title: "Tambunan",
        subGroups: [
          {
            title: "Unallocated",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Unallocated_Tambunan/FeatureServer/50",
          },
          {
            title: "Leak Repair Contractor",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_Tambunan/FeatureServer/86",
          },
        ],
      },
      {
        title: "Tawau",
        subGroups: [
          {
            title: "Unallocated",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Unallocated_Tawau/FeatureServer/54",
          },
          {
            title: "Leak Repair Contractor",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_Tawau/FeatureServer/95",
          },
        ],
      },
      {
        title: "Semporna",
        subGroups: [
          {
            title: "Leak Repair Contractor",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_Semporna/FeatureServer/75",
          },
        ],
      },
      {
        title: "Sandakan",
        subGroups: [
          {
            title: "Unallocated",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Unallocated_Sandakan/FeatureServer/42",
          },
          {
            title: "Leak Repair Contractor",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_Sandakan/FeatureServer/67",
          },
        ],
      },
      {
        title: "Kota Kinabalu",
        subGroups: [
          {
            title: "Unallocated",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/KotaKinabalu_Unallocated/FeatureServer/7",
          },
          {
            title: "JANS Internal",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/KotaKinabalu_JANSInternalWork/FeatureServer/0",
          },
          {
            title: "Leak Repair Contractor",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/KotaKinabalu_LeakRepairContractor/FeatureServer/123",
          },
        ],
      },
    ];
    const layersDataLoggers = [
      {
        title: "Kota Kinabalu",
        subGroups: [
          {
            title: "Ovarro XiLog 4G",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_KotaKinabalu_OvarroXiLog4G/FeatureServer/430",
          },
          {
            title: "Primayer XiLog",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_KotaKinabalu_PrimayerXiLog/FeatureServer/447",
          },
          {
            title: "Primayer XiLog+",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_KotaKinabalu_PrimayerXiLog1/FeatureServer/567",
          },
        ],
      },
      {
        title: "Kota Belud",
        subGroups: [
          {
            title: "i2OWater ALGA1161",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_KotaBelud_i2OWaterALGA1161/FeatureServer/0",
          },
          {
            title: "Ovarro XiLog 4G",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_KotaBelud_OvarroXiLog4G/FeatureServer/83",
          },
        ],
      },
      {
        title: "Kota Marudu",
        subGroups: [
          {
            title: "i2OWater ALGA1130",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_KotaMarudu_i2OWaterALGA1130/FeatureServer/584",
          },
          {
            title: "i2OWater ALGA3230",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_KotaMarudu_i2OWaterALGA3230/FeatureServer/598",
          },
          {
            title: "Primayer XiLog+",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_KotaMarudu_PrimayerXiLog1/FeatureServer/612",
          },
          {
            title: "Technolog Cello",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_KotaMarudu_TechnologCello/FeatureServer/625",
          },
        ],
      },
      {
        title: "Kudat",
        subGroups: [
          {
            title: "i2OWater ALGA1161",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Kudat_i2OWaterALGA1161/FeatureServer/640",
          },
          {
            title: "Ovarro XiLog 4G",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Kudat_OvarroXiLog4G/FeatureServer/684",
          },
          {
            title: "Primayer XiLog+",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Kudat_PrimayerXiLog1/FeatureServer/701",
          },
        ],
      },
      {
        title: "Papar",
        subGroups: [
          {
            title: "Ovarro XiLog 4G",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Papar_OvarroXiLog4G/FeatureServer/721",
          },
          {
            title: "Primayer XiLog+",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Papar_PrimayerXiLog1/FeatureServer/782",
          },
        ],
      },
      {
        title: "Ranau",
        subGroups: [
          {
            title: "Ovarro XiLog 4G",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Ranau_OvarroXiLog4G/FeatureServer/808",
          },
          {
            title: "Primayer XiLog+",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Ranau_PrimayerXiLog1/FeatureServer/842",
          },
        ],
      },
      {
        title: "Sandakan",
        subGroups: [
          {
            title: "Ovarro XiLog 4G",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Sandakan_OvarroXiLog4G/FeatureServer/876",
          },
          {
            title: "Primayer XiLog+",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Sandakan_PrimayerXiLog1/FeatureServer/972",
          },
        ],
      },
      {
        title: "Tambunan",
        subGroups: [
          {
            title: "Primayer XiLog+",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Tambunan_PrimayerXiLog1/FeatureServer/1032",
          },
        ],
      },
      {
        title: "Tuaran",
        subGroups: [
          {
            title: "Ovarro XiLog 4G",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Tuaran_OvarroXiLog4G/FeatureServer/1086",
          },
          {
            title: "Primayer XiLog+",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Tuaran_PrimayerXiLog1/FeatureServer/1101",
          },
        ],
      },
      {
        title: "Tamparuli",
        subGroups: [
          {
            title: "Ovarro XiLog 4G",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Tamparuli_OvarroXiLog4G/FeatureServer/1055",
          },
          {
            title: "Primayer XiLog+",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Tamparuli_PrimayerXiLog1/FeatureServer/1070",
          },
        ],
      },
      {
        title: "Semporna",
        subGroups: [
          {
            title: "i2OWater ALGA1160",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Semporna_i2OWaterALGA1160/FeatureServer/989",
          },
          {
            title: "Ovarro XiLog 4G",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Semporna_OvarroXiLog4G/FeatureServer/1008",
          },
        ],
      },
    ];
    const layersSivMeters = [
      {
        url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/SivMeters/FeatureServer/0",
        title: "Kota Kinabalu",
      },
    ];
    const layersValvesTransmissionMain = [
      {
        title: "Kota Kinabalu",
        subGroups: [
          {
            title: "Primary Transmission Main",
            url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Valves_transmission_main_updated/FeatureServer/0",
          },
        ],
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
          width: 1,
        },
      },
    };

    const WTPRenderer = {
      type: "simple",
      symbol: {
        type: "picture-marker",
        url: "./wtp.png",
        width: "25px",
        height: "25px",
        // style: "circle",
        // color: [2, 144, 227, 0.5],
        // size: 9,
        // outline: {
        //   color: "#ffffff",
        //   width: 1
        // }
      },
    };
    const TMMRenderer = {
      type: "simple",
      symbol: {
        type: "picture-marker",
        url: "./tmm.png",
        width: "25px",
        height: "25px",
      },
    };
    const TKMRenderer = {
      type: "simple",
      symbol: {
        type: "picture-marker",
        url: "./tkm.png",
        width: "25px",
        height: "25px",
      },
    };
    const DMZRenderer = {
      type: "simple",
      symbol: {
        type: "picture-marker",
        url: "./dmz.png",
        width: "25px",
        height: "25px",
      },
    };
    const CriticalPointsRenderer = {
      type: "simple",
      symbol: {
        type: "picture-marker",
        url: "./criticalpoints.png",
        width: "25px",
        height: "25px",
      },
    };
    const CustomerLocationsRenderer = {
      type: "simple",
      symbol: {
        type: "picture-marker",
        url: "./customerlocation.png",
        width: "15px",
        height: "15px",
      },
    };
    const ReservoirRenderer = {
      type: "simple",
      symbol: {
        type: "picture-marker",
        url: "./reservoir.png",
        width: "25px",
        height: "25px",
      },
    };
    const WorkOrdersRenderer = {
      type: "simple",
      symbol: {
        type: "picture-marker",
        url: "./workorders.png",
        width: "25px",
        height: "25px",
      },
    };
    const DataLoggersRenderer = {
      type: "simple",
      symbol: {
        type: "picture-marker",
        url: "./dataloggers.png",
        width: "25px",
        height: "25px",
      },
    };
    const DataLoggersRendererWithColor = {
      type: "simple",
      symbol: {
        type: "picture-marker",
        url: "./dataloggersWithColor.png",
        width: "25px",
        height: "25px",
      },
    };
    const SivMetersRenderer = {
      type: "simple",
      symbol: {
        type: "picture-marker",
        url: "./siv.png",
        width: "25px",
        height: "25px",
      },
    };
    const ValvesTransmissionMainRenderer = {
      type: "simple",
      symbol: {
        type: "picture-marker",
        url: "./valves.png",
        width: "25px",
        height: "25px",
      },
    };

    // // Consumer Meters || Customer Locations Layers
    // Create SubtypeGroupLayers for CustomerLocations
    const subtypeGroupLayersCustomerLocations = layersCustomerLocations.map(
      (layerInfo) => {
        const layer = new SubtypeGroupLayer({
          url: layerInfo.url,
          visible: false, // Hide all sublayers initially
          title: layerInfo.title,
          outFields: ["*"], // Ensure all fields are available for the popup
          // popupTemplate: popupTemplateCustomerLocations
        });

        // Apply the renderer to each sublayer
        layer.when(() => {
          layer.sublayers.forEach((sublayer) => {
            sublayer.visible = false;
            sublayer.renderer = CustomerLocationsRenderer;
            sublayer.labelingInfo = [labelClassCustomerLocations];
            sublayer.labelsVisible = false;
            sublayer.popupTemplate = popupTemplateCustomerLocations;
          });
        });

        return layer;
      }
    );
    const Customer_Locations = new GroupLayer({
      title: "Customer Locations",
      layers: subtypeGroupLayersCustomerLocations,
      visible: false, // Hide all sublayers initially
    });

    // DMZ Critical Points Layers
    // Create SubtypeGroupLayers for DMZ Critical Points
    const subtypeGroupLayersDMZCriticalPoints = layersDMZCriticalPoints.map(
      (layerInfo) => {
        const layer = new SubtypeGroupLayer({
          url: layerInfo.url,
          visible: false, // Hide all sublayers initially
          title: layerInfo.title,
          outFields: ["*"], // Ensure all fields are available for the popup
          // popupTemplate: popupTemplateCustomerLocations
        });

        // Apply the renderer to each sublayer
        layer.when(() => {
          layer.sublayers.forEach((sublayer) => {
            sublayer.visible = false;
            sublayer.renderer = CriticalPointsRenderer;
            sublayer.labelingInfo = [labelClassDMZCriticalPoints];
            sublayer.labelsVisible = false;
            sublayer.popupTemplate = popupTemplateDMZCriticalPoints;
          });
        });
        return layer;
      }
    );
    const DMZCriticalPoints = new GroupLayer({
      title: "DMZ Critical Points",
      layers: subtypeGroupLayersDMZCriticalPoints,
      visible: false, // Hide all sublayers initially
    });

    // KTM Layers
    // Create SubtypeGroupLayers for KTM
    const subtypeGroupLayersKTM = layersKTM.map((layerInfo) => {
      const layer = new SubtypeGroupLayer({
        url: layerInfo.url,
        visible: false, // Hide all sublayers initially
        title: layerInfo.title,
        outFields: ["*"], // Ensure all fields are available for the popup
        // popupTemplate: popupTemplateCustomerLocations
      });

      // Apply the renderer to each sublayer
      layer.when(() => {
        layer.sublayers.forEach((sublayer) => {
          sublayer.visible = false;
          sublayer.renderer = TKMRenderer;
          sublayer.labelingInfo = [labelClassKTM];
          sublayer.labelsVisible = false;
          sublayer.popupTemplate = popupTemplateKTM;
        });
      });
      return layer;
    });
    const KTM = new GroupLayer({
      title: "Trunk Main Meter Points",
      layers: subtypeGroupLayersKTM,
      visible: false, // Hide all sublayers initially
    });

    // Reservoirs Layers
    // Create SubtypeGroupLayers for Reservoirs
    const subtypeGroupLayersReservoirs = layersReservoirs.map((layerInfo) => {
      const layer = new SubtypeGroupLayer({
        url: layerInfo.url,
        visible: false, // Hide all sublayers initially
        title: layerInfo.title,
        outFields: ["*"], // Ensure all fields are available for the popup
        // popupTemplate: popupTemplateCustomerLocations
      });

      // Apply the renderer to each sublayer
      layer.when(() => {
        layer.sublayers.forEach((sublayer) => {
          sublayer.visible = false;
          sublayer.renderer = ReservoirRenderer;
          sublayer.labelingInfo = [labelClassReservoirs];
          sublayer.labelsVisible = false;
          sublayer.popupTemplate = popupTemplateReservoirs;
        });
      });
      return layer;
    });
    const Reservoirs = new GroupLayer({
      title: "Reservoirs",
      layers: subtypeGroupLayersReservoirs,
      visible: false, // Hide all sublayers initially
    });

    // WTP Layers
    // Create SubtypeGroupLayers for WTP
    const subtypeGroupLayersWTP = layersWTP.map((layerInfo) => {
      const layer = new SubtypeGroupLayer({
        url: layerInfo.url,
        visible: false, // Hide all sublayers initially
        title: layerInfo.title,
        outFields: ["*"], // Ensure all fields are available for the popup
        // popupTemplate: popupTemplateCustomerLocations
      });

      // Apply the renderer to each sublayer
      layer.when(() => {
        layer.sublayers.forEach((sublayer) => {
          sublayer.visible = false;
          sublayer.renderer = WTPRenderer;
          sublayer.labelingInfo = [labelClassWTP];
          sublayer.labelsVisible = false;
          sublayer.popupTemplate = popupTemplateWTP;
        });
      });
      return layer;
    });
    const WTP = new GroupLayer({
      title: "Water Treatment Plant",
      layers: subtypeGroupLayersWTP,
      visible: false, // Hide all sublayers initially
    });

    // DMZBoundaries Layers
    // Create SubtypeGroupLayers for DMZBoundaries
    const subtypeGroupLayersDMZBoundaries = layersDMZBoundaries.map(
      (layerInfo) => {
        const layer = new SubtypeGroupLayer({
          url: layerInfo.url,
          visible: false, // Hide all sublayers initially
          title: layerInfo.title,
          outFields: ["*"], // Ensure all fields are available for the popup
          // popupTemplate: popupTemplateCustomerLocations
        });

        // Apply the renderer to each sublayer
        layer.when(() => {
          layer.sublayers.forEach((sublayer) => {
            sublayer.visible = false;
            sublayer.renderer.symbol.color.a = 0.3;
            sublayer.renderer.symbol.outline.width = 1;
            sublayer.labelingInfo = [labelClassDMZBoundariesNamesOnly];
            sublayer.labelsVisible = false;
            sublayer.popupTemplate = popupTemplateDMZBoundaries;
          });
        });
        return layer;
      }
    );
    const DMZBoundaries = new GroupLayer({
      title: "DMZ Boundaries",
      layers: subtypeGroupLayersDMZBoundaries,
      visible: false, // Hide all sublayers initially
    });

    // DMZMeterPoints Layers
    // Create SubtypeGroupLayers for DMZMeterPoints
    const subtypeGroupLayersDMZMeterPoints = layersDMZMeterPoints.map(
      (layerInfo) => {
        const layer = new SubtypeGroupLayer({
          url: layerInfo.url,
          visible: false, // Hide all sublayers initially
          title: layerInfo.title,
          outFields: ["*"], // Ensure all fields are available for the popup
          // popupTemplate: popupTemplateCustomerLocations
        });

        // Apply the renderer to each sublayer
        layer.when(() => {
          layer.sublayers.forEach((sublayer) => {
            sublayer.visible = false;
            sublayer.renderer = DMZRenderer;
            sublayer.labelingInfo = [labelClassDMZMeterPoints];
            sublayer.labelsVisible = false;
            sublayer.popupTemplate = popupTemplateDMZMeterPoints;
          });
        });
        return layer;
      }
    );
    const DMZMeterPoints = new GroupLayer({
      title: "DMZ Meter Points",
      layers: subtypeGroupLayersDMZMeterPoints,
      visible: false, // Hide all sublayers initially
    });

    // Transmission Main Meter Points Layers
    // Create SubtypeGroupLayers for Transmission Main Meter Points
    const subtypeGroupLayersTransmissionMainMeterPoints =
      layersTransmissionMainMeterPoints.map((layerInfo) => {
        const layer = new SubtypeGroupLayer({
          url: layerInfo.url,
          visible: false, // Hide all sublayers initially
          title: layerInfo.title,
          outFields: ["*"], // Ensure all fields are available for the popup
          // popupTemplate: popupTemplateCustomerLocations
        });

        // Apply the renderer to each sublayer
        layer.when(() => {
          layer.sublayers.forEach((sublayer) => {
            sublayer.visible = false;
            sublayer.renderer = TMMRenderer;
            sublayer.labelingInfo = [labelClassTransmissionMainMeterPoints];
            sublayer.labelsVisible = false;
            sublayer.popupTemplate = popupTemplateTransmissionMainMeterPoints;
          });
        });
        return layer;
      });
    const TransmissionMainMeterPoints = new GroupLayer({
      title: "Transmission Main Meter Points",
      layers: subtypeGroupLayersTransmissionMainMeterPoints,
      visible: false, // Hide all sublayers initially
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
          width: 1,
        },
      },
    };

    let primaryTransmissionRenderer = {
      type: "simple",
      symbol: {
        type: "simple-line", // autocasts as new SimpleLineSymbol()
        color: [0, 0, 255],
        width: "2px",
      },
    };
    let secondaryTrunkRenderer = {
      type: "simple",
      symbol: {
        type: "simple-line", // autocasts as new SimpleLineSymbol()
        color: [255, 140, 0],
        width: "2px",
      },
    };
    let tertiaryDistributionRenderer = {
      type: "simple",
      symbol: {
        type: "simple-line", // autocasts as new SimpleLineSymbol()
        color: [105, 105, 105],
        width: "2px",
      },
    };
    let rawWaterRenderer = {
      type: "simple",
      symbol: {
        type: "simple-line", // autocasts as new SimpleLineSymbol()
        color: [255, 215, 0],
        width: "2px",
      },
    };
    let privateMainRenderer = {
      type: "simple",
      symbol: {
        type: "simple-line", // autocasts as new SimpleLineSymbol()
        color: "black",
        width: "2px",
      },
    };

    // Define Renderers for Each Category
    const renderers = {
      "Primary Transmission Main": primaryTransmissionRenderer,
      "Secondary Trunk Main": secondaryTrunkRenderer,
      "Tertiary Distribution Main": tertiaryDistributionRenderer,
      "Raw Water Main": rawWaterRenderer,
      "Private Main": privateMainRenderer,
    };

    // Water Mains Layers
    // Create SubtypeGroupLayers for Water Mains
    // Handle Nested Structure (WaterMain → Regions → SubtypeGroupLayers)
    // Define Water Mains Layers with structured hierarchy
    const subtypeGroupLayersWaterMains = layersWaterMains.map((region) => {
      const subLayers = region.subGroups.map((subGroup) => {
        const layer = new SubtypeGroupLayer({
          url: subGroup.url,
          visible: false, // Hide all sublayers initially
          title: subGroup.title,
          outFields: ["*"], // Ensure all fields are available for future use
        });
        // Placeholder for renderer setup in the future
        layer.when(() => {
          // console.log(layer, "layer");
          layer.sublayers.forEach((sublayer) => {
            sublayer.visible = false;
            if (renderers[subGroup.title]) {
              sublayer.renderer = renderers[subGroup.title];
              sublayer.labelingInfo = [labelClassWaterMains];
              sublayer.labelsVisible = false;
              sublayer.popupTemplate = popupTemplateWaterMains;
            }
          });
        });
        return layer;
      });
      return new GroupLayer({
        title: region.title,
        layers: subLayers,
        visible: false, // Hide all sublayers initially
      });
    });
    // Create the Main Water Main Group Layer
    const WaterMains = new GroupLayer({
      title: "Water Mains",
      layers: subtypeGroupLayersWaterMains,
      visible: false, // Hide initially
    });

    // // Work Orders Layers
    // // Create SubtypeGroupLayers for Work Orders
    const subtypeGroupLayersWorkOrders = layersWaorkOrders.map((region) => {
      const subLayers = region.subGroups.map((subGroup) => {
        const layer = new SubtypeGroupLayer({
          url: subGroup.url,
          visible: false, // Hide all sublayers initially
          title: subGroup.title,
          outFields: ["*"], // Ensure all fields are available for future use
        });
        // Placeholder for renderer setup in the future
        layer.when(() => {
          layer.sublayers.forEach((sublayer) => {
            sublayer.visible = false;
            sublayer.renderer = WorkOrdersRenderer;
            // sublayer.labelingInfo = [ labelClassWorkOrders ];
            sublayer.popupTemplate = popupTemplateWorkOrders;
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
        visible: false, // Hide all sublayers initially
      });
    });
    // Create the Main Water Main Group Layer
    const WorkOrders = new GroupLayer({
      title: "Maintenance Work Orders",
      layers: subtypeGroupLayersWorkOrders,
      visible: false, // Hide initially
    });

    // // Data Loggers Layers
    // // Create SubtypeGroupLayers for Data Loggers
    const subtypeGroupLayersDataLoggers = layersDataLoggers.map((region) => {
      const subLayers = region.subGroups.map((subGroup) => {
        const layer = new SubtypeGroupLayer({
          url: subGroup.url,
          visible: false, // Hide all sublayers initially
          title: subGroup.title,
          outFields: ["*"], // Ensure all fields are available for future use
        });
        // Placeholder for renderer setup in the future
        layer.when(() => {
          layer.sublayers.forEach((sublayer) => {
            sublayer.visible = false;
            sublayer.renderer = DataLoggersRenderer;
            sublayer.labelingInfo = [labelClassDataLoggers];
            sublayer.labelsVisible = false;
            sublayer.popupTemplate = popupTemplateDataLoggers;
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
        visible: false, // Hide all sublayers initially
      });
    });
    // Create the Main Water Main Group Layer
    const DataLoggers = new GroupLayer({
      title: "Data Loggers",
      layers: subtypeGroupLayersDataLoggers,
      visible: false, // Hide initially
    });

    // Siv Meters Points Layers
    // Create SubtypeGroupLayers for Siv Meters Points
    const subtypeGroupLayersSivMeters = layersSivMeters.map((layerInfo) => {
      const layer = new SubtypeGroupLayer({
        url: layerInfo.url,
        visible: false, // Hide all sublayers initially
        title: layerInfo.title,
        outFields: ["*"], // Ensure all fields are available for the popup
        // popupTemplate: popupTemplateCustomerLocations
      });

      // Apply the renderer to each sublayer
      layer.when(() => {
        layer.sublayers.forEach((sublayer) => {
          sublayer.visible = false;
          sublayer.renderer = SivMetersRenderer;
          sublayer.labelingInfo = [labelClassSivMeters];
          sublayer.labelsVisible = false;
          sublayer.popupTemplate = popupTemplateSivMeters;
        });
      });
      return layer;
    });
    const SivMetersPoints = new GroupLayer({
      title: "SIV Meters Points",
      layers: subtypeGroupLayersSivMeters,
      visible: false, // Hide all sublayers initially
    });

    // Valves Transmission Main Layer
    // Create SubtypeGroupLayers for Valves Transmission Main
    // Define Valves Transmission Main Layers with structured hierarchy
    const subtypeGroupLayersValvesTransmissionMain =
      layersValvesTransmissionMain.map((region) => {
        const subLayers = region.subGroups.map((subGroup) => {
          const layer = new SubtypeGroupLayer({
            url: subGroup.url,
            visible: false, // Hide all sublayers initially
            title: subGroup.title,
            outFields: ["*"], // Ensure all fields are available for future use
          });
          // Placeholder for renderer setup in the future
          layer.when(() => {
            // console.log(layer, "layer");
            layer.sublayers.forEach((sublayer) => {
              sublayer.visible = false;
              sublayer.renderer = ValvesTransmissionMainRenderer;
              sublayer.labelingInfo = [labelClassValvesTransmissionMain];
              sublayer.labelsVisible = false;
              sublayer.popupTemplate = popupTemplateValvesTransmissionMain;
            });
            layer.orderBy = [
              {
                field: "markerTitle",
                order: "descending",
              },
            ];
          });
          return layer;
        });
        return new GroupLayer({
          title: region.title,
          layers: subLayers,
          visible: false, // Hide all sublayers initially
        });
      });
    // Create the Main Water Main Group Layer
    const ValvesTransmissionMain = new GroupLayer({
      title: "Valves",
      layers: subtypeGroupLayersValvesTransmissionMain,
      visible: false, // Hide initially
    });

    await displayMap.add(WorkOrders);  // adds the layer to the map
    // wait for the view to catch up
    await reactiveUtils.whenOnce(() => !view.updating);
    await displayMap.add(WTP);  // adds the layer to the map
    // wait for the view to catch up
    await reactiveUtils.whenOnce(() => !view.updating);
    await displayMap.add(WaterMains); // adds the layer to the map
    // wait for the view to catch up
    await reactiveUtils.whenOnce(() => !view.updating);
    await displayMap.add(ValvesTransmissionMain);
    // wait for the view to catch up
    await reactiveUtils.whenOnce(() => !view.updating);
    await displayMap.add(KTM);
    // wait for the view to catch up
    await reactiveUtils.whenOnce(() => !view.updating);
    await displayMap.add(TransmissionMainMeterPoints);  // adds the layer to the map
    // wait for the view to catch up
    await reactiveUtils.whenOnce(() => !view.updating);
    await displayMap.add(SivMetersPoints);  // adds the layer to the map
    // wait for the view to catch up
    await reactiveUtils.whenOnce(() => !view.updating);
    await displayMap.add(Reservoirs);  // adds the layer to the map
    // wait for the view to catch up
    await reactiveUtils.whenOnce(() => !view.updating);
    await displayMap.add(DMZMeterPoints);  // adds the layer to the map
    // wait for the view to catch up
    await reactiveUtils.whenOnce(() => !view.updating);
    await displayMap.add(DMZCriticalPoints);
    // wait for the view to catch up
    await reactiveUtils.whenOnce(() => !view.updating);
    await displayMap.add(DMZBoundaries); // adds the layer to the map
    // wait for the view to catch up
    await reactiveUtils.whenOnce(() => !view.updating);
    await displayMap.add(DataLoggers);  // adds the layer to the map
    // wait for the view to catch up
    await reactiveUtils.whenOnce(() => !view.updating);
    await displayMap.add(Customer_Locations);
    // wait for the view to catch up
    await reactiveUtils.whenOnce(() => !view.updating);

    // Watch for when the popup becomes visible
    reactiveUtils.watch(
      () => view.popup.visible,
      (isVisible) => {
        if (isVisible) {
          // Wait for the popup to be fully rendered
          setTimeout(() => {
            // Access the popup's DOM
            const popupContainer = view.popup.container;
            if (popupContainer) {
              // Find the calcite-action-group within the popup
              const actionGroups = popupContainer.querySelectorAll(
                'calcite-action-group[layout="horizontal"]'
              );
              actionGroups.forEach((actionGroup) => {
                const shadowRoot = actionGroup.shadowRoot;
                if (shadowRoot) {
                  const container = shadowRoot.querySelector(".container");
                  if (container) {
                    container.style.display = "flex";
                    container.style.flexDirection = "row-reverse";
                  }
                }
              });
            }
          }, 100); // Adjust the timeout as needed to ensure the popup is fully rendered
        }
      }
    );

    view.when(() => {
      // // Watch for when features are selected
      // reactiveUtils.watch(
      //   () => view.popup.selectedFeature,
      //   (graphic) => {
      //     if (graphic) {
      //       // Set the action's visible property to true if the 'website' field value is not null, otherwise set it to false
      //       const graphicTemplate = graphic.getEffectivePopupTemplate();
      //       graphicTemplate.actions.items[0].visible = graphic.attributes.website ? true : false;
      //     }
      //   }
      // );
      // Watch for the trigger-action event on the popup
      reactiveUtils.on(
        () => view.popup,
        "trigger-action",
        (event) => {
          if (event.action.id === "sharelocation") {
            const selectedFeature = view.popup.selectedFeature.geometry;
            // console.log(selectedFeature, "selectedFeature")
            let info;
            if (selectedFeature.type === "point") {
              // Get the 'website' field attribute
              info = `https://www.google.com/maps/place/${selectedFeature.latitude},${selectedFeature.longitude}`;
            } else if (selectedFeature.type === "polyline") {
              info = `https://www.google.com/maps/place/${selectedFeature.extent.center.latitude},${selectedFeature.extent.center.longitude}`;
            } else {
              info = `https://www.google.com/maps/place/${selectedFeature.centroid.latitude},${selectedFeature.centroid.longitude}`;
            }
            // Make sure the 'website' field value is not null
            if (info) {
              // Open up a new browser using the URL value in the 'website' field
              window.open(info.trim());
            }
          }

          if (event.action.id === "streetview") {
            const selectedFeature = view.popup.selectedFeature.geometry;
            let info;
            if (selectedFeature.type === "point") {
              info = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selectedFeature.latitude},${selectedFeature.longitude}&heading=-45&pitch=0&fov=80`;
            } else if (selectedFeature.type === "polyline") {
              info = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selectedFeature.extent.center.latitude},${selectedFeature.extent.center.longitude}&heading=-45&pitch=0&fov=80`;
            } else {
              info = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selectedFeature.centroid.latitude},${selectedFeature.centroid.longitude}&heading=-45&pitch=0&fov=80`;
            }
            // Make sure the 'website' field value is not null
            if (info) {
              // Open up a new browser using the URL value in the 'website' field
              window.open(info.trim());
            }
          }
        }
      );
    });

    // // Find the calcite-action-group within the popup
    const calciteButton = document.querySelectorAll(
      "calcite-button[appearance=outline-fill][kind=neutral]"
    );

    calciteButton[0].childEl.style.backgroundColor = "white";
    calciteButton[0].childEl.style.color = "black";
    calciteButton[0].childEl.style.borderColor = "transparent";

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
      Legend,
      CIMSymbol,
      Portal,
      PortalBasemapsSource,
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
      loadModule("esri/symbols/CIMSymbol"),
      loadModule("esri/portal/Portal"),
      loadModule("esri/widgets/BasemapGallery/support/PortalBasemapsSource"),
    ]);

    var search = new Search({
      //Add Search widget
      view: view,
      includeDefaultSources: false,
      sources: [
        {
          name: "Custom Geocoding Service",
          placeholder: "Search in Sabah, Malaysia",
          apiKey:
            "AAPK756f006de03e44d28710cb446c8dedb4rkQyhmzX6upFiYPzQT0HNQNMJ5qPyO1TnPDSPXT4EAM_DlQSj20ShRD7vyKa7a1H",
          // singleLineFieldName: "SingleLine",
          withinViewEnabled: true,
          url: "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer",
          // resultSymbol: {
          //   type: "picture-marker",  // autocasts as new PictureMarkerSymbol()
          //   url: this.basePath + "/images/search/search-symbol-32.png",
          //   size: 24,
          //   width: 24,
          //   height: 24,
          //   xoffset: 0,
          //   yoffset: 0
          // },

          // filter: searchExtent
          // maxResults: 3,
          // maxSuggestions: 6,
          // suggestionsEnabled: false,
          // minSuggestCharacters: 0

          // apiKey: "YOUR_API_KEY", // Only needed if using API key auth
        },
      ],
    });
    view.ui.add(search, { position: "top-left", index: 0 }); //Add to the map

    var homeWidget = new Home({
      view: view,
    });
    view.ui.add(homeWidget, "top-left");

    const titlesData = [
      "Customer Locations",
      "Data Loggers",
      "DMZ Boundaries",
      "DMZ Critical Points",
      "DMZ Meter Points",
      "Reservoirs",
      "SIV Meters Points",
      "Transmission Main Meter Points",
      "Trunk Main Meter Points",
      "Water Mains",
      "Water Treatment Plant",
      "Maintenance Work Orders",
    ];

    const symbolCIM = new CIMSymbol({
      data: {
        type: "CIMSymbolReference",
        symbol: {
          type: "CIMPointSymbol",
          symbolLayers: [
            {
              type: "CIMVectorMarker",
              enable: true,
              anchorPointUnits: "Relative",
              dominantSizeAxis3D: "Z",
              size: 19,
              billboardMode3D: "FaceNearPlane",
              frame: {
                xmin: 0,
                ymin: 0,
                xmax: 400,
                ymax: 400,
              },
              markerGraphics: [
                {
                  type: "CIMMarkerGraphic",
                  geometry: {
                    paths: [
                      [
                        [204.1, 349.5],
                        [203.1, 348.9],
                        [201.7, 348],
                        [201.2, 347.2],
                        [201.2, 343.8],
                        [201.6, 342.8],
                        [203, 340.6],
                        [204.4, 339.3],
                        [211.1, 339.2],
                        [218.2, 338.6],
                        [218.8, 338.2],
                        [222.4, 338.2],
                        [223.8, 337.6],
                        [225.4, 337.2],
                        [226.4, 336.8],
                        [227.2, 336.4],
                        [228.1, 335.9],
                        [228.9, 335.3],
                        [229.4, 335.1],
                        [233.9, 333.1],
                        [234.6, 332.8],
                        [235.2, 332.4],
                        [235.9, 332],
                        [237.2, 331.2],
                        [238.2, 330.4],
                        [239.9, 329.2],
                        [241.8, 328],
                        [242.6, 326.6],
                        [243.8, 325.4],
                        [246.4, 323.3],
                        [248.9, 320.4],
                        [249.6, 319.1],
                        [250.4, 318.1],
                        [251.2, 317.1],
                        [251.9, 315.8],
                        [253.4, 312.6],
                        [253.7, 312],
                        [255.2, 309.3],
                        [255.6, 308.8],
                        [256, 308],
                        [256.4, 307],
                        [256.8, 306],
                        [257.4, 304.2],
                        [257.8, 302.5],
                        [258.2, 301.4],
                        [258.6, 299.5],
                        [258.4, 296.2],
                        [259.1, 294],
                        [259.4, 291.4],
                        [260, 289.8],
                        [260.4, 288.8],
                        [260.8, 288.2],
                        [261.6, 287.9],
                        [262.4, 287.6],
                        [266.7, 288],
                        [267.1, 288],
                        [269.1, 288],
                        [270.4, 288.8],
                        [270.6, 289.7],
                        [270.6, 295.3],
                        [270.5, 299.2],
                        [269.5, 300.9],
                        [269.1, 303.1],
                        [268.8, 304.7],
                        [268.6, 306.4],
                        [268, 307.6],
                        [267.6, 308.8],
                        [267.2, 309.8],
                        [266.8, 310.8],
                        [266.4, 311.8],
                        [266, 312.8],
                        [265.6, 313.8],
                        [265.3, 314.8],
                        [264.3, 316.4],
                        [263.2, 317.8],
                        [263.1, 318.4],
                        [262.8, 319.2],
                        [262.4, 320],
                        [262, 320.8],
                        [261.6, 321.5],
                        [260.8, 322.8],
                        [260, 323.9],
                        [259.7, 324.4],
                        [258.8, 325.4],
                        [257.8, 326.2],
                        [257.5, 326.8],
                        [247.1, 337.6],
                        [245.7, 338.8],
                        [244.2, 340],
                        [242.9, 340.8],
                        [241.2, 341.4],
                        [240.4, 341.8],
                        [239.6, 342.4],
                        [238.8, 342.8],
                        [238.2, 343.2],
                        [237.6, 343.6],
                        [236.8, 344],
                        [236, 344.4],
                        [235.2, 344.8],
                        [234.4, 345.2],
                        [233.4, 345.6],
                        [232.3, 346.2],
                        [231.1, 346.5],
                        [229.8, 346.8],
                        [227.2, 346.6],
                        [226.8, 346],
                        [227.1, 347.4],
                        [227.7, 348.4],
                        [226.6, 348.2],
                        [224.9, 347.3],
                        [224.4, 347.7],
                        [222.1, 348.6],
                        [220.3, 348.9],
                        [220.3, 349.9],
                        [214.2, 349.3],
                        [212.6, 349.6],
                        [212.2, 349.8],
                        [205.7, 349.7],
                        [204.1, 349.5],
                      ],
                      [
                        [250.6, 331.8],
                        [249.6, 331.5],
                        [249.9, 331.9],
                        [250.4, 332.7],
                        [250.9, 332.9],
                        [250.6, 331.8],
                      ],
                      [
                        [209, 327.4],
                        [207.3, 327],
                        [205.3, 326.4],
                        [204.3, 323.9],
                        [206.6, 318.7],
                        [207.7, 317.7],
                        [211, 317.4],
                        [214.9, 317.3],
                        [216.8, 316.7],
                        [217.7, 316.1],
                        [218.8, 315.8],
                        [220, 315.6],
                        [221, 315.2],
                        [222, 314.8],
                        [222.6, 314.4],
                        [225.6, 312.3],
                        [227, 310.6],
                        [228.4, 308.9],
                        [229.3, 308.5],
                        [230.8, 307.8],
                        [231.7, 306.8],
                        [232, 306.2],
                        [232.4, 305.6],
                        [232.8, 305],
                        [233.2, 304.4],
                        [233.6, 303.8],
                        [234, 303.2],
                        [234.4, 302.4],
                        [234.8, 301.4],
                        [235.1, 300.2],
                        [235.5, 299.2],
                        [236, 297.8],
                        [236.5, 296.4],
                        [236.7, 294.4],
                        [237.1, 292.4],
                        [237.6, 291.2],
                        [238, 290],
                        [238.4, 289.6],
                        [240.9, 288],
                        [243.2, 287.9],
                        [246, 289],
                        [246.6, 289.6],
                        [246.7, 298.7],
                        [246.5, 300.6],
                        [246.2, 302.2],
                        [245.6, 303.4],
                        [245.2, 304.6],
                        [245, 305.8],
                        [244.6, 306.8],
                        [244, 307.4],
                        [243.6, 308],
                        [243.2, 308.4],
                        [242, 310.5],
                        [240.8, 312.8],
                        [237.2, 316.9],
                        [233.6, 320.8],
                        [232.8, 321.2],
                        [231.3, 321.9],
                        [229.7, 323],
                        [228.8, 323.6],
                        [228.2, 324],
                        [227.4, 324.5],
                        [226, 324.9],
                        [224.8, 325.2],
                        [223.8, 325.6],
                        [222.8, 326.1],
                        [221.6, 326.3],
                        [220.1, 326.7],
                        [218.3, 327.1],
                        [215.8, 327.4],
                        [209, 327.4],
                      ],
                      [
                        [267.2, 307.7],
                        [266.3, 307],
                        [266.8, 308],
                        [267.2, 307.7],
                      ],
                      [
                        [199.6, 304.6],
                        [198.6, 304.1],
                        [197.4, 303.4],
                        [196.8, 303.1],
                        [195.1, 302],
                        [193.6, 300.6],
                        [193.5, 300],
                        [193.2, 298.6],
                        [192.7, 282.7],
                        [192.7, 267.4],
                        [186, 267.5],
                        [179.2, 267.7],
                        [179.2, 266.7],
                        [179.2, 265.8],
                        [178.5, 266.7],
                        [172.3, 267.1],
                        [172, 267.1],
                        [171.4, 267.6],
                        [171, 267.2],
                        [168.4, 266.4],
                        [166.6, 267],
                        [162.4, 267],
                        [161, 267.2],
                        [158.2, 267.6],
                        [155.2, 266.8],
                        [154.8, 266],
                        [154.5, 266.8],
                        [136.3, 267],
                        [133.6, 266.4],
                        [131.2, 266],
                        [129.8, 265.6],
                        [128.4, 265.2],
                        [127.4, 264.8],
                        [126.4, 264.4],
                        [125.6, 264],
                        [124.8, 263.4],
                        [123.9, 263.1],
                        [123.3, 262.6],
                        [122.8, 262.1],
                        [122, 262],
                        [121.4, 261.6],
                        [120.7, 261.3],
                        [118.7, 259.4],
                        [117, 257.6],
                        [116.2, 257.6],
                        [115.4, 257.6],
                        [114.6, 256.5],
                        [113.7, 255.3],
                        [111.1, 252.8],
                        [111, 252.2],
                        [110.4, 250.8],
                        [109.6, 249.4],
                        [109.3, 248.8],
                        [108.6, 246.4],
                        [107.8, 243.6],
                        [107.2, 242.2],
                        [106.8, 241],
                        [106.6, 77.6],
                        [107.4, 78.2],
                        [108, 78.5],
                        [107.6, 77.8],
                        [108.1, 74.5],
                        [108.8, 72.2],
                        [109.5, 70.5],
                        [110.3, 68.7],
                        [110.4, 68.2],
                        [111.8, 66.4],
                        [112.4, 65.5],
                        [114, 63.6],
                        [119.1, 59.7],
                        [119.9, 59.8],
                        [119.7, 59.3],
                        [119.8, 58.4],
                        [123.1, 56.3],
                        [123.8, 56],
                        [124.4, 55.7],
                        [127.1, 54.4],
                        [127.6, 53.8],
                        [129, 53.5],
                        [130.4, 53.3],
                        [132, 52.8],
                        [133.6, 52.1],
                        [136.3, 51.7],
                        [262.9, 51.8],
                        [263.7, 51.1],
                        [264, 51.1],
                        [265.4, 51.6],
                        [266.5, 52.2],
                        [268.4, 52.8],
                        [270.2, 53.2],
                        [271.4, 53.4],
                        [272.4, 53.8],
                        [273, 54.4],
                        [275.4, 55.8],
                        [276, 56.1],
                        [276.8, 56.4],
                        [277.6, 56.7],
                        [278.4, 57],
                        [279.8, 57.9],
                        [281.2, 58.8],
                        [281.7, 59.2],
                        [286.9, 64.9],
                        [287.1, 65.9],
                        [288.4, 65.8],
                        [288.8, 66.2],
                        [289, 66.7],
                        [289.3, 67.9],
                        [290.4, 69.5],
                        [291.3, 70.3],
                        [291.4, 71.3],
                        [292.6, 75.2],
                        [292.9, 76.4],
                        [293.2, 77.6],
                        [293.6, 79.2],
                        [294.1, 81],
                        [294.1, 234.6],
                        [293.6, 238.1],
                        [293.2, 241.5],
                        [292.8, 242.4],
                        [292.4, 243.9],
                        [291.3, 247.4],
                        [290.8, 248.9],
                        [290.5, 250.1],
                        [290.5, 250.5],
                        [289.3, 251.2],
                        [288.9, 252.2],
                        [288.9, 253],
                        [288.2, 253.4],
                        [287.2, 254.1],
                        [286.7, 254.7],
                        [284.2, 257.6],
                        [282.3, 258.9],
                        [278.8, 261.6],
                        [278.4, 262],
                        [277.9, 262.4],
                        [276.4, 263.2],
                        [274.7, 264],
                        [274, 264.4],
                        [273.2, 264.8],
                        [272.3, 265.4],
                        [271.2, 265.7],
                        [270.2, 266.1],
                        [267.4, 266.5],
                        [264.6, 267],
                        [237.7, 267.6],
                        [211.1, 267.6],
                        [211.1, 283],
                        [211.2, 298.5],
                        [210.3, 298.2],
                        [209.8, 298.3],
                        [210.1, 300.4],
                        [209.1, 301.6],
                        [207.8, 302.8],
                        [207.2, 303.4],
                        [206.4, 304.1],
                        [205.8, 304.8],
                        [204.6, 305],
                        [200.9, 305],
                        [199.6, 304.6],
                      ],
                      [
                        [164.7, 266.3],
                        [163.5, 266.4],
                        [163.9, 267.1],
                        [164.7, 266.3],
                      ],
                      [
                        [119.2, 257.4],
                        [118.6, 256.8],
                        [118.4, 257.4],
                        [119, 258],
                        [119.2, 257.4],
                      ],
                      [
                        [150.2, 254.7],
                        [169.9, 254.6],
                        [171, 254.4],
                        [173.3, 254.3],
                        [195.1, 254.2],
                        [199, 254.4],
                        [201.3, 254.5],
                        [206.6, 254.7],
                        [207.4, 254.8],
                        [220.5, 254.4],
                        [226.4, 254.3],
                        [234.1, 254.2],
                        [244.7, 254.1],
                        [248.1, 254.4],
                        [249.5, 254.5],
                        [253.6, 254.3],
                        [262.6, 254.1],
                        [270.4, 252.2],
                        [275.6, 248],
                        [277.4, 245.8],
                        [278.4, 244.3],
                        [279.7, 242.4],
                        [280.4, 240.8],
                        [280.8, 239.2],
                        [280.9, 79.4],
                        [280.4, 78.8],
                        [280, 77.8],
                        [279.6, 76.9],
                        [273, 68.4],
                        [271, 67.2],
                        [268.7, 66],
                        [267.8, 65.6],
                        [266.2, 65.2],
                        [264.6, 64.8],
                        [136.4, 64.8],
                        [134.9, 65.2],
                        [124.4, 71],
                        [122.9, 73.2],
                        [118.6, 86.4],
                        [118.9, 115.4],
                        [118.9, 136.4],
                        [118.9, 142.8],
                        [118.9, 155.6],
                        [118.8, 200.4],
                        [118.7, 207.6],
                        [118.8, 217.6],
                        [118.9, 231],
                        [118.9, 236.7],
                        [119.3, 238],
                        [119.6, 238.8],
                        [120.4, 241.3],
                        [121.2, 243.5],
                        [121.5, 244],
                        [122.4, 245.1],
                        [123.6, 246.8],
                        [125.7, 250.1],
                        [126.7, 250.8],
                        [130.3, 252.9],
                        [130.1, 253.4],
                        [130.9, 253.3],
                        [133, 253.4],
                        [135.7, 254],
                        [137, 254.5],
                        [137.4, 254.5],
                        [139.6, 254.3],
                        [147.7, 254.1],
                        [149.4, 254.6],
                        [149.6, 255.2],
                        [150.2, 254.7],
                      ],
                      [
                        [245.4, 207.9],
                        [240.8, 205.2],
                        [236.7, 195.9],
                        [237.1, 193],
                        [237.6, 190.2],
                        [237.6, 188],
                        [232.2, 181.9],
                        [229.2, 178.4],
                        [227.3, 176.1],
                        [223.1, 171.6],
                        [218.4, 166.5],
                        [216.1, 166.1],
                        [213.7, 165.9],
                        [212.2, 165.9],
                        [208.4, 165.1],
                        [207.2, 164.4],
                        [206.7, 163.9],
                        [204.7, 164.4],
                        [201.4, 166.2],
                        [199.6, 167.3],
                        [196, 169.7],
                        [191.1, 172.9],
                        [189, 174.2],
                        [186.8, 175.5],
                        [186, 178.4],
                        [185.6, 180.8],
                        [185.2, 181.6],
                        [184.8, 182.6],
                        [184.4, 183.5],
                        [181, 187.6],
                        [180.4, 188],
                        [179.9, 188.4],
                        [177.7, 189.2],
                        [174.7, 190],
                        [172.9, 190.4],
                        [172.2, 190.4],
                        [170.8, 190],
                        [164.8, 187.3],
                        [161.2, 182.7],
                        [160.8, 181.6],
                        [160.5, 179.8],
                        [160.1, 178],
                        [160, 176.2],
                        [160.4, 174.4],
                        [160.8, 172.6],
                        [161.2, 171.4],
                        [161.7, 170.3],
                        [160.5, 168.6],
                        [158.8, 166.7],
                        [152, 158.7],
                        [149.7, 156.4],
                        [147.3, 156.4],
                        [140, 153.4],
                        [136.5, 148.1],
                        [136.1, 147.5],
                        [135.6, 146.7],
                        [135.4, 144.4],
                        [135.5, 142.4],
                        [135.6, 140.1],
                        [136.4, 137.2],
                        [137.2, 135.8],
                        [139.8, 132.8],
                        [141.4, 131.3],
                        [142.4, 130.8],
                        [142.8, 130.4],
                        [143.8, 130],
                        [145, 129.6],
                        [152.5, 130],
                        [154.6, 130.8],
                        [158, 134],
                        [159.2, 135.6],
                        [160.4, 138.4],
                        [160.8, 139.2],
                        [161.2, 142.6],
                        [160.8, 146.2],
                        [160.4, 147],
                        [159.7, 149.2],
                        [159.6, 151.9],
                        [165.1, 157.8],
                        [171.2, 163.1],
                        [173.8, 163.2],
                        [180.7, 165.7],
                        [182.6, 165.6],
                        [183.6, 165.2],
                        [184.4, 164.8],
                        [185.8, 163.8],
                        [187.7, 162.7],
                        [191, 160.6],
                        [192, 159.9],
                        [197.9, 156.7],
                        [198.8, 155.9],
                        [199.3, 155.6],
                        [201, 153.5],
                        [201, 152.3],
                        [201.2, 150.5],
                        [202.4, 146.8],
                        [202.8, 146],
                        [207.5, 141.8],
                        [209.2, 140.8],
                        [217, 140],
                        [225.2, 145.1],
                        [225.6, 145.6],
                        [226, 146.9],
                        [226.3, 147.9],
                        [227.1, 149.1],
                        [227.2, 155.8],
                        [226.8, 157],
                        [226.4, 158.2],
                        [228.4, 161.6],
                        [231.3, 164.8],
                        [235, 168.9],
                        [236.4, 170.6],
                        [238.8, 173.2],
                        [241.2, 175.9],
                        [245, 180.1],
                        [245.4, 180.8],
                        [246, 181.5],
                        [248.4, 181.7],
                        [253.2, 181.6],
                        [254, 182],
                        [259.6, 185.5],
                        [262.8, 191.8],
                        [263.2, 193.2],
                        [262.1, 200.8],
                        [254.5, 207.6],
                        [253.4, 208],
                        [245.4, 207.9],
                      ],
                      [
                        [251.9, 198.6],
                        [253.3, 195.7],
                        [252.5, 192.3],
                        [248.2, 191.4],
                        [246, 195],
                        [247.7, 198.2],
                        [251.9, 198.6],
                      ],
                      [
                        [175.5, 179.6],
                        [175.9, 174.2],
                        [175.2, 173.4],
                        [170.3, 174.3],
                        [169.6, 177.8],
                        [170, 178.8],
                        [170.6, 179.6],
                        [171.2, 180],
                        [175.5, 179.6],
                      ],
                      [
                        [216.8, 156.1],
                        [218, 154.6],
                        [218.6, 154],
                        [219.2, 153.2],
                        [218.6, 152.1],
                        [218, 151.4],
                        [215.4, 149.4],
                        [211.8, 150.1],
                        [210.1, 153.1],
                        [211.5, 155.6],
                        [214.1, 157.1],
                        [216.8, 156.1],
                      ],
                      [
                        [150.1, 145.9],
                        [152, 141.9],
                        [151.6, 140.1],
                        [151.2, 139.8],
                        [150.8, 140.2],
                        [148.4, 139],
                        [145.1, 140.8],
                        [145.5, 145.6],
                        [150.1, 145.9],
                      ],
                      [
                        [290, 113.2],
                        [289.4, 112.8],
                        [288.8, 113.2],
                        [289.4, 113.6],
                        [290, 113.2],
                      ],
                    ],
                  },
                  symbol: {
                    type: "CIMPolygonSymbol",
                    symbolLayers: [
                      {
                        type: "CIMSolidFill",
                        enable: true,
                        color: [156, 59, 61, 255],
                      },
                    ],
                    angleAlignment: "Map",
                  },
                },
                {
                  type: "CIMMarkerGraphic",
                  geometry: {
                    paths: [
                      [
                        [209, 351],
                        [211, 351],
                        [214, 351],
                        [209, 351],
                      ],
                      [
                        [205, 350],
                        [206, 350],
                        [207, 350],
                        [206, 351],
                        [205, 350],
                      ],
                      [
                        [217, 350],
                        [218, 350],
                        [219, 350],
                        [217, 350],
                      ],
                      [
                        [201, 350],
                        [202, 349],
                        [203, 350],
                        [202, 350],
                        [201, 350],
                      ],
                      [
                        [222, 350],
                        [224, 349],
                        [225, 350],
                        [223, 350],
                        [222, 350],
                      ],
                      [
                        [228, 348],
                        [230, 348],
                        [231, 348],
                        [229, 348],
                        [228, 348],
                      ],
                      [
                        [200, 348],
                        [200, 344],
                        [200, 346],
                        [200, 348],
                      ],
                      [
                        [233, 346],
                        [234, 346],
                        [235, 346],
                        [236, 345],
                        [235, 346],
                        [233, 346],
                      ],
                      [
                        [240, 343],
                        [240, 343],
                        [241, 342],
                        [242, 342],
                        [241, 343],
                        [240, 343],
                      ],
                      [
                        [203, 338],
                        [216, 338],
                        [209, 339],
                        [203, 338],
                      ],
                      [
                        [219, 338],
                        [221, 338],
                        [219, 338],
                        [219, 338],
                      ],
                      [
                        [222, 337],
                        [223, 336],
                        [224, 337],
                        [223, 337],
                        [222, 337],
                      ],
                      [
                        [249, 337],
                        [251, 335],
                        [250, 336],
                        [249, 337],
                      ],
                      [
                        [227, 335],
                        [228, 335],
                        [228, 335],
                        [227, 336],
                        [227, 335],
                      ],
                      [
                        [235, 332],
                        [236, 331],
                        [236, 331],
                        [237, 330],
                        [236, 332],
                        [235, 332],
                      ],
                      [
                        [208, 329],
                        [212, 328],
                        [216, 329],
                        [208, 329],
                      ],
                      [
                        [239, 328],
                        [240, 328],
                        [239, 329],
                        [239, 328],
                      ],
                      [
                        [257, 329],
                        [258, 328],
                        [258, 328],
                        [260, 325],
                        [260, 326],
                        [257, 329],
                      ],
                      [
                        [205, 328],
                        [204, 327],
                        [204, 327],
                        [203, 326],
                        [203, 324],
                        [203, 321],
                        [204, 320],
                        [207, 318],
                        [206, 318],
                        [205, 319],
                        [205, 320],
                        [204, 320],
                        [204, 321],
                        [204, 323],
                        [204, 326],
                        [206, 328],
                        [207, 328],
                        [206, 328],
                        [205, 328],
                      ],
                      [
                        [218, 328],
                        [219, 328],
                        [220, 328],
                        [219, 328],
                        [218, 328],
                      ],
                      [
                        [221, 327],
                        [222, 327],
                        [224, 326],
                        [224, 326],
                        [224, 327],
                        [221, 327],
                      ],
                      [
                        [226, 326],
                        [227, 325],
                        [227, 326],
                        [227, 326],
                        [226, 326],
                      ],
                      [
                        [262, 322],
                        [263, 320],
                        [263, 322],
                        [262, 322],
                      ],
                      [
                        [234, 321],
                        [236, 320],
                        [235, 321],
                        [234, 321],
                      ],
                      [
                        [264, 319],
                        [264, 318],
                        [265, 317],
                        [265, 318],
                        [264, 319],
                      ],
                      [
                        [210, 317],
                        [211, 316],
                        [213, 317],
                        [211, 317],
                        [210, 317],
                      ],
                      [
                        [214, 316],
                        [215, 316],
                        [217, 316],
                        [215, 316],
                        [214, 316],
                      ],
                      [
                        [219, 315],
                        [221, 314],
                        [220, 315],
                        [219, 315],
                        [219, 316],
                        [219, 315],
                      ],
                      [
                        [266, 315],
                        [266, 314],
                        [267, 312],
                        [267, 312],
                        [267, 314],
                        [266, 315],
                      ],
                      [
                        [252, 314],
                        [252, 313],
                        [252, 313],
                        [252, 314],
                        [252, 314],
                      ],
                      [
                        [242, 312],
                        [242, 312],
                        [243, 311],
                        [243, 310],
                        [244, 309],
                        [245, 308],
                        [245, 309],
                        [244, 310],
                        [243, 311],
                        [242, 312],
                      ],
                      [
                        [255, 307],
                        [255, 306],
                        [256, 304],
                        [257, 301],
                        [257, 303],
                        [256, 305],
                        [256, 306],
                        [256, 307],
                        [255, 308],
                        [255, 307],
                      ],
                      [
                        [201, 306],
                        [203, 305],
                        [205, 306],
                        [201, 306],
                      ],
                      [
                        [231, 306],
                        [232, 305],
                        [232, 304],
                        [232, 305],
                        [231, 306],
                      ],
                      [
                        [269, 305],
                        [270, 305],
                        [270, 305],
                        [270, 306],
                        [269, 305],
                      ],
                      [
                        [246, 304],
                        [246, 303],
                        [247, 304],
                        [246, 305],
                        [246, 304],
                      ],
                      [
                        [194, 302],
                        [193, 301],
                        [196, 303],
                        [194, 302],
                      ],
                      [
                        [232, 303],
                        [233, 302],
                        [234, 302],
                        [234, 302],
                        [233, 303],
                        [233, 304],
                        [232, 303],
                      ],
                      [
                        [270, 302],
                        [270, 301],
                        [271, 302],
                        [270, 302],
                      ],
                      [
                        [211, 300],
                        [212, 283],
                        [212, 268],
                        [212, 300],
                        [211, 300],
                      ],
                      [
                        [248, 297],
                        [248, 295],
                        [248, 297],
                        [248, 299],
                        [248, 297],
                      ],
                      [
                        [235, 298],
                        [236, 297],
                        [235, 298],
                        [235, 298],
                      ],
                      [
                        [192, 296],
                        [192, 296],
                        [192, 296],
                        [192, 297],
                        [192, 296],
                      ],
                      [
                        [271, 295],
                        [271, 293],
                        [271, 297],
                        [271, 295],
                      ],
                      [
                        [192, 295],
                        [192, 282],
                        [192, 295],
                        [192, 295],
                      ],
                      [
                        [236, 294],
                        [236, 293],
                        [236, 294],
                        [236, 295],
                        [236, 294],
                      ],
                      [
                        [258, 293],
                        [258, 293],
                        [259, 293],
                        [258, 294],
                        [258, 293],
                      ],
                      [
                        [236, 291],
                        [237, 290],
                        [237, 290],
                        [237, 291],
                        [236, 291],
                      ],
                      [
                        [248, 290],
                        [246, 288],
                        [246, 287],
                        [247, 288],
                        [248, 291],
                        [248, 290],
                      ],
                      [
                        [259, 290],
                        [259, 289],
                        [260, 290],
                        [259, 290],
                      ],
                      [
                        [237, 289],
                        [238, 288],
                        [238, 288],
                        [237, 289],
                      ],
                      [
                        [270, 288],
                        [269, 287],
                        [268, 286],
                        [270, 287],
                        [271, 288],
                        [270, 288],
                      ],
                      [
                        [239, 287],
                        [240, 287],
                        [241, 287],
                        [240, 288],
                        [239, 287],
                      ],
                      [
                        [261, 287],
                        [265, 286],
                        [263, 287],
                        [261, 287],
                        [261, 287],
                      ],
                      [
                        [241, 287],
                        [245, 286],
                        [243, 287],
                        [241, 287],
                      ],
                      [
                        [192, 281],
                        [192, 280],
                        [192, 281],
                        [192, 282],
                        [192, 281],
                      ],
                      [
                        [192, 276],
                        [192, 274],
                        [192, 276],
                        [192, 277],
                        [192, 276],
                      ],
                      [
                        [192, 269],
                        [192, 268],
                        [192, 269],
                        [192, 270],
                        [192, 269],
                      ],
                      [
                        [131, 267],
                        [132, 267],
                        [134, 267],
                        [132, 268],
                        [131, 267],
                      ],
                      [
                        [268, 267],
                        [269, 267],
                        [270, 267],
                        [269, 268],
                        [268, 267],
                      ],
                      [
                        [128, 266],
                        [129, 266],
                        [130, 266],
                        [128, 266],
                      ],
                      [
                        [126, 266],
                        [127, 265],
                        [128, 266],
                        [127, 266],
                        [126, 266],
                      ],
                      [
                        [123, 264],
                        [120, 262],
                        [122, 263],
                        [123, 264],
                        [124, 264],
                        [125, 264],
                        [125, 265],
                        [123, 264],
                      ],
                      [
                        [276, 264],
                        [277, 264],
                        [278, 263],
                        [280, 262],
                        [281, 261],
                        [283, 260],
                        [282, 261],
                        [280, 263],
                        [278, 264],
                        [277, 264],
                        [277, 264],
                        [276, 264],
                      ],
                      [
                        [118, 261],
                        [116, 260],
                        [116, 259],
                        [118, 260],
                        [120, 261],
                        [120, 262],
                        [118, 261],
                      ],
                      [
                        [134, 253],
                        [127, 249],
                        [121, 242],
                        [120, 239],
                        [120, 160],
                        [120, 80],
                        [121, 78],
                        [125, 72],
                        [130, 68],
                        [140, 66],
                        [200, 66],
                        [266, 66],
                        [268, 66],
                        [275, 72],
                        [280, 80],
                        [280, 239],
                        [275, 248],
                        [266, 253],
                        [134, 253],
                      ],
                      [
                        [107, 246],
                        [107, 245],
                        [108, 246],
                        [107, 247],
                        [107, 246],
                      ],
                      [
                        [292, 246],
                        [293, 245],
                        [293, 246],
                        [293, 247],
                        [292, 246],
                      ],
                      [
                        [293, 244],
                        [294, 243],
                        [294, 240],
                        [294, 239],
                        [294, 242],
                        [294, 243],
                        [294, 244],
                        [293, 244],
                      ],
                      [
                        [106, 244],
                        [106, 243],
                        [106, 241],
                        [105, 238],
                        [106, 235],
                        [106, 238],
                        [106, 242],
                        [107, 243],
                        [106, 244],
                      ],
                      [
                        [295, 159],
                        [295, 84],
                        [295, 234],
                        [295, 159],
                      ],
                      [
                        [105, 213],
                        [106, 192],
                        [106, 233],
                        [105, 213],
                      ],
                      [
                        [256, 208],
                        [262, 203],
                        [264, 195],
                        [262, 187],
                        [256, 182],
                        [247, 181],
                        [243, 176],
                        [234, 167],
                        [227, 159],
                        [228, 158],
                        [228, 148],
                        [225, 143],
                        [221, 141],
                        [214, 139],
                        [209, 140],
                        [206, 142],
                        [202, 146],
                        [200, 152],
                        [199, 155],
                        [194, 158],
                        [190, 160],
                        [187, 162],
                        [184, 164],
                        [182, 165],
                        [179, 164],
                        [174, 162],
                        [171, 162],
                        [166, 158],
                        [161, 152],
                        [160, 151],
                        [160, 149],
                        [162, 142],
                        [159, 134],
                        [154, 130],
                        [147, 129],
                        [141, 131],
                        [136, 136],
                        [134, 143],
                        [136, 150],
                        [141, 155],
                        [147, 157],
                        [151, 158],
                        [158, 167],
                        [159, 169],
                        [161, 171],
                        [160, 174],
                        [160, 180],
                        [162, 186],
                        [169, 191],
                        [177, 190],
                        [184, 186],
                        [187, 179],
                        [187, 176],
                        [189, 175],
                        [191, 174],
                        [202, 167],
                        [204, 166],
                        [208, 166],
                        [215, 167],
                        [218, 167],
                        [220, 169],
                        [224, 174],
                        [229, 179],
                        [232, 182],
                        [234, 185],
                        [237, 188],
                        [237, 191],
                        [237, 201],
                        [243, 208],
                        [256, 208],
                      ],
                      [
                        [248, 197],
                        [247, 193],
                        [252, 193],
                        [253, 195],
                        [252, 197],
                        [250, 198],
                        [248, 197],
                      ],
                      [
                        [105, 180],
                        [106, 168],
                        [106, 191],
                        [105, 180],
                      ],
                      [
                        [172, 179],
                        [171, 175],
                        [175, 174],
                        [176, 177],
                        [175, 179],
                        [172, 179],
                      ],
                      [
                        [105, 165],
                        [106, 162],
                        [106, 165],
                        [106, 168],
                        [105, 165],
                      ],
                      [
                        [105, 161],
                        [105, 161],
                        [106, 161],
                        [105, 161],
                      ],
                      [
                        [105, 155],
                        [106, 150],
                        [106, 155],
                        [106, 160],
                        [105, 155],
                      ],
                      [
                        [212, 155],
                        [211, 153],
                        [213, 150],
                        [216, 150],
                        [218, 153],
                        [216, 156],
                        [212, 155],
                      ],
                      [
                        [105, 146],
                        [106, 143],
                        [106, 146],
                        [106, 149],
                        [105, 146],
                      ],
                      [
                        [147, 145],
                        [145, 143],
                        [146, 141],
                        [150, 141],
                        [151, 145],
                        [147, 145],
                      ],
                      [
                        [105, 136],
                        [106, 131],
                        [106, 140],
                        [105, 136],
                      ],
                      [
                        [106, 131],
                        [105, 125],
                        [106, 121],
                        [106, 131],
                      ],
                      [
                        [105, 118],
                        [105, 117],
                        [106, 117],
                        [106, 118],
                        [105, 118],
                      ],
                      [
                        [105, 102],
                        [106, 87],
                        [106, 102],
                        [106, 116],
                        [105, 102],
                      ],
                      [
                        [105, 81],
                        [106, 77],
                        [106, 80],
                        [106, 84],
                        [105, 81],
                      ],
                      [
                        [294, 80],
                        [294, 78],
                        [294, 77],
                        [295, 79],
                        [294, 80],
                      ],
                      [
                        [106, 76],
                        [106, 75],
                        [107, 76],
                        [106, 77],
                        [106, 76],
                      ],
                      [
                        [107, 74],
                        [108, 71],
                        [108, 72],
                        [108, 73],
                        [107, 74],
                        [107, 74],
                      ],
                      [
                        [292, 73],
                        [293, 73],
                        [293, 74],
                        [293, 74],
                        [292, 73],
                      ],
                      [
                        [280, 58],
                        [280, 57],
                        [279, 57],
                        [278, 56],
                        [277, 55],
                        [278, 55],
                        [279, 56],
                        [280, 57],
                        [281, 58],
                        [280, 58],
                      ],
                      [
                        [120, 57],
                        [121, 56],
                        [121, 57],
                        [120, 57],
                        [120, 57],
                      ],
                      [
                        [122, 55],
                        [123, 55],
                        [124, 55],
                        [123, 56],
                        [122, 55],
                      ],
                      [
                        [275, 54],
                        [274, 54],
                        [274, 54],
                        [275, 54],
                        [275, 55],
                        [275, 54],
                      ],
                      [
                        [130, 52],
                        [131, 52],
                        [132, 52],
                        [131, 52],
                        [130, 52],
                      ],
                      [
                        [268, 52],
                        [269, 52],
                        [271, 52],
                        [269, 52],
                        [268, 52],
                      ],
                      [
                        [149, 51],
                        [152, 51],
                        [151, 52],
                        [149, 51],
                      ],
                      [
                        [176, 51],
                        [179, 51],
                        [177, 52],
                        [176, 51],
                      ],
                      [
                        [241, 51],
                        [242, 51],
                        [243, 51],
                        [241, 51],
                      ],
                      [
                        [232, 51],
                        [233, 51],
                        [232, 51],
                        [232, 51],
                      ],
                    ],
                  },
                  symbol: {
                    type: "CIMPolygonSymbol",
                    symbolLayers: [
                      {
                        type: "CIMSolidFill",
                        enable: true,
                        color: [202, 100, 100, 255],
                      },
                    ],
                    angleAlignment: "Map",
                  },
                },
                {
                  type: "CIMMarkerGraphic",
                  geometry: {
                    paths: [
                      [
                        [208.9, 350.2],
                        [207.6, 349.4],
                        [212.2, 349.8],
                        [212.6, 349.7],
                        [215.2, 349.6],
                        [215.3, 350],
                        [214.4, 350.3],
                        [208.9, 350.2],
                      ],
                      [
                        [220.5, 349.2],
                        [221.3, 348.5],
                        [222, 348.8],
                        [221.2, 349.5],
                        [220.5, 349.2],
                      ],
                      [
                        [224.3, 348],
                        [224.8, 347.2],
                        [224.4, 349.2],
                        [224.3, 348],
                      ],
                      [
                        [227, 347.4],
                        [226.8, 346],
                        [227.2, 346.6],
                        [227.5, 347.2],
                        [227.9, 347.8],
                        [227, 347.4],
                      ],
                      [
                        [200.5, 345.7],
                        [201, 343.3],
                        [201.6, 343.1],
                        [201.2, 343.8],
                        [200.7, 345.8],
                        [200.5, 347.4],
                        [200.5, 345.7],
                      ],
                      [
                        [238.1, 343.3],
                        [238.8, 342.8],
                        [239.2, 342.4],
                        [239.2, 343],
                        [238.1, 343.6],
                        [238.1, 343.3],
                      ],
                      [
                        [240.4, 341.8],
                        [241.3, 341.4],
                        [241.4, 342.1],
                        [240.4, 341.8],
                      ],
                      [
                        [243.1, 340.6],
                        [244.5, 340.1],
                        [244.3, 340.4],
                        [243.6, 340.8],
                        [242.9, 341.2],
                        [243.1, 340.6],
                      ],
                      [
                        [216.9, 338.6],
                        [218.3, 338.5],
                        [217.2, 339.1],
                        [216.9, 338.6],
                      ],
                      [
                        [246.1, 338.2],
                        [247.2, 337.6],
                        [247, 338.2],
                        [246.1, 338.2],
                      ],
                      [
                        [224.7, 337],
                        [225.8, 336.4],
                        [226.8, 336],
                        [227.8, 335.6],
                        [229, 335.2],
                        [230, 334.8],
                        [230.8, 334.4],
                        [231.4, 334],
                        [232, 333.6],
                        [232.8, 333.2],
                        [233.6, 332.8],
                        [234.5, 332.4],
                        [234.8, 332.7],
                        [234, 333.2],
                        [231.8, 334.3],
                        [229.1, 335.6],
                        [227.8, 336],
                        [227.2, 336.4],
                        [226.4, 336.8],
                        [225.4, 337.2],
                        [224.7, 337],
                      ],
                      [
                        [252.6, 332.7],
                        [257.2, 328.2],
                        [258.2, 327.4],
                        [257.2, 328.6],
                        [255.5, 330.4],
                        [254.8, 331.6],
                        [254.5, 331.8],
                        [251.8, 334],
                        [249.2, 336.4],
                        [252.6, 332.7],
                      ],
                      [
                        [250.4, 332.7],
                        [249.9, 331.9],
                        [249.6, 331.5],
                        [250.6, 331.8],
                        [250.9, 332.9],
                        [250.4, 332.7],
                      ],
                      [
                        [236.1, 331.4],
                        [237.1, 331.4],
                        [235.7, 332],
                        [236.1, 331.4],
                      ],
                      [
                        [238.1, 330.1],
                        [238.8, 329.6],
                        [239.5, 329.2],
                        [239.4, 329.8],
                        [238, 330.3],
                        [238.1, 330.1],
                      ],
                      [
                        [215.2, 328],
                        [217.4, 326.9],
                        [216.4, 327.7],
                        [215.2, 328],
                      ],
                      [
                        [208, 327.4],
                        [207.6, 326.8],
                        [209, 327.4],
                        [208, 327.4],
                      ],
                      [
                        [241.2, 327.5],
                        [242.3, 326.5],
                        [242.5, 327],
                        [241.5, 328],
                        [241.2, 327.5],
                      ],
                      [
                        [219.2, 327.3],
                        [220.1, 326.5],
                        [220.8, 326],
                        [220.7, 326.8],
                        [219.4, 327.6],
                        [219.2, 327.3],
                      ],
                      [
                        [224.6, 325.4],
                        [226.1, 324.9],
                        [227, 325.1],
                        [226.1, 325.1],
                        [225.2, 325.6],
                        [224.6, 326],
                        [224.6, 325.4],
                      ],
                      [
                        [258.9, 325.2],
                        [259.7, 324.4],
                        [260, 324],
                        [260.7, 322.9],
                        [261.1, 322.8],
                        [260.6, 324],
                        [259.3, 325.3],
                        [258.9, 325.2],
                      ],
                      [
                        [244.8, 324.5],
                        [246, 323],
                        [247.5, 321.2],
                        [249.2, 319],
                        [249.6, 319],
                        [248.9, 320.4],
                        [246.4, 323.3],
                        [244.2, 325.6],
                        [244.8, 324.5],
                      ],
                      [
                        [229.6, 323.1],
                        [231.4, 321.9],
                        [233, 321.6],
                        [232.2, 322],
                        [231, 322.8],
                        [229.4, 323.6],
                        [229.6, 323.1],
                      ],
                      [
                        [233.6, 320.8],
                        [240.1, 314.1],
                        [237.2, 317.5],
                        [233.6, 320.8],
                      ],
                      [
                        [262.4, 320.1],
                        [263.1, 319.2],
                        [263.4, 319.5],
                        [262.7, 320.4],
                        [262.4, 320.1],
                      ],
                      [
                        [205.6, 318.8],
                        [206.2, 318.4],
                        [207.1, 317.8],
                        [207.6, 317.2],
                        [207.8, 317.7],
                        [205.6, 318.8],
                      ],
                      [
                        [250.4, 317.6],
                        [252.7, 314.6],
                        [252, 315.6],
                        [251.2, 317],
                        [250.5, 318.1],
                        [250.4, 317.6],
                      ],
                      [
                        [264.8, 315.2],
                        [265.2, 314.8],
                        [265.6, 314],
                        [266.2, 312.5],
                        [266.8, 312.3],
                        [266.4, 313],
                        [266, 314],
                        [265.4, 315.2],
                        [264.8, 315.2],
                      ],
                      [
                        [220.9, 314.9],
                        [221.6, 314.4],
                        [222.2, 314],
                        [225.3, 312],
                        [225.6, 312.1],
                        [222.6, 314.4],
                        [222, 314.8],
                        [221.1, 315.2],
                        [220.9, 314.9],
                      ],
                      [
                        [240.8, 312.9],
                        [241.6, 311.1],
                        [242.4, 310.3],
                        [241.6, 312.1],
                        [240.8, 312.9],
                      ],
                      [
                        [266.4, 311.2],
                        [266.8, 310.8],
                        [267.3, 310.1],
                        [267.6, 310.3],
                        [267, 311.3],
                        [266.4, 311.2],
                      ],
                      [
                        [254.7, 309.6],
                        [255.5, 308.4],
                        [255.7, 308.7],
                        [255.2, 309.6],
                        [254.9, 310.6],
                        [254.7, 309.6],
                      ],
                      [
                        [243.1, 308.8],
                        [243.6, 308],
                        [243.7, 308.8],
                        [243.2, 309.6],
                        [243.1, 308.8],
                      ],
                      [
                        [230, 307.9],
                        [232, 306.4],
                        [231.7, 306.8],
                        [230.8, 307.8],
                        [230, 307.9],
                      ],
                      [
                        [268.1, 307.7],
                        [268.7, 306.4],
                        [268.9, 306.7],
                        [268.3, 308],
                        [268.1, 307.7],
                      ],
                      [
                        [266.2, 307.6],
                        [266.9, 307.1],
                        [266.8, 308],
                        [266.2, 307.6],
                      ],
                      [
                        [256.4, 305.1],
                        [256.8, 304.2],
                        [257, 305],
                        [256.4, 305.1],
                      ],
                      [
                        [199.2, 304.8],
                        [198.5, 304.3],
                        [198.7, 304],
                        [199.6, 304.6],
                        [199.4, 305.2],
                        [199.2, 304.8],
                      ],
                      [
                        [205.8, 304.4],
                        [206.6, 304],
                        [207.2, 303.4],
                        [207.8, 302.8],
                        [209.1, 301.6],
                        [210.8, 300.4],
                        [210.2, 301],
                        [209, 302.6],
                        [208.3, 304],
                        [206.9, 304.4],
                        [205.8, 304.4],
                      ],
                      [
                        [196.9, 303.8],
                        [196.8, 303],
                        [197.5, 303.4],
                        [196.9, 303.8],
                      ],
                      [
                        [269, 303.2],
                        [269.5, 300.9],
                        [270.6, 299.4],
                        [270.4, 299.8],
                        [270, 301.7],
                        [269.2, 303.9],
                        [269, 303.2],
                      ],
                      [
                        [194.5, 301.7],
                        [193.2, 299.4],
                        [192.8, 298.8],
                        [192.4, 298.1],
                        [193.6, 299.5],
                        [194.9, 301.6],
                        [196, 303.3],
                        [194.5, 301.7],
                      ],
                      [
                        [234, 302.5],
                        [234.7, 301.1],
                        [234.9, 301.2],
                        [234.3, 302.6],
                        [234, 302.5],
                      ],
                      [
                        [258, 301],
                        [258.2, 298.9],
                        [258, 297.4],
                        [258.5, 298.9],
                        [258, 301.6],
                        [258, 301],
                      ],
                      [
                        [246.4, 300.1],
                        [246.8, 298.6],
                        [246.9, 299.7],
                        [246.5, 301.1],
                        [246.4, 300.1],
                      ],
                      [
                        [210.2, 299.3],
                        [210, 298.4],
                        [209.8, 298],
                        [210.5, 299.2],
                        [210.2, 299.3],
                      ],
                      [
                        [235.1, 298.9],
                        [235.6, 297.5],
                        [236.2, 295.7],
                        [236.8, 295.8],
                        [236.4, 296.4],
                        [236, 297.8],
                        [235.3, 299.2],
                        [235.1, 298.9],
                      ],
                      [
                        [258.1, 296.2],
                        [258.4, 295.6],
                        [258.9, 294.3],
                        [259, 293],
                        [259.2, 294.5],
                        [258.8, 296.4],
                        [258.1, 296.2],
                      ],
                      [
                        [192.5, 295],
                        [192.7, 294.3],
                        [192.7, 295.9],
                        [192.5, 295],
                      ],
                      [
                        [192.5, 290],
                        [192.7, 288.5],
                        [192.7, 291.5],
                        [192.5, 290],
                      ],
                      [
                        [259.1, 291.1],
                        [259.6, 289.6],
                        [259.9, 289.1],
                        [259.1, 291.6],
                        [259.1, 291.1],
                      ],
                      [
                        [245.9, 288.8],
                        [246.4, 288.6],
                        [246.6, 289.6],
                        [245.9, 288.8],
                      ],
                      [
                        [241.8, 287.8],
                        [243, 287.2],
                        [244.1, 287],
                        [244.9, 287.3],
                        [243.9, 287.9],
                        [241.8, 288.2],
                        [241.8, 287.8],
                      ],
                      [
                        [266.5, 287.8],
                        [265.9, 287.5],
                        [265.8, 287.3],
                        [266.9, 286.8],
                        [267.3, 287.3],
                        [267.1, 288.1],
                        [267.1, 288.4],
                        [266.5, 287.8],
                      ],
                      [
                        [192.6, 280.4],
                        [192.7, 277.3],
                        [192.7, 283.5],
                        [192.6, 280.4],
                      ],
                      [
                        [192.5, 270],
                        [192.7, 269.3],
                        [192.7, 270.7],
                        [192.5, 270],
                      ],
                      [
                        [135.6, 267.2],
                        [134.5, 266.7],
                        [134.8, 266.5],
                        [136, 267.6],
                        [135.6, 267.2],
                      ],
                      [
                        [154.6, 267.1],
                        [154.6, 266.1],
                        [155.1, 267.1],
                        [154.6, 267.1],
                      ],
                      [
                        [161, 267.2],
                        [162.4, 267],
                        [162.1, 267.6],
                        [161, 267.2],
                      ],
                      [
                        [163.9, 267.3],
                        [163.5, 266.4],
                        [164.7, 266.6],
                        [164.6, 267.6],
                        [163.9, 267.3],
                      ],
                      [
                        [166.5, 267.1],
                        [170.3, 266.6],
                        [169.2, 267.6],
                        [167.8, 267.2],
                        [167.6, 266.8],
                        [167.2, 267.2],
                        [166.8, 267.6],
                        [166.5, 267.1],
                      ],
                      [
                        [178.4, 266.8],
                        [179, 266],
                        [179.2, 266.8],
                        [178.6, 267.6],
                        [178.4, 266.8],
                      ],
                      [
                        [264.5, 267],
                        [266.4, 266.5],
                        [267.6, 266.6],
                        [266.4, 267.1],
                        [264.5, 267],
                      ],
                      [
                        [130.8, 266.2],
                        [130.8, 265.6],
                        [131.2, 266],
                        [132.1, 266.5],
                        [132.1, 266.7],
                        [130.8, 266.2],
                      ],
                      [
                        [128, 265.4],
                        [128, 264.8],
                        [128.4, 265.2],
                        [129.1, 265.7],
                        [129.1, 266],
                        [128, 265.4],
                      ],
                      [
                        [272.3, 265.4],
                        [273.2, 264.8],
                        [274, 264.4],
                        [274.4, 264],
                        [274.4, 264.6],
                        [273.4, 265.2],
                        [272.8, 265.6],
                        [272.4, 266],
                        [272.3, 265.4],
                      ],
                      [
                        [125.8, 264.8],
                        [125.5, 264.3],
                        [125.5, 264],
                        [126.6, 264.6],
                        [126.4, 265.1],
                        [125.8, 264.8],
                      ],
                      [
                        [118.8, 260.2],
                        [119.4, 260],
                        [119.7, 260.8],
                        [118.8, 260.2],
                      ],
                      [
                        [116.3, 258.3],
                        [114.4, 256.6],
                        [114.9, 256.8],
                        [116.7, 257.4],
                        [117.1, 257.4],
                        [117.5, 258.5],
                        [116.3, 258.3],
                      ],
                      [
                        [282.4, 258.9],
                        [283.5, 258],
                        [285.5, 256.4],
                        [286.2, 256.2],
                        [282.4, 258.9],
                      ],
                      [
                        [118.4, 257.4],
                        [118.6, 256.8],
                        [119.2, 257.4],
                        [119, 258],
                        [118.4, 257.4],
                      ],
                      [
                        [113.1, 255.2],
                        [113.2, 254.4],
                        [113.6, 255.6],
                        [113.1, 255.2],
                      ],
                      [
                        [149.3, 254.8],
                        [150, 254.1],
                        [150.3, 254.4],
                        [149.6, 255.1],
                        [149.3, 254.8],
                      ],
                      [
                        [206.7, 254.9],
                        [208.1, 254.1],
                        [208.8, 254.3],
                        [207.4, 254.8],
                        [206.7, 254.9],
                      ],
                      [
                        [286.4, 255],
                        [288, 253.6],
                        [287.7, 254.4],
                        [286.4, 255],
                      ],
                      [
                        [139.6, 254.3],
                        [143.1, 254],
                        [146.3, 254.2],
                        [139.6, 254.3],
                      ],
                      [
                        [168.4, 254.4],
                        [166.6, 254.1],
                        [168.9, 254.1],
                        [171, 254.4],
                        [170.5, 254.7],
                        [168.4, 254.4],
                      ],
                      [
                        [176.2, 254.4],
                        [184.4, 254.1],
                        [195.1, 254.2],
                        [176.2, 254.4],
                      ],
                      [
                        [199, 254.4],
                        [200.2, 254],
                        [201.4, 254.4],
                        [200.2, 254.8],
                        [199, 254.4],
                      ],
                      [
                        [216.6, 254.4],
                        [220.3, 254.1],
                        [226.4, 254.3],
                        [216.6, 254.4],
                      ],
                      [
                        [241.2, 254.4],
                        [241.7, 254],
                        [242.7, 254.5],
                        [241.2, 254.4],
                      ],
                      [
                        [248, 254.4],
                        [248.5, 254],
                        [249.6, 254.4],
                        [248, 254.4],
                      ],
                      [
                        [256.8, 254.4],
                        [257.8, 254.1],
                        [259, 254.4],
                        [256.8, 254.4],
                      ],
                      [
                        [161.5, 254.1],
                        [164.3, 254.1],
                        [163, 254.3],
                        [161.5, 254.1],
                      ],
                      [
                        [252.7, 254.1],
                        [254.3, 254.1],
                        [253.4, 254.3],
                        [252.7, 254.1],
                      ],
                      [
                        [263.9, 253.7],
                        [265.7, 253.7],
                        [264.8, 253.9],
                        [263.9, 253.7],
                      ],
                      [
                        [130, 253.2],
                        [130.5, 252.8],
                        [130.4, 252.4],
                        [131.7, 252.6],
                        [132.1, 253.1],
                        [131, 253.2],
                        [130, 253.2],
                      ],
                      [
                        [288.7, 252.2],
                        [289.5, 251.2],
                        [289.7, 251.5],
                        [289.2, 252.2],
                        [288.9, 253],
                        [288.7, 252.2],
                      ],
                      [
                        [270.1, 252],
                        [272.2, 250.8],
                        [272.8, 250.5],
                        [269.6, 252.6],
                        [270.1, 252],
                      ],
                      [
                        [110.5, 251.7],
                        [110.8, 251.2],
                        [111.1, 251.9],
                        [110.5, 251.7],
                      ],
                      [
                        [126.9, 250.9],
                        [125.7, 250],
                        [125.7, 249.2],
                        [124.6, 248.1],
                        [125.3, 248.4],
                        [126.5, 250.1],
                        [126.7, 250.3],
                        [127.8, 250.6],
                        [128.4, 251.1],
                        [126.9, 250.9],
                      ],
                      [
                        [275.6, 247.6],
                        [277.1, 246],
                        [276, 247.6],
                        [274.5, 249.2],
                        [275.6, 247.6],
                      ],
                      [
                        [108.3, 246.5],
                        [108, 245.1],
                        [107.6, 244],
                        [107.2, 243.5],
                        [108.5, 245.5],
                        [108.3, 246.5],
                      ],
                      [
                        [123.3, 246.5],
                        [122.8, 245.8],
                        [122, 244.5],
                        [121.3, 243.2],
                        [122.7, 244.8],
                        [123.9, 246.8],
                        [123.3, 246.5],
                      ],
                      [
                        [292, 244.5],
                        [292.6, 243.6],
                        [293.2, 243.5],
                        [292.6, 244.4],
                        [292, 244.5],
                      ],
                      [
                        [278.5, 243.6],
                        [280.4, 239.4],
                        [280.3, 79.2],
                        [280.3, 78.9],
                        [280.9, 79.4],
                        [280.8, 239.2],
                        [280.4, 240.8],
                        [279.8, 242.3],
                        [278.6, 243.8],
                        [278.5, 243.6],
                      ],
                      [
                        [293.7, 236.5],
                        [294.3, 234.5],
                        [294.2, 237.8],
                        [293.7, 236.5],
                      ],
                      [
                        [118.9, 236.7],
                        [118.9, 231],
                        [118.8, 217.6],
                        [118.7, 207.6],
                        [118.8, 200.4],
                        [118.9, 155.6],
                        [118.9, 142.8],
                        [118.9, 136.4],
                        [118.9, 115.4],
                        [118.6, 86.4],
                        [119, 83.6],
                        [119.5, 159.5],
                        [119.3, 238],
                        [118.9, 236.7],
                      ],
                      [
                        [294.5, 221.4],
                        [294.7, 220.7],
                        [294.7, 222.3],
                        [294.5, 221.4],
                      ],
                      [
                        [294.5, 217.6],
                        [294.7, 216.9],
                        [294.7, 218.3],
                        [294.5, 217.6],
                      ],
                      [
                        [294.5, 208.6],
                        [294.7, 207.9],
                        [294.7, 209.5],
                        [294.5, 208.6],
                      ],
                      [
                        [247.7, 208.5],
                        [249.1, 208.5],
                        [248.4, 208.7],
                        [247.7, 208.5],
                      ],
                      [
                        [244.8, 208.1],
                        [239.2, 203.9],
                        [240.3, 204.7],
                        [244.7, 207.6],
                        [246, 208],
                        [244.8, 208.1],
                      ],
                      [
                        [253.4, 208],
                        [254.5, 207.6],
                        [257, 206.3],
                        [258, 205.7],
                        [253.4, 208],
                      ],
                      [
                        [294.5, 202.4],
                        [294.7, 200.7],
                        [294.7, 204.1],
                        [294.5, 202.4],
                      ],
                      [
                        [259.5, 204.1],
                        [261.1, 202.4],
                        [262, 201.7],
                        [259.1, 204.8],
                        [259.5, 204.1],
                      ],
                      [
                        [236.6, 198.6],
                        [236.6, 197.3],
                        [237, 198.2],
                        [237.1, 199.4],
                        [236.6, 198.6],
                      ],
                      [
                        [262.8, 198.8],
                        [263.2, 197.2],
                        [263.2, 198.8],
                        [262.9, 199.8],
                        [262.8, 198.8],
                      ],
                      [
                        [247.1, 197.8],
                        [246.7, 192.8],
                        [246.9, 192.8],
                        [247.3, 197.5],
                        [250.4, 198.4],
                        [252.8, 196.7],
                        [253, 197],
                        [250.6, 198.9],
                        [247.1, 197.8],
                      ],
                      [
                        [294.6, 192.4],
                        [294.7, 189.3],
                        [294.7, 195.5],
                        [294.6, 192.4],
                      ],
                      [
                        [236.6, 193.4],
                        [237.2, 190.2],
                        [235.6, 186],
                        [233.6, 183.4],
                        [234.7, 184.5],
                        [236.9, 187],
                        [237.6, 190.2],
                        [237.1, 193.1],
                        [236.7, 195.9],
                        [236.6, 193.4],
                      ],
                      [
                        [252.8, 193.5],
                        [251.9, 192.2],
                        [251.4, 191.6],
                        [253.1, 193.7],
                        [252.8, 193.5],
                      ],
                      [
                        [262.8, 191.7],
                        [262.9, 190.5],
                        [263.3, 191.9],
                        [263.2, 193.2],
                        [262.8, 191.7],
                      ],
                      [
                        [248.7, 191.2],
                        [250, 191.2],
                        [249.6, 191.6],
                        [248.7, 191.2],
                      ],
                      [
                        [170.4, 190.4],
                        [166.1, 188.6],
                        [167.9, 189.2],
                        [170.8, 190],
                        [172.2, 190.4],
                        [170.4, 190.4],
                      ],
                      [
                        [173, 190.5],
                        [175.1, 189.9],
                        [176.4, 190.1],
                        [174.4, 190.6],
                        [173, 190.5],
                      ],
                      [
                        [261.8, 188.7],
                        [260.3, 186.4],
                        [258.2, 184],
                        [257, 182.6],
                        [258.5, 184],
                        [262.5, 189.3],
                        [261.8, 188.7],
                      ],
                      [
                        [178.1, 189],
                        [179.8, 188.4],
                        [180.4, 188],
                        [180.9, 187.6],
                        [183, 185.9],
                        [184.5, 184.2],
                        [183.2, 185.9],
                        [178.7, 189.3],
                        [178.1, 189],
                      ],
                      [
                        [184.4, 183.5],
                        [184.8, 182.6],
                        [185.2, 181.6],
                        [185.6, 180.8],
                        [185.4, 182.3],
                        [184.4, 183.5],
                      ],
                      [
                        [160.7, 182.8],
                        [161, 181.7],
                        [161.1, 182.9],
                        [161, 183.8],
                        [160.7, 182.8],
                      ],
                      [
                        [254.3, 182.1],
                        [253.2, 181.6],
                        [255.4, 182],
                        [255.5, 182.3],
                        [254.3, 182.1],
                      ],
                      [
                        [245.8, 181.4],
                        [245.5, 180.8],
                        [246.2, 181.2],
                        [247.9, 181.4],
                        [248.6, 181.6],
                        [245.8, 181.4],
                      ],
                      [
                        [159.9, 179.8],
                        [160.3, 178.1],
                        [160.4, 179.8],
                        [160.2, 181.4],
                        [159.9, 179.8],
                      ],
                      [
                        [250.3, 180.9],
                        [252.1, 180.9],
                        [251.2, 181.1],
                        [250.3, 180.9],
                      ],
                      [
                        [294.5, 179],
                        [294.7, 177.9],
                        [294.7, 180.3],
                        [294.5, 179],
                      ],
                      [
                        [171.2, 180],
                        [170.6, 179.6],
                        [170, 179],
                        [170.9, 179.2],
                        [173.8, 180],
                        [176.1, 178],
                        [176.4, 178.1],
                        [172.9, 180.4],
                        [171.2, 180],
                      ],
                      [
                        [186.2, 178.2],
                        [187.5, 174.9],
                        [188.8, 174.2],
                        [187.6, 175.3],
                        [186.3, 178.2],
                        [186.1, 180.4],
                        [186.2, 178.2],
                      ],
                      [
                        [228.2, 177.7],
                        [226.8, 176],
                        [227.7, 176.6],
                        [229.2, 178.2],
                        [229.9, 179.3],
                        [230.3, 180],
                        [228.2, 177.7],
                      ],
                      [
                        [242.4, 177.4],
                        [241.3, 175.7],
                        [242.7, 177.1],
                        [243.8, 178.7],
                        [242.4, 177.4],
                      ],
                      [
                        [169.5, 177.7],
                        [169.8, 174.9],
                        [172.3, 173.3],
                        [172.2, 173.6],
                        [169.7, 176.8],
                        [169.5, 177.7],
                      ],
                      [
                        [159.9, 174.9],
                        [160.3, 173.3],
                        [160.4, 174.5],
                        [160, 176.2],
                        [159.9, 174.9],
                      ],
                      [
                        [294.5, 174.6],
                        [294.7, 173.9],
                        [294.7, 175.5],
                        [294.5, 174.6],
                      ],
                      [
                        [176, 174.9],
                        [174.7, 173.9],
                        [175, 173.2],
                        [175.2, 173.4],
                        [175.9, 174.2],
                        [176.3, 175],
                        [176, 174.9],
                      ],
                      [
                        [239.6, 174.2],
                        [238.8, 173.1],
                        [239.9, 174.1],
                        [240.7, 175.2],
                        [239.6, 174.2],
                      ],
                      [
                        [222.6, 171.5],
                        [220, 168.2],
                        [222.2, 170.6],
                        [224.8, 173.2],
                        [225.3, 173.8],
                        [222.6, 171.5],
                      ],
                      [
                        [237.3, 171.7],
                        [236.5, 170.6],
                        [237.6, 171.4],
                        [238.4, 172.5],
                        [237.3, 171.7],
                      ],
                      [
                        [160.2, 168.9],
                        [159, 167.4],
                        [160.5, 168.6],
                        [162, 170.1],
                        [160.2, 168.9],
                      ],
                      [
                        [197.2, 168.9],
                        [199.6, 167.2],
                        [201.2, 166.6],
                        [195.3, 170.4],
                        [197.2, 168.9],
                      ],
                      [
                        [234.6, 168.5],
                        [233.3, 166.9],
                        [234.6, 168.1],
                        [236, 169.7],
                        [234.6, 168.5],
                      ],
                      [
                        [218.6, 166.8],
                        [217, 166.3],
                        [215.8, 166.1],
                        [217.1, 166.1],
                        [218.8, 166.6],
                        [218.6, 166.8],
                      ],
                      [
                        [158.2, 166.2],
                        [156.9, 164.4],
                        [156.1, 163.2],
                        [158.7, 166.6],
                        [158.2, 166.2],
                      ],
                      [
                        [212.6, 166.4],
                        [212.2, 165.9],
                        [213.7, 166],
                        [214.6, 166.1],
                        [215.3, 166.3],
                        [212.6, 166.4],
                      ],
                      [
                        [207.4, 165],
                        [206.1, 163.6],
                        [206.8, 164],
                        [207.2, 164.4],
                        [208.4, 165.1],
                        [210.1, 166.1],
                        [210.2, 166.3],
                        [207.4, 165],
                      ],
                      [
                        [181.2, 165.7],
                        [186.1, 163.1],
                        [188.7, 161.6],
                        [190.5, 160.4],
                        [197, 157],
                        [194.1, 158.7],
                        [192, 160],
                        [191.3, 160.5],
                        [187.7, 162.7],
                        [185.8, 163.8],
                        [184.4, 164.8],
                        [183.6, 165.2],
                        [182.6, 165.6],
                        [181.5, 166],
                        [181.2, 165.7],
                      ],
                      [
                        [229.8, 163.2],
                        [228.7, 161.8],
                        [230, 163.1],
                        [231.2, 164.5],
                        [229.8, 163.2],
                      ],
                      [
                        [294.5, 163.4],
                        [294.7, 162.7],
                        [294.7, 164.3],
                        [294.5, 163.4],
                      ],
                      [
                        [170.3, 162.8],
                        [170.4, 162.6],
                        [172.6, 162.8],
                        [173.9, 163.1],
                        [170.3, 162.8],
                      ],
                      [
                        [152.6, 159.7],
                        [151.2, 157.8],
                        [155.5, 162.8],
                        [152.6, 159.7],
                      ],
                      [
                        [166.8, 159.4],
                        [165, 157.4],
                        [167, 159.3],
                        [168.8, 161.3],
                        [166.8, 159.4],
                      ],
                      [
                        [228.2, 161.3],
                        [226.4, 158.2],
                        [226.8, 157],
                        [227.2, 155.8],
                        [227.5, 156.3],
                        [227.8, 160.3],
                        [228.2, 161.3],
                      ],
                      [
                        [294.5, 158],
                        [294.7, 156.9],
                        [294.7, 159.1],
                        [294.5, 158],
                      ],
                      [
                        [211.5, 155.6],
                        [210.5, 152.2],
                        [210.7, 152.6],
                        [213.1, 156.4],
                        [213.8, 157.2],
                        [211.5, 155.6],
                      ],
                      [
                        [215.1, 156.9],
                        [216.1, 156],
                        [217.8, 154],
                        [217.5, 151.2],
                        [217.4, 150.4],
                        [218, 151.4],
                        [218.6, 152.1],
                        [218.6, 154],
                        [217.9, 154.7],
                        [215.1, 156.9],
                      ],
                      [
                        [145.9, 156.5],
                        [148.5, 156.5],
                        [147.2, 156.7],
                        [145.9, 156.5],
                      ],
                      [
                        [142.9, 155.7],
                        [139.9, 153.5],
                        [138.2, 151.9],
                        [139.9, 153.3],
                        [143, 155.4],
                        [144.4, 156.2],
                        [142.9, 155.7],
                      ],
                      [
                        [199.8, 155],
                        [200.6, 153.1],
                        [200.8, 150.2],
                        [200.9, 148.6],
                        [201.2, 150.2],
                        [201.1, 152.3],
                        [201, 153.5],
                        [199.5, 155.6],
                        [199.8, 155],
                      ],
                      [
                        [294.5, 152.4],
                        [294.7, 150.7],
                        [294.7, 154.1],
                        [294.5, 152.4],
                      ],
                      [
                        [227.7, 153],
                        [227.9, 151.9],
                        [227.9, 154.3],
                        [227.7, 153],
                      ],
                      [
                        [160.2, 152.8],
                        [159.1, 151.4],
                        [160.4, 152.7],
                        [161.6, 154.1],
                        [160.2, 152.8],
                      ],
                      [
                        [159.6, 149.2],
                        [160.4, 147],
                        [160.8, 146.2],
                        [160.8, 147.1],
                        [159.3, 150.6],
                        [159.6, 149.2],
                      ],
                      [
                        [211.9, 149.9],
                        [216.1, 149.5],
                        [214.6, 149.7],
                        [212.1, 150.1],
                        [211.9, 149.9],
                      ],
                      [
                        [227, 148.9],
                        [226.4, 147.8],
                        [226, 146.9],
                        [226.9, 147.5],
                        [227.5, 149.7],
                        [227, 148.9],
                      ],
                      [
                        [135.9, 148.4],
                        [135, 140.9],
                        [135.4, 138.2],
                        [135.6, 140],
                        [135.5, 142.2],
                        [135.4, 144.2],
                        [135.6, 146.7],
                        [136.1, 147.5],
                        [136.6, 148.5],
                        [136.5, 149.5],
                        [135.9, 148.4],
                      ],
                      [
                        [201.6, 147.3],
                        [202.8, 146],
                        [202.2, 147.1],
                        [201.6, 147.3],
                      ],
                      [
                        [150.8, 144.9],
                        [151.8, 142.5],
                        [152.3, 141.4],
                        [152.4, 141.5],
                        [152.3, 142.2],
                        [150.6, 145.6],
                        [150.8, 144.9],
                      ],
                      [
                        [161.3, 142.6],
                        [161.5, 141.1],
                        [161.5, 144.3],
                        [161.3, 142.6],
                      ],
                      [
                        [204, 143.9],
                        [205.8, 142.3],
                        [204.4, 143.8],
                        [203, 145],
                        [204, 143.9],
                      ],
                      [
                        [224.4, 143.8],
                        [221.7, 142.2],
                        [219.7, 141],
                        [224.6, 143.6],
                        [225.1, 144.4],
                        [224.4, 143.8],
                      ],
                      [
                        [144.5, 143],
                        [145, 141],
                        [145.6, 140.6],
                        [145.2, 141.4],
                        [144.7, 143],
                        [144.5, 144.2],
                        [144.5, 143],
                      ],
                      [
                        [106.5, 140.6],
                        [106.7, 139.3],
                        [106.7, 142.1],
                        [106.5, 140.6],
                      ],
                      [
                        [208, 141.1],
                        [210.4, 139.9],
                        [211.4, 139.6],
                        [210.4, 140.1],
                        [209.2, 140.8],
                        [206.9, 142],
                        [208, 141.1],
                      ],
                      [
                        [150.4, 140.2],
                        [148.6, 139.1],
                        [148.6, 138.9],
                        [150.3, 139.6],
                        [151.3, 139.7],
                        [151.6, 140.1],
                        [151.4, 141.1],
                        [150.4, 140.2],
                      ],
                      [
                        [218.2, 140.5],
                        [217.8, 139.9],
                        [219, 140.4],
                        [219.1, 140.8],
                        [218.2, 140.5],
                      ],
                      [
                        [294.5, 139],
                        [294.7, 138.3],
                        [294.7, 139.9],
                        [294.5, 139],
                      ],
                      [
                        [214.3, 139.3],
                        [215.9, 139.3],
                        [215, 139.5],
                        [214.3, 139.3],
                      ],
                      [
                        [135.8, 137.7],
                        [137.2, 135.6],
                        [136.4, 137.2],
                        [135.8, 137.7],
                      ],
                      [
                        [294.6, 132.8],
                        [294.7, 130.5],
                        [294.7, 135.1],
                        [294.6, 132.8],
                      ],
                      [
                        [158.2, 134.3],
                        [154.6, 130.8],
                        [152.9, 130.2],
                        [152.4, 129.6],
                        [159.1, 135.4],
                        [158.2, 134.3],
                      ],
                      [
                        [137.6, 134.9],
                        [141.3, 131.2],
                        [140.3, 132.3],
                        [138.3, 134.4],
                        [137.6, 134.9],
                      ],
                      [
                        [143.8, 129.6],
                        [145, 129.6],
                        [143.9, 130],
                        [143.8, 129.6],
                      ],
                      [
                        [147.1, 128.9],
                        [149.7, 128.9],
                        [148.4, 129.1],
                        [147.1, 128.9],
                      ],
                      [
                        [294.5, 123.2],
                        [294.7, 122.1],
                        [294.7, 124.3],
                        [294.5, 123.2],
                      ],
                      [
                        [294.5, 114.6],
                        [294.7, 113.5],
                        [294.7, 115.9],
                        [294.5, 114.6],
                      ],
                      [
                        [288.8, 113.2],
                        [289.4, 112.8],
                        [290, 113.2],
                        [289.4, 113.6],
                        [288.8, 113.2],
                      ],
                      [
                        [294.5, 110],
                        [294.7, 109.3],
                        [294.7, 110.7],
                        [294.5, 110],
                      ],
                      [
                        [294.5, 104.2],
                        [294.7, 103.1],
                        [294.7, 105.5],
                        [294.5, 104.2],
                      ],
                      [
                        [294.5, 97.8],
                        [294.7, 96.5],
                        [294.7, 99.3],
                        [294.5, 97.8],
                      ],
                      [
                        [106.5, 85.2],
                        [106.7, 84.3],
                        [106.7, 86.1],
                        [106.5, 85.2],
                      ],
                      [
                        [107.3, 78.2],
                        [106.8, 77.1],
                        [107.4, 77.5],
                        [107.3, 78.2],
                      ],
                      [
                        [293.6, 78.3],
                        [293.2, 77.6],
                        [292.8, 76.5],
                        [293.1, 76],
                        [293.7, 77.5],
                        [293.9, 78.7],
                        [293.6, 78.3],
                      ],
                      [
                        [279.2, 76.8],
                        [278.4, 75.1],
                        [277.5, 73.8],
                        [278.6, 75],
                        [279.4, 77.2],
                        [279.2, 76.8],
                      ],
                      [
                        [122.9, 73.1],
                        [124.4, 71],
                        [125, 70.1],
                        [125.6, 69.8],
                        [121.8, 74.7],
                        [122.9, 73.1],
                      ],
                      [
                        [108, 73.8],
                        [108.9, 72.3],
                        [108.5, 73.8],
                        [108, 73.8],
                      ],
                      [
                        [291.5, 73.7],
                        [291.2, 72.4],
                        [291.6, 72.6],
                        [291.5, 73.7],
                      ],
                      [
                        [276.2, 72.2],
                        [275.2, 70.6],
                        [276.5, 72],
                        [277.4, 73.6],
                        [276.2, 72.2],
                      ],
                      [
                        [108.4, 70.9],
                        [108.9, 70.3],
                        [110.2, 68.5],
                        [111.5, 66.6],
                        [111.3, 67.4],
                        [110, 69.7],
                        [108.4, 70.9],
                      ],
                      [
                        [271.3, 67.8],
                        [269.3, 66.6],
                        [268.7, 66],
                        [272.4, 68.3],
                        [271.3, 67.8],
                      ],
                      [
                        [132.1, 65.8],
                        [134.5, 65.2],
                        [135.8, 65.3],
                        [134.4, 65.6],
                        [132, 66.2],
                        [132.1, 65.8],
                      ],
                      [
                        [286.4, 66.1],
                        [287, 64.5],
                        [287.6, 63.4],
                        [287.6, 64.5],
                        [287, 66],
                        [286.4, 66.1],
                      ],
                      [
                        [266.4, 65.6],
                        [265, 65.3],
                        [266.3, 65.3],
                        [267.8, 65.6],
                        [267.9, 65.9],
                        [266.4, 65.6],
                      ],
                      [
                        [136.4, 64.7],
                        [142.7, 64.4],
                        [148.4, 64.6],
                        [136.4, 64.7],
                      ],
                      [
                        [167, 64.8],
                        [161.2, 64.7],
                        [162.6, 64.6],
                        [187.8, 64.5],
                        [225.8, 64.6],
                        [167, 64.8],
                      ],
                      [
                        [247.6, 64.8],
                        [251.8, 64.5],
                        [257, 64.6],
                        [253, 64.9],
                        [247.6, 64.8],
                      ],
                      [
                        [263.5, 64.7],
                        [264.5, 64.7],
                        [264, 65.2],
                        [263.5, 64.7],
                      ],
                      [
                        [227.5, 64.5],
                        [229.1, 64.5],
                        [228.2, 64.7],
                        [227.5, 64.5],
                      ],
                      [
                        [234.1, 64.5],
                        [241.7, 64.5],
                        [237.8, 64.6],
                        [234.1, 64.5],
                      ],
                      [
                        [259.3, 64.5],
                        [261.5, 64.5],
                        [260.4, 64.7],
                        [259.3, 64.5],
                      ],
                      [
                        [114, 63.1],
                        [114.6, 62],
                        [114.6, 63],
                        [114, 63.1],
                      ],
                      [
                        [284.6, 61.6],
                        [283.2, 59.9],
                        [285.1, 61.5],
                        [286.4, 63.2],
                        [284.6, 61.6],
                      ],
                      [
                        [118, 59.1],
                        [121, 58],
                        [120, 58.4],
                        [119.7, 59.3],
                        [119.9, 59.8],
                        [119, 59.6],
                        [118.2, 59.6],
                        [117.5, 60],
                        [118, 59.1],
                      ],
                      [
                        [282, 59.3],
                        [280.7, 58],
                        [282, 58.8],
                        [282, 59.3],
                      ],
                      [
                        [121.6, 57.2],
                        [122.4, 56.4],
                        [123.2, 56.3],
                        [122.4, 57.1],
                        [121.6, 57.2],
                      ],
                      [
                        [275.4, 56],
                        [275.2, 55.2],
                        [275.3, 54.8],
                        [275.8, 56.2],
                        [275.4, 56],
                      ],
                      [
                        [124, 55.7],
                        [125.5, 54.5],
                        [127.3, 53.4],
                        [127.6, 53.7],
                        [127, 54.4],
                        [124.3, 55.8],
                        [124, 55.7],
                      ],
                      [
                        [129, 53.3],
                        [130.2, 52.8],
                        [130.7, 53],
                        [129.1, 53.6],
                        [129, 53.3],
                      ],
                      [
                        [266.6, 52.4],
                        [267.4, 52.2],
                        [267.5, 52.8],
                        [266.6, 52.4],
                      ],
                      [
                        [138.4, 52],
                        [140.6, 51.7],
                        [143.3, 51.8],
                        [141.2, 52.1],
                        [138.4, 52],
                      ],
                      [
                        [202.9, 52.1],
                        [204.3, 52.1],
                        [203.6, 52.3],
                        [202.9, 52.1],
                      ],
                      [
                        [249.3, 52.1],
                        [250.7, 52.1],
                        [250, 52.3],
                        [249.3, 52.1],
                      ],
                      [
                        [259.2, 52],
                        [256.6, 51.7],
                        [259.7, 51.7],
                        [262.8, 51.8],
                        [259.2, 52],
                      ],
                    ],
                  },
                  symbol: {
                    type: "CIMPolygonSymbol",
                    symbolLayers: [
                      {
                        type: "CIMSolidFill",
                        enable: true,
                        color: [164, 68, 68, 255],
                      },
                    ],
                    angleAlignment: "Map",
                  },
                },
                {
                  type: "CIMMarkerGraphic",
                  geometry: {
                    paths: [
                      [
                        [214.4, 350.4],
                        [217.5, 349.8],
                        [216.8, 350],
                        [216.2, 350.4],
                        [215.4, 350.7],
                        [214.4, 350.4],
                      ],
                      [
                        [203.2, 349.6],
                        [202.5, 349.1],
                        [202.5, 348.8],
                        [203.6, 349.4],
                        [203.6, 350],
                        [203.2, 349.6],
                      ],
                      [
                        [221.6, 349.1],
                        [223.1, 348.9],
                        [222.7, 349.2],
                        [221.6, 349.1],
                      ],
                      [
                        [200.6, 348.7],
                        [200.7, 348.6],
                        [201.2, 348.3],
                        [200.8, 347.5],
                        [200.9, 347.4],
                        [201.3, 349.2],
                        [200.6, 348.7],
                      ],
                      [
                        [227.9, 347.5],
                        [229.3, 347.3],
                        [228.9, 347.6],
                        [227.9, 347.5],
                      ],
                      [
                        [232.2, 346.7],
                        [233.6, 345.6],
                        [234.8, 345.1],
                        [234.8, 345.3],
                        [233.7, 346],
                        [232.3, 346.9],
                        [231.6, 347.8],
                        [232.2, 346.7],
                      ],
                      [
                        [203.9, 339.1],
                        [205.3, 338.9],
                        [204.9, 339.2],
                        [203.9, 339.1],
                      ],
                      [
                        [214, 338.9],
                        [216.5, 338.3],
                        [217.1, 338.1],
                        [214, 339.1],
                        [211.8, 339.1],
                        [214, 338.9],
                      ],
                      [
                        [220.7, 338.1],
                        [221.6, 337.6],
                        [222.3, 337.2],
                        [222.2, 337.8],
                        [220.6, 338.3],
                        [220.7, 338.1],
                      ],
                      [
                        [248.2, 337.2],
                        [249.1, 337.1],
                        [248.3, 337.8],
                        [248.2, 337.2],
                      ],
                      [
                        [240.2, 328],
                        [241, 326.8],
                        [240.2, 328.8],
                        [240.2, 328],
                      ],
                      [
                        [208, 328],
                        [207, 327.5],
                        [206.6, 327.3],
                        [208.6, 327.6],
                        [210.4, 328.1],
                        [209.4, 328.3],
                        [208, 328],
                      ],
                      [
                        [216.2, 327.8],
                        [218, 327.3],
                        [217.9, 327.5],
                        [217, 327.9],
                        [216.3, 328.3],
                        [216.2, 327.8],
                      ],
                      [
                        [220.6, 327.1],
                        [221.8, 326.5],
                        [223.6, 325.9],
                        [223.7, 326.1],
                        [222, 326.8],
                        [220.7, 327.2],
                        [220.6, 327.1],
                      ],
                      [
                        [203.7, 324.4],
                        [203.9, 323.7],
                        [203.9, 325.1],
                        [203.7, 324.4],
                      ],
                      [
                        [244, 324.9],
                        [245.7, 323.2],
                        [244.9, 324.4],
                        [244, 324.9],
                      ],
                      [
                        [248.6, 318.4],
                        [249.4, 318],
                        [250, 317.4],
                        [250.4, 316.8],
                        [249.2, 318.5],
                        [248.6, 318.4],
                      ],
                      [
                        [212.6, 317.3],
                        [213.8, 316.8],
                        [215.6, 316.4],
                        [217, 316.5],
                        [215.4, 316.9],
                        [212.8, 317.4],
                        [212.6, 317.3],
                      ],
                      [
                        [223.1, 313.3],
                        [224.3, 312.4],
                        [224.8, 312.8],
                        [223.7, 312.9],
                        [223.4, 313.1],
                        [223.1, 313.3],
                      ],
                      [
                        [241.5, 313],
                        [242, 311.4],
                        [242.8, 310.6],
                        [242.4, 311.4],
                        [241.9, 312.6],
                        [241.5, 313],
                      ],
                      [
                        [245.6, 303.9],
                        [246.3, 302.6],
                        [246.4, 302.7],
                        [246, 304],
                        [245.7, 305.2],
                        [245.6, 303.9],
                      ],
                      [
                        [208.8, 303.1],
                        [210.6, 300.8],
                        [211.3, 300.3],
                        [211.6, 300.3],
                        [210.6, 301.2],
                        [209.6, 301.8],
                        [209.3, 302.7],
                        [210, 302.6],
                        [211, 301.8],
                        [210.2, 302.7],
                        [208.8, 303.1],
                      ],
                      [
                        [257.2, 301.7],
                        [257.8, 300.1],
                        [258.4, 299.8],
                        [257.8, 301.4],
                        [257.2, 301.7],
                      ],
                      [
                        [247.3, 299.8],
                        [247.2, 294.3],
                        [247.2, 289.3],
                        [246, 288.4],
                        [244.8, 287.1],
                        [246.2, 288.1],
                        [247.6, 289.4],
                        [247.5, 294.8],
                        [247.3, 299.8],
                      ],
                      [
                        [211.3, 291.6],
                        [211.5, 290.1],
                        [211.5, 293.1],
                        [211.3, 291.6],
                      ],
                      [
                        [270.5, 291.8],
                        [270.7, 290.9],
                        [270.7, 292.9],
                        [270.5, 291.8],
                      ],
                      [
                        [236.8, 291.7],
                        [237.2, 290.5],
                        [236.7, 289.8],
                        [236.6, 289.6],
                        [237.5, 290.8],
                        [236.9, 291.8],
                        [236.8, 291.7],
                      ],
                      [
                        [269.4, 288],
                        [268.3, 287.2],
                        [268, 286.8],
                        [269.4, 287.6],
                        [269.9, 288.4],
                        [269.4, 288],
                      ],
                      [
                        [240.9, 287.4],
                        [243.1, 286.8],
                        [242.6, 287.4],
                        [240.9, 287.4],
                      ],
                      [
                        [264.2, 286.9],
                        [266, 286.3],
                        [266.8, 286.2],
                        [264.2, 287.1],
                        [262.6, 287.1],
                        [264.2, 286.9],
                      ],
                      [
                        [211.3, 278.8],
                        [211.5, 277.5],
                        [211.5, 280.1],
                        [211.3, 278.8],
                      ],
                      [
                        [211.3, 274.2],
                        [211.5, 273.5],
                        [211.5, 275.1],
                        [211.3, 274.2],
                      ],
                      [
                        [191.6, 272.4],
                        [191.9, 271],
                        [191.8, 274],
                        [191.6, 272.4],
                      ],
                      [
                        [281.4, 260.1],
                        [282.8, 259.2],
                        [282.8, 259.5],
                        [281.4, 260.4],
                        [281.4, 260.1],
                      ],
                      [
                        [113.3, 256.7],
                        [114.2, 256.5],
                        [114.2, 257.1],
                        [113.3, 256.7],
                      ],
                      [
                        [112.8, 255.3],
                        [112.2, 254.8],
                        [111.6, 254.5],
                        [112.2, 254.1],
                        [113, 255.5],
                        [112.8, 255.3],
                      ],
                      [
                        [167.7, 253.7],
                        [231.5, 253.7],
                        [238.8, 253.7],
                        [235.3, 253.8],
                        [199.6, 253.8],
                        [163.9, 253.8],
                        [160.4, 253.7],
                        [167.7, 253.7],
                      ],
                      [
                        [291.5, 246.7],
                        [292.1, 245.4],
                        [292.4, 245.7],
                        [291.7, 247],
                        [291.5, 246.7],
                      ],
                      [
                        [293.7, 239.8],
                        [294.7, 237.7],
                        [294.5, 238.3],
                        [293.9, 239.8],
                        [293.7, 241],
                        [293.7, 239.8],
                      ],
                      [
                        [106.1, 236.8],
                        [106.3, 235.1],
                        [106.3, 238.5],
                        [106.1, 236.8],
                      ],
                      [
                        [106.1, 223.2],
                        [106.3, 222.3],
                        [106.3, 224.1],
                        [106.1, 223.2],
                      ],
                      [
                        [106.1, 213.8],
                        [106.3, 212.5],
                        [106.3, 215.3],
                        [106.1, 213.8],
                      ],
                      [
                        [106.1, 208.6],
                        [106.3, 207.7],
                        [106.3, 209.7],
                        [106.1, 208.6],
                      ],
                      [
                        [256.8, 207.1],
                        [258.1, 205.8],
                        [259.4, 204.6],
                        [258.2, 205.9],
                        [256.8, 207.1],
                      ],
                      [
                        [236.1, 195.8],
                        [236.3, 194.7],
                        [236.3, 197.1],
                        [236.1, 195.8],
                      ],
                      [
                        [106.1, 193.8],
                        [106.3, 193.1],
                        [106.3, 194.7],
                        [106.1, 193.8],
                      ],
                      [
                        [263.7, 194],
                        [263.9, 193.3],
                        [263.9, 194.7],
                        [263.7, 194],
                      ],
                      [
                        [248.7, 191.7],
                        [250.5, 191.7],
                        [249.6, 191.9],
                        [248.7, 191.7],
                      ],
                      [
                        [172, 191.1],
                        [173.8, 190.7],
                        [174.8, 190.8],
                        [172, 191.1],
                      ],
                      [
                        [163.2, 186.5],
                        [161.8, 185],
                        [163.3, 186.4],
                        [164.7, 188],
                        [163.2, 186.5],
                      ],
                      [
                        [247.6, 181.2],
                        [249, 180.8],
                        [248.2, 181.4],
                        [247.6, 181.2],
                      ],
                      [
                        [119.3, 180],
                        [119.5, 179.3],
                        [119.5, 180.7],
                        [119.3, 180],
                      ],
                      [
                        [159.3, 177.4],
                        [159.5, 176.7],
                        [159.5, 178.3],
                        [159.3, 177.4],
                      ],
                      [
                        [106.1, 176.8],
                        [106.3, 175.9],
                        [106.3, 177.7],
                        [106.1, 176.8],
                      ],
                      [
                        [176.1, 176.4],
                        [176.3, 175.7],
                        [176.3, 177.1],
                        [176.1, 176.4],
                      ],
                      [
                        [106.1, 169.6],
                        [106.3, 168.7],
                        [106.3, 170.5],
                        [106.1, 169.6],
                      ],
                      [
                        [221, 169.9],
                        [219.8, 168.6],
                        [221.1, 169.8],
                        [222.3, 171.2],
                        [221, 169.9],
                      ],
                      [
                        [106.1, 165.6],
                        [106.3, 164.7],
                        [106.3, 166.5],
                        [106.1, 165.6],
                      ],
                      [
                        [295.3, 165.6],
                        [295.5, 164.7],
                        [295.5, 166.5],
                        [295.3, 165.6],
                      ],
                      [
                        [212.1, 166.5],
                        [213.5, 166.5],
                        [212.8, 166.7],
                        [212.1, 166.5],
                      ],
                      [
                        [295.3, 161.6],
                        [295.5, 160.7],
                        [295.5, 162.5],
                        [295.3, 161.6],
                      ],
                      [
                        [106.1, 159],
                        [106.3, 158.1],
                        [106.3, 160.1],
                        [106.1, 159],
                      ],
                      [
                        [151.4, 158.7],
                        [149.4, 156.6],
                        [151.5, 158.6],
                        [153.6, 160.7],
                        [151.4, 158.7],
                      ],
                      [
                        [106.1, 149.8],
                        [106.3, 149.1],
                        [106.3, 150.7],
                        [106.1, 149.8],
                      ],
                      [
                        [134.5, 143.2],
                        [134.7, 142.1],
                        [134.7, 144.3],
                        [134.5, 143.2],
                      ],
                      [
                        [106.1, 135],
                        [106.3, 134.3],
                        [106.3, 135.9],
                        [106.1, 135],
                      ],
                      [
                        [106.1, 127.6],
                        [106.3, 126.9],
                        [106.3, 128.3],
                        [106.1, 127.6],
                      ],
                      [
                        [106.2, 120.6],
                        [106.3, 117.9],
                        [106.3, 123.5],
                        [106.2, 120.6],
                      ],
                      [
                        [106.1, 112.4],
                        [106.3, 111.5],
                        [106.3, 113.3],
                        [106.1, 112.4],
                      ],
                      [
                        [106.1, 106.4],
                        [106.3, 105.3],
                        [106.3, 107.5],
                        [106.1, 106.4],
                      ],
                      [
                        [106.1, 99],
                        [106.3, 98.1],
                        [106.3, 100.1],
                        [106.1, 99],
                      ],
                      [
                        [106.1, 80],
                        [106.3, 79.1],
                        [106.3, 80.9],
                        [106.1, 80],
                      ],
                      [
                        [293.8, 80.2],
                        [293.7, 79.1],
                        [294, 79.5],
                        [294.5, 80.5],
                        [294.5, 80.8],
                        [293.8, 80.2],
                      ],
                      [
                        [292.2, 74.6],
                        [291.9, 73.5],
                        [292, 72.2],
                        [292.4, 73.1],
                        [292.9, 74.9],
                        [292.9, 75.2],
                        [292.2, 74.6],
                      ],
                      [
                        [109.2, 69.3],
                        [109.6, 68.4],
                        [109.6, 69.6],
                        [109.2, 69.3],
                      ],
                      [
                        [149.9, 64.9],
                        [173.1, 64.9],
                        [175.7, 64.9],
                        [174.4, 65],
                        [161.4, 65],
                        [148.5, 65],
                        [147.2, 64.9],
                        [149.9, 64.9],
                      ],
                      [
                        [192.3, 64.9],
                        [207.9, 64.9],
                        [208.9, 65],
                        [200.2, 65],
                        [192.3, 64.9],
                      ],
                      [
                        [224.7, 64.9],
                        [241.5, 64.9],
                        [233, 65],
                        [223.6, 65],
                        [224.7, 64.9],
                      ],
                      [
                        [252.3, 64.9],
                        [256.5, 64.9],
                        [254.4, 65.1],
                        [252.3, 64.9],
                      ],
                      [
                        [260.1, 64.9],
                        [262.3, 64.9],
                        [261.2, 65.1],
                        [260.1, 64.9],
                      ],
                      [
                        [283.1, 59.6],
                        [282.7, 58.8],
                        [284.4, 60.1],
                        [283.1, 59.6],
                      ],
                      [
                        [153.5, 51.7],
                        [169.7, 51.7],
                        [161.6, 51.8],
                        [153.5, 51.7],
                      ],
                      [
                        [178.9, 51.7],
                        [181.1, 51.7],
                        [180, 51.9],
                        [178.9, 51.7],
                      ],
                      [
                        [182.9, 51.7],
                        [184.3, 51.7],
                        [183.6, 51.9],
                        [182.9, 51.7],
                      ],
                      [
                        [189.1, 51.7],
                        [190.9, 51.7],
                        [190, 51.9],
                        [189.1, 51.7],
                      ],
                      [
                        [192.7, 51.7],
                        [194.3, 51.7],
                        [193.4, 51.9],
                        [192.7, 51.7],
                      ],
                      [
                        [196.3, 51.7],
                        [199.1, 51.7],
                        [197.8, 51.9],
                        [196.3, 51.7],
                      ],
                      [
                        [203.1, 51.7],
                        [205.5, 51.7],
                        [204.2, 51.9],
                        [203.1, 51.7],
                      ],
                      [
                        [209.9, 51.7],
                        [212.5, 51.7],
                        [211.2, 51.9],
                        [209.9, 51.7],
                      ],
                      [
                        [216.9, 51.7],
                        [221.5, 51.7],
                        [219.2, 51.8],
                        [216.9, 51.7],
                      ],
                      [
                        [226.5, 51.7],
                        [229.5, 51.7],
                        [228, 51.9],
                        [226.5, 51.7],
                      ],
                      [
                        [233.1, 51.7],
                        [237.1, 51.7],
                        [235, 51.9],
                        [233.1, 51.7],
                      ],
                      [
                        [239.9, 51.7],
                        [241.7, 51.7],
                        [240.8, 51.9],
                        [239.9, 51.7],
                      ],
                      [
                        [249.5, 51.7],
                        [252.7, 51.7],
                        [251, 51.9],
                        [249.5, 51.7],
                      ],
                      [
                        [254.9, 51.7],
                        [256.3, 51.7],
                        [255.6, 51.9],
                        [254.9, 51.7],
                      ],
                    ],
                  },
                  symbol: {
                    type: "CIMPolygonSymbol",
                    symbolLayers: [
                      {
                        type: "CIMSolidFill",
                        enable: true,
                        color: [173, 76, 76, 255],
                      },
                    ],
                    angleAlignment: "Map",
                  },
                },
                {
                  type: "CIMMarkerGraphic",
                  geometry: {
                    paths: [
                      [
                        [207, 350.4],
                        [207.8, 350],
                        [208.6, 350.4],
                        [207.8, 350.8],
                        [207, 350.4],
                      ],
                      [
                        [202, 340.2],
                        [203.7, 338.9],
                        [203.1, 339.7],
                        [202, 340.2],
                      ],
                      [
                        [245.4, 339.7],
                        [246.5, 339.1],
                        [245.2, 340.4],
                        [245.4, 339.7],
                      ],
                      [
                        [252.7, 333.7],
                        [253.4, 332.7],
                        [254.6, 332.1],
                        [252.7, 333.7],
                      ],
                      [
                        [245.2, 322.9],
                        [247.3, 321.3],
                        [247.3, 321.6],
                        [245.9, 323],
                        [245.7, 323.2],
                        [245.2, 322.9],
                      ],
                      [
                        [231.6, 322.3],
                        [232.1, 322.1],
                        [233.4, 321.6],
                        [233.5, 321.8],
                        [231.6, 322.3],
                      ],
                      [
                        [203.6, 321.2],
                        [204, 320.8],
                        [204.4, 320.2],
                        [204.8, 319.6],
                        [204.8, 320.4],
                        [203.6, 321.2],
                      ],
                      [
                        [247.6, 320.3],
                        [248.4, 319.3],
                        [248.6, 319.8],
                        [247.6, 320.3],
                      ],
                      [
                        [238.8, 316.3],
                        [240.3, 315],
                        [238.4, 317],
                        [238.8, 316.3],
                      ],
                      [
                        [268.4, 307.6],
                        [268.8, 306.8],
                        [269.1, 307.6],
                        [268.7, 308.4],
                        [268.4, 307.6],
                      ],
                      [
                        [206.2, 304.8],
                        [207, 304.4],
                        [207.6, 304.8],
                        [206.8, 305.2],
                        [206.2, 304.8],
                      ],
                      [
                        [210.8, 300.1],
                        [211.2, 299],
                        [211.2, 300.2],
                        [210.8, 300.1],
                      ],
                      [
                        [257.2, 300.2],
                        [257.6, 299.4],
                        [258, 299.8],
                        [257.6, 300.6],
                        [257.2, 300.2],
                      ],
                      [
                        [211.3, 296.4],
                        [211.5, 295.3],
                        [211.5, 297.5],
                        [211.3, 296.4],
                      ],
                      [
                        [235.3, 295.6],
                        [236.4, 295.1],
                        [235.6, 295.9],
                        [235.3, 295.6],
                      ],
                      [
                        [247.6, 293],
                        [248, 290.8],
                        [248.3, 293],
                        [247.9, 295.2],
                        [247.6, 293],
                      ],
                      [
                        [270.9, 291.5],
                        [271.2, 290.2],
                        [271.3, 293],
                        [270.9, 291.5],
                      ],
                      [
                        [246.6, 288.4],
                        [246.2, 287.6],
                        [247.5, 289],
                        [246.6, 288.4],
                      ],
                      [
                        [238, 288.5],
                        [238.9, 287.4],
                        [239.7, 286.6],
                        [239, 287.7],
                        [238, 288.5],
                      ],
                      [
                        [117.7, 259.8],
                        [116.7, 258.4],
                        [118.4, 259.8],
                        [119.4, 261.2],
                        [117.7, 259.8],
                      ],
                      [
                        [133.8, 253.2],
                        [135, 253.2],
                        [134.9, 253.6],
                        [133.8, 253.2],
                      ],
                      [
                        [110.2, 252.8],
                        [110.2, 252.4],
                        [109.8, 251.5],
                        [109, 250.6],
                        [109.9, 251.4],
                        [110.6, 252.4],
                        [110.9, 252.9],
                        [110.9, 253.2],
                        [110.2, 252.8],
                      ],
                      [
                        [125.8, 248.7],
                        [124.1, 246.4],
                        [125.6, 248],
                        [126.7, 249.6],
                        [125.8, 248.7],
                      ],
                      [
                        [273.9, 248.9],
                        [275.2, 247.4],
                        [276.2, 246.6],
                        [275.3, 247.9],
                        [273.9, 248.9],
                      ],
                      [
                        [107.6, 247.1],
                        [107.8, 246.1],
                        [108.2, 247.4],
                        [108, 248.4],
                        [107.6, 247.1],
                      ],
                      [
                        [107.3, 244.9],
                        [107, 244.1],
                        [107.9, 245.1],
                        [107.3, 244.9],
                      ],
                      [
                        [278.2, 243.2],
                        [279, 242],
                        [278.6, 243.2],
                        [277.8, 244.4],
                        [278.2, 243.2],
                      ],
                      [
                        [119.7, 234.2],
                        [119.9, 232.7],
                        [119.9, 235.9],
                        [119.7, 234.2],
                      ],
                      [
                        [105.2, 234.5],
                        [105.9, 233],
                        [106.3, 233.2],
                        [106, 234.7],
                        [105.6, 235.2],
                        [105.2, 234.5],
                      ],
                      [
                        [106, 230.6],
                        [105.5, 230.3],
                        [105.5, 230],
                        [106.1, 228],
                        [106.3, 228.9],
                        [106.1, 231.2],
                        [106, 230.6],
                      ],
                      [
                        [119.8, 219.4],
                        [119.9, 213.7],
                        [119.9, 225.3],
                        [119.8, 219.4],
                      ],
                      [
                        [244.2, 208.4],
                        [243.4, 208.1],
                        [244.2, 208],
                        [245.6, 208.4],
                        [244.2, 208.4],
                      ],
                      [
                        [254, 208.4],
                        [255.2, 208],
                        [255.2, 208.4],
                        [254, 208.8],
                        [254, 208.4],
                      ],
                      [
                        [241.7, 206.9],
                        [241.6, 206.6],
                        [243.1, 208],
                        [241.7, 206.9],
                      ],
                      [
                        [119.8, 200],
                        [119.9, 196.3],
                        [119.9, 203.7],
                        [119.8, 200],
                      ],
                      [
                        [258.6, 205.6],
                        [260.4, 204],
                        [259, 205.6],
                        [257.2, 207.2],
                        [258.6, 205.6],
                      ],
                      [
                        [261.4, 202.7],
                        [262.3, 201.8],
                        [261.6, 202.9],
                        [260.7, 203.8],
                        [261.4, 202.7],
                      ],
                      [
                        [106.1, 198.8],
                        [106.3, 198.1],
                        [106.3, 199.5],
                        [106.1, 198.8],
                      ],
                      [
                        [263.2, 199.2],
                        [263.6, 198],
                        [264, 198],
                        [263.6, 199.2],
                        [263.2, 199.2],
                      ],
                      [
                        [250.4, 198.3],
                        [251.8, 197.2],
                        [253, 196.2],
                        [252, 197.3],
                        [250.7, 198.4],
                        [250.4, 198.3],
                      ],
                      [
                        [246.4, 193.7],
                        [247.3, 192.6],
                        [248.1, 191.8],
                        [247.4, 192.9],
                        [246.4, 193.7],
                      ],
                      [
                        [236.1, 193],
                        [236.4, 191.4],
                        [236.7, 190.6],
                        [236.7, 191.4],
                        [236.4, 193],
                        [236.1, 193.8],
                        [236.1, 193],
                      ],
                      [
                        [263.5, 192.2],
                        [263.2, 190.9],
                        [263.6, 191.2],
                        [263.9, 192.5],
                        [263.5, 192.2],
                      ],
                      [
                        [119.8, 152],
                        [119.8, 129.3],
                        [119.9, 127],
                        [119.9, 131.7],
                        [119.9, 172.3],
                        [119.9, 177],
                        [119.8, 174.7],
                        [119.8, 152],
                      ],
                      [
                        [170.2, 190.8],
                        [169.4, 190.5],
                        [170.2, 190.4],
                        [171.6, 190.8],
                        [170.2, 190.8],
                      ],
                      [
                        [237, 189.4],
                        [234.1, 185.1],
                        [231.6, 182.2],
                        [235.9, 186.5],
                        [237.2, 189.8],
                        [237, 189.4],
                      ],
                      [
                        [178.8, 189.4],
                        [180.2, 188.6],
                        [183.3, 186],
                        [184.4, 185],
                        [183.5, 186.4],
                        [178.8, 189.4],
                      ],
                      [
                        [163, 186.7],
                        [161.1, 184.2],
                        [164.3, 188],
                        [163, 186.7],
                      ],
                      [
                        [244.8, 179.6],
                        [243.3, 177.6],
                        [245.2, 179.4],
                        [247.5, 180.9],
                        [247.6, 181.2],
                        [244.8, 179.6],
                      ],
                      [
                        [106.1, 179.6],
                        [106.3, 178.9],
                        [106.3, 180.3],
                        [106.1, 179.6],
                      ],
                      [
                        [159.4, 180],
                        [159.3, 178.9],
                        [159.8, 179.6],
                        [159.9, 180.7],
                        [159.4, 180],
                      ],
                      [
                        [171, 179.1],
                        [170.2, 178.3],
                        [171.3, 179],
                        [172.1, 180],
                        [171, 179.1],
                      ],
                      [
                        [174.7, 178.9],
                        [176, 177.9],
                        [174, 180],
                        [174.7, 178.9],
                      ],
                      [
                        [186.4, 178.5],
                        [187.7, 175.2],
                        [187.7, 175.7],
                        [187.2, 177.2],
                        [186.4, 178.5],
                      ],
                      [
                        [169.8, 177.2],
                        [171.3, 174],
                        [171.1, 174.8],
                        [170.2, 177.1],
                        [169.8, 177.2],
                      ],
                      [
                        [240.6, 174.5],
                        [236.2, 169.5],
                        [238.1, 171.4],
                        [243.1, 177.2],
                        [240.6, 174.5],
                      ],
                      [
                        [159.2, 175.6],
                        [159.6, 174.4],
                        [160, 174.4],
                        [159.6, 175.6],
                        [159.2, 175.6],
                      ],
                      [
                        [225.2, 175],
                        [224.4, 173.9],
                        [225.5, 174.9],
                        [226.3, 176],
                        [225.2, 175],
                      ],
                      [
                        [174.7, 174.4],
                        [174.2, 173.6],
                        [175.4, 174.4],
                        [174.7, 174.4],
                      ],
                      [
                        [221.8, 171.1],
                        [220.6, 169.8],
                        [221.9, 171],
                        [223.2, 172.3],
                        [221.8, 171.1],
                      ],
                      [
                        [194.2, 171.4],
                        [197, 169.9],
                        [195, 171.2],
                        [194.2, 171.4],
                      ],
                      [
                        [159.2, 168.3],
                        [157.9, 166.4],
                        [158.9, 167.4],
                        [160.4, 169.3],
                        [159.2, 168.3],
                      ],
                      [
                        [199, 168.4],
                        [200.6, 167.2],
                        [201.8, 166.8],
                        [200.2, 168],
                        [199, 168.4],
                      ],
                      [
                        [210.5, 166.9],
                        [214, 166.6],
                        [217.5, 166.9],
                        [214, 167.1],
                        [210.5, 166.9],
                      ],
                      [
                        [233.4, 166.6],
                        [230.5, 163.2],
                        [228.1, 160.4],
                        [231.4, 163.8],
                        [234.1, 167.2],
                        [233.4, 166.6],
                      ],
                      [
                        [156.2, 164.3],
                        [155, 163],
                        [156.3, 164.2],
                        [157.5, 165.6],
                        [156.2, 164.3],
                      ],
                      [
                        [181, 165.2],
                        [181.3, 165],
                        [183.1, 164.6],
                        [184.2, 163.9],
                        [183.2, 164.7],
                        [181, 165.2],
                      ],
                      [
                        [186.5, 162.4],
                        [187.9, 161.6],
                        [185.8, 163.2],
                        [186.5, 162.4],
                      ],
                      [
                        [168.7, 160.8],
                        [166.8, 158.5],
                        [168.6, 160.3],
                        [171.3, 162.5],
                        [171.4, 162.7],
                        [168.7, 160.8],
                      ],
                      [
                        [153, 160.7],
                        [151.8, 159.4],
                        [153.1, 160.6],
                        [154.3, 162],
                        [153, 160.7],
                      ],
                      [
                        [150.4, 158.2],
                        [147.2, 157.1],
                        [145, 157],
                        [147.2, 156.9],
                        [150.6, 158],
                        [151.5, 159.2],
                        [150.4, 158.2],
                      ],
                      [
                        [162.7, 154.8],
                        [159.2, 150.7],
                        [160.5, 151.9],
                        [164.1, 155.8],
                        [166.3, 158.3],
                        [162.7, 154.8],
                      ],
                      [
                        [213.7, 156.1],
                        [215.1, 156.1],
                        [214.4, 156.3],
                        [213.7, 156.1],
                      ],
                      [
                        [199.6, 154.7],
                        [200, 152.6],
                        [200.4, 149.8],
                        [200.6, 151.4],
                        [199.8, 154.7],
                        [199.6, 154.7],
                      ],
                      [
                        [106.1, 153],
                        [106.3, 152.1],
                        [106.3, 154.1],
                        [106.1, 153],
                      ],
                      [
                        [217, 151.2],
                        [215.5, 150.2],
                        [214.9, 149.6],
                        [217.5, 151.6],
                        [217, 151.2],
                      ],
                      [
                        [147.4, 146.1],
                        [148.4, 145.7],
                        [149.1, 146.1],
                        [147.4, 146.1],
                      ],
                      [
                        [225, 143.9],
                        [224.6, 142.8],
                        [226.3, 145.6],
                        [225, 143.9],
                      ],
                      [
                        [161.8, 142.8],
                        [162.1, 141.9],
                        [162.1, 144.1],
                        [161.8, 142.8],
                      ],
                      [
                        [145, 143.8],
                        [144.9, 142.3],
                        [145.2, 142.9],
                        [145, 143.8],
                      ],
                      [
                        [151.2, 142.8],
                        [151.7, 142.3],
                        [151.7, 143.3],
                        [151.2, 142.8],
                      ],
                      [
                        [105.3, 141.2],
                        [105.9, 140.1],
                        [106, 141.7],
                        [105.5, 142.7],
                        [105.3, 141.2],
                      ],
                      [
                        [134.5, 140.8],
                        [135.1, 139],
                        [134.8, 140.6],
                        [134.5, 140.8],
                      ],
                      [
                        [147.1, 139.5],
                        [148.2, 139.2],
                        [149.3, 139.5],
                        [148.2, 139.8],
                        [147.1, 139.5],
                      ],
                      [
                        [213.7, 138.9],
                        [215.1, 138.9],
                        [214.4, 139.1],
                        [213.7, 138.9],
                      ],
                      [
                        [137.1, 134.6],
                        [139.1, 132.4],
                        [136.9, 135.2],
                        [137.1, 134.6],
                      ],
                      [
                        [157, 132.1],
                        [154.8, 130.3],
                        [153.8, 129.6],
                        [155, 130.2],
                        [157.4, 132],
                        [158.3, 133.1],
                        [157, 132.1],
                      ],
                      [
                        [105.4, 119.6],
                        [105.7, 118.2],
                        [105.7, 120.9],
                        [105.4, 119.6],
                      ],
                      [
                        [119.8, 96.6],
                        [119.9, 89.3],
                        [119.9, 104.1],
                        [119.8, 96.6],
                      ],
                      [
                        [105.5, 96.4],
                        [105.5, 95.3],
                        [105.5, 94.9],
                        [106.1, 93.7],
                        [106.3, 92.7],
                        [106.3, 94.1],
                        [105.7, 96.4],
                        [105.5, 96.4],
                      ],
                      [
                        [106.1, 89.7],
                        [105.6, 87.4],
                        [105.2, 86.9],
                        [105.8, 86.9],
                        [106.3, 89.8],
                        [106.2, 92.2],
                        [106.1, 89.7],
                      ],
                      [
                        [105.7, 86.1],
                        [105.3, 84.4],
                        [106.4, 85.5],
                        [105.7, 86.1],
                      ],
                      [
                        [120.8, 77.4],
                        [123.7, 73],
                        [123.2, 74],
                        [121.5, 76.6],
                        [120.8, 77.4],
                      ],
                      [
                        [274.6, 71.1],
                        [271.4, 68.1],
                        [272, 68.4],
                        [276.7, 73.2],
                        [274.6, 71.1],
                      ],
                      [
                        [125.1, 70.9],
                        [127.6, 68.9],
                        [126.1, 70.4],
                        [125.1, 70.9],
                      ],
                      [
                        [197.8, 65.2],
                        [261.4, 65.2],
                        [200.6, 65.4],
                        [137, 65.4],
                        [197.8, 65.2],
                      ],
                      [
                        [111.8, 64.7],
                        [111.8, 64.5],
                        [112.6, 64.1],
                        [113.2, 63.9],
                        [111.8, 64.7],
                      ],
                      [
                        [114.6, 61.2],
                        [115.7, 60.4],
                        [115.2, 61.2],
                        [114.1, 62],
                        [114.6, 61.2],
                      ],
                      [
                        [117.5, 58.3],
                        [118.2, 58],
                        [118.8, 57.6],
                        [119.4, 57.2],
                        [120, 57.6],
                        [119.6, 57.8],
                        [119, 58.1],
                        [118, 58.7],
                        [117.5, 58.3],
                      ],
                      [
                        [127.9, 52.7],
                        [128.5, 52.6],
                        [129.4, 52.1],
                        [129.7, 52.3],
                        [128.6, 53.1],
                        [127.9, 52.7],
                      ],
                      [
                        [138.2, 51.3],
                        [140, 50.9],
                        [141.8, 51.3],
                        [140, 51.6],
                        [138.2, 51.3],
                      ],
                      [
                        [142.7, 51.1],
                        [149.2, 51.3],
                        [145.8, 51.5],
                        [142.7, 51.1],
                      ],
                      [
                        [151.8, 51.2],
                        [163.8, 50.9],
                        [176, 51.3],
                        [151.8, 51.2],
                      ],
                      [
                        [178.2, 51.2],
                        [182.8, 51.2],
                        [180.4, 51.5],
                        [178.2, 51.2],
                      ],
                      [
                        [183.6, 51.2],
                        [189.8, 50.9],
                        [196, 51.2],
                        [189.8, 51.6],
                        [183.6, 51.2],
                      ],
                      [
                        [197, 51.2],
                        [241.2, 51.3],
                        [219, 51.6],
                        [197, 51.2],
                      ],
                      [
                        [242.6, 51.2],
                        [253, 50.9],
                        [263.6, 51.3],
                        [242.6, 51.2],
                      ],
                    ],
                  },
                  symbol: {
                    type: "CIMPolygonSymbol",
                    symbolLayers: [
                      {
                        type: "CIMSolidFill",
                        enable: true,
                        color: [179, 79, 84, 255],
                      },
                    ],
                    angleAlignment: "Map",
                  },
                },
              ],
              scaleSymbolsProportionally: true,
              respectFrame: true,
              clippingPath: {
                type: "CIMClippingPath",
                clippingType: "Intersect",
                path: {
                  rings: [
                    [
                      [0, 0],
                      [400, 0],
                      [400, 400],
                      [0, 400],
                      [0, 0],
                    ],
                  ],
                },
              },
            },
          ],
          animations: [
            {
              type: "CIMSymbolAnimationTransparency",
              toTransparency: 100,
              animatedSymbolProperties: {
                type: "CIMAnimatedSymbolProperties",
                playAnimation: true,
                randomizeStartTime: false,
                repeatType: "Loop",
                repeatDelay: 0,
                duration: 1,
                easing: "Linear",
                reverseAnimation: true,
              },
            },
          ],
        },
      },
    });

    // At the top of your script, add this configuration object
    const THEME_CONFIG = {
      // 'nrw-percentage': {
      //   field: 'ranking_descr',
      //   categories: [
      //     {
      //       values: ["Not specified", "Negative NRW"],  // Array of values to match
      //       label: "Non Specified and Negative NRW",
      //       color: [128, 128, 128, 0.6] // Dark Grey
      //     },
      //     {
      //       values: ["< 25%"],
      //       label: "Less than 25%",
      //       color: [44, 123, 182, 0.6] // Blue
      //     },
      //     {
      //       values: ["25 to 35%", "35 to 45%"],  // Combined class
      //       label: "26% to 45%",
      //       color: [253, 174, 97, 0.6] // Orange
      //     },
      //     {
      //       values: ["> 45%"],
      //       label: "45% above",
      //       color: [215, 48, 39, 0.6] // Red
      //     }
      //   ]
      // },
      "nrw-percentage": {
        field: "classValue", // Changed from 'ranking_descr' to 'classValue'
        categories: [
          {
            value: "1", // Changed from array of values to single value
            label: "Non Specified and Negative NRW",
            color: [128, 128, 128, 0.6], // Dark Grey
          },
          {
            value: "2",
            label: "Less than 25%",
            color: [44, 123, 182, 0.6], // Blue
          },
          {
            value: "3",
            label: "26% to 45%",
            color: [253, 174, 97, 0.6], // Orange
          },
          {
            value: "4",
            label: "45% above",
            color: [215, 48, 39, 0.6], // Red
          },
        ],
      },
      "nrw-status": {
        field: "status_descr",
        categories: [
          {
            value: "Not specified",
            label: "Not specified",
            color: [189, 189, 189, 0.6],
          },
          {
            value: "No inflow",
            label: "No inflow",
            color: [253, 174, 97, 0.6],
          },
          {
            value: "Zero inflow",
            label: "Zero inflow",
            color: [255, 255, 191, 0.6],
          },
          {
            value: "No BMAC data",
            label: "No BMAC data",
            color: [166, 217, 106, 0.6],
          },
          {
            value: "Negative NRW",
            label: "Negative NRW",
            color: [26, 150, 65, 0.6],
          },
          {
            value: "Positive NRW",
            label: "Positive NRW",
            color: [215, 48, 39, 0.6],
          },
        ],
      },
      "operational-status": {
        field: "category_name",
        categories: [
          {
            value: "Not specified",
            label: "Not specified",
            color: [189, 189, 189, 0.6],
          },
          {
            value: "Active - hydraulically isolated",
            label: "Active - hydraulically isolated",
            color: [44, 123, 182, 0.6],
          },
          {
            value: "Active - open boundary",
            label: "Active - open boundary",
            color: [171, 217, 233, 0.6],
          },
          {
            value: "Active - bypassed mp",
            label: "Active - bypassed mp",
            color: [253, 174, 97, 0.6],
          },
          {
            value: "Active - pending zpt",
            label: "Active - pending zpt",
            color: [215, 48, 39, 0.6],
          },
        ],
      },
      "hardware-alarm": {
        field: "Missing_Transmission",
        categories: [
          {
            value: "5", // Changed from ">3" to "5"
            label: "Alarm Triggered",
            symbol: symbolCIM,
          },
          {
            value: "no_alarm",
            label: "No Alarm",
            symbol: {
              type: "picture-marker",
              url: "./dataloggers.png",
              width: "25px",
              height: "25px",
            },
          },
        ],
      },
    };

    // 2. Add all these utility functions together
    function findLayerByTitle(title) {
      let targetLayer = null;
      displayMap.layers.forEach((layer) => {
        if (layer.title === title) {
          targetLayer = layer;
        }
      });
      return targetLayer;
    }

    function updateThemeOptions(layerTitle) {
      const themeSelect = document.getElementById("thematicThemeSelect");

      // Clear existing theme options except Default
      while (themeSelect.options.length > 1) {
        themeSelect.remove(1);
      }

      // Enable/disable theme select based on layer selection
      if (layerTitle === "none") {
        themeSelect.disabled = true;
        return;
      }

      themeSelect.disabled = false;

      // Add theme options based on layer
      if (layerTitle === "DMZ Boundaries") {
        const themes = [
          { value: "nrw-percentage", text: "DMA NRW Percentage" },
          { value: "nrw-status", text: "DMA NRW Status" },
          { value: "operational-status", text: "DMA Operational Status" },
        ];

        themes.forEach((theme) => {
          const option = document.createElement("option");
          option.value = theme.value;
          option.text = theme.text;
          themeSelect.add(option);
        });
      } else if (layerTitle === "Data Loggers") {
        const themes = [{ value: "hardware-alarm", text: "Hardware Alarm" }];

        themes.forEach((theme) => {
          const option = document.createElement("option");
          option.value = theme.value;
          option.text = theme.text;
          themeSelect.add(option);
        });
      }
    }

    function applyThematicRenderer(layerTitle, theme) {
      const layer = findLayerByTitle(layerTitle);
      if (!layer) return;

      // Create renderer based on theme configuration
      const createRenderer = (themeKey, layerType) => {
        const themeConfig = THEME_CONFIG[themeKey];

        if (layerType === "Data Loggers" && themeKey === "hardware-alarm") {
          // Special handling for Data Loggers hardware alarm
          return {
            type: "unique-value",
            field: "Missing_Transmission",
            defaultSymbol: THEME_CONFIG["hardware-alarm"].categories[1].symbol, // No Alarm symbol for empty values
            uniqueValueInfos: [
              {
                value: "5", // Exact value of 5
                symbol: THEME_CONFIG["hardware-alarm"].categories[0].symbol, // Alarm Triggered symbol
                label: "Alarm Triggered",
              },
            ],
          };
        } else if (themeKey === "nrw-percentage") {
          // Updated handling for nrw-percentage using classValue
          return {
            type: "unique-value",
            field: themeConfig.field,
            defaultSymbol: {
              type: "simple-fill",
              color: [200, 200, 200, 0.6],
              outline: { color: [128, 128, 128, 0.8], width: 0.5 },
            },
            uniqueValueInfos: themeConfig.categories.map((category) => ({
              value: category.value,
              symbol: {
                type: "simple-fill",
                color: category.color,
                outline: { color: [128, 128, 128, 0.8], width: 0.5 },
              },
              label: category.label,
            })),
          };
          // // Special handling for nrw-percentage with combined classes
          // return {
          //   type: "unique-value",
          //   field: themeConfig.field,
          //   defaultSymbol: {
          //     type: "simple-fill",
          //     color: [200, 200, 200, 0.6],
          //     outline: { color: [128, 128, 128, 0.8], width: 0.5 }
          //   },
          //   uniqueValueInfos: themeConfig.categories.flatMap(category =>
          //     category.values.map(value => ({
          //       value: value,
          //       symbol: {
          //         type: "simple-fill",
          //         color: category.color,
          //         outline: { color: [128, 128, 128, 0.8], width: 0.5 }
          //       },
          //       label: category.label
          //     }))
          //   )
          // };
        } else {
          // Regular handling for other themes
          return {
            type: "unique-value",
            field: themeConfig.field,
            defaultSymbol: {
              type: "simple-fill",
              color: [200, 200, 200, 0.6],
              outline: { color: [128, 128, 128, 0.8], width: 0.5 },
            },
            uniqueValueInfos: themeConfig.categories.map((category) => ({
              value: category.value,
              symbol: {
                type: "simple-fill",
                color: category.color,
                outline: { color: [128, 128, 128, 0.8], width: 0.5 },
              },
            })),
          };
        }
      };

      // Apply renderer to layers
      if (layer.layers) {
        if (layerTitle === "Data Loggers") {
          // Handle Data Loggers layer structure (nested group layers)
          layer.layers.forEach((regionGroup) => {
            regionGroup.layers.forEach((subtypeGroupLayer) => {
              subtypeGroupLayer.when(() => {
                subtypeGroupLayer.sublayers.forEach((sublayer) => {
                  // Store original renderer if not already stored
                  if (!originalRenderers.has(sublayer.id)) {
                    originalRenderers.set(sublayer.id, sublayer.renderer);
                  }

                  if (theme === "default") {
                    // Restore original renderer
                    sublayer.renderer = originalRenderers.get(sublayer.id);
                  } else {
                    // Apply thematic renderer
                    sublayer.renderer = createRenderer(theme, layerTitle);
                  }
                });
              });
            });
          });
        } else {
          // Handle DMZ Boundaries and other layers
          layer.layers.forEach((subtypeGroupLayer) => {
            if (subtypeGroupLayer.type === "subtype-group") {
              subtypeGroupLayer.when(() => {
                subtypeGroupLayer.sublayers.forEach((sublayer) => {
                  // Store original renderer if not already stored
                  if (!originalRenderers.has(sublayer.id)) {
                    originalRenderers.set(sublayer.id, sublayer.renderer);
                  }

                  if (theme === "default") {
                    // Restore original renderer
                    sublayer.renderer = originalRenderers.get(sublayer.id);
                    sublayer.labelingInfo = [labelClassDMZBoundariesNamesOnly];
                  } else {
                    // Apply thematic renderer and appropriate labels
                    sublayer.renderer = createRenderer(theme, layerTitle);

                    // Apply appropriate labels based on theme
                    if (theme === "nrw-percentage") {
                      sublayer.labelingInfo = [labelClassDMZBoundaries];
                    } else {
                      sublayer.labelingInfo = [
                        labelClassDMZBoundariesNamesOnly,
                      ];
                    }
                  }

                  sublayer.popupTemplate = sublayer.popupTemplate;
                });
              });
            }
          });
        }
      }
    }

    // 3. Add the initialization function
    function initializeThematic() {
      if (isThematicInitialized) return;

      const layerSelect = document.getElementById("thematicLayerSelect");
      const themeSelect = document.getElementById("thematicThemeSelect");
      const themeLegendBtn = document.getElementById("themeLegendBtn");
      const legendPopup = document.getElementById("themeLegendPopup");
      const closeLegendBtn = document.getElementById("closeLegendPopup");

      // Function to reset layer renderers
      const resetLayerRenderers = (layer) => {
        if (layer.title === "Data Loggers") {
          // Handle nested structure of Data Loggers
          layer.layers.forEach((regionGroup) => {
            regionGroup.layers.forEach((subtypeGroupLayer) => {
              subtypeGroupLayer.when(() => {
                subtypeGroupLayer.sublayers.forEach((sublayer) => {
                  if (originalRenderers.has(sublayer.id)) {
                    sublayer.renderer = originalRenderers.get(sublayer.id);
                  }
                });
              });
            });
          });
        } else {
          // Handle other layers (like DMZ Boundaries)
          layer.layers.forEach((subtypeGroupLayer) => {
            if (subtypeGroupLayer.type === "subtype-group") {
              subtypeGroupLayer.when(() => {
                subtypeGroupLayer.sublayers.forEach((sublayer) => {
                  if (originalRenderers.has(sublayer.id)) {
                    sublayer.renderer = originalRenderers.get(sublayer.id);
                    sublayer.labelingInfo = [labelClassDMZBoundariesNamesOnly];
                  }
                });
              });
            }
          });
        }
      };

      // Layer selection change
      layerSelect.addEventListener("change", (e) => {
        const selectedOption = layerSelect.options[layerSelect.selectedIndex];

        if (selectedOption.value === "none") {
          // Reset everything when 'none' is selected
          themeSelect.disabled = true;
          themeLegendBtn.disabled = true;

          // Clear theme options
          while (themeSelect.options.length > 1) {
            themeSelect.remove(1);
          }

          // Reset all layers to their original renderers
          displayMap.layers.forEach((layer) => {
            if (layer.layers) {
              resetLayerRenderers(layer);
            }
          });
        } else {
          updateThemeOptions(selectedOption.text);
        }
      });

      // Theme selection change
      themeSelect.addEventListener("change", (e) => {
        const selectedLayer =
          layerSelect.options[layerSelect.selectedIndex].text;
        const selectedTheme = e.target.value;
        themeLegendBtn.disabled = selectedTheme === "default";

        const layer = findLayerByTitle(selectedLayer);
        if (!layer) return;

        if (selectedTheme === "default") {
          // Reset to original renderers for the selected layer only
          resetLayerRenderers(layer);
        } else {
          applyThematicRenderer(selectedLayer, selectedTheme);
        }
      });

      // Theme legend button
      themeLegendBtn.addEventListener("click", () => {
        updateThemeLegend();
        document.querySelector(".theme-legend-popup").style.display = "block";
        document.querySelector(".theme-legend-backdrop").style.display =
          "block";
      });

      // Close legend popup
      closeLegendBtn.addEventListener("click", () => {
        document.querySelector(".theme-legend-popup").style.display = "none";
        document.querySelector(".theme-legend-backdrop").style.display = "none";
      });

      // Close on backdrop click
      document
        .querySelector(".theme-legend-backdrop")
        .addEventListener("click", () => {
          document.querySelector(".theme-legend-popup").style.display = "none";
          document.querySelector(".theme-legend-backdrop").style.display =
            "none";
        });

      isThematicInitialized = true;
    }

    async function updateThemeLegend() {
      try {
        const legendTableBody = document.getElementById("legendTableBody");
        legendTableBody.innerHTML =
          '<tr><td colspan="3" style="text-align: center;">Loading...</td></tr>';

        const layerSelect = document.getElementById("thematicLayerSelect");
        const themeSelect = document.getElementById("thematicThemeSelect");
        const selectedLayer =
          layerSelect.options[layerSelect.selectedIndex].text;
        const selectedTheme = themeSelect.value;

        document.getElementById("legendLayerName").textContent = selectedLayer;
        document.getElementById("legendThemeName").textContent =
          themeSelect.options[themeSelect.selectedIndex].text;

        const layer = findLayerByTitle(selectedLayer);
        if (!layer) return;

        const themeConfig = THEME_CONFIG[selectedTheme];
        if (!themeConfig) return;

        if (
          selectedLayer === "Data Loggers" &&
          selectedTheme === "hardware-alarm"
        ) {
          const categoryCounts = {
            alarm: 0,
            no_alarm: 0,
          };

          const visibleSublayers = [];

          // Handle nested structure of Data Loggers layer
          layer.layers.forEach((regionGroup) => {
            regionGroup.layers.forEach((subtypeGroupLayer) => {
              if (subtypeGroupLayer.visible) {
                subtypeGroupLayer.sublayers.forEach((sublayer) => {
                  if (sublayer.visible) {
                    visibleSublayers.push(sublayer);
                  }
                });
              }
            });
          });

          if (visibleSublayers.length > 0) {
            const promises = visibleSublayers.map((sublayer) => {
              // Query for alarm count
              const queryAlarm = sublayer.createQuery();
              queryAlarm.where = "Missing_Transmission = 5";
              const alarmPromise = sublayer
                .queryFeatureCount(queryAlarm)
                .then((count) => {
                  categoryCounts.alarm += count;
                });

              // Query for no alarm count
              const queryNoAlarm = sublayer.createQuery();
              queryNoAlarm.where =
                "Missing_Transmission IS NULL OR Missing_Transmission <> 5";
              const noAlarmPromise = sublayer
                .queryFeatureCount(queryNoAlarm)
                .then((count) => {
                  categoryCounts.no_alarm += count;
                });

              return Promise.all([alarmPromise, noAlarmPromise]);
            });

            await Promise.all(promises.flat());
          }

          // Update legend table for Data Loggers
          legendTableBody.innerHTML = "";
          themeConfig.categories.forEach((category) => {
            const count =
              category.value === "5"
                ? categoryCounts.alarm
                : categoryCounts.no_alarm;
            const row = document.createElement("tr");
            if (category.value === "5") {
              // For alarm triggered - add animation class
              row.innerHTML = `
              <td>
                <img src="./dataloggersWithRedColor.png" 
                      width="25" height="25" 
                      alt="${category.label}" 
                      class="alarm-icon" />
              </td>
              <td>${category.label}</td>
              <td>${count}</td>
            `;
            } else {
              // For no alarm - regular display
              row.innerHTML = `
              <td>
                <img src="${category.symbol.url}" 
                      width="25" height="25" 
                      alt="${category.label}" />
              </td>
              <td>${category.label}</td>
              <td>${count}</td>
            `;
            }
            legendTableBody.appendChild(row);
          });
        } else {
          // Existing code for other layers
          const categoryCounts = {};
          if (selectedTheme === "nrw-percentage") {
            // themeConfig.categories.forEach(cat => {
            //   cat.values.forEach(value => {
            //     categoryCounts[value] = 0;
            //   });
            // });
            themeConfig.categories.forEach((category) => {
              categoryCounts[category.value] = 0;
            });
          } else {
            themeConfig.categories.forEach((cat) => {
              categoryCounts[cat.value] = 0;
            });
          }

          if (layer.layers) {
            const visibleSublayers = [];

            layer.layers.forEach((subtypeGroupLayer) => {
              if (
                subtypeGroupLayer.visible &&
                subtypeGroupLayer.type === "subtype-group"
              ) {
                subtypeGroupLayer.sublayers.forEach((sublayer) => {
                  if (sublayer.visible) {
                    visibleSublayers.push(sublayer);
                  }
                });
              }
            });

            if (visibleSublayers.length > 0) {
              const promises = visibleSublayers.map((sublayer) => {
                const query = sublayer.createQuery();
                query.where = "1=1";
                query.outFields = [themeConfig.field];
                query.returnGeometry = false;
                query.returnDistinctValues = true;
                query.groupByFieldsForStatistics = [themeConfig.field];
                query.outStatistics = [
                  {
                    statisticType: "count",
                    onStatisticField: themeConfig.field,
                    outStatisticFieldName: "count",
                  },
                ];

                return sublayer
                  .queryFeatures(query)
                  .then((result) => {
                    result.features.forEach((feature) => {
                      const value = feature.attributes[themeConfig.field];
                      const count = feature.attributes.count;
                      if (value in categoryCounts) {
                        categoryCounts[value] += count;
                      }
                    });
                  })
                  .catch((error) => {
                    console.error(`Error querying sublayer: ${error}`);
                  });
              });

              await Promise.all(promises);
            }

            // Update the legend creation
            legendTableBody.innerHTML = "";
            themeConfig.categories.forEach((category) => {
              const count = categoryCounts[category.value] || 0;
              const row = document.createElement("tr");
              row.innerHTML = `
              <td>
                <div class="color-box" style="background-color: rgba(${category.color.join(
                  ","
                )})"></div>
              </td>
              <td>${category.label}</td>
              <td>${count}</td>
            `;
              legendTableBody.appendChild(row);
            });

            // legendTableBody.innerHTML = '';

            // if (selectedTheme === 'nrw-percentage') {
            //   themeConfig.categories.forEach(category => {
            //     const totalCount = category.values.reduce((sum, value) => {
            //       return sum + (categoryCounts[value] || 0);
            //     }, 0);

            //     const row = document.createElement('tr');
            //     row.innerHTML = `
            //       <td>
            //         <div class="color-box" style="background-color: rgba(${category.color.join(',')})"></div>
            //       </td>
            //       <td>${category.label}</td>
            //       <td>${totalCount}</td>
            //     `;
            //     legendTableBody.appendChild(row);
            //   });
            // } else {
            //   themeConfig.categories.forEach(category => {
            //     const row = document.createElement('tr');
            //     row.innerHTML = `
            //       <td>
            //         <div class="color-box" style="background-color: rgba(${category.color.join(',')})"></div>
            //       </td>
            //       <td>${category.label}</td>
            //       <td>${categoryCounts[category.value] || 0}</td>
            //     `;
            //     legendTableBody.appendChild(row);
            //   });
            // }
          }
        }
      } catch (error) {
        console.error("Error updating legend:", error);
        legendTableBody.innerHTML =
          '<tr><td colspan="3" style="text-align: center; color: red;">Query timeout, Error loading data, Please try again.</td></tr>';
      }
    }

    var layerList = new LayerList({
      view: view,
      container: document.getElementById("layerListContainer"), // Place LayerList in the new container,
      // showLegend: true
    });

    layerList.visibilityAppearance = "checkbox";
    layerList.listItemCreatedFunction = async function (event) {
      const item = event.item;
      // await item.layer.when();
      // console.log(item, "here is the item...");
      // if (item.children.length > 0) {
      //   console.log(item, "M");
      // }
      if (item.children.length > 0) {
        // Only apply logic to group layers
        item.watch("open", function (expanded) {
          if (expanded) {
            collapseSiblingGroups(item);
          }
        });
      }
      function collapseSiblingGroups(targetItem) {
        layerList.operationalItems.forEach((mainGroup) => {
          if (mainGroup !== targetItem) {
            if (targetItem.parent === mainGroup.parent) {
              // Collapse only items within the same parent (same hierarchy level)
              mainGroup.open = false;
            }

            mainGroup.children.forEach((subGroup) => {
              if (
                subGroup !== targetItem &&
                subGroup.parent === targetItem.parent
              ) {
                subGroup.open = false; // Collapse only sibling inside-group layers
              }

              subGroup.children.forEach((subtypeGroup) => {
                if (
                  subtypeGroup !== targetItem &&
                  subtypeGroup.parent === targetItem.parent
                ) {
                  subtypeGroup.open = false; // Collapse only sibling subtype layers
                }
              });
            });
          }
        });
      }
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
            id: "full-extent",
          },
        ]);
      }

      // Define actions for regions layers
      if (item.layer.type === "group") {
        if (item.layer.parent.type === "group") {
          item.actionsSections.push([
            {
              title: "Search Features",
              icon: "select-by-attributes", // search
              id: "search-attr",
            },
          ]);
        }
      }

      // Check if the layer is a top-level GroupLayer
      const isTopLevelGroupLayer = view.map.layers.includes(item.layer);

      if (item.layer.type === "group" && isTopLevelGroupLayer) {
        // console.log("Top-Level GroupLayer:", item.layer.title);
        item.actionsSections.push([
          {
            title: "Show/Hide Labels",
            icon: "star",
            id: "toggle-labels",
          },
        ]);
      }

      item.watch("visible", (visible) => {
        if (visible) {
          if (item.layer.type === "group") {
            titlesData.forEach((titleGroup) => {
              if (item.layer.title === titleGroup) {
                const layerSelect = document.getElementById(
                  "thematicLayerSelect"
                );

                // Update layer options
                let existingOption = Array.from(layerSelect.options).find(
                  (opt) => opt.value === item.layer.id
                );
                if (!existingOption) {
                  const option = document.createElement("option");
                  option.value = item.layer.id;
                  option.text = item.layer.title;
                  layerSelect.add(option);
                }

                // Initialize thematic functionality if not already done
                initializeThematic();
              }
            });
          }

          if (item.layer.type === "subtype-sublayer") {
            let parentLayer = item.layer.parent;
            while (parentLayer) {
              if (parentLayer.visible === false) {
                parentLayer.visible = true;
                // console.log("Parent Layer Made Visible:", parentLayer.title || "Unnamed Layer");
              }
              parentLayer = parentLayer.parent; // Move up the hierarchy
            }
            // return;
          } else {
            if (
              item.layer.type === "subtype-group" &&
              item.layer.parent.type === "group"
            ) {
              // &&
              if (
                item.layer.sublayers &&
                item.layer.sublayers.some((sublayer) => sublayer.visible)
              ) {
                return;
              } else {
                let parentLayer = item.layer.parent;
                while (parentLayer) {
                  if (parentLayer.visible === false) {
                    parentLayer.visible = true;
                    // console.log("Parent Layer Made Visible:", parentLayer.title || "Unnamed Layer");
                  }
                  parentLayer = parentLayer.parent; // Move up the hierarchy
                }

                // Remove or modify this block to prevent all sublayers from being turned on
                if (
                  item.layer.sublayers &&
                  item.layer.type === "subtype-group"
                ) {
                  // Ensure sublayers exist
                  item.layer.sublayers.forEach((sublayer) => {
                    if (!sublayer.visible) {
                      // Only change if not already visible
                      sublayer.visible = true;
                      // console.log("Sublayer Made Visible:", sublayer.title);
                    }
                  });
                }
              }
            } else {
              let parentLayer = item.layer.parent;
              while (parentLayer) {
                if (parentLayer.visible === false) {
                  parentLayer.visible = true;
                  // console.log("Parent Layer Made Visible:", parentLayer.title || "Unnamed Layer");
                }
                parentLayer = parentLayer.parent; // Move up the hierarchy
              }
            }

            if (
              item.layer.type === "group" &&
              item.layer.parent.title === "Data Loggers"
            ) {
              if (
                item.layer.layers &&
                item.layer.layers.some((layer) => layer.visible)
              ) {
                return;
              } else {
                // console.log(item.layer, "Here is the group layer...");
                item.layer.layers.forEach((subtypegrouplayers) => {
                  subtypegrouplayers.visible = true;
                });
              }
            }
          }
        } else {
          // When layer becomes invisible, remove from dropdown
          if (item.layer.type === "group") {
            const layerSelect = document.getElementById("thematicLayerSelect");
            Array.from(layerSelect.options).forEach((opt) => {
              if (opt.value === item.layer.id) {
                layerSelect.remove(opt.index);
              }
            });
          }
          if (item.layer.sublayers) {
            item.layer.sublayers.forEach((sublayer) => {
              sublayer.visible = false; // Turn off visibility
              sublayer.listItem && (sublayer.listItem.visible = false); // Uncheck the checkbox in UI
            });
          }
          if (item.layer.type === "group") {
            item.layer.layers.forEach((layer) => {
              layer.visible = false;
            });
          }
        }

        if (item.layer.type === "subtype-sublayer") {
          // Apply to all children, outside the condition
          item.children.forEach((child) => {
            child.watch("visible", (childVisible) => {
              // console.log("Child Layer Visibility Changed:", child.layer.title, childVisible);
            });
          });
        }
      });
    };

    // Add at the top of your file
    let lastSelectedField = "";
    let lastSelectedOperator = "";
    let lastInputValue = "";

    function buildWhereClause(field, operator, value) {
      // Remove any special characters and ensure proper formatting
      const sanitizedValue = value.replace(/['"]/g, "").trim();

      if (field === "pipe_dn_descr") {
        // For pipe diameter, extract the number and compare
        const numericValue = sanitizedValue.replace(/[^0-9]/g, "");
        return `${field} ${operator} '${numericValue}mm'`;
      } else {
        // For other fields
        const isNumeric =
          !isNaN(sanitizedValue) && !isNaN(parseFloat(sanitizedValue));
        return `${field} ${operator} ${
          isNumeric ? sanitizedValue : `'${sanitizedValue}'`
        }`;
      }
    }

    // Add this at the top of your file with other global variables
    let searchWidget = null;

    async function showSelectByAttributesModal(layer) {
      const modal = document.getElementById("selectByAttributesModal");
      const closeBtn = modal.querySelector(".close-button");
      const fieldSelect = document.getElementById("fieldSelect");
      const operatorSelect = document.getElementById("operatorSelect");
      const valueInput = document.getElementById("valueInput");

      // Show modal
      modal.style.display = "block";

      // Function to destroy search widget and its container
      function destroySearchWidget() {
        if (searchWidget) {
          searchWidget.destroy();
          searchWidget = null;
        }
      }

      // Destroy existing widget
      destroySearchWidget();

      // Remove existing container and create a new one
      const queryLine = modal.querySelector(".query-line");
      const oldContainer = document.getElementById("searchWidgetContainer");
      if (oldContainer) {
        oldContainer.remove();
      }

      // Create new container
      const newContainer = document.createElement("div");
      newContainer.id = "searchWidgetContainer";
      newContainer.className = "search-widget-container";
      queryLine.appendChild(newContainer);

      // Create new search widget
      searchWidget = new Search({
        view: view,
        container: newContainer,
        allPlaceholder: "Search pipe size",
        includeDefaultSources: false,
        sources: [],
      });

      // Add search sources based on layer type
      if (layer.type === "group") {
        const subtypeGroupLayers = layer.layers.filter(
          (l) => l.type === "subtype-group"
        );
        subtypeGroupLayers.forEach((subtypeLayer) => {
          searchWidget.sources.push({
            layer: subtypeLayer,
            searchFields: ["pipe_dn_descr", "pipe_mat"],
            displayField: "pipe_dn_descr",
            exactMatch: false,
            outFields: ["*"],
            name: subtypeLayer.title || "Pipe Size",
            placeholder: "example: 250mm",
            suggestionTemplate: "{markerTitle} with Pipe Mat: {pipe_mat} with Length: {mLength}",
          });
        });
      } else if (layer.type === "subtype-group") {
        searchWidget.sources.push({
          layer: layer,
          searchFields: ["pipe_dn_descr", "pipe_mat"],
          displayField: "pipe_dn_descr",
          exactMatch: false,
          outFields: ["*"],
          name: layer.title || "Pipe Size",
          placeholder: "example: 250mm",
          suggestionTemplate: "{markerTitle} with Pipe Mat: {pipe_mat} with Length: {mLength}",
        });
      }

      // Handle search results
      searchWidget.on("select-result", function (event) {
        if (event.result) {
          applySelectionToLayer(
            layer,
            "pipe_dn_descr",
            "=",
            event.result.feature.attributes.pipe_dn_descr
          );
          destroySearchWidget();
          modal.style.display = "none";
        }
      });

      // Initialize field select
      fieldSelect.innerHTML = '<option value="">Select a field</option>';

      // Map to store unique fields (using name as key to prevent duplicates)
      const uniqueFields = new Map();

      async function processLayerFields(layer) {
        if (layer.type === "group") {
          const subtypeGroupLayers = layer.layers.filter(
            (l) => l.type === "subtype-group"
          );
          for (const subtypeLayer of subtypeGroupLayers) {
            await subtypeLayer.load();
            if (subtypeLayer.sublayers) {
              for (const sublayer of subtypeLayer.sublayers.toArray()) {
                if (sublayer.fields) {
                  sublayer.fields.forEach((field) => {
                    if (!uniqueFields.has(field.name)) {
                      uniqueFields.set(field.name, field);
                    }
                  });
                }
              }
            }
          }
        } else if (layer.type === "subtype-group") {
          await layer.load();
          if (layer.sublayers) {
            for (const sublayer of layer.sublayers.toArray()) {
              if (sublayer.fields) {
                sublayer.fields.forEach((field) => {
                  if (!uniqueFields.has(field.name)) {
                    uniqueFields.set(field.name, field);
                  }
                });
              }
            }
          }
        }
      }

      // Process and populate fields
      await processLayerFields(layer);

      // Sort fields alphabetically by name
      const sortedFields = Array.from(uniqueFields.values()).sort((a, b) =>
        (a.alias || a.name).localeCompare(b.alias || b.name)
      );

      // Populate field select
      sortedFields.forEach((field) => {
        const option = document.createElement("option");
        option.value = field.name;
        option.textContent = field.alias || field.name;
        fieldSelect.appendChild(option);
      });

      // Restore last selections
      if (lastSelectedField) fieldSelect.value = lastSelectedField;
      if (lastSelectedOperator) operatorSelect.value = lastSelectedOperator;
      if (lastInputValue) valueInput.value = lastInputValue;

      // Event listeners
      fieldSelect.addEventListener("change", (e) => {
        lastSelectedField = e.target.value;
      });

      operatorSelect.addEventListener("change", (e) => {
        lastSelectedOperator = e.target.value;
      });

      valueInput.addEventListener("input", (e) => {
        lastInputValue = e.target.value;
      });

      document.getElementById("applySelection").onclick = () => {
        const field = fieldSelect.value;
        const operator = operatorSelect.value;
        const value = valueInput.value;

        if (field && operator && value) {
          applySelectionToLayer(layer, field, operator, value);
          modal.style.display = "none";
        } else {
          alert("Please fill in all fields before applying selection.");
        }
      };

      // Update close handlers
      closeBtn.onclick = () => {
        destroySearchWidget();
        modal.style.display = "none";
      };

      window.onclick = (event) => {
        if (event.target === modal) {
          destroySearchWidget();
          modal.style.display = "none";
        }
      };

      document.getElementById("clearSelection").onclick = () => {
        destroySearchWidget();
        clearSelectionFromLayer(layer);
        modal.style.display = "none";
      };
    }

    // Add this function to clean up when needed (e.g., when unloading your application)
    function destroySearchWidget() {
      if (searchWidget) {
        searchWidget.destroy();
        searchWidget = null;
      }
    }

    async function applySelectionToLayer(layer, field, operator, value) {
      const whereClause = buildWhereClause(field, operator, value);
      console.log("Where clause:", whereClause); // Debug log

      async function processSubtypeLayer(subtypeLayer) {
        try {
          subtypeLayer.visible = true;

          const query = {
            where: whereClause,
            returnGeometry: false,
            outFields: ["*"],
          };

          // First check if the subtype layer has any matching features
          const subtypeFeatureCount = await subtypeLayer.queryFeatureCount(
            query
          );

          if (subtypeFeatureCount > 0) {
            // Apply the definition expression to the subtype layer
            subtypeLayer.definitionExpression = whereClause;

            // Check each sublayer for matching features
            if (subtypeLayer.sublayers) {
              for (const sublayer of subtypeLayer.sublayers.toArray()) {
                try {
                  const sublayerFeatureCount = await sublayer.queryFeatureCount(
                    query
                  );
                  // Only make sublayer visible if it has matching features
                  sublayer.visible = sublayerFeatureCount > 0;
                } catch (error) {
                  console.error(
                    `Error querying sublayer ${sublayer.id}:`,
                    error
                  );
                  sublayer.visible = false;
                }
              }
            }
          } else {
            // If no features match in the subtype layer, hide everything
            subtypeLayer.definitionExpression = "";
            subtypeLayer.visible = false;
            if (subtypeLayer.sublayers) {
              subtypeLayer.sublayers.forEach((sublayer) => {
                sublayer.visible = false;
              });
            }
          }

          console.log(
            `Subtype layer ${subtypeLayer.id} feature count:`,
            subtypeFeatureCount
          );
        } catch (error) {
          console.error(
            `Error processing subtype layer ${subtypeLayer.id}:`,
            error
          );
        }
      }

      if (layer.type === "group") {
        layer.visible = true;
        const subtypeGroupLayers = layer.layers.filter(
          (l) => l.type === "subtype-group"
        );
        for (const subtypeLayer of subtypeGroupLayers) {
          await processSubtypeLayer(subtypeLayer);
        }
      } else if (layer.type === "subtype-group") {
        await processSubtypeLayer(layer);
      }

      // Zoom to selection
      await zoomToSelection(layer, whereClause);
    }

    async function zoomToSelection(layer, whereClause) {
      try {
        let extent;
        if (layer.type === "group") {
          const promises = [];

          // Find the subtype group layer
          const subtypeGroupLayer = layer.layers.find(
            (l) => l.type === "subtype-group"
          );

          if (subtypeGroupLayer && subtypeGroupLayer.sublayers) {
            subtypeGroupLayer.sublayers.forEach((sublayer) => {
              if (sublayer.visible) {
                // Only query visible sublayers
                const query = {
                  where: whereClause,
                  returnGeometry: true,
                  outSpatialReference: view.spatialReference,
                };

                // Use queryFeatures instead of queryExtent
                promises.push(
                  sublayer
                    .queryFeatures(query)
                    .then((result) => {
                      if (result.features.length > 0) {
                        return result.features.reduce((acc, feature) => {
                          const geomExtent = feature.geometry.extent;
                          return acc ? acc.union(geomExtent) : geomExtent;
                        }, null);
                      }
                      return null;
                    })
                    .catch((error) => {
                      console.error("Error querying features:", error);
                      return null;
                    })
                );
              }
            });
          }

          const results = await Promise.all(promises);
          extent = results.reduce((acc, result) => {
            if (!result) return acc;
            return acc ? acc.union(result) : result;
          }, null);
        }

        if (extent) {
          view.goTo(extent.expand(1.2));
        }
      } catch (error) {
        console.error("Error zooming to selection:", error);
      }
    }

    function clearSelectionFromLayer(layer) {
      if (layer.type === "group") {
        const subtypeGroupLayers = layer.layers.filter(
          (l) => l.type === "subtype-group"
        );
        subtypeGroupLayers.forEach((subtypeLayer) => {
          subtypeLayer.definitionExpression = "";
          subtypeLayer.visible = false;
        });
      } else if (layer.type === "subtype-group") {
        layer.definitionExpression = "";
        layer.visible = false;
      }
    }

    // Keep the event listener for action triggers
    layerList.on("trigger-action", (event) => {
      const id = event.action.id;
      const layer = event.item.layer;
      if (id === "full-extent") {
        view
          .goTo(
            {
              target: layer.fullExtent,
            },
            {
              duration: 3000,
            }
          )
          .catch((error) => {
            if (error.name !== "AbortError") {
              console.error(error);
            }
          });
      }
      if (id === "toggle-labels") {
        // console.log("Toggling labels for:", layer.title);
        toggleLayerLabels(layer, event.item);
      }

      if (id === "search-attr") {
        console.log("Searching by attributes...");
        showSelectByAttributesModal(event.item.layer);
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
                let newLabelState =
                  !subLayer0.sublayers.getItemAt(0)?.labelsVisible;
                // console.log(`Setting labels to: ${newLabelState} for ${subLayer0.title}`);

                subLayer0.sublayers.forEach((subLayer0) => {
                  subLayer0.labelsVisible = newLabelState;
                });
                updateIconColor(item, newLabelState); // Update icon color
                hasLabels = true;
              }
            });
          }
        });

        if (!hasLabels) {
          console.warn(
            `No valid sublayers with labels found in ${layer.title}`
          );
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

      item.actionsSections = [
        [
          {
            title: isLabelsVisible ? "Hide Labels" : "Show Labels",
            icon: isLabelsVisible ? "star-f" : "star",
            id: "toggle-labels",
          },
        ],
      ];

      layerList.renderNow(); // Refresh UI to reflect icon change
    }

    view.ui.add(document.getElementById("thematicButton"), {
      position: "bottom-right",
      index: 0,
    });

    let basemapGallery = new BasemapGallery({
      view: view,
    });

    // create a portal instance
    const portal = new Portal();

    // source for basemaps from a portal group
    // containing basemaps with different projections
    const source = new PortalBasemapsSource({
      portal,
      query: {
        id: "bab0e2fa162441668f2f375f5a7db33c",
      },
    });
    basemapGallery.source = source;

    const basemapGalleryExpand = new Expand({
      expandIcon: "basemap",
      view: view,
      content: basemapGallery,
    });
    view.ui.add(basemapGalleryExpand, { position: "bottom-right", index: 1 });

    basemapGallery.when(
      function () {
        // This function will execute once the promise is resolved
        // console.log(basemapGallery, "Basemap Grallery...");

        basemapGallery.watch("activeBasemap", () => {
          if (basemapGallery.activeBasemap === null) {
            // console.log("Yes");
            return;
          } else {
            if (basemapWithoutLabels) {
              // console.log("No")
              displayMap.remove(basemapWithoutLabels);
            }
          }
        });
      },
      function (error) {
        // This function will execute if the promise is rejected due to an error
      }
    );

    // view.ui.add([Expand5], { position: "top-left", index: 6 });
    var fullscreen = new Fullscreen({
      view: view,
    });
    view.ui.add(fullscreen, { position: "bottom-right", index: 2 });

    let fl = false;
    // Show popup
    document.getElementById("thematicButton").addEventListener("click", () => {
      if (fl == false) {
        const popup = document.getElementById("thematicPopup");
        popup.style.display = "block"; // Make it visible first
        // Force a reflow
        popup.offsetHeight;
        popup.classList.add("show");

        const calciteButton = document.querySelectorAll(
          "calcite-button[appearance=outline-fill][kind=neutral]"
        );
        document.getElementById("thematicButton").kind = "brand";
        document.getElementById("thematicButton").appearance = "solid";
        calciteButton[0].childEl.style.backgroundColor = "#007ac2";
        calciteButton[0].childEl.style.color = "white";
        calciteButton[0].childEl.style.borderColor = "transparent";
        fl = true;
      } else {
        const calciteButton = document.querySelectorAll(
          "calcite-button[appearance=solid][kind=brand]"
        );
        document.getElementById("thematicButton").kind = "neutral";
        document.getElementById("thematicButton").appearance = "outline-fill";
        calciteButton[0].childEl.style.backgroundColor = "white";
        calciteButton[0].childEl.style.color = "black";
        calciteButton[0].childEl.style.borderColor = "transparent";

        // e.stopPropagation();
        const popup = document.getElementById("thematicPopup");

        popup.classList.remove("show");
        popup.classList.add("hiding");

        // Wait for animation to complete before hiding
        popup.addEventListener("animationend", function hidePopup() {
          popup.style.display = "none";
          popup.classList.remove("hiding");
          popup.removeEventListener("animationend", hidePopup);
        });
        fl = false;
      }
    });

    // Hide popup
    document
      .getElementById("closeThematicPopup")
      .addEventListener("click", (e) => {
        const calciteButton = document.querySelectorAll(
          "calcite-button[appearance=solid][kind=brand]"
        );
        document.getElementById("thematicButton").kind = "neutral";
        document.getElementById("thematicButton").appearance = "outline-fill";
        calciteButton[0].childEl.style.backgroundColor = "white";
        calciteButton[0].childEl.style.color = "black";
        calciteButton[0].childEl.style.borderColor = "transparent";

        e.stopPropagation();
        const popup = document.getElementById("thematicPopup");

        popup.classList.remove("show");
        popup.classList.add("hiding");

        // Wait for animation to complete before hiding
        popup.addEventListener("animationend", function hidePopup() {
          popup.style.display = "none";
          popup.classList.remove("hiding");
          popup.removeEventListener("animationend", hidePopup);
        });

        fl = false;
    });

    // Sample data for the legend with image URLs
    const legendData = [
      {
        feature: "Customer Locations",
        count: "#",
        icon: "./customerlocation.png",
      },
      {
        feature: "Data Loggers",
        count: "#",
        icon: "./dataloggers.png",
      },
      {
        feature: "DMZ Boundaries",
        count: "#",
        icon: "./dmzboundaries.png",
      },
      {
        feature: "DMZ Critical Points",
        count: "#",
        icon: "./criticalpoints.png",
      },
      {
        feature: "DMZ Meter Points",
        count: "#",
        icon: "./dmz.png",
      },
      {
        feature: "Reservoirs",
        count: "#",
        icon: "./reservoir.png",
      },
      {
        feature: "SIV Meters Points",
        count: "#",
        icon: "./siv.png",
      },
      {
        feature: "Transmission Main Meter Points",
        count: "#",
        icon: "./tmm.png",
      },
      {
        feature: "Trunk Main Meter Points",
        count: "#",
        icon: "./tkm.png",
      },
      {
        feature: "Valves",
        count: "#",
        icon: "./valves.png",
      },
      {
        feature: "Water Mains",
        count: "#",
        icon: "./watermains.png",
      },
      {
        feature: "Water Treatment Plant",
        count: "#",
        icon: "./wtp.png",
      },
      {
        feature: "Maintenance Work Orders",
        count: "#",
        icon: "./workorders.png",
      },
    ];

    // Function to create the legend
    function createLegend(legendData) {
      const legendContainer = document.getElementById("legendContainer");
      legendContainer.innerHTML = ""; // Clear existing content

      legendData.forEach((item) => {
        const row = document.createElement("div");
        row.className = "legend-item";
        row.innerHTML = `
              <img src="${item.icon}" alt="${item.feature}">
              ${item.feature} <span id="${item.feature.replace(
          /\s+/g,
          ""
        )}Count" style="font-weight: bold;">${item.count}</span>
          `;
        legendContainer.appendChild(row);
      });
    }

    // Function to update the count of displayed features
    function updateFeatureCount(featureName, count) {
      const featureCountElement = document.getElementById(
        featureName.replace(/\s+/g, "") + "Count"
      );
      if (featureCountElement) {
        featureCountElement.textContent = count;
      }
    }

    function animateCount(element, targetCount, unit, duration = 1000) {
      const startCount =
        parseFloat(element.textContent.replace(/,/g, "").replace("#", "0")) ||
        0;
      const totalSteps = Math.max(duration / 100, 1); // Ensure at least one step
      const increment = (targetCount - startCount) / totalSteps;
      let currentCount = startCount;
      let step = 0;

      const interval = setInterval(() => {
        step++;
        currentCount += increment;

        // Clamp the current count to the target count
        if (
          (increment > 0 && currentCount >= targetCount) ||
          (increment < 0 && currentCount <= targetCount)
        ) {
          currentCount = targetCount;
          clearInterval(interval);
        }

        // Format the count for Water Mains to two decimal places
        const formattedCount =
          unit === "km" ? currentCount.toFixed(2) : Math.round(currentCount);

        element.textContent = `${formattedCount.toLocaleString()} ${unit}`;

        // If the step exceeds totalSteps, stop the animation
        if (step >= totalSteps) {
          clearInterval(interval);
          const finalFormattedCount =
            unit === "km" ? targetCount.toFixed(2) : targetCount;
          element.textContent = `${finalFormattedCount.toLocaleString()} ${unit}`; // Ensure final value is exact
        }
      }, 100);
    }

    view.map.layers.forEach((layer) => {
      if (layer.type === "group") {
        layer.loadAll().then(() => {
          layer.layers.forEach((subtypegrouplayer) => {
            if (subtypegrouplayer.type === "subtype-group") {
              subtypegrouplayer.loadAll().then(() => {
                if (subtypegrouplayer.sublayers) {
                  subtypegrouplayer.sublayers.forEach((sublayer) => {
                    let sublayerCount = 0; // Store the count for this sublayer
                    sublayer.watch("visible", async () => {
                      const matchingLegendItem = legendData.find(
                        (item) => item.feature === layer.title
                      );
                      if (matchingLegendItem) {
                        const unit =
                          layer.title === "Water Mains" ? "km" : "nos.";
                        const countElement = document.getElementById(
                          matchingLegendItem.feature.replace(/\s+/g, "") +
                            "Count"
                        );

                        if (sublayer.visible) {
                          sublayerCount = await sublayer.queryFeatureCount();
                          matchingLegendItem.count =
                            matchingLegendItem.count === "#"
                              ? 0
                              : matchingLegendItem.count;
                          matchingLegendItem.count += sublayerCount;
                          animateCount(
                            countElement,
                            matchingLegendItem.count,
                            unit
                          );
                        } else {
                          matchingLegendItem.count -= sublayerCount;
                          if (matchingLegendItem.count < 0) {
                            matchingLegendItem.count = 0;
                          }
                          if (matchingLegendItem.count === 0) {
                            matchingLegendItem.count = "#";
                            countElement.textContent = matchingLegendItem.count; // Display '#' if count is zero
                          } else {
                            const formattedCount =
                              unit === "km"
                                ? matchingLegendItem.count.toFixed(2)
                                : matchingLegendItem.count;
                            countElement.textContent = `${formattedCount.toLocaleString()} ${unit}`; // Display count with unit
                          }
                        }
                      }
                    });
                  });
                }
              });
            } else {
              if (layer.title === "Water Mains") {
                subtypegrouplayer.loadAll().then(() => {
                  subtypegrouplayer.layers.forEach((nestedSubtypeGroup) => {
                    nestedSubtypeGroup.loadAll().then(() => {
                      if (nestedSubtypeGroup.sublayers) {
                        nestedSubtypeGroup.sublayers.forEach(
                          (nestedSublayer) => {
                            let nestedSublayerCount = 0; // Store the count for this nested sublayer
                            nestedSublayer.watch("visible", async () => {
                              const matchingLegendItem = legendData.find(
                                (item) => item.feature === layer.title
                              );
                              if (matchingLegendItem) {
                                const unit = "km";
                                const countElement = document.getElementById(
                                  matchingLegendItem.feature.replace(
                                    /\s+/g,
                                    ""
                                  ) + "Count"
                                );

                                if (nestedSublayer.visible) {
                                  const query = {
                                    where: "1=1",
                                    returnGeometry: false,
                                    outFields: ["mLength"],
                                  };
                                  const results =
                                    await nestedSublayer.queryFeatures(query);
                                  nestedSublayerCount =
                                    results.features.reduce(
                                      (total, feature) => {
                                        return (
                                          total +
                                          (feature.attributes.mLength || 0)
                                        );
                                      },
                                      0
                                    ) / 1000; // Convert meters to kilometers

                                  matchingLegendItem.count =
                                    matchingLegendItem.count === "#"
                                      ? 0
                                      : matchingLegendItem.count;
                                  matchingLegendItem.count +=
                                    nestedSublayerCount;
                                  animateCount(
                                    countElement,
                                    matchingLegendItem.count,
                                    unit
                                  );
                                } else {
                                  matchingLegendItem.count -=
                                    nestedSublayerCount;
                                  if (matchingLegendItem.count < 0) {
                                    matchingLegendItem.count = 0;
                                  }
                                  if (matchingLegendItem.count === 0) {
                                    matchingLegendItem.count = "#";
                                    countElement.textContent =
                                      matchingLegendItem.count;
                                  } else {
                                    const formattedCount =
                                      matchingLegendItem.count.toFixed(2);
                                    countElement.textContent = `${formattedCount.toLocaleString()} ${unit}`;
                                  }
                                }
                              }
                            });
                          }
                        );
                      }
                    });
                  });
                });
              } else {
                subtypegrouplayer.loadAll().then(() => {
                  subtypegrouplayer.layers.forEach((nestedSubtypeGroup) => {
                    nestedSubtypeGroup.loadAll().then(() => {
                      if (nestedSubtypeGroup.sublayers) {
                        nestedSubtypeGroup.sublayers.forEach(
                          (nestedSublayer) => {
                            let nestedSublayerCount = 0; // Store the count for this nested sublayer
                            nestedSublayer.watch("visible", async () => {
                              const matchingLegendItem = legendData.find(
                                (item) => item.feature === layer.title
                              );
                              if (matchingLegendItem) {
                                const unit = "nos.";
                                const countElement = document.getElementById(
                                  matchingLegendItem.feature.replace(
                                    /\s+/g,
                                    ""
                                  ) + "Count"
                                );

                                if (nestedSublayer.visible) {
                                  nestedSublayerCount =
                                    await nestedSublayer.queryFeatureCount();
                                  matchingLegendItem.count =
                                    matchingLegendItem.count === "#"
                                      ? 0
                                      : matchingLegendItem.count;
                                  matchingLegendItem.count +=
                                    nestedSublayerCount;
                                  animateCount(
                                    countElement,
                                    matchingLegendItem.count,
                                    unit
                                  );
                                } else {
                                  matchingLegendItem.count -=
                                    nestedSublayerCount;
                                  if (matchingLegendItem.count < 0) {
                                    matchingLegendItem.count = 0;
                                  }
                                  if (matchingLegendItem.count === 0) {
                                    matchingLegendItem.count = "#";
                                    countElement.textContent =
                                      matchingLegendItem.count;
                                  } else {
                                    countElement.textContent = `${matchingLegendItem.count.toLocaleString()} ${unit}`;
                                  }
                                }
                              }
                            });
                          }
                        );
                      }
                    });
                  });
                });
              }
            }
          });
        });
      }
    });

    // Call the function to create the legend initially
    createLegend(legendData);

    Promise.all([
      view.when(),
      // view.map.when(),
      ...view.map.allLayers.map((layer) => layer.when()),
      layerList.when(),
    ]).then(() => {
      console.log("Everything is loaded: view, map, layers, layerList");
      var preloader = document.getElementById("preloader");
      if (preloader) {
        preloader.style.display = "none";
      }
    });

    await view.when();
    return [view, displayMap]; // You can return the view object
  } catch (error) {
    console.error("Error initializing map:", error);
    throw error; // Rethrow the error to handle it further, if needed
  }
}
