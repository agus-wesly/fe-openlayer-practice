import { useEffect, useRef } from "react";
import Map from "ol/Map.js";
import View from "ol/View.js";
import OSM from "ol/source/OSM.js";
import { Draw, Modify, Snap } from "ol/interaction.js";
import { Vector as VectorSource } from "ol/source.js";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer.js";
import "./App.css";

function App() {
  const mapRef = useRef();
  const mapInstanceRef = useRef();

  useEffect(function initMap() {
    if (!mapRef.current) return;

    const tile = new TileLayer({ source: new OSM() });

    tile.on("prerender", (evt) => {
      // return
      if (evt.context) {
        const context = evt.context;
        context.filter = "grayscale(80%) invert(100%) ";
        context.globalCompositeOperation = "source-over";
      }
    });

    tile.on("postrender", (evt) => {
      if (evt.context) {
        const context = evt.context;
        context.filter = "none";
      }
    });

    const source = new VectorSource();

    const vector = new VectorLayer({
      source: source,
      style: {
        "fill-color": "rgba(255, 255, 255, 0.2)",
        "stroke-color": "#ffcc33",
        "stroke-width": 2,
        "circle-radius": 7,
        "circle-fill-color": "#ffcc33",
      },
    });

    function addInteractions() {
      const draw = new Draw({
        source: source,
        type: "Polygon",
      });
      map.addInteraction(draw);
      const snap = new Snap({ source: source });
      map.addInteraction(snap);
    }

    const map = new Map({
      layers: [tile, vector],
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
      target: mapRef.current,
    });

    mapInstanceRef.current = map;

    addInteractions();

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
