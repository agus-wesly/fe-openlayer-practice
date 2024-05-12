import { useRef } from "react";
import View from "ol/View.js";
import { OSM } from "ol/source.js";
import { Tile as TileLayer } from "ol/layer.js";
import { useOpenLayersMap } from "./hooks/useOpenLayersMap";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { setOverlayPosition } from "./hooks/utils";

export default function PointTest() {
  const mapDivRef = useRef();

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
      // Reset overlay position
      const initialPosition = overlay.getProperties().initialPosition;
      setOverlayPosition(overlay, initialPosition, mapInstance);
    });
  }

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
        onClick={resetDeclutter}
        className="absolute top-5 right-20 z-[5]"
      >
        Test reset
      </button>
    </>
  );
}