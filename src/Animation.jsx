import { Feature, View } from "ol";
import Polyline from "ol/format/Polyline";
import { Point } from "ol/geom";
import TileLayer from "ol/layer/Tile";
import { getVectorContext } from "ol/render";
import { Fill, Icon, Stroke, Style } from "ol/style";
import CircleStyle from "ol/style/Circle";
import { useCallback, useRef } from "react";
import { useEffect } from "react";
import { OSM } from "ol/source.js";
import Map from "ol/Map.js";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";

const styles = {
  route: new Style({
    stroke: new Stroke({
      width: 6,
      color: [237, 212, 0, 0.8],
    }),
  }),
  icon: new Style({
    image: new Icon({
      anchor: [0.5, 1],
      src: "/vite.svg",
    }),
  }),
  geoMarker: new Style({
    image: new CircleStyle({
      radius: 7,
      fill: new Fill({ color: "black" }),
      stroke: new Stroke({
        color: "red",
        width: 2,
      }),
    }),
  }),
};

let distance = 0;
let lastTime = 0;
const center = [-5639523.95, -3501274.52];

export default function Animation() {
  const mapRef = useRef();
  const routeRef = useRef();
  const positionRef = useRef();
  const vectorLayerRef = useRef();
  const geoMarkerRef = useRef();

  useEffect(() => {
    const map = new Map({
      layers: [new TileLayer({ source: new OSM() })],
      view: new View({
        center: center,
        zoom: 10,
        minZoom: 2,
        maxZoom: 19,
      }),
      target: "map",
    });

    mapRef.current = map;

    async function initMap() {
      const response = await fetch("/result.json");
      const result = await response.json();

      const polyline = result.routes[0].geometry;

      const route = new Polyline({
        factor: 1e6,
      }).readGeometry(polyline, {
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:3857",
      });

      routeRef.current = route;

      const routeFeature = new Feature({
        type: "route",
        geometry: route,
      });

      const startMarker = new Feature({
        type: "icon",
        geometry: new Point(route.getFirstCoordinate()),
      });

      const endMarker = new Feature({
        type: "icon",
        geometry: new Point(route.getLastCoordinate()),
      });

      positionRef.current = startMarker.getGeometry().clone();

      const geoMarker = new Feature({
        geometry: positionRef.current,
      });

      geoMarkerRef.current = geoMarker;

      const vectorLayer = new VectorLayer({
        source: new VectorSource({
          features: [
            routeFeature,
            geoMarkerRef.current,
            startMarker,
            endMarker,
          ],
        }),
        style: function (feature) {
          return styles[feature.get("type")];
        },
      });
      vectorLayerRef.current = vectorLayer;
      map.addLayer(vectorLayer);
    }

    initMap();

    return () => {
      map.setTarget(null);
    };
  }, []);

  const startAnimation = useCallback(() => {
    lastTime = Date.now();
    vectorLayerRef.current.on("postrender", (event) => {
      const speed = 2;
      const time = event.frameState.time;
      const elapsedTime = time - lastTime;
      distance = (distance + (speed * elapsedTime) / 1e6) % 2;

      const currentCoordinate = routeRef.current.getCoordinateAt(
        distance > 1 ? 2 - distance : distance,
      );
      positionRef.current.setCoordinates(currentCoordinate);
      const vectorContext = getVectorContext(event);
      vectorContext.setStyle(styles.geoMarker);
      vectorContext.drawGeometry(positionRef.current);

      mapRef.current.render();
    });
    geoMarkerRef.current.setGeometry(null);
  }, []);

  return (
    <div>
      <div className="w-screen h-screen relative" id="map">
        <button
          onClick={startAnimation}
          className="p-4 rounded absolute right-2 z-[2] bg-white"
        >
          GASSSSS
        </button>
      </div>
    </div>
  );
}
