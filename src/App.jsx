import { useEffect, useRef } from "react";
import Map from "ol/Map.js";
import View from "ol/View.js";
import TileLayer from "ol/layer/Tile";
import StadiaMaps from "ol/source/StadiaMaps";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Google from "ol/source/Google";
import Layer from "ol/layer/WebGLTile";

import {
  DragRotateAndZoom,
  defaults as defaultInteractions,
} from "ol/interaction";

import { Icon, Style } from "ol/style.js";
import "./App.css";

function createStyle(src, img) {
  return new Style({
    image: new Icon({
      anchor: [0.5, 0.96],
      crossOrigin: "anonymous",
      src: src,
      img: img,
      imgSize: img ? [img.width, img.height] : undefined,
    }),
  });
}

function App() {
  const mapRef = useRef();
  const mapInstanceRef = useRef();
  const vectorSourceRef = useRef();

  useEffect(function initMap() {
    if (!mapRef.current) return;

    const markerFeature = new Feature(new Point([200, 0]));
    markerFeature.set(
      "style",
      createStyle(
        "https://openlayers.org/en/latest/examples/data/icon.png",
        undefined,
      ),
    );

    vectorSourceRef.current = new VectorSource({
      features: [markerFeature],
    });

    const map = new Map({
      target: mapRef.current,
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
      interactions: defaultInteractions().extend([new DragRotateAndZoom()]),
      layers: [
        new Layer({
          source: new Google({
            key: "AIzaSyDLDS_zPNgRcBZ-z34oVCHrXRJJceboL9o",
            scale: "scaleFactor2x",
            highDpi: true,
          }),
        }),
      ],
    });
    mapInstanceRef.current = map;

    map.on("click", (e) => {
      const newMarkerFeature = new Feature(new Point(e.coordinate));
      newMarkerFeature.set(
        "style",
        createStyle(
          "https://openlayers.org/en/latest/examples/data/icon.png",
          undefined,
        ),
      );
      vectorSourceRef.current.addFeature(newMarkerFeature);
    });

    return () => {
      map.setTarget(null);
    };
  }, []);

  return (
    <>
      <div
        style={{
          width: "800px",
          height: "800px",
        }}
        ref={mapRef}
      ></div>
    </>
  );
}

export default App;
