// MapLibre GL JSの読み込み
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

/* //opacityControl
import OpacityControl from 'maplibre-gl-opacity';
import 'maplibre-gl-opacity/dist/maplibre-gl-opacity.css'; */

//import maplibre-contour
import mlcontour from "maplibre-contour";

// 'fast-png'パッケージから'encode'関数をインポート。これは画像データをPNG形式にエンコードするために使用。
import { encode as fastPngEncode } from 'https://cdn.jsdelivr.net/npm/fast-png@6.1.0/+esm';


const map = new maplibregl.Map({
  container: 'map', // div要素のid
  zoom: 8, // 初期表示のズーム
  center: [141.6795, 43.0635], // 初期表示の中心
  minZoom: 6, // 最小ズーム
  maxZoom: 18, // 最大ズーム
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

// RGB値を元に地形の高さを計算し、その高さに対応する新たなRGB値を返す関数
const gsidem2terrainrgb = (r, g, b) => {
  // まず、RGB値を元に地形の高さを計算
  let height = r * 655.36 + g * 2.56 + b * 0.01;

  // 特定のRGB値(128, 0, 0)は高さ0として扱う
  if (r === 128 && g === 0 && b === 0) {
      height = 0;
  } else if (r >= 128) {
      // Rが128以上の場合は、地形の高さから一定値を引く
      height -= 167772.16;
  }

    // 地形の高さに基準値を加算し、さらにスケーリング
    height += 100000;
    height *= 10;

    // 新たなRGB値を計算
    const tB = (height / 256 - Math.floor(height / 256)) * 256;
    const tG =
        (Math.floor(height / 256) / 256 -
            Math.floor(Math.floor(height / 256) / 256)) *
        256;
    const tR =
        (Math.floor(Math.floor(height / 256) / 256) / 256 -
            Math.floor(Math.floor(Math.floor(height / 256) / 256) / 256)) *
        256;

    // 新たなRGB値を返す
    return [tR, tG, tB];
  };

  // 地形データを扱うためのプロトコルをmaplibreglに追加
  maplibregl.addProtocol('gsidem', (params, callback) => {
    // 新しい画像を作成
    const image = new Image();
    image.crossOrigin = '';

    image.onload = () => {
        // キャンバスを作成し、画像のサイズに合わせる
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;

        // 2Dコンテキストを取得し、画像を描画
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);

        // 画像のピクセルデータを取得
        const imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
        );

        // すべてのピクセルについて、RGB値を変換
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

        // fast-pngのencode関数を使用して画像データをPNG形式にエンコード
        const pngData = fastPngEncode({
            width: canvas.width,
            height: canvas.height,
            data: imageData.data,
        });

        // PNGデータをArrayBufferとしてcallback関数に渡す
        callback(null, pngData.buffer, null, null);

        
/*         // 変換後の画像データをキャンバスに戻す
        context.putImageData(imageData, 0, 0);

        // キャンバスからblobを作成し、そのblobをArrayBufferとしてcallback関数に渡す
        canvas.toBlob((blob) =>
            blob.arrayBuffer().then((arr) => callback(null, arr, null, null)),
        ); */
        
    };

    // 画像のURLを取得し、gsidemプロトコル部分を除去してからimage.srcに設定
    image.src = params.url.replace('gsidem://', '');

    // キャンセル処理を返す(今回は特に何もしない)
    return { cancel: () => { } };
    });

    // 標高タイルソース
    map.addSource("gsidem", {
      type: 'raster-dem',
      tiles: [
          'gsidem://https://cyberjapandata.gsi.go.jp/xyz/dem_png/{z}/{x}/{y}.png',
      ],
      attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html#dem" target="_blank">地理院タイル(標高タイル)</a>',
      tileSize: 256
    });

    // 標高タイルセット
    map.setTerrain({ 'source': 'gsidem', 'exaggeration': 1 });


  var demSource = new mlcontour.DemSource({
    url: 'https://tiles.gsj.jp/tiles/elev/land/{z}/{y}/{x}.png',
    multiplier: 0.1,
    encoding: "mapbox", // "mapbox" or "terrarium" default="terrarium"
    maxzoom: 17,
    worker: true, // offload isoline computation to a web worker to reduce jank
    cacheSize: 1000, // number of most-recent tiles to cache
    timeoutMs: 10_000, // timeout on fetch requests
  });
  demSource.setupMaplibre(maplibregl);

  map.addSource("contour-source", {
    type: "vector",
    tiles: [
      demSource.contourProtocolUrl({
        // multiplier: 0.1,
        thresholds: {
          11: [100, 500], 
          12: [100, 500],
          13: [100, 500],
          14: [100, 500],
          15: [25, 100],
          16: [25, 100],
          17: [10, 50],
          18: [10, 50],
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
  });*/
});



