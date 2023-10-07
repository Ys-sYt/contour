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
  /* //https://qiita.com/Kanahiro/items/1e9c1a4ad6be76b27f0f
  const gsidem2terrainrgb = (r, g, b) => {
    let height = r * 655.36 + g * 2.56 + b * 0.01;
    if (r === 128 && g === 0 && b === 0) {
        height = 0;
    } else if (r >= 128) {
        height -= 167772.16;
    }
    height += 100000;
    height *= 10;
    const tB = (height / 256 - Math.floor(height / 256)) * 256;
    const tG =
        (Math.floor(height / 256) / 256 -
            Math.floor(Math.floor(height / 256) / 256)) *
        256;
    const tR =
        (Math.floor(Math.floor(height / 256) / 256) / 256 -
            Math.floor(Math.floor(Math.floor(height / 256) / 256) / 256)) *
        256;
    return [tR, tG, tB];
  };

  maplibregl.addProtocol('gsidem', (params, callback) => {
    const image = new Image();
    image.crossOrigin = '';
    image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;

        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        const imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
        );
        for (let i = 0; i < imageData.data.length / 4; i++) {
            const tRGB = gsidem2terrainrgb(
                imageData.data[i * 4],
                imageData.data[i * 4 + 1],
                imageData.data[i * 4 + 2],
            );
            imageData.data[i * 4] = tRGB[0];
            imageData.data[i * 4 + 1] = tRGB[1];
            imageData.data[i * 4 + 2] = tRGB[2];
        }
        context.putImageData(imageData, 0, 0);
        canvas.toBlob((blob) =>
            blob.arrayBuffer().then((arr) => callback(null, arr, null, null)),
        );
    };
    image.src = params.url.replace('gsidem://', '');
    return { cancel: () => {} };
  }); */

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
          13: [25, 100],
          14: [25, 100],
          15: [10, 50],
          16: [10, 50],
          17: [10, 50],
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
        "line-color": "rgba(0,0,0, 50%)",
        // level = highest index in thresholds array the elevation is a multiple of
        "line-width": ["match", ["get", "level"], 1, 1, 0.5],
      },
    },
  );

  //label
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
      "text-font": ['Noto Sans Bold'],
    },
    paint: {
      "text-halo-color": "white",
      "text-halo-width": 1,
    },
  });
});



