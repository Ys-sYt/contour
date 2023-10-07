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
          tiles: ['https://api.maptiler.com/maps/jp-mierune-gray/{z}/{x}/{y}.png?key=IP9CYAWJVLGwdbFbpPVD'],
          maxzoom: 18,
          tileSize: 512,
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
var demSource = useGsiTerrainSource(maplibreGl.addProtocol);
map.addSource('terrain', demSource);

// 陰影図追加
map.addLayer(
  {
      id: 'hillshade',
      source: 'terrain', // type=raster-demのsourceを指定
      type: 'hillshade', // 陰影図レイヤー
      paint: {
          'hillshade-illumination-anchor': 'map', // 陰影の方向の基準
          'hillshade-exaggeration': 0.2, // 陰影の強さ
      },
  },
  'osm-layer', 
);

// 3D地形
map.addControl(
  new maplibregl.TerrainControl({
      source: 'terrain', // type="raster-dem"のsourceのID
      exaggeration: 1, // 標高を強調する倍率
  }),
);
});

map.addSource("contour-souce", {
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

map.addLayer({
  id: "contour-lines",
  type: "line",
  source: "contour-source",
  "source-layer": "contours",
  paint: {
    "line-color": "rgba(0,0,0, 50%)",
    // level = highest index in thresholds array the elevation is a multiple of
    "line-width": ["match", ["get", "level"], 1, 1, 0.5],
  },
});

map.addLayer({
  id: "contour-labels",
  type: "symbol",
  source: "contour-source",
  "source-layer": "contours",
  filter: [">", ["get", "level"], 0],
  layout: {
    "symbol-placement": "line",
    "text-size": 10,
    "text-field": ["concat", ["number-format", ["get", "ele"], {}], "'"],
    "text-font": ["Noto Sans Bold"],
  },
  paint: {
    "text-halo-color": "white",
    "text-halo-width": 1,
  },
});

