import config from './config.js';
export function getInitialMapStyle(currentColorTheme) {
  return {
    version: 8,
    glyphs: config.glyphsSource,
    sources: {
      'borders-source': {
        type: 'geojson',
        data: config.bordersSource
      },
      "points-source": {
        type: 'geojson',
        data: config.pointsSource
      },
      "places": {
        type: 'geojson',
        data: config.placesSource
      },
      "roads": {
        type: 'geojson',
        data: config.roadsSource
      },
      "highlighted-nodes": {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      },
      "highlighted-edges": {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      },
      "highlighted-region": {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      },
      "clipped-regions-raster": {
        type: 'raster',
        tiles: [ config.rasterTilesSource ],
        tileSize: 512,
        minzoom: 4.3,
        maxzoom: 12
      },
      "region-boundaries": {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      }
    },
    layers: [
      {
        id: "background",
        type: "background",
        paint: {
          "background-color": currentColorTheme.background
        }
      },
      {
        "id": "polygon-layer",
        "type": "fill",
        "source": "borders-source",
        "filter": ["==", "$type", "Polygon"],
        "paint": {
          "fill-color": ["get", "fill"], // colorStyle
        }
      },
      {
        "id": "clipped-regions-raster-layer",
        "type": "raster",
        "source": "clipped-regions-raster",
        "layout": {
          "visibility": "none"
        },
        "paint": {
          "raster-opacity": 1,
          "raster-resampling": "linear",
          "raster-fade-duration": 0
        }
      },
      {
        "id": "region-fill-layer",
        "type": "fill",
        "source": "region-boundaries",
        "minzoom": 4.2,
        "paint": {
          "fill-color": ["get", "fill"],
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "discovered"], false],
            0,
            1
          ]
        }
      },
      {
        "id": "region-boundaries-layer",
        "type": "line",
        "source": "region-boundaries",
        "minzoom": 4.2,
        "paint": {
          "line-blur": 0.4,
          "line-color": "rgba(255, 255, 255, 0.5)",
          "line-opacity": 0.4,
          "line-dasharray": [2, 2],
          "line-width": {
            "base": 1.3,
            "stops": [[3, 1], [22, 15]]
          }
        }
      },
      {
        "id": "border-highlight",
        "type": "line",
        "source": "borders-source",
        "layout": {},
        "paint": {
          "line-color": "rgba(255, 255, 255, 0.5)",
          "line-width": [
            "interpolate",
            ["exponential", 1.1],
            ["zoom"],
            3,
            1,
            22,
            20
          ]

        }
      },
      {
        "id": "roads-layer",
        "type": "line",
        "source": "roads",
        "minzoom": 4,
        "paint": {
          "line-color": "#FFF",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            4, 0.5,
            12, 2
          ],
          "line-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            8, 0.1,
            12, 0.8
          ]
        }
      },
      {
        id: 'highlighted-edges',
        type: 'line',
        source: 'highlighted-edges',
        paint: {
          "line-color": "#e56aaa",
          "line-width": 2,
          "line-opacity": 0.8
        },
        layout: {
          "line-cap": "round",
          "line-join": "round"
        }
      },
      {
        "id": "circle-layer",
        "type": "circle",
        "source": "points-source",
        "paint": {
          "circle-color": currentColorTheme.circleColor,
          "circle-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5, 0.1,
            15, 0.9
          ],
          "circle-stroke-color": currentColorTheme.circleStrokeColor,
          "circle-stroke-width": 1,
          "circle-stroke-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            8, 0.0,
            15, 0.9
          ],
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5, ["*", ["get", "size"], 1.5],
            23, ["*", ["get", "size"], 2],
          ]
        }
      },
      {
        "id": "label-layer",
        "type": "symbol",
        "source": "points-source",
        "filter": [">=", ["zoom"], 4],
        "layout": {
          "text-font": ["Roboto Condensed Regular"],
          "text-field": ["slice", ["get", "label"], ["+", ["index-of", "/", ["get", "label"]], 1]],
          "text-anchor": "top",
          "symbol-sort-key": ["-", 0, ["get", "size"]],
          "symbol-spacing": 500,
          "text-offset": [0, 0.5],
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            4.5, 12,
            10, 20,
            13, 48
          ],
        },
        "paint": {
          "text-color": currentColorTheme.circleLabelsColor,
          "text-halo-color": currentColorTheme.circleLabelsHaloColor,
          "text-halo-width": currentColorTheme.circleLabelsHaloWidth,
        },
      },
      {
        id: 'highlighted-nodes',
        type: 'circle',
        source: 'highlighted-nodes',
        paint: {
          "circle-color": ["get", "color"],
          "circle-opacity": 1,
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1.5,
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5, ["*", ["get", "size"], .25],
            23, ["*", ["get", "size"], 2.5],
          ]
        }
      },
      {
        id: 'highlighted-region-outline',
        type: 'line',
        source: 'highlighted-region',
        paint: {
          "line-color": "#ffffff",
          "line-width": 3,
          "line-opacity": 0.9
        },
        layout: {
          "line-cap": "round",
          "line-join": "round"
        }
      },
      {
        "id": "place-country-1",
        "maxzoom": 10,
        "type": "symbol",
        "source": "places",
        "layout": {
          "text-font": ["Roboto Condensed Bold"],
          "text-size": [
            "interpolate",
            ["cubic-bezier", 0.2, 0, 0.7, 1],
            ["zoom"],
            1, [
              "step",
              ["get", "symbolzoom"], 15,
              4, 13,
              5, 12
            ],
            9, [
              "step",
              ["get", "symbolzoom"], 22,
              4, 19,
              5, 17
            ]
          ],
          "symbol-sort-key": ["get", "symbolzoom"],
          "text-field": "{name}",
          "text-max-width": 6,
          "text-line-height": 1.1,
          "text-letter-spacing": 0,
        },
        "paint": {
          "text-color": currentColorTheme.placeLabelsColor,
          "text-halo-color": currentColorTheme.placeLabelsHaloColor,
          "text-halo-width": currentColorTheme.placeLabelsHaloWidth,
        },
        "filter": [
          "<=",
          ["get", "symbolzoom"],
          ["+", ["zoom"], 4]
        ],
      },
    ]
  };
}

export function getColorTheme() {
  return {
    background: '#030E2E',

    circleColor: "#EAEDEF",
    circleStrokeColor: "#000",
    circleLabelsColor: "#FFF",
    circleLabelsHaloColor: "#101",
    circleLabelsHaloWidth: 1.2,

    placeLabelsColor: "#FFF",
    placeLabelsHaloColor: "#000",
    placeLabelsHaloWidth: 0.2,
  }
}
