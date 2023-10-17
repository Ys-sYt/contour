// MapLibre GL JSの読み込み
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

/* //opacityControl
import OpacityControl from 'maplibre-gl-opacity';
import 'maplibre-gl-opacity/dist/maplibre-gl-opacity.css'; */

//import maplibre-contour
import mlcontour from "maplibre-contour";


const map = new maplibregl.Map({
  container: 'map', // div要素のid
  zoom: 8, // 初期表示のズーム
  center: [141.6795, 43.0635], // 初期表示の中心
  minZoom: 6, // 最小ズーム
  maxZoom: 16, // 最大ズーム
  maxBounds: [122, 20, 154, 50], // 表示可能な範囲
  style: {
      version: 8,
      glyphs: './fonts/{fontstack}/{range}.pbf', //フォントデータ指定
      sources: {
        mierune: {
          type: 'raster',
          tiles: ['https://api.maptiler.com/maps/jp-mierune-gray/{z}/{x}/{y}.png?key=xeycR1Jqna3Gkrzt6ZBw'],
          maxzoom: 18,
          tileSize: 512,
          attribution:
          '<a href="https://maptiler.jp/" target="_blank">&copy; MIERUNE</a> <a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
        },
        jforest: {
          type: 'raster',
          tiles: ['https://api.maptiler.com/tiles/jp-forest/{z}/{x}/{y}.png?key=xeycR1Jqna3Gkrzt6ZBw'],
          maxzoom: 18,
          tileSize: 512,
          attribution:
          '<a href="https://maptiler.jp/" target="_blank">&copy; MIERUNE</a>',
        },
        // hillshade: {
        //   type: 'raster',
        //   tiles: ['https://cyberjapandata.gsi.go.jp/xyz/hillshademap/{z}/{x}/{y}.png'],
        //   minzoom: 11,
        //   maxzoom: 18,
        //   tileSize: 512,
        //   attribution:
        //   '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">&copy; 地理院タイル</a>',
        // },
        slope: {
          type: 'raster',
          tiles: ['https://cyberjapandata.gsi.go.jp/xyz/slopemap/{z}/{x}/{y}.png'],
          minzoom: 11,
          maxzoom: 18,
          tileSize: 512,
          attribution:
          '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">&copy; 地理院タイル</a>',
        }
     },
      layers: [
        //森
        {
          id: 'jforest',
          source: 'jforest',
          type: 'raster',
          //paint: {"raster-opacity": 0.5},
        },
        //背景地図レイヤー
        {
          id: 'basemap',
          source: 'mierune',
          type: 'raster',
          paint: {"raster-opacity": 0.8},
        },
        // {
        //   id: 'hillshade',
        //   source: 'hillshade',
        //   type: 'raster',
        //   paint: {"raster-opacity": 0.2}
        // },
        {
          id: 'slope',
          source: 'slope',
          type: 'raster',
          paint: {"raster-opacity": 0.2}
        },
      ]
    }
});

map.on('load', () => {
  var demSource = new mlcontour.DemSource({
    url: 'https://tiles.gsj.jp/tiles/elev/land/{z}/{y}/{x}.png',
    encoding: "mapbox", // "mapbox" or "terrarium" default="terrarium"
    maxzoom: 17,
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
          11: [100, 1000], 
          12: [100, 1000],
          13: [100, 1000],
          14: [100, 1000],
          15: [25, 100],
          16: [25, 100],
        },
      }),
    ],
    maxzoom: 17,
  });

  //contour
  map.addLayer(
    {
      id: "contour-lines",
      type: "line",
      source: "contour-source",
      "source-layer": "contours",
      paint: {
        "line-color": "rgba(0,0,0, 100%)",
        // level = highest index in thresholds array the elevation is a multiple of
        "line-width": ["match", ["get", "level"], 1, 1, 0.5],
      },
    },
    'basemap',
  );

/*   const opacity = new OpacityControl({
    baseLayers: {
      'basemap': '地図',
      'hillshade': '陰影図',
    },
    overLayers: {
      'contour-lines': '等高線',
    },
    OpacityControl: true,
  });
  map.addControl(opacity, 'top-right'); */

  //label
/*   map.addLayer({
    id: "contour-labels",
    type: "symbol",
    source: "contour-source",
    "source-layer": "contours",
    filter: [">", ["get", "level"], 0],
    layout: {
      "symbol-placement": "line",
      "text-size": 10,
      "text-field": ["concat", ["number-format", ["get", "ele"], {}], "'"],
      "text-font": ['Noto Sans Bold'],
    },
    paint: {
      "text-halo-color": "white",
      "text-halo-width": 1,
    },
  }); */
});



