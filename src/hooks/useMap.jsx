import { useCallback, useEffect, useRef, useState } from "react";
import Map from "ol/Map.js";
import View from "ol/View.js";
import { Draw, Snap } from "ol/interaction.js";
import { Vector as VectorSource, OSM } from "ol/source.js";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer.js";
import { fromLonLat } from "ol/proj";
import { Zoom, defaults as defaultControls } from "ol/control";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style.js";
import { LineString } from "ol/geom";
import { Overlay } from "ol";
import { unByKey } from "ol/Observable";
import { getVectorContext } from "ol/render";
import { easeOut } from "ol/easing";
import { formatLength } from "../utils/map";

const duration = 1000;
const source = new VectorSource();

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
  const zoomButtonRef = useRef();
  const measureTooltipElementRef = useRef();
  const measureTooltipRef = useRef();

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
      controls: defaultControls({ zoom: false }).extend([
        new Zoom({
          target: zoomButtonRef.current,
          className: "button-zoom-container",
        }),
      ]),
    });

    // ANIMATION POINT
    source.on("addfeature", function (e) {
      const feature = e.feature;
      const start = Date.now();
      const flashGeom = feature.getGeometry().clone();
      const listenerKey = tile.on("postrender", animate);

      function animate(event) {
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
      }
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

      draw.on("drawstart", function (evt) {
        let sketch = evt.feature;
        let tooltipCoord = evt.coordinate;

        sketch.getGeometry().on("change", function (evt) {
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

      draw.on("drawend", function () {
        measureTooltipElementRef.current.style.display = "none";
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

  return {
    mapRef,
    measureTooltipElementRef,
    drawFeature,
    mapInstanceRef,
    setDrawFeature,
    addInteractions,
    zoomButtonRef,
    removeFeature,
  };
};
