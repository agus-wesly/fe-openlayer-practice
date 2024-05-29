import React, { useEffect, useRef } from "react";
import View from "ol/View.js";
import { OSM } from "ol/source.js";
import { Tile as TileLayer } from "ol/layer.js";
import { useOpenLayersMap } from "./hooks/useOpenLayersMap";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { setOverlayPosition } from "./hooks/utils";
import { Fill, Stroke, Style } from "ol/style";
import { Draw } from "ol/interaction";

const lineStyle = new Style({
  stroke: new Stroke({
    color: "green",
    width: 2,
  }),

  fill: new Fill({
    color: "rgba(255, 0, 0, 0.5)", // Red fill color with 50% opacity
  }),
});

export default function PointTest() {
  const mapDivRef = useRef();
  const [isDrawing, setIsDrawing] = React.useState(false);

  const { mapInstance } = useOpenLayersMap(mapDivRef, () => ({
    layers: [
      new TileLayer({
        source: new OSM(),
      }),
      new VectorLayer({
        source: new VectorSource({
          features: [],
        }),
      }),
    ],
    target: mapDivRef.current,
    view: new View({
      center: [-8150000, 6025000],
      zoom: 8,
    }),
  }));

  function resetDeclutter() {
    if (!mapInstance) return;
    mapInstance.getOverlays().forEach((overlay) => {
      const initialPosition = overlay.getProperties().initialPosition;
      console.log({ initialPosition });
      setOverlayPosition(overlay, initialPosition, mapInstance);
    });
  }

  useEffect(() => {
    if (!mapInstance) return;
    const source = mapInstance.getLayers().getArray()[1].getSource();
    let draw;

    if (isDrawing) {
      draw = new Draw({
        source: source,
        type: "Circle",
      });

      draw.on("drawend", (evt) => {
        const f = evt.feature;

        // Create a new style with a blue fill and a default stroke
        const newStyle = new Style({
          stroke: new Stroke({
            color: "blue",
          }),
        });
        f.setStyle(newStyle);
      });
      mapInstance.addInteraction(draw);
    }
    return () => {
      mapInstance.removeInteraction(draw);
    };
  }, [isDrawing, mapInstance]);

  return (
    <>
      <div
        ref={mapDivRef}
        id="map"
        style={{
          width: "100%",
          height: "100vh",
        }}
      ></div>

      <button
        onClick={() => setIsDrawing((prev) => !prev)}
        className="absolute top-5 right-48 z-[5]"
      >
        Toggle draw
      </button>

      <button
        onClick={resetDeclutter}
        className="absolute top-5 right-20 z-[5]"
      >
        Test reset
      </button>
    </>
  );
}
