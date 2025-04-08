// display variables
var displayMap;
var view;
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
      decoration: "none"  // Can be "underline", "line-through", etc.
    },
    lineHeight: 1.2  // Adjust space between lines
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
    `
  },
  maxScale: 0,
  minScale: 18055.9548215,
  where: "sitename IS NOT NULL"  // Only label features with names
};

const labelClassDMZBoundariesNamesOnly = {  // autocasts as new LabelClass()
  symbol: {
    type: "text",  // autocasts as new TextSymbol()
    color: "black",
    haloColor: "white",
    haloSize: 2,
    font: {  // autocast as new Font()
      family: "Noto Sans",
      weight: "bold",
      size: 8
     }
  },
  labelPlacement: "always-horizontal",
  labelExpressionInfo: {
    expression: "$feature.sitename"
  },
  maxScale: 0,
  minScale: 18055.9548215,
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
      const [esriConfig, Map, MapView, intl, GeoJSONLayer, GroupLayer, Graphic, reactiveUtils, promiseUtils, VectorTileLayer, Basemap] = await Promise.all([
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
        basemap: "topo-vector",
      });

      // create a new instance of VectorTileLayer from the vector tiles style endpoint
      const basemapWithoutLabels = new VectorTileLayer({
        // esri colored pencil style
        url: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/WorldTopographicBasemMapLayerWithoutLabels.json",
        listMode: "hide",
      });
      displayMap.add(basemapWithoutLabels);  // adds the layer to the map

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
    view.ui.add("logoDiv", "top-right");
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

    function formatDate(timestamp) {
      const date = new Date(timestamp);
      
      // Adjust for timezone offset (+8 hours)
      date.setHours(date.getHours() + 8);
    
      const options = {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      };
    
      return date.toLocaleDateString('en-GB', options).replace(',', '');
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
          title: "Street View"
        },
        {
          id: "sharelocation",
          // image: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/sharelocation.png",
          icon: "pin-tear",
          title: "Share Location"
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
          <p><strong>Logger Type:</strong> ${attributes.make} - ${attributes.model} - ${attributes.sub_model}</p>
          <p><strong>Last Received Date/Time:</strong> ${formatDate(attributes.last_loggedtime)}</p>
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
          const ctx = document.getElementById('reservoirsChart').getContext('2d');
          new Chart(ctx, {
            type: 'line',
            data: {
              labels: ['12:00 AM', '12:00 PM', '12:00 AM'],
              datasets: [{
                label: 'Reservoirs Level',
                data: [-2, 0, 1, 0, -1, -2],
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: false
              }]
            },
            options: {
              scales: {
                y: {
                  title: {
                    display: true,
                    text: 'Level (m)'
                  }
                },
                x: {
                  title: {
                    display: true,
                    text: 'Time'
                  }
                }
              }
            }
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
      }
    };

    const popupTemplateCustomerLocations = {
      title: "CUSTOMER LOCATION <br> Premise Number: {premisenum}",
      outFields: ["*"],
      actions: [
        {
          id: "streetview",
          icon: "360-view",
          title: "Street View"
        },
        {
          id: "sharelocation",
          // image: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/sharelocation.png",
          icon: "pin-tear",
          title: "Share Location"
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
      }
    };

    const popupTemplateDMZCriticalPoints = {
      title: "DMZ CRITICAL POINT <br> Site: {site}",
      outFields: ["*"],
      actions: [
        {
          id: "streetview",
          icon: "360-view",
          title: "Street View"
        },
        {
          id: "sharelocation",
          // image: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/sharelocation.png",
          icon: "pin-tear",
          title: "Share Location"
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
          <p><strong>Logger Type:</strong> ${attributes.make} - ${attributes.model}</p>
          <p><strong>Last Received Date/Time:</strong> ${formatDate(attributes.last_loggedtime)}</p>
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
      }
    };
    
    const popupTemplateKTM = {
      title: "TRUNK MAIN METER POINT <br> Site: {site}",
      outFields: ["*"],
      actions: [
        {
          id: "streetview",
          icon: "360-view",
          title: "Street View"
        },
        {
          id: "sharelocation",
          // image: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/sharelocation.png",
          icon: "pin-tear",
          title: "Share Location"
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
          <p><strong>Logger Type:</strong> ${attributes.make} - ${attributes.model}</p>
          <p><strong>Last Received Date/Time:</strong> ${formatDate(attributes.last_loggedtime)}</p>
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
      }
    };

    const popupTemplateWTP = {
      title: "WATER TREATMENT PLANT <br> Site: {site}",
      outFields: ["*"],
      actions: [
        {
          id: "streetview",
          icon: "360-view",
          title: "Street View"
        },
        {
          id: "sharelocation",
          // image: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/sharelocation.png",
          icon: "pin-tear",
          title: "Share Location"
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
      }
    };

    const popupTemplateDMZBoundaries = {
      title: "DMZ BOUNDARY <br> Site: {site}",
      outFields: ["*"],
      actions: [
        {
          id: "streetview",
          icon: "360-view",
          title: "Street View"
        },
        {
          id: "sharelocation",
          // image: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/sharelocation.png",
          icon: "pin-tear",
          title: "Share Location"
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
          const ctx = document.getElementById('nrwChart').getContext('2d');
          new Chart(ctx, {
            type: 'bar',
            data: {
              labels: ['Apr-24', 'May-24', 'Jun-24', 'Jul-24', 'Aug-24', 'Sep-24', 'Oct-24', 'Nov-24', 'Dec-24', 'Jan-25', 'Feb-25', 'Mar-25'],
              datasets: [
                {
                  label: 'Inflow',
                  data: [20, 30, -10, 40, -20, 30, 10, -30, 20, 10, -10, 30],
                  backgroundColor: 'rgba(75, 192, 192, 0.6)'
                },
                {
                  label: 'BMAC',
                  data: [-15, 25, -5, 35, -25, 20, 5, -20, 15, 5, -5, 25],
                  backgroundColor: 'rgba(255, 159, 64, 0.6)'
                },
                {
                  label: 'NRW',
                  data: [10, -20, 15, -30, 20, -10, 25, -15, 10, -5, 20, -25],
                  backgroundColor: 'rgba(153, 102, 255, 0.6)'
                }
              ]
            },
            options: {
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Value'
                  }
                },
                x: {
                  title: {
                    display: true,
                    text: 'Month-Year'
                  }
                }
              }
            }
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
      }
    };

    const popupTemplateDMZMeterPoints = {
      title: "DMZ METER POINT <br> Site: {site}",
      outFields: ["*"],
      actions: [
        {
          id: "streetview",
          icon: "360-view",
          title: "Street View"
        },
        {
          id: "sharelocation",
          // image: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/sharelocation.png",
          icon: "pin-tear",
          title: "Share Location"
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
          <p><strong>Logger Type:</strong> ${attributes.make} - ${attributes.model}</p>
          <p><strong>Last Received Date/Time:</strong> ${formatDate(attributes.last_loggedtime)}</p>
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
      }
    };

    const popupTemplateTransmissionMainMeterPoints = {
      title: "TRANSMISSION MAIN METER POINT <br> Site: {site}",
      outFields: ["*"],
      actions: [
        {
          id: "streetview",
          icon: "360-view",
          title: "Street View"
        },
        {
          id: "sharelocation",
          // image: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/sharelocation.png",
          icon: "pin-tear",
          title: "Share Location"
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
          <p><strong>Logger Type:</strong> ${attributes.make} - ${attributes.model}</p>
          <p><strong>Last Received Date/Time:</strong> ${formatDate(attributes.last_loggedtime)}</p>
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
      }
    };

    const popupTemplateWaterMains = {
      title: "WATER MAINS <br> Site: {site}",
      outFields: ["*"],
      actions: [
        {
          id: "streetview",
          icon: "360-view",
          title: "Street View"
        },
        {
          id: "sharelocation",
          // image: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/sharelocation.png",
          icon: "pin-tear",
          title: "Share Location"
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
      }
    };

    const popupTemplateWorkOrders = {
      title: "Work Order (New System) <br> Work Order Number: {workorder_dbID}",
      outFields: ["*"],
      actions: [
        {
          id: "streetview",
          icon: "360-view",
          title: "Street View"
        },
        {
          id: "sharelocation",
          // image: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/sharelocation.png",
          icon: "pin-tear",
          title: "Share Location"
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
      }
    };

    const popupTemplateDataLoggers = {
      title: "DATA LOGGER <br> Serial Number: {serial_number}",
      outFields: ["*"],
      actions: [
        {
          id: "streetview",
          icon: "360-view",
          title: "Street View"
        },
        {
          id: "sharelocation",
          // image: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/sharelocation.png",
          icon: "pin-tear",
          title: "Share Location"
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
          <p><strong>Logger Type:</strong> ${attributes.make} ${attributes.model}</p>
          <p><strong>Group Code:</strong> ${attributes.groupcode}</p>
          <p><strong>Group Name:</strong> ${attributes.groupname}</p>
          <p><strong>Site Code:</strong> ${attributes.sitecode}</p>
          <p><strong>Site Name:</strong> ${attributes.sitename}</p>
          <p><strong>Last Received Date/Time:</strong> ${formatDate(attributes.last_loggedtime)}</p>
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
      }
    };

    const popupTemplateSivMeters = {
      title: "SYSTEM INPUT VOLUME METER POINT <br> Site: {site}",
      outFields: ["*"],
      actions: [
        {
          id: "streetview",
          icon: "360-view",
          title: "Street View"
        },
        {
          id: "sharelocation",
          // image: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/sharelocation.png",
          icon: "pin-tear",
          title: "Share Location"
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
          <p><strong>Logger Type:</strong> ${attributes.make} - ${attributes.model}</p>
          <p><strong>Last Received Date/Time:</strong> ${formatDate(attributes.last_loggedtime)}</p>
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
      }
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
    const labelClassCustomerLocations = {  // autocasts as new LabelClass()
      symbol: {
        type: "text",  // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        yoffset: -6,
        font: {  // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 7
         }
      },
      labelPlacement: "above-center",
      labelExpressionInfo: {
        expression: "$feature.mtrnum"
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
    const labelClassDMZCriticalPoints= {  // autocasts as new LabelClass()
      symbol: {
        type: "text",  // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        yoffset: -6,
        font: {  // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 7
         }
      },
      labelPlacement: "above-center",
      labelExpressionInfo: {
        expression: "$feature.sitename"
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
    const labelClassKTM= {  // autocasts as new LabelClass()
      symbol: {
        type: "text",  // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        yoffset: -6,
        font: {  // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 7
         }
      },
      labelPlacement: "above-center",
      labelExpressionInfo: {
        expression: "$feature.sitename"
        // expression: "$feature.sitename + TextFormatting.NewLine + $feature.Division"
      },
      maxScale: 0,
      minScale: 36111.909643,
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
    const labelClassReservoirs= {  // autocasts as new LabelClass()
      symbol: {
        type: "text",  // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        yoffset: -6,
        font: {  // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 7
         }
      },
      labelPlacement: "above-center",
      labelExpressionInfo: {
        expression: "$feature.site"
        // expression: "$feature.sitename + TextFormatting.NewLine + $feature.Division"
      },
      maxScale: 0,
      minScale: 18055.9548215,
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
    const labelClassWTP= {  // autocasts as new LabelClass()
      symbol: {
        type: "text",  // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        yoffset: -6,
        font: {  // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 7
          }
      },
      labelPlacement: "above-center",
      labelExpressionInfo: {
        expression: "$feature.sitename"
        // expression: "$feature.sitename + TextFormatting.NewLine + $feature.Division"
      },
      maxScale: 0,
      minScale: 36111.909643,
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
    const labelClassDMZMeterPoints= {  // autocasts as new LabelClass()
      symbol: {
        type: "text",  // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        yoffset: -6,
        font: {  // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 7
         }
      },
      labelPlacement: "above-center",
      labelExpressionInfo: {
        expression: "$feature.sitename"
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
    const labelClassTransmissionMainMeterPoints= {  // autocasts as new LabelClass()
      symbol: {
        type: "text",  // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        yoffset: -6,
        font: {  // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 7
         }
      },
      labelPlacement: "above-center",
      labelExpressionInfo: {
        expression: "$feature.sitename"
        // expression: "$feature.sitename + TextFormatting.NewLine + $feature.Division"
      },
      maxScale: 0,
      minScale: 36111.909643,
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
        expression: "$feature.pipe_dn + ' ' + $feature.pipe_mat"
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
    const labelClassWorkOrders= {  // autocasts as new LabelClass()
      symbol: {
        type: "text",  // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        yoffset: -6,
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
      minScale: 18055.9548215,
      // where: "Conference = 'AFC'"
    };

    const labelClassDataLoggers= {  // autocasts as new LabelClass()
      symbol: {
        type: "text",  // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        haloSize: 2,
        yoffset: -6,
        font: {  // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 7
         }
      },
      labelPlacement: "above-center",
      labelExpressionInfo: {
        expression: "$feature.model + ' ' + $feature.serial_number"
        // expression: "$feature.sitename + TextFormatting.NewLine + $feature.Division"
      },
      maxScale: 0,
      minScale: 18055.9548215,
      // where: "Conference = 'AFC'"
    };

    const labelClassSivMeters= {  // autocasts as new LabelClass()
      symbol: {
        type: "text",  // autocasts as new TextSymbol()
        color: "black",
        haloColor: "white",
        haloSize: 2,
        haloSize: 2,
        yoffset: -6,
        font: {  // autocast as new Font()
          family: "Noto Sans",
          weight: "bold",
          size: 7
         }
      },
      labelPlacement: "above-center",
      labelExpressionInfo: {
        expression: "$feature.sitename"
        // expression: "$feature.sitename + TextFormatting.NewLine + $feature.Division"
      },
      maxScale: 0,
      minScale: 36111.909643,
      // where: "Conference = 'AFC'"
    };


    const layersDMZMeterPoints = [
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_MeterPoints_KotaBelud/FeatureServer/0", title: "Kota Belud" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_MeterPoints_KotaKinabalu/FeatureServer/280", title: "Kota Kinabalu" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_MeterPoints_KotaMarudu/FeatureServer/317", title: "Kota Marudu" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_MeterPoints_Kudat/FeatureServer/340", title: "Kudat" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_MeterPoints_Papar/FeatureServer/388", title: "Papar" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_MeterPoints_Ranau/FeatureServer/425", title: "Ranau" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_MeterPoints_Sandakan/FeatureServer/489", title: "Sandakan" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_MeterPoints_Semporna/FeatureServer/526", title: "Semporna" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_MeterPoints_Tambunan/FeatureServer/550", title: "Tambunan" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_MeterPoints_Tamparuli/FeatureServer/561", title: "Tamparuli" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_MeterPoints_Tawau/FeatureServer/628", title: "Tawau" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_MeterPoints_Tuaran/FeatureServer/665", title: "Tuaran" },
      // { url: "", title: "" },
    ];
    const layersCustomerLocations = [
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Kota_Marudu/FeatureServer/297", title: "Kota Marudu" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Tambunan/FeatureServer/544", title: "Tambunan" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Ranau/FeatureServer/437", title: "Ranau" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Tamparuli/FeatureServer/556", title: "Tamparuli" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Papar/FeatureServer/372", title: "Papar" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Tuaran/FeatureServer/585", title: "Tuaran" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/KotaBelud/FeatureServer/309", title: "Kota Belud" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Kudat/FeatureServer/356", title: "Kudat" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Sandakan/FeatureServer/460", title: "Sandakan" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/customers_locationsLargeOne_Layer01/FeatureServer/0", title: "Kota Kinabalu" }
    ];
    const layersDMZCriticalPoints = [
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZCriticalPoint_KotaKinabalu/FeatureServer/132", title: "Kota Kinabalu" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZCriticalPoint_Semporna/FeatureServer/308", title: "Semporna" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZCriticalPoint_Tambunan/FeatureServer/355", title: "Tambunan" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZCriticalPoint_Sandakan/FeatureServer/236", title: "Sandakan" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZCriticalPoint_Kudat/FeatureServer/198", title: "Kudat" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZCriticalPoint_KotaBelud/FeatureServer/0", title: "Kota Belud" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZCriticalPoint_Papar/FeatureServer/213", title: "Papar" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZCriticalPoint_Ranau/FeatureServer/216", title: "Ranau" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZCriticalPoint_KotaMarudu/FeatureServer/179", title: "Kota Marudu" },
      // { url: "", title: "" },
    ];
    const layersKTM = [
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/KTM_KotaKinabalu/FeatureServer/0", title: "Kota Kinabalu" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/KTM_Tambunan/FeatureServer/69", title: "Tambunan" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/KTM_Kudat/FeatureServer/59", title: "Kudat" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/KTM_Papar/FeatureServer/60", title: "Papar" },
      // { url: "", title: "" },
    ];
    const layersWTP = [
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WTP_KotaKinabalu/FeatureServer/5", title: "Kota Kinabalu" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WTP_Semporna/FeatureServer/28", title: "Semporna" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WTP_Tambunan/FeatureServer/31", title: "Tambunan" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WTP_Sandakan/FeatureServer/24", title: "Sandakan" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WTP_Kudat/FeatureServer/13", title: "Kudat" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WTP_KotaBelud/FeatureServer/0", title: "Kota Belud" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WTP_Tuaran/FeatureServer/38", title: "Tuaran" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WTP_Papar/FeatureServer/16", title: "Papar" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WTP_Tamparuli/FeatureServer/33", title: "Tamparuli" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WTP_Ranau/FeatureServer/20", title: "Ranau" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WTP_KotaMarudu/FeatureServer/9", title: "Kota Marudu" },
      // { url: "", title: "" },
    ];
    const layersReservoirs = [
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Reservoirs_KotaKinabalu/FeatureServer/32", title: "Kota Kinabalu" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Reservoirs_Semporna/FeatureServer/128", title: "Semporna" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Reservoirs_Tambunan/FeatureServer/143", title: "Tambunan" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Reservoirs_Sandakan/FeatureServer/113", title: "Sandakan" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Reservoirs_Kudat/FeatureServer/66", title: "Kudat" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Reservoirs_KotaBelud/FeatureServer/0", title: "Kota Belud" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Reservoirs_Tuaran/FeatureServer/152", title: "Tuaran" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Reservoirs_Papar/FeatureServer/81", title: "Papar" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Reservoirs_Tamparuli/FeatureServer/149", title: "Tamparuli" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Reservoirs_Ranau/FeatureServer/98", title: "Ranau" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Reservoirs_KotaMarudu/FeatureServer/49", title: "Kota Marudu" },
      // { url: "", title: "" },
    ];
    const layersDMZBoundaries = [
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_Boundaries_Ranau/FeatureServer/436", title: "Ranau" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_Boundaries_Tambunan/FeatureServer/567", title: "Tambunan" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_Boundaries_Papar/FeatureServer/388", title: "Papar" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_Boundaries_Tamparuli/FeatureServer/578", title: "Tamparuli" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_Boundaries_KotaBelud/FeatureServer/0", title: "Kota Belud" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_Boundaries_KotaMarudu/FeatureServer/341", title: "Kota Marudu" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_Boundaries_Kudat/FeatureServer/365", title: "Kudat" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_Boundaries_Sandakan/FeatureServer/494", title: "Sandakan" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_Boundaries_Semporna/FeatureServer/542", title: "Semporna" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_Boundaries_Tawau/FeatureServer/631", title: "Tawau" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/DMZ_Boundaries_KotaKinabalu/FeatureServer/0", title: "Kota Kinabalu" },
      // { url: "", title: "" },
    ];
    const layersTransmissionMainMeterPoints = [
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Transmission_Main_Meter_Points_Kudat/FeatureServer/20", title: "Kudat" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Transmission_Main_Meter_Points_Papar/FeatureServer/21", title: "Papar" },
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Transmission_Main_Meter_Points_KotaKinabalu/FeatureServer/0", title: "Kota Kinabalu" },
      // { url: "", title: "" },
    ];
    const layersWaterMains = [
      {
        title: "Kota Kinabalu",
        subGroups: [
          { title: "Primary Transmission Main", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Kota_Kinabalu_PrimaryTransmissionMain/FeatureServer/0" },
          { title: "Secondary Trunk Main", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Kota_Kinabalu_SecondaryTrunkMain/FeatureServer/23" },
          { title: "Tertiary Distribution Main", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Kota_Kinabalu_TertiaryDistributionMain/FeatureServer/40" },
          { title: "Raw Water Main", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Kota_Kinabalu_RawWaterMain/FeatureServer/18" },
        ]
      },
      {
        title: "Kota Belud",
        subGroups: [
          { title: "Primary Transmission Main", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_KotaBelud_PrimaryTransmissionMain/FeatureServer/49" },
          { title: "Secondary Trunk Main", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_KotaBelud_SecondaryTrunkMain/FeatureServer/57" },
          { title: "Tertiary Distribution Main", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_KotaBelud_TertiaryDistributionMain/FeatureServer/65" }
        ]
      },
      {
        title: "Kota Marudu",
        subGroups: [
          { title: "Primary Transmission Main", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_KotaMarudu_PrimaryTransmissionMain/FeatureServer/72" },
          { title: "Secondary Trunk Main", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_KotaMarudu_SecondaryTrunkMain/FeatureServer/77" },
          { title: "Tertiary Distribution Main", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_KotaMarudu_TertiaryDistributionMain/FeatureServer/79" },

        ]
      },
      {
        title: "Kudat",
        subGroups: [
          { title: "Primary Transmission Main", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Kudat_PrimaryTransmissionMain/FeatureServer/86" },
          { title: "Secondary Trunk Main", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Kudat_SecondaryTrunkMain/FeatureServer/94" },
          { title: "Tertiary Distribution Main", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Kudat_TertiaryDistributionMain/FeatureServer/108" },

        ]
      },
      {
        title: "Papar",
        subGroups: [
          { title: "Primary Transmission Main", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Papar_PrimaryTransmissionMain/FeatureServer/117" },
          { title: "Secondary Trunk Main", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Papar_SecondaryTrunkMain/FeatureServer/122" },
          { title: "Tertiary Distribution Main", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Papar_TertiaryDistributionMain/FeatureServer/129" },

        ]
      },
      {
        title: "Ranau",
        subGroups: [
          { title: "Primary Transmission Main", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Ranau_PrimaryTransmissionMain/FeatureServer/135" },
          { title: "Secondary Trunk Main", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Ranau_SecondaryTrunkMain/FeatureServer/141" },
          { title: "Tertiary Distribution Main", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Ranau_TertiaryDistributionMain/FeatureServer/147" },

        ]
      },
      {
        title: "Sandakan",
        subGroups: [
          { title: "Primary Transmission Main", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Sandakan_PrimaryTransmissionMain/FeatureServer/153" },
          { title: "Secondary Trunk Main", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Sandakan_SecondaryTrunkMain/FeatureServer/176" },
          { title: "Tertiary Distribution Main", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Sandakan_TertiaryDistributionMain/FeatureServer/189" },
          { title: "Private Main", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Sandakan_PrivateMain/FeatureServer/166" },

        ]
      },
      {
        title: "Tambunan",
        subGroups: [
          { title: "Tertiary Distribution Main", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Tambunan_TertiaryDistributionMain/FeatureServer/201" },

        ]
      },
      {
        title: "Tuaran",
        subGroups: [
          { title: "Primary Transmission Main", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Tuaran_PrimaryTransmissionMain/FeatureServer/210" },
          { title: "Secondary Trunk Main", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Tuaran_SecondaryTrunkMain/FeatureServer/214" },
          { title: "Tertiary Distribution Main", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/WaterMain_Tuaran_TertiaryDistributionMain/FeatureServer/221" },

        ]
      },
    ];
    const layersWaorkOrders = [
      {
        title: "Beaufort",
        subGroups: [
          { title: "Unallocated", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Beaufort_Unallocated/FeatureServer/0" },
          { title: "Leak Repair Contractor", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Beaufort_LeakRepairContractor/FeatureServer/109" },
        ]
      },
      {
        title: "Beluran",
        subGroups: [
          { title: "Leak Repair Contractor", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Beluran_LeakRepairContractor/FeatureServer/116" },
        ]
      },
      {
        title: "Kinabatangan",
        subGroups: [
          { title: "Leak Repair Contractor", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_Kinabatangan/FeatureServer/10" },
        ]
      },
      {
        title: "Tenom",
        subGroups: [
          { title: "Leak Repair Contractor", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_Tenom/FeatureServer/102" },
        ]
      },
      {
        title: "Keningau",
        subGroups: [
          { title: "Unallocated", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Unallocated_Keningau/FeatureServer/12" },
          { title: "Leak Repair Contractor", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_Keningau/FeatureServer/0" },
        ]
      },
      {
        title: "Kota Belud",
        subGroups: [
          { title: "Unallocated", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Unallocated_KotaBelud/FeatureServer/16" },
          { title: "Leak Repair Contractor", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_KotaBelud/FeatureServer/12" },
        ]
      },
      {
        title: "Kuala Penyu",
        subGroups: [
          { title: "Unallocated", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Unallocated_KualaPenyu/FeatureServer/20" },
          { title: "Leak Repair Contractor", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_KualaPenyu/FeatureServer/19" },
        ]
      },
      {
        title: "Kunak",
        subGroups: [
          { title: "Unallocated", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Unallocated_Kunak/FeatureServer/22" },
          { title: "Leak Repair Contractor", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_Kunak/FeatureServer/26" },
        ]
      },
      {
        title: "Lahad Datu",
        subGroups: [
          { title: "Unallocated", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Unallocated_LahadDatu/FeatureServer/26" },
          { title: "Leak Repair Contractor", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_LahadDatu/FeatureServer/42" },
        ]
      },
      {
        title: "Membakut",
        subGroups: [
          { title: "Unallocated", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Unallocated_Membakut/FeatureServer/29" },
          { title: "Leak Repair Contractor", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_Membakut/FeatureServer/44" },
        ]
      },
      {
        title: "Merotai",
        subGroups: [
          { title: "Unallocated", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Unallocated_Merotai/FeatureServer/32" },
          { title: "Leak Repair Contractor", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_Merotai/FeatureServer/48" },
        ]
      },
      {
        title: "Nabawan",
        subGroups: [
          { title: "Unallocated", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Unallocated_Nabawan/FeatureServer/37" },
          { title: "Leak Repair Contractor", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_Nabawan/FeatureServer/55" },
        ]
      },
      {
        title: "PulauSebatik",
        subGroups: [
          { title: "Unallocated", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Unallocated_PulauSebatik/FeatureServer/39" },
          { title: "Leak Repair Contractor", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_PulauSebatik/FeatureServer/59" },
        ]
      },
      {
        title: "Sook",
        subGroups: [
          { title: "Unallocated", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Unallocated_Sook/FeatureServer/47" },
          { title: "Leak Repair Contractor", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_Sook/FeatureServer/82" },
        ]
      },
      {
        title: "Tambunan",
        subGroups: [
          { title: "Unallocated", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Unallocated_Tambunan/FeatureServer/50" },
          { title: "Leak Repair Contractor", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_Tambunan/FeatureServer/86" },
        ]
      },
      {
        title: "Tawau",
        subGroups: [
          { title: "Unallocated", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Unallocated_Tawau/FeatureServer/54" },
          { title: "Leak Repair Contractor", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_Tawau/FeatureServer/95" },
        ]
      },
      {
        title: "Semporna",
        subGroups: [
          { title: "Leak Repair Contractor", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_Semporna/FeatureServer/75" },
        ]
      },
      {
        title: "Sandakan",
        subGroups: [
          { title: "Unallocated", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/Unallocated_Sandakan/FeatureServer/42" },
          { title: "Leak Repair Contractor", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/LeakRepairContractor_Sandakan/FeatureServer/67" },
        ]
      },
      {
        title: "Kota Kinabalu",
        subGroups: [
          { title: "Unallocated", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/KotaKinabalu_Unallocated/FeatureServer/7" },
          { title: "JANS Internal", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/KotaKinabalu_JANSInternalWork/FeatureServer/0" },
          { title: "Leak Repair Contractor", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/KotaKinabalu_LeakRepairContractor/FeatureServer/123" },
        ]
      },
    ];
    const layersDataLoggers = [
      {
        title: "Kota Kinabalu",
        subGroups: [
          { title: "Ovarro XiLog 4G", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_KotaKinabalu_OvarroXiLog4G/FeatureServer/430" },
          { title: "Primayer XiLog", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_KotaKinabalu_PrimayerXiLog/FeatureServer/447" },
          { title: "Primayer XiLog+", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_KotaKinabalu_PrimayerXiLog1/FeatureServer/567" },
        ]
      },
      {
        title: "Kota Belud",
        subGroups: [
          { title: "i2OWater ALGA1161", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_KotaBelud_i2OWaterALGA1161/FeatureServer/0" },
          { title: "Ovarro XiLog 4G", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_KotaBelud_OvarroXiLog4G/FeatureServer/83" },
        ]
      },
      {
        title: "Kota Marudu",
        subGroups: [
          { title: "i2OWater ALGA1130", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_KotaMarudu_i2OWaterALGA1130/FeatureServer/584" },
          { title: "i2OWater ALGA3230", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_KotaMarudu_i2OWaterALGA3230/FeatureServer/598" },
          { title: "Primayer XiLog+", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_KotaMarudu_PrimayerXiLog1/FeatureServer/612" },
          { title: "Technolog Cello", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_KotaMarudu_TechnologCello/FeatureServer/625" },
        ]
      },
      {
        title: "Kudat",
        subGroups: [
          { title: "i2OWater ALGA1161", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Kudat_i2OWaterALGA1161/FeatureServer/640" },
          { title: "Ovarro XiLog 4G", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Kudat_OvarroXiLog4G/FeatureServer/684" },
          { title: "Primayer XiLog+", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Kudat_PrimayerXiLog1/FeatureServer/701" },
        ]
      },
      {
        title: "Papar",
        subGroups: [
          { title: "Ovarro XiLog 4G", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Papar_OvarroXiLog4G/FeatureServer/721" },
          { title: "Primayer XiLog+", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Papar_PrimayerXiLog1/FeatureServer/782" },
        ]
      },
      {
        title: "Ranau",
        subGroups: [
          { title: "Ovarro XiLog 4G", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Ranau_OvarroXiLog4G/FeatureServer/808" },
          { title: "Primayer XiLog+", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Ranau_PrimayerXiLog1/FeatureServer/842" },
        ]
      },
      {
        title: "Sandakan",
        subGroups: [
          { title: "Ovarro XiLog 4G", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Sandakan_OvarroXiLog4G/FeatureServer/876" },
          { title: "Primayer XiLog+", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Sandakan_PrimayerXiLog1/FeatureServer/972" },
        ]
      },
      {
        title: "Tambunan",
        subGroups: [
          { title: "Primayer XiLog+", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Tambunan_PrimayerXiLog1/FeatureServer/1032" },
        ]
      },
      {
        title: "Tuaran",
        subGroups: [
          { title: "Ovarro XiLog 4G", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Tuaran_OvarroXiLog4G/FeatureServer/1086" },
          { title: "Primayer XiLog+", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Tuaran_PrimayerXiLog1/FeatureServer/1101" },
        ]
      },
      {
        title: "Tamparuli",
        subGroups: [
          { title: "Ovarro XiLog 4G", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Tamparuli_OvarroXiLog4G/FeatureServer/1055" },
          { title: "Primayer XiLog+", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Tamparuli_PrimayerXiLog1/FeatureServer/1070" },
        ]
      },
      {
        title: "Semporna",
        subGroups: [
          { title: "i2OWater ALGA1160", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Semporna_i2OWaterALGA1160/FeatureServer/989" },
          { title: "Ovarro XiLog 4G", url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/datalogger_Semporna_OvarroXiLog4G/FeatureServer/1008" },
        ]
      },
    ];
    const layersSivMeters = [
      { url: "https://services9.arcgis.com/O3obYY4143cgu5Lt/arcgis/rest/services/SivMeters/FeatureServer/0", title: "Kota Kinabalu" },
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
    
    const WTPRenderer = {
      type: "simple",
      symbol: {
        type: "picture-marker",
        url: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/wtp.png",
        width: "25px",
        height: "25px"
        // style: "circle",
        // color: [2, 144, 227, 0.5],
        // size: 9,
        // outline: {
        //   color: "#ffffff",
        //   width: 1
        // }
      }
    };
    const TMMRenderer = {
      type: "simple",
      symbol: {
        type: "picture-marker",
        url: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/tmm.png",
        width: "25px",
        height: "25px"
      }
    };
    const TKMRenderer = {
      type: "simple",
      symbol: {
        type: "picture-marker",
        url: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/tkm.png",
        width: "25px",
        height: "25px"
      }
    };
    const DMZRenderer = {
      type: "simple",
      symbol: {
        type: "picture-marker",
        url: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/dmz.png",
        width: "25px",
        height: "25px"
      }
    };
    const CriticalPointsRenderer = {
      type: "simple",
      symbol: {
        type: "picture-marker",
        url: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/criticalpoints.png",
        width: "25px",
        height: "25px"
      }
    };
    const CustomerLocationsRenderer = {
      type: "simple",
      symbol: {
        type: "picture-marker",
        url: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/customerlocation.png",
        width: "15px",
        height: "15px"
      }
    };
    const ReservoirRenderer = {
      type: "simple",
      symbol: {
        type: "picture-marker",
        url: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/reservoir.png",
        width: "25px",
        height: "25px"
      }
    };
    const WorkOrdersRenderer = {
      type: "simple",
      symbol: {
        type: "picture-marker",
        url: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/workorders.png",
        width: "25px",
        height: "25px"
      }
    };
    const DataLoggersRenderer = {
      type: "simple",
      symbol: {
        type: "picture-marker",
        url: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/dataloggers.png",
        width: "25px",
        height: "25px"
      }
    };
    const DataLoggersRendererWithColor = {
      type: "simple",
      symbol: {
        type: "picture-marker",
        url: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/dataloggersWithColor.png",
        width: "25px",
        height: "25px"
      }
    };
    const SivMetersRenderer = {
      type: "simple",
      symbol: {
        type: "picture-marker",
        url: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/siv.png",
        width: "25px",
        height: "25px"
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
          sublayer.renderer = CustomerLocationsRenderer;
          sublayer.labelingInfo = [ labelClassCustomerLocations ];
          sublayer.labelsVisible = false;
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
          sublayer.renderer = CriticalPointsRenderer;
          sublayer.labelingInfo = [ labelClassDMZCriticalPoints ];
          sublayer.labelsVisible = false;
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
          sublayer.renderer = TKMRenderer;
          sublayer.labelingInfo = [ labelClassKTM ];
          sublayer.labelsVisible = false;
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
          sublayer.renderer = ReservoirRenderer;
          sublayer.labelingInfo = [ labelClassReservoirs ];
          sublayer.labelsVisible = false;
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
          sublayer.renderer = WTPRenderer;
          sublayer.labelingInfo = [ labelClassWTP ];
          sublayer.labelsVisible = false;
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
          sublayer.renderer.symbol.outline.width = 1;
          sublayer.labelingInfo = [ labelClassDMZBoundariesNamesOnly ];
          sublayer.labelsVisible = false;
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
          sublayer.renderer = DMZRenderer;
          sublayer.labelingInfo = [ labelClassDMZMeterPoints ];
          sublayer.labelsVisible = false;
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
          sublayer.renderer = TMMRenderer;
          sublayer.labelingInfo = [ labelClassTransmissionMainMeterPoints ];
          sublayer.labelsVisible = false;
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
        visible: false // Hide all sublayers initially
      });
    });
    // Create the Main Water Main Group Layer
    const WaterMains = new GroupLayer({
      title: "Water Mains",
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
            sublayer.renderer = WorkOrdersRenderer;
            // sublayer.labelingInfo = [ labelClassWorkOrders ];
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
      title: "Maintenance Work Orders",
      layers: subtypeGroupLayersWorkOrders,
      visible: false // Hide initially
    });

    // // Data Loggers Layers
    // // Create SubtypeGroupLayers for Data Loggers
    const subtypeGroupLayersDataLoggers = layersDataLoggers.map(region => {
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
            sublayer.renderer = DataLoggersRenderer;
            sublayer.labelingInfo = [ labelClassDataLoggers ];
            sublayer.labelsVisible = false;
            sublayer.popupTemplate = popupTemplateDataLoggers ;
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
    const DataLoggers = new GroupLayer({
      title: "Data Loggers",
      layers: subtypeGroupLayersDataLoggers,
      visible: false // Hide initially
    });

    // Siv Meters Points Layers
    // Create SubtypeGroupLayers for Siv Meters Points
    const subtypeGroupLayersSivMeters = layersSivMeters.map(layerInfo => {
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
          sublayer.renderer = SivMetersRenderer;
          sublayer.labelingInfo = [ labelClassSivMeters ];
          sublayer.labelsVisible = false;
          sublayer.popupTemplate = popupTemplateSivMeters;
        });
      });
      return layer;
    });
    const SivMetersPoints = new GroupLayer({
      title: "SIV Meters Points",
      layers: subtypeGroupLayersSivMeters,
      visible: false // Hide all sublayers initially
    });




    // await displayMap.add(WorkOrders);  // adds the layer to the map
    // // wait for the view to catch up
    // await reactiveUtils.whenOnce(() => !view.updating);
    // await displayMap.add(WTP);  // adds the layer to the map
    // // wait for the view to catch up
    // await reactiveUtils.whenOnce(() => !view.updating);
    // await displayMap.add(WaterMains);  // adds the layer to the map
    // // wait for the view to catch up
    // await reactiveUtils.whenOnce(() => !view.updating);
    // await displayMap.add(KTM);
    // // wait for the view to catch up
    // await reactiveUtils.whenOnce(() => !view.updating);
    // await displayMap.add(TransmissionMainMeterPoints);  // adds the layer to the map
    // // wait for the view to catch up
    // await reactiveUtils.whenOnce(() => !view.updating);
    // await displayMap.add(SivMetersPoints);  // adds the layer to the map
    // // wait for the view to catch up
    // await reactiveUtils.whenOnce(() => !view.updating);
    // await displayMap.add(Reservoirs);  // adds the layer to the map
    // // wait for the view to catch up
    // await reactiveUtils.whenOnce(() => !view.updating);
    // await displayMap.add(DMZMeterPoints);  // adds the layer to the map
    // // wait for the view to catch up
    // await reactiveUtils.whenOnce(() => !view.updating);
    // await displayMap.add(DMZCriticalPoints);
    await displayMap.add(DMZBoundaries);  // adds the layer to the map
    // wait for the view to catch up
    await reactiveUtils.whenOnce(() => !view.updating);
    await displayMap.add(DataLoggers);  // adds the layer to the map
    // wait for the view to catch up
    await reactiveUtils.whenOnce(() => !view.updating);
    // await displayMap.add(Customer_Locations);
    // // wait for the view to catch up
    // await reactiveUtils.whenOnce(() => !view.updating);


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
              const actionGroups = popupContainer.querySelectorAll('calcite-action-group[layout="horizontal"]');
              actionGroups.forEach(actionGroup => {
                const shadowRoot = actionGroup.shadowRoot;
                if (shadowRoot) {
                  const container = shadowRoot.querySelector('.container');
                  if (container) {
                    container.style.display = 'flex';
                    container.style.flexDirection = 'row-reverse';
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
            console.log(selectedFeature, "selectedFeature")
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
    const calciteButton = document.querySelectorAll('calcite-button[appearance=outline-fill][kind=neutral]');

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
  "Maintenance Work Orders"
];

// At the top of your script, add this configuration object
const THEME_CONFIG = {
  'nrw-percentage': {
    field: 'ranking_descr',
    categories: [
      { 
        values: ["Not specified", "Negative NRW"],  // Array of values to match
        label: "Non Specified and Negative NRW",
        color: [128, 128, 128, 0.6] // Dark Grey
      },
      { 
        values: ["< 25%"],
        label: "Less than 25%",
        color: [44, 123, 182, 0.6] // Blue
      },
      { 
        values: ["25 to 35%", "35 to 45%"],  // Combined class
        label: "26% to 45%",
        color: [253, 174, 97, 0.6] // Orange
      },
      { 
        values: ["> 45%"],
        label: "45% above",
        color: [215, 48, 39, 0.6] // Red
      }
    ]
  },
  'nrw-status': {
    field: 'status_descr',
    categories: [
      {
        value: "Not specified",
        label: "Not specified",
        color: [189, 189, 189, 0.6]
      },
      {
        value: "No inflow",
        label: "No inflow",
        color: [253, 174, 97, 0.6]
      },
      {
        value: "Zero inflow",
        label: "Zero inflow",
        color: [255, 255, 191, 0.6]
      },
      {
        value: "No BMAC data",
        label: "No BMAC data",
        color: [166, 217, 106, 0.6]
      },
      {
        value: "Negative NRW",
        label: "Negative NRW",
        color: [26, 150, 65, 0.6]
      },
      {
        value: "Positive NRW",
        label: "Positive NRW",
        color: [215, 48, 39, 0.6]
      }
    ]
  },
  'operational-status': {
    field: 'category_name',
    categories: [
      {
        value: "Not specified",
        label: "Not specified",
        color: [189, 189, 189, 0.6]
      },
      {
        value: "Active - hydraulically isolated",
        label: "Active - hydraulically isolated",
        color: [44, 123, 182, 0.6]
      },
      {
        value: "Active - open boundary",
        label: "Active - open boundary",
        color: [171, 217, 233, 0.6]
      },
      {
        value: "Active - bypassed mp",
        label: "Active - bypassed mp",
        color: [253, 174, 97, 0.6]
      },
      {
        value: "Active - pending zpt",
        label: "Active - pending zpt",
        color: [215, 48, 39, 0.6]
      }
    ]
  },
  'hardware-alarm': {
    field: 'Missing_Transmission',
    categories: [
      {
        value: "5",  // Changed from ">3" to "5"
        label: "Alarm Triggered",
        symbol: {
          type: "picture-marker",
          url: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/dataloggersWithColor.png",
          width: "25px",
          height: "25px"
        }
      },
      {
        value: "no_alarm",
        label: "No Alarm",
        symbol: {
          type: "picture-marker",
          url: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/dataloggers.png",
          width: "25px",
          height: "25px"
        }
      }
    ]
  }
};

// 2. Add all these utility functions together
function findLayerByTitle(title) {
  let targetLayer = null;
  displayMap.layers.forEach(layer => {
    if (layer.title === title) {
      targetLayer = layer;
    }
  });
  return targetLayer;
}

function updateThemeOptions(layerTitle) {
  const themeSelect = document.getElementById('thematicThemeSelect');
  
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
      { value: 'nrw-percentage', text: 'DMA NRW Percentage' },
      { value: 'nrw-status', text: 'DMA NRW Status' },
      { value: 'operational-status', text: 'DMA Operational Status' }
    ];

    themes.forEach(theme => {
      const option = document.createElement('option');
      option.value = theme.value;
      option.text = theme.text;
      themeSelect.add(option);
    });
  } else if (layerTitle === "Data Loggers") {
    const themes = [
      { value: 'hardware-alarm', text: 'Hardware Alarm' },
    ];

    themes.forEach(theme => {
      const option = document.createElement('option');
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
        defaultSymbol: THEME_CONFIG['hardware-alarm'].categories[1].symbol, // No Alarm symbol for empty values
        uniqueValueInfos: [
          {
            value: "5",  // Exact value of 5
            symbol: THEME_CONFIG['hardware-alarm'].categories[0].symbol, // Alarm Triggered symbol
            label: "Alarm Triggered"
          }
        ]
      };
    } else if (themeKey === 'nrw-percentage') {
      // Special handling for nrw-percentage with combined classes
      return {
        type: "unique-value",
        field: themeConfig.field,
        defaultSymbol: {
          type: "simple-fill",
          color: [200, 200, 200, 0.6],
          outline: { color: [128, 128, 128, 0.8], width: 0.5 }
        },
        uniqueValueInfos: themeConfig.categories.flatMap(category => 
          category.values.map(value => ({
            value: value,
            symbol: {
              type: "simple-fill",
              color: category.color,
              outline: { color: [128, 128, 128, 0.8], width: 0.5 }
            },
            label: category.label
          }))
        )
      };
    } else {
      // Regular handling for other themes
      return {
        type: "unique-value",
        field: themeConfig.field,
        defaultSymbol: {
          type: "simple-fill",
          color: [200, 200, 200, 0.6],
          outline: { color: [128, 128, 128, 0.8], width: 0.5 }
        },
        uniqueValueInfos: themeConfig.categories.map(category => ({
          value: category.value,
          symbol: {
            type: "simple-fill",
            color: category.color,
            outline: { color: [128, 128, 128, 0.8], width: 0.5 }
          }
        }))
      };
    }
  };

  // Apply renderer to layers
  if (layer.layers) {
    if (layerTitle === "Data Loggers") {
      // Handle Data Loggers layer structure (nested group layers)
      layer.layers.forEach(regionGroup => {
        regionGroup.layers.forEach(subtypeGroupLayer => {
          subtypeGroupLayer.when(() => {
            subtypeGroupLayer.sublayers.forEach(sublayer => {
              // Store original renderer if not already stored
              if (!originalRenderers.has(sublayer.id)) {
                originalRenderers.set(sublayer.id, sublayer.renderer);
              }

              if (theme === 'default') {
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
      layer.layers.forEach(subtypeGroupLayer => {
        if (subtypeGroupLayer.type === "subtype-group") {
          subtypeGroupLayer.when(() => {
            subtypeGroupLayer.sublayers.forEach(sublayer => {
              // Store original renderer if not already stored
              if (!originalRenderers.has(sublayer.id)) {
                originalRenderers.set(sublayer.id, sublayer.renderer);
              }

              if (theme === 'default') {
                // Restore original renderer
                sublayer.renderer = originalRenderers.get(sublayer.id);
                sublayer.labelingInfo = [labelClassDMZBoundariesNamesOnly];
              } else {
                // Apply thematic renderer and appropriate labels
                sublayer.renderer = createRenderer(theme, layerTitle);
                
                // Apply appropriate labels based on theme
                if (theme === 'nrw-percentage') {
                  sublayer.labelingInfo = [labelClassDMZBoundaries];
                } else {
                  sublayer.labelingInfo = [labelClassDMZBoundariesNamesOnly];
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

  const layerSelect = document.getElementById('thematicLayerSelect');
  const themeSelect = document.getElementById('thematicThemeSelect');
  const themeLegendBtn = document.getElementById('themeLegendBtn');
  const legendPopup = document.getElementById('themeLegendPopup');
  const closeLegendBtn = document.getElementById('closeLegendPopup');



  // Function to reset layer renderers
  const resetLayerRenderers = (layer) => {
    if (layer.title === "Data Loggers") {
      // Handle nested structure of Data Loggers
      layer.layers.forEach(regionGroup => {
        regionGroup.layers.forEach(subtypeGroupLayer => {
          subtypeGroupLayer.when(() => {
            subtypeGroupLayer.sublayers.forEach(sublayer => {
              if (originalRenderers.has(sublayer.id)) {
                sublayer.renderer = originalRenderers.get(sublayer.id);
              }
            });
          });
        });
      });
    } else {
      // Handle other layers (like DMZ Boundaries)
      layer.layers.forEach(subtypeGroupLayer => {
        if (subtypeGroupLayer.type === "subtype-group") {
          subtypeGroupLayer.when(() => {
            subtypeGroupLayer.sublayers.forEach(sublayer => {
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
  layerSelect.addEventListener('change', (e) => {
    const selectedOption = layerSelect.options[layerSelect.selectedIndex];
    
    if (selectedOption.value === 'none') {
      // Reset everything when 'none' is selected
      themeSelect.disabled = true;
      themeLegendBtn.disabled = true;
      
      // Clear theme options
      while (themeSelect.options.length > 1) {
        themeSelect.remove(1);
      }
      
      // Reset all layers to their original renderers
      displayMap.layers.forEach(layer => {
        if (layer.layers) {
          resetLayerRenderers(layer);
        }
      });

    } else {
      updateThemeOptions(selectedOption.text);
    }
  });

  // Theme selection change
  themeSelect.addEventListener('change', (e) => {
    const selectedLayer = layerSelect.options[layerSelect.selectedIndex].text;
    const selectedTheme = e.target.value;
    themeLegendBtn.disabled = selectedTheme === 'default';

    const layer = findLayerByTitle(selectedLayer);
    if (!layer) return;

    if (selectedTheme === 'default') {
      // Reset to original renderers for the selected layer only
      resetLayerRenderers(layer);
    } else {
      applyThematicRenderer(selectedLayer, selectedTheme);
    }
  });

  // Theme legend button
  themeLegendBtn.addEventListener('click', () => {
    updateThemeLegend();
    document.querySelector('.theme-legend-popup').style.display = 'block';
    document.querySelector('.theme-legend-backdrop').style.display = 'block';
  });

  // Close legend popup
  closeLegendBtn.addEventListener('click', () => {
    document.querySelector('.theme-legend-popup').style.display = 'none';
    document.querySelector('.theme-legend-backdrop').style.display = 'none';
  });

  // Close on backdrop click
  document.querySelector('.theme-legend-backdrop').addEventListener('click', () => {
    document.querySelector('.theme-legend-popup').style.display = 'none';
    document.querySelector('.theme-legend-backdrop').style.display = 'none';
  });

  isThematicInitialized = true;
}

async function updateThemeLegend() {
  try {
    const legendTableBody = document.getElementById('legendTableBody');
    legendTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Loading...</td></tr>';

    const layerSelect = document.getElementById('thematicLayerSelect');
    const themeSelect = document.getElementById('thematicThemeSelect');
    const selectedLayer = layerSelect.options[layerSelect.selectedIndex].text;
    const selectedTheme = themeSelect.value;

    document.getElementById('legendLayerName').textContent = selectedLayer;
    document.getElementById('legendThemeName').textContent = themeSelect.options[themeSelect.selectedIndex].text;

    const layer = findLayerByTitle(selectedLayer);
    if (!layer) return;

    const themeConfig = THEME_CONFIG[selectedTheme];
    if (!themeConfig) return;

    if (selectedLayer === "Data Loggers" && selectedTheme === "hardware-alarm") {
      const categoryCounts = {
        alarm: 0,
        no_alarm: 0
      };

      const visibleSublayers = [];
      
      // Handle nested structure of Data Loggers layer
      layer.layers.forEach(regionGroup => {
        regionGroup.layers.forEach(subtypeGroupLayer => {
          if (subtypeGroupLayer.visible) {
            subtypeGroupLayer.sublayers.forEach(sublayer => {
              if (sublayer.visible) {
                visibleSublayers.push(sublayer);
              }
            });
          }
        });
      });

      if (visibleSublayers.length > 0) {
        const promises = visibleSublayers.map(sublayer => {
          // Query for alarm count
          const queryAlarm = sublayer.createQuery();
          queryAlarm.where = "Missing_Transmission = 5";
          const alarmPromise = sublayer.queryFeatureCount(queryAlarm)
            .then(count => {
              categoryCounts.alarm += count;
            });

          // Query for no alarm count
          const queryNoAlarm = sublayer.createQuery();
          queryNoAlarm.where = "Missing_Transmission IS NULL OR Missing_Transmission <> 5";
          const noAlarmPromise = sublayer.queryFeatureCount(queryNoAlarm)
            .then(count => {
              categoryCounts.no_alarm += count;
            });

          return Promise.all([alarmPromise, noAlarmPromise]);
        });

        await Promise.all(promises.flat());
      }

      // Update legend table for Data Loggers
      legendTableBody.innerHTML = '';
      themeConfig.categories.forEach(category => {
        const count = category.value === "5" ? categoryCounts.alarm : categoryCounts.no_alarm;
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>
            <img src="${category.symbol.url}" width="25" height="25" alt="${category.label}" />
          </td>
          <td>${category.label}</td>
          <td>${count}</td>
        `;
        legendTableBody.appendChild(row);
      });

    } else {
      // Existing code for other layers
      const categoryCounts = {};
      if (selectedTheme === 'nrw-percentage') {
        themeConfig.categories.forEach(cat => {
          cat.values.forEach(value => {
            categoryCounts[value] = 0;
          });
        });
      } else {
        themeConfig.categories.forEach(cat => {
          categoryCounts[cat.value] = 0;
        });
      }

      if (layer.layers) {
        const visibleSublayers = [];
        
        layer.layers.forEach(subtypeGroupLayer => {
          if (subtypeGroupLayer.visible && subtypeGroupLayer.type === "subtype-group") {
            subtypeGroupLayer.sublayers.forEach(sublayer => {
              if (sublayer.visible) {
                visibleSublayers.push(sublayer);
              }
            });
          }
        });

        if (visibleSublayers.length > 0) {
          const promises = visibleSublayers.map(sublayer => {
            const query = sublayer.createQuery();
            query.where = "1=1";
            query.outFields = [themeConfig.field];
            query.returnGeometry = false;
            query.returnDistinctValues = true;
            query.groupByFieldsForStatistics = [themeConfig.field];
            query.outStatistics = [{
              statisticType: "count",
              onStatisticField: themeConfig.field,
              outStatisticFieldName: "count"
            }];

            return sublayer.queryFeatures(query)
              .then(result => {
                result.features.forEach(feature => {
                  const value = feature.attributes[themeConfig.field];
                  const count = feature.attributes.count;
                  if (value in categoryCounts) {
                    categoryCounts[value] += count;
                  }
                });
              })
              .catch(error => {
                console.error(`Error querying sublayer: ${error}`);
              });
          });

          await Promise.all(promises);
        }

        legendTableBody.innerHTML = '';
        
        if (selectedTheme === 'nrw-percentage') {
          themeConfig.categories.forEach(category => {
            const totalCount = category.values.reduce((sum, value) => {
              return sum + (categoryCounts[value] || 0);
            }, 0);

            const row = document.createElement('tr');
            row.innerHTML = `
              <td>
                <div class="color-box" style="background-color: rgba(${category.color.join(',')})"></div>
              </td>
              <td>${category.label}</td>
              <td>${totalCount}</td>
            `;
            legendTableBody.appendChild(row);
          });
        } else {
          themeConfig.categories.forEach(category => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>
                <div class="color-box" style="background-color: rgba(${category.color.join(',')})"></div>
              </td>
              <td>${category.label}</td>
              <td>${categoryCounts[category.value] || 0}</td>
            `;
            legendTableBody.appendChild(row);
          });
        }
      }
    }
  } catch (error) {
    console.error('Error updating legend:', error);
    legendTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: red;">Query timeout, Error loading data, Please try again.</td></tr>';
  }
}




      var layerList = new LayerList({
        view: view,
        container: document.getElementById("layerListContainer"), // Place LayerList in the new container,
        // showLegend: true
      });

      layerList.visibilityAppearance = "checkbox";
      layerList.listItemCreatedFunction = async function(event) {
        const item = event.item;
        // await item.layer.when();
        // console.log(item, "here is the item...");
        // if (item.children.length > 0) {
        //   console.log(item, "M");
        // }
        if (item.children.length > 0) {  // Only apply logic to group layers
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
                if (subGroup !== targetItem && subGroup.parent === targetItem.parent) {
                  subGroup.open = false; // Collapse only sibling inside-group layers
                }
      
                subGroup.children.forEach((subtypeGroup) => {
                  if (subtypeGroup !== targetItem && subtypeGroup.parent === targetItem.parent) {
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
                  id: "full-extent"
              }
          ]);
        }

        // Check if the layer is a top-level GroupLayer
        const isTopLevelGroupLayer = view.map.layers.includes(item.layer);

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


        item.watch("visible", (visible) => {
          if (visible) {




if (item.layer.type === "group") {
  titlesData.forEach(titleGroup => {
    if (item.layer.title === titleGroup) {
      const layerSelect = document.getElementById('thematicLayerSelect');
      
      // Update layer options
      let existingOption = Array.from(layerSelect.options).find(opt => opt.value === item.layer.id);
      if (!existingOption) {
        const option = document.createElement('option');
        option.value = item.layer.id;
        option.text = item.layer.title;
        layerSelect.add(option);
      }
    
      // Initialize thematic functionality if not already done
      initializeThematic();
    }
  })
}



            if ( item.layer.type === "subtype-sublayer") {
              let parentLayer = item.layer.parent;
              while (parentLayer) {
                if (parentLayer.visible === false) {
                  parentLayer.visible = true;
                  console.log("Parent Layer Made Visible:", parentLayer.title || "Unnamed Layer");
                }
                parentLayer = parentLayer.parent; // Move up the hierarchy
              }
              // return;
            } else {
                if (item.layer.type === "subtype-group" && item.layer.parent.type === "group") { // &&
                  if (item.layer.sublayers && item.layer.sublayers.some(sublayer => sublayer.visible)) {
                    return;
                  } else {
                    let parentLayer = item.layer.parent;
                    while (parentLayer) {
                      if (parentLayer.visible === false) {
                        parentLayer.visible = true;
                        console.log("Parent Layer Made Visible:", parentLayer.title || "Unnamed Layer");
                      }
                      parentLayer = parentLayer.parent; // Move up the hierarchy
                    }
              
                    // Remove or modify this block to prevent all sublayers from being turned on
                    if (item.layer.sublayers && item.layer.type === "subtype-group") { // Ensure sublayers exist
                      item.layer.sublayers.forEach((sublayer) => {
                        if (!sublayer.visible) { // Only change if not already visible
                          sublayer.visible = true;
                          console.log("Sublayer Made Visible:", sublayer.title);
                        }
                      });
                    }
                  }
                } else {
                  let parentLayer = item.layer.parent;
                  while (parentLayer) {
                    if (parentLayer.visible === false) {
                      parentLayer.visible = true;
                      console.log("Parent Layer Made Visible:", parentLayer.title || "Unnamed Layer");
                    }
                    parentLayer = parentLayer.parent; // Move up the hierarchy
                  }
                }


                if (item.layer.type === "group" && item.layer.parent.title === "Data Loggers")  {
                  if (item.layer.layers && item.layer.layers.some(layer => layer.visible)) {
                    return;
                  } else {
                    console.log(item.layer, "Here is the group layer...");
                    item.layer.layers.forEach((subtypegrouplayers) => {
                      subtypegrouplayers.visible = true;

                    })
                  }
                }

            }
          } else {

                // When layer becomes invisible, remove from dropdown
                if (item.layer.type === "group") {
                  const layerSelect = document.getElementById('thematicLayerSelect');
                  Array.from(layerSelect.options).forEach(opt => {
                    if (opt.value === item.layer.id) {
                      layerSelect.remove(opt.index);
                    }
                  });
                }
              if (item.layer.sublayers) {
                item.layer.sublayers.forEach((sublayer) => {
                      sublayer.visible = false;  // Turn off visibility
                      sublayer.listItem && (sublayer.listItem.visible = false); // Uncheck the checkbox in UI
                  });
              }
              if (item.layer.type === "group") {
                item.layer.layers.forEach((layer) => {
                  layer.visible = false;
                })
              }
          }
        
          if (item.layer.type === "subtype-sublayer") {
            // Apply to all children, outside the condition
            item.children.forEach(child => {
              child.watch("visible", (childVisible) => {
                console.log("Child Layer Visibility Changed:", child.layer.title, childVisible);
              });
            });
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


      // const thematicExpand = new Expand({
      //   expandIcon: "classify-pixels",
      //   view: view,
      //   // content: document.getElementById("thematicsSection")
      // });
      // // view.ui.add(thematicExpand, { position: "bottom-right", index: 0 });
     


      view.ui.add(document.getElementById("thematicButton"), { position: "bottom-right", index: 0 });
      
      let basemapGallery = new BasemapGallery({
        view: view
      });

      const basemapGalleryExpand = new Expand({
        expandIcon: "basemap",
        view: view,
        content: basemapGallery
      });
      view.ui.add(basemapGalleryExpand, { position: "bottom-right", index: 1 });

      basemapGallery.when(function(){
        // This function will execute once the promise is resolved
        console.log("Basemap Grallery...");
      }, function(error){
        // This function will execute if the promise is rejected due to an error
      });




      // view.ui.add([Expand5], { position: "top-left", index: 6 });
      var fullscreen = new Fullscreen({
        view: view
      });
      view.ui.add(fullscreen, { position: "bottom-right", index: 2 });
    

// Show popup
document.getElementById("thematicButton").addEventListener("click", () => {
  const popup = document.getElementById("thematicPopup");
  popup.style.display = "block"; // Make it visible first
  // Force a reflow
  popup.offsetHeight;
  popup.classList.add("show");

  const calciteButton = document.querySelectorAll('calcite-button[appearance=outline-fill][kind=neutral]');
  document.getElementById("thematicButton").kind = "brand";
  document.getElementById("thematicButton").appearance = "solid";
  calciteButton[0].childEl.style.backgroundColor = "#007ac2";
  calciteButton[0].childEl.style.color = "white";
  calciteButton[0].childEl.style.borderColor = "transparent";
});

// Hide popup
document.getElementById("closeThematicPopup").addEventListener("click", (e) => {
  const calciteButton = document.querySelectorAll('calcite-button[appearance=solid][kind=brand]');
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
});

// // Close popup when clicking outside
// document.addEventListener("click", (e) => {
//   const popup = document.getElementById("thematicPopup");
//   const thematicButton = document.getElementById("thematicButton");
  
//   if (!popup.contains(e.target) && !thematicButton.contains(e.target)) {
//     popup.classList.remove("show");
//   }
// });



    
      // let legend = new Legend({
      //   view: view,
      //   container: document.getElementById("legendContainer"), // Place Legend in the new container,
      // });
      // legend.hideLayersNotInCurrentView = true;


      // Sample data for the legend with image URLs
      const legendData = [
        // { feature: "Customer Locations", count: '#', icon: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/customerlocation.png" },
        { feature: "Data Loggers", count: '#', icon: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/dataloggers.png" },
        { feature: "DMZ Boundaries", count: '#', icon: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/dmzboundaries.png" },
        // { feature: "DMZ Critical Points", count: '#', icon: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/criticalpoints.png" },
        // { feature: "DMZ Meter Points", count: '#', icon: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/dmz.png" },
        // { feature: "Reservoirs", count: '#', icon: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/reservoir.png" },
        // { feature: "SIV Meters Points", count: '#', icon: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/siv.png" },
        // { feature: "Transmission Main Meter Points", count: '#', icon: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/tmm.png" },
        // { feature: "Trunk Main Meter Points", count: '#', icon: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/tkm.png" },
        // { feature: "Water Mains", count: '#', icon: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/watermains.png" },
        // { feature: "Water Treatment Plant", count: '#', icon: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/wtp.png" },
        // { feature: "Maintenance Work Orders", count: '#', icon: "https://raw.githubusercontent.com/ashrafayman219/austen-inspire-map/refs/heads/main/workorders.png" },
      ];

      // Function to create the legend
      function createLegend(legendData) {
        const legendContainer = document.getElementById('legendContainer');
        legendContainer.innerHTML = ''; // Clear existing content

        legendData.forEach(item => {
            const row = document.createElement('div');
            row.className = 'legend-item';
            row.innerHTML = `
                <img src="${item.icon}" alt="${item.feature}">
                ${item.feature} <span id="${item.feature.replace(/\s+/g, '')}Count" style="font-weight: bold;">${item.count}</span>
            `;
            legendContainer.appendChild(row);
        });
      }

      // Function to update the count of displayed features
      function updateFeatureCount(featureName, count) {
        const featureCountElement = document.getElementById(featureName.replace(/\s+/g, '') + 'Count');
        if (featureCountElement) {
            featureCountElement.textContent = count;
        }
      }

      function animateCount(element, targetCount, unit, duration = 1000) {
        const startCount = parseFloat(element.textContent.replace(/,/g, '').replace('#', '0')) || 0;
        const totalSteps = Math.max(duration / 100, 1); // Ensure at least one step
        const increment = (targetCount - startCount) / totalSteps;
        let currentCount = startCount;
        let step = 0;

        const interval = setInterval(() => {
          step++;
          currentCount += increment;

          // Clamp the current count to the target count
          if ((increment > 0 && currentCount >= targetCount) || (increment < 0 && currentCount <= targetCount)) {
            currentCount = targetCount;
            clearInterval(interval);
          }

          // Format the count for Water Mains to two decimal places
          const formattedCount = (unit === "km") ? currentCount.toFixed(2) : Math.round(currentCount);

          element.textContent = `${formattedCount.toLocaleString()} ${unit}`;

          // If the step exceeds totalSteps, stop the animation
          if (step >= totalSteps) {
            clearInterval(interval);
            const finalFormattedCount = (unit === "km") ? targetCount.toFixed(2) : targetCount;
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
                      sublayer.watch('visible', async () => {
                        const matchingLegendItem = legendData.find(item => item.feature === layer.title);
                        if (matchingLegendItem) {
                          const unit = (layer.title === "Water Mains") ? "km" : "nos.";
                          const countElement = document.getElementById(matchingLegendItem.feature.replace(/\s+/g, '') + 'Count');
                          
                          if (sublayer.visible) {
                            sublayerCount = await sublayer.queryFeatureCount();
                            matchingLegendItem.count = (matchingLegendItem.count === '#') ? 0 : matchingLegendItem.count;
                            matchingLegendItem.count += sublayerCount;
                            animateCount(countElement, matchingLegendItem.count, unit);
                          } else {
                            matchingLegendItem.count -= sublayerCount;
                            if (matchingLegendItem.count < 0) {
                              matchingLegendItem.count = 0;
                            }
                            if (matchingLegendItem.count === 0) {
                              matchingLegendItem.count = '#';
                              countElement.textContent = matchingLegendItem.count; // Display '#' if count is zero
                            } else {
                              const formattedCount = (unit === "km") ? matchingLegendItem.count.toFixed(2) : matchingLegendItem.count;
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
                          nestedSubtypeGroup.sublayers.forEach((nestedSublayer) => {
                            let nestedSublayerCount = 0; // Store the count for this nested sublayer
                            nestedSublayer.watch('visible', async () => {
                              const matchingLegendItem = legendData.find(item => item.feature === layer.title);
                              if (matchingLegendItem) {
                                const unit = "km";
                                const countElement = document.getElementById(matchingLegendItem.feature.replace(/\s+/g, '') + 'Count');
                                
                                if (nestedSublayer.visible) {
                                  const query = {
                                    where: "1=1",
                                    returnGeometry: false,
                                    outFields: ["mLength"]
                                  };
                                  const results = await nestedSublayer.queryFeatures(query);
                                  nestedSublayerCount = results.features.reduce((total, feature) => {
                                    return total + (feature.attributes.mLength || 0);
                                  }, 0) / 1000; // Convert meters to kilometers

                                  matchingLegendItem.count = (matchingLegendItem.count === '#') ? 0 : matchingLegendItem.count;
                                  matchingLegendItem.count += nestedSublayerCount;
                                  animateCount(countElement, matchingLegendItem.count, unit);
                                } else {
                                  matchingLegendItem.count -= nestedSublayerCount;
                                  if (matchingLegendItem.count < 0) {
                                    matchingLegendItem.count = 0;
                                  }
                                  if (matchingLegendItem.count === 0) {
                                    matchingLegendItem.count = '#';
                                    countElement.textContent = matchingLegendItem.count;
                                  } else {
                                    const formattedCount = matchingLegendItem.count.toFixed(2);
                                    countElement.textContent = `${formattedCount.toLocaleString()} ${unit}`;
                                  }
                                }
                              }
                            });
                          });
                        }
                      });
                    });
                  });
                } else {
                  subtypegrouplayer.loadAll().then(() => {
                    subtypegrouplayer.layers.forEach((nestedSubtypeGroup) => {
                      nestedSubtypeGroup.loadAll().then(() => {
                        if (nestedSubtypeGroup.sublayers) {
                          nestedSubtypeGroup.sublayers.forEach((nestedSublayer) => {
                            let nestedSublayerCount = 0; // Store the count for this nested sublayer
                            nestedSublayer.watch('visible', async () => {
                              const matchingLegendItem = legendData.find(item => item.feature === layer.title);
                              if (matchingLegendItem) {
                                const unit = "nos.";
                                const countElement = document.getElementById(matchingLegendItem.feature.replace(/\s+/g, '') + 'Count');
                                
                                if (nestedSublayer.visible) {
                                  nestedSublayerCount = await nestedSublayer.queryFeatureCount();
                                  matchingLegendItem.count = (matchingLegendItem.count === '#') ? 0 : matchingLegendItem.count;
                                  matchingLegendItem.count += nestedSublayerCount;
                                  animateCount(countElement, matchingLegendItem.count, unit);
                                } else {
                                  matchingLegendItem.count -= nestedSublayerCount;
                                  if (matchingLegendItem.count < 0) {
                                    matchingLegendItem.count = 0;
                                  }
                                  if (matchingLegendItem.count === 0) {
                                    matchingLegendItem.count = '#';
                                    countElement.textContent = matchingLegendItem.count;
                                  } else {
                                    countElement.textContent = `${matchingLegendItem.count.toLocaleString()} ${unit}`;
                                  }
                                }
                              }
                            });
                          });
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




  
      await view.when();
      return [view, displayMap]; // You can return the view object
    } catch (error) {
      console.error("Error initializing map:", error);
      throw error; // Rethrow the error to handle it further, if needed
    }
}









