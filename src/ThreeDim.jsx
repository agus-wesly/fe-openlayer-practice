import { useCallback, useEffect, useRef, useState } from "react";
import View from "ol/View.js";
import { OSM } from "ol/source.js";
import { Feature, Map } from "ol";
import { Tile as TileLayer } from "ol/layer.js";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Point } from "ol/geom";
import { Fill, Icon, Stroke, Style } from "ol/style";
import CircleStyle from "ol/style/Circle";
import Polyline from "ol/format/Polyline";
import { getVectorContext } from "ol/render";

import OLCesium from "olcs";

const center = [-5639523.95, -3501274.52];

let lastTime;
let distance = 0;

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
      src: "data/icon.png",
    }),
  }),
  geoMarker: new Style({
    image: new CircleStyle({
      radius: 7,
      fill: new Fill({ color: "black" }),
      stroke: new Stroke({
        color: "white",
        width: 2,
      }),
    }),
  }),
};

export default function ThreeDim() {
  const mapDivRef = useRef();
  const ol3dRef = useRef();
  const [enabled3D, setEnabled3D] = useState(true);
  const [mapInstanceRef, setMapInstanceRef] = useState(null);
  const [animating, setAnimating] = useState(false);

  const routeRef = useRef();
  const positionRef = useRef();
  const geoMarkerRef = useRef();
  const vectorLayerRef = useRef();

  useEffect(() => {
    const map = new Map({
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
        center: [0, 0],
        zoom: 2,
      }),
    });

    map.on("click", (e) => {
      const feature = new Feature({
        geometry: new Point(e.coordinate),
        name: "Null Island",
        population: 4000,
        rainfall: 500,
      });
      feature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 10,
            fill: new Fill({ color: "rgba(255, 0, 0, 0.1)" }),
            stroke: new Stroke({ color: "red", width: 1 }),
          }),
        }),
      );
      map.getLayers().getArray()[1].getSource().addFeature(feature);
    });

    fetch(
      "https://openlayers.org/en/latest/examples/data/polyline/route.json",
    ).then(function(response) {
      console.log("ok", response);
      response.json().then(function(result) {
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
          geometry: new Point([[700000, 200000, 100000]]),
        });
        const endMarker = new Feature({
          type: "icon",
          geometry: new Point(route.getLastCoordinate()),
        });

        const position = startMarker.getGeometry().clone();
        positionRef.current = position;

        const geoMarker = new Feature({
          type: "geoMarker",
          geometry: position,
        });
        geoMarkerRef.current = geoMarker;

        const vectorLayer = new VectorLayer({
          source: new VectorSource({
            features: [routeFeature, geoMarker, startMarker, endMarker],
          }),
          style: function(feature) {
            return styles[feature.get("type")];
          },
        });
        vectorLayerRef.current = vectorLayer;
        map.addLayer(vectorLayer);
      });
    });

    const ol3d = new OLCesium({ map });
    const scene = ol3d.getCesiumScene();
    // window.Cesium.createWorldTerrainAsync().then(
    //   (tp) => (scene.terrainProvider = tp),
    // );

    ol3dRef.current = ol3d;
    setMapInstanceRef(map);

    return () => {
      map.setTarget(null);
      setMapInstanceRef(null);
    };
  }, []);

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     const old = geoMarkerRef.current.getCoordinates();
  //     positionRef.current.setCoordinates([
  //       old[0] + 1000 * Math.random(),
  //       old[1] + 1000 * Math.random(),
  //       old[2],
  //     ]);
  //     geoMarkerRef.current.changed();
  //   }, 100);

  //   return () => {
  //     clearInterval(interval);
  //   };
  // }, []);

  const moveFeature = useCallback(
    (event) => {
      console.log("hi");
      ol3dRef.current.trackedFeature = geoMarkerRef.current;
      return;
      const speed = 80;
      const time = event.frameState.time;
      const elapsedTime = time - lastTime;
      distance = (distance + (speed * elapsedTime) / 1e6) % 2;
      lastTime = time;

      const currentCoordinate = routeRef.current.getCoordinateAt(
        distance > 1 ? 2 - distance : distance,
      );

      console.log({ currentCoordinate });

      positionRef.current.setCoordinates(currentCoordinate);
      geoMarkerRef.current.changed();
      // mapInstanceRef.getView().setCenter(currentCoordinate);

      const vectorContext = getVectorContext(event);
      vectorContext.setStyle(styles.geoMarker);
      vectorContext.drawGeometry(positionRef.current);
      // tell OpenLayers to continue the postrender animation
      mapInstanceRef.render();
    },
    [mapInstanceRef],
  );

  function startAnimation() {
    setAnimating(true);
    lastTime = Date.now();
    vectorLayerRef.current.on("postrender", moveFeature);
    // hide geoMarker and trigger map render through change event
    geoMarkerRef.current.setGeometry(null);
  }

  function stopAnimation() {
    setAnimating(false);
    // Keep marker at current animation position
    geoMarkerRef.current.setGeometry(positionRef.current);
    vectorLayerRef.current.un("postrender", moveFeature);
  }

  useEffect(() => {
    const ol3d = ol3dRef.current;
    if (true) {
      ol3d.setEnabled(true);
    } else {
      if (mapInstanceRef) {
        mapInstanceRef.getView().setRotation(0);
      }
      // ol3d.setEnabled(false);
    }
  }, [enabled3D, mapInstanceRef]);

  return (
    <>
      <div
        ref={mapDivRef}
        style={{
          width: "100%",
          height: "100vh",
        }}
      ></div>
      <button
        className="fixed right-0 top-0 z-[10] bg-white p-2"
        onClick={() => {
          ol3dRef.current.trackedFeature = geoMarkerRef.current;

          const interval = setInterval(() => {
            console.log("hi");
            const old = positionRef.current.getCoordinates();
            positionRef.current.setCoordinates([
              old[0] + 100 * Math.random(),
              old[1] + 100 * Math.random(),
              old[2],
            ]);
            geoMarkerRef.current.changed();
          }, 100);
          console.log("hi");
          return;

          // if (animating) {
          //   stopAnimation();
          // } else {
          //   startAnimation();
          // }
        }}
      >
        Start
      </button>
      <button
        className="fixed left-0 top-0 z-[10] bg-white p-2"
        onClick={() => {
          ol3dRef.current.trackedFeature = undefined;
        }}
      >
        Rest
      </button>
    </>
  );
}
