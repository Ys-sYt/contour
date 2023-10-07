// MapLibre GL JSの読み込み
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

//import maplibre-contour
import mlcontour from "maplibre-contour";

//import maplibre-gl-gsi-terrain
import { useGsiTerrainSource } from 'maplibre-gl-gsi-terrain';


const map = new maplibregl.Map({
  container: 'map', // div要素のid
  zoom: 8, // 初期表示のズーム
  center: [141.6795, 43.0635], // 初期表示の中心
  minZoom: 6, // 最小ズーム
  maxZoom: 14, // 最大ズーム
  maxBounds: [122, 20, 154, 50], // 表示可能な範囲
  style: {
      version: 8,
      glyphs: './fonts/{fontstack}/{range}.pbf', //フォントデータ指定
      sources: {
        mierune: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          maxzoom: 18,
          tileSize: 256,
          attribution:
          '<a href="https://maptiler.jp/" target="_blank">&copy; MIERUNE</a>',
          '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a>':
          '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
        },
     },
      layers: [
        //背景地図レイヤー
        {
          id: 'osm-layer',
          source: 'mierune',
          type: 'raster',
          //paint: {"raster-opacity": 0.5},
        },
      ]
    }
});

map.on('load', () => {
  var demSource = new mlcontour.DemSource({
    url: "https://api.maptiler.com/tiles/terrain-rgb-v2/{z}/{x}/{y}.webp?key=WALjHeMMwhydAZbblglR",
    encoding: "mapbox", // "mapbox" or "terrarium" default="terrarium"
    maxzoom: 14,
    worker: true, // offload isoline computation to a web worker to reduce jank
    cacheSize: 100, // number of most-recent tiles to cache
    timeoutMs: 10_000, // timeout on fetch requests
  });
  demSource.setupMaplibre(maplibregl);

  map.addSource("contour-source", {
    type: "vector",
    tiles: [
      demSource.contourProtocolUrl({
        thresholds: {
          11: [200, 1000],
          12: [100, 500],
          14: [50, 200],
          15: [20, 100],
        },
      
      }),
    ],
    maxzoom: 15,
  });

  map.addLayer(
    {
      id: "contour-lines",
      type: "line",
      source: "contour-source",
      "source-layer": "contours",
      paint: {
        "line-color": "rgba(0,0,0, 50%)",
        // level = highest index in thresholds array the elevation is a multiple of
        "line-width": ["match", ["get", "level"], 1, 1, 0.5],
      },
    },
  );
});

