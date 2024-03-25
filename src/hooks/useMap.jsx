import { useCallback, useEffect, useRef, useState } from "react";
import Map from "ol/Map.js";
import View from "ol/View.js";
import { Draw, Snap } from "ol/interaction.js";
import { Vector as VectorSource, OSM } from "ol/source.js";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer.js";
import { defaults as defaultControls } from "ol/control";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style.js";
import { LineString, Point } from "ol/geom";
import { Feature, Overlay } from "ol";
import { unByKey } from "ol/Observable";
import { getVectorContext } from "ol/render";
import { easeOut } from "ol/easing";
import { fromLonLat } from "ol/proj";
import Polyline from "ol/format/Polyline";

import { formatLength } from "../utils/map";

const duration = 1000;
const source = new VectorSource();
let lastTime = 0;
let distance = 0;

const vector = new VectorLayer({
  source: source,
  style: {
    "fill-color": "rgba(255, 255, 255, 0.2)",
    "stroke-color": "#ffcc33",
    "stroke-width": 2,
    "circle-radius": 9,
    "icon-src": "https://avatars.githubusercontent.com/u/98297487?v=4",
    "icon-width": 40,
    "icon-height": 40,
  },
});

const style = new Style({
  fill: new Fill({
    color: "rgba(255,255,255, 0.3)",
  }),
  stroke: new Stroke({
    color: "rgba(1, 186, 239)",
    lineDash: [20, 20],
    width: 3,
  }),
  image: new CircleStyle({
    radius: 5,
    stroke: new Stroke({
      color: "rgba(1, 186, 239)",
    }),
    fill: new Fill({
      color: "rgba(1, 186, 239)",
    }),
  }),
});

export const useMap = () => {
  const [drawFeature, setDrawFeature] = useState(null);

  const mapRef = useRef();
  const mapInstanceRef = useRef();
  const snapRef = useRef();
  const measureTooltipElementRef = useRef();
  const measureTooltipRef = useRef();
  const routeRef = useRef();
  const vectorLayerRef = useRef();
  const positionRef = useRef();
  const geoMarkerRef = useRef();

  useEffect(function initMap() {
    if (!mapRef.current) return;

    const tile = new TileLayer({ source: new OSM() });

    tile.on("prerender", (evt) => {
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

    const map = new Map({
      layers: [tile, vector],
      view: new View({
        center: fromLonLat([107.60981, -6.914744]),
        zoom: 12,
      }),
      target: mapRef.current,
      controls: defaultControls({ zoom: false }),
    });

    // ANIMATION POINT
    source.on("addfeature", (e) => {
      const feature = e.feature;
      const start = Date.now();
      const flashGeom = feature.getGeometry().clone();
      const listenerKey = tile.on("postrender", (event) => {
        const frameState = event.frameState;
        const elapsed = frameState.time - start;
        if (elapsed >= duration) {
          unByKey(listenerKey);
          return;
        }
        const vectorContext = getVectorContext(event);
        const elapsedRatio = elapsed / duration;
        const radius = easeOut(elapsedRatio) * 35 + 5;
        const opacity = easeOut(1.5 - elapsedRatio);

        const style = new Style({
          image: new CircleStyle({
            radius: radius,
            stroke: new Stroke({
              color: "rgba(255, 255, 255, " + opacity + ")",
              width: 0.75 + opacity,
            }),
          }),
        });

        vectorContext.setStyle(style);
        vectorContext.drawGeometry(flashGeom);
        mapInstanceRef.current.render();
      });
    });

    mapInstanceRef.current = map;

    return () => {
      map.setTarget(null);
    };
  }, []);

  const addInteractions = useCallback(
    (type = "LineString") => {
      mapInstanceRef.current.removeInteraction(drawFeature);
      mapInstanceRef.current.removeInteraction(snapRef.current);

      const draw = new Draw({
        source,
        type: type,
        style,
      });

      setDrawFeature(draw);
      mapInstanceRef.current.addInteraction(draw);

      measureTooltipRef.current = new Overlay({
        element: measureTooltipElementRef.current,
        offset: [15, -15],
        positioning: "bottom-center",
        stopEvent: false,
        insertFirst: false,
      });

      mapInstanceRef.current.addOverlay(measureTooltipRef.current);

      draw.on("drawstart", (evt) => {
        let sketch = evt.feature;
        let tooltipCoord = evt.coordinate;

        sketch.getGeometry().on("change", (evt) => {
          const geom = evt.target;
          if (geom instanceof LineString) {
            let output;
            output = formatLength(geom);
            tooltipCoord = geom.getLastCoordinate();
            measureTooltipElementRef.current.style.display = "block";
            measureTooltipElementRef.current.innerHTML = output;
            measureTooltipRef.current.setPosition(tooltipCoord);
          }
        });
      });

      draw.on("drawend", (evt) => {
        routeRef.current = evt.feature.getGeometry();

        const routeFeature = new Feature({
          type: "route",
          geometry: evt.feature.getGeometry(),
        });

        const startMarker = new Feature({
          type: "icon",
          geometry: new Point(routeRef.current.getFirstCoordinate()),
        });

        const endMarker = new Feature({
          type: "icon",
          geometry: new Point(routeRef.current.getLastCoordinate()),
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
          style: function () {
            return new Style({
              image: new CircleStyle({
                radius: 7,
                fill: new Fill({ color: "black" }),
                stroke: new Stroke({
                  color: "red",
                  width: 2,
                }),
              }),
            });
          },
        });

        vectorLayerRef.current = vectorLayer;
        mapInstanceRef.current.addLayer(vectorLayer);
      });

      const snap = new Snap({ source: source });
      snapRef.current = snap;
      mapInstanceRef.current.addInteraction(snap);
    },
    [drawFeature],
  );

  const removeFeature = useCallback(() => {
    mapInstanceRef.current.removeInteraction(drawFeature);
    mapInstanceRef.current.removeOverlay(measureTooltipRef.current);
    setDrawFeature(null);
  }, [drawFeature]);

  const zoomIn = useCallback(() => {
    mapInstanceRef.current.getView().animate({
      zoom: mapInstanceRef.current.getView().getZoom() + 1,
      duration: 225,
    });
  }, []);

  const zoomOut = useCallback(() => {
    mapInstanceRef.current.getView().animate({
      zoom: mapInstanceRef.current.getView().getZoom() - 1,
      duration: 225,
    });
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
      vectorContext.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 7,
            fill: new Fill({ color: "black" }),
            stroke: new Stroke({
              color: "black",
              width: 2,
            }),
          }),
        }),
      );
      vectorContext.drawGeometry(positionRef.current);

      mapInstanceRef.current.render();
    });
    geoMarkerRef.current.setGeometry(null);
  }, []);

  return {
    mapRef,
    measureTooltipElementRef,
    drawFeature,
    addInteractions,
    removeFeature,
    zoomIn,
    zoomOut,
    startAnimation,
  };
};
