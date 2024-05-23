import Map from "ol/Map.js";
import { useEffect, useState } from "react";
import { DragBox, Select } from "ol/interaction";
import { click, platformModifierKeyOnly } from "ol/events/condition";
import { containsCoordinate, intersects } from "ol/extent";
import { createPoint, getLabelExtent, setOverlayPosition } from "./utils";
import { Draw, Modify } from "ol/interaction.js";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import TileLayer from "ol/layer/Tile";
import { OSM } from "ol/source";
import { View } from "ol";
import { Fill, Stroke, Style } from "ol/style";

function generateCirclePixel(idx, i, n) {
  const r = 90;
  const [a, b] = idx;
  const angle = (2 * Math.PI * i) / n;
  const x = a + r * Math.cos(angle);
  const y = b + r * Math.sin(angle);
  return [x, y];
}

function beginDeclutterMode(intersectedElement, map) {
  function isIntersectingWithOtherOverlay(currentOverlay) {
    const currentExtent = getLabelExtent(currentOverlay, map);
    return intersectedElement.some((otherOverlay) => {
      if (currentOverlay === otherOverlay) return false;

      const otherExtent = getLabelExtent(otherOverlay, map);
      return intersects(currentExtent, otherExtent);
    });
  }

  function isIntersectingWithOtherPoint(currentOverlay) {
    const currentExtent = getLabelExtent(currentOverlay, map);
    const vectorSource = map.getLayers().getArray()[1].getSource();
    return Boolean(vectorSource.getFeaturesInExtent(currentExtent).length);
  }
  intersectedElement.forEach((labelOverlay, index) => {
    const coordinate = labelOverlay.getPosition();
    const pixel = map.getPixelFromCoordinate(coordinate);
    let newPixel = pixel;

    while (
      isIntersectingWithOtherPoint(labelOverlay) ||
      isIntersectingWithOtherOverlay(labelOverlay)
    ) {
      newPixel = generateCirclePixel(
        newPixel,
        index,
        intersectedElement.length,
      );
      const newCoordinate = map.getCoordinateFromPixel(newPixel);
      labelOverlay.setPosition(newCoordinate);
    }

    const newCoordinate = map.getCoordinateFromPixel(newPixel);
    setOverlayPosition(labelOverlay, newCoordinate, map);
  });
}

function addSelectInteraction(map) {
  const dragBox = new DragBox({
    condition: platformModifierKeyOnly,
  });

  dragBox.on("boxend", () => {
    const boxExtent = dragBox.getGeometry().getExtent();

    const intersected = [];
    map.getOverlays().forEach((overlay) => {
      if (intersects(boxExtent, getLabelExtent(overlay, map))) {
        // Set all border to yellow
        const labelElement = overlay.getElement();
        labelElement.classList.add("selected");
        intersected.push(overlay);
      }
    });
    beginDeclutterMode(intersected, map);
  });
  map.addInteraction(dragBox);
}

const vectorSource = new VectorSource({
  features: [],
});

const vectorLayer = new VectorLayer({
  source: vectorSource,
  style: {
    "fill-color": "rgba(255, 255, 255, 0.2)",
    "stroke-color": "blue",
    "stroke-width": 4,
    "circle-radius": 7,
    "circle-fill-color": "skyblue",
  },
});

export function useOpenLayersMap(mapDivRef) {
  const [mapInstance, setMapInstance] = useState(null);

  useEffect(() => {
    const map = new Map({
      target: mapDivRef.current ?? undefined,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        vectorLayer,
      ],
      view: new View({
        center: [-8150000, 6025000],
        zoom: 8,
      }),
    });

    //  map.on("click", (e) => {
    //    const resolution = map.getView().getResolution();
    //   const coordinate = e.coordinate;
    //    const newPoint = createPoint(map, coordinate, resolution);
    //    map.getLayers().getArray()[1].getSource().addFeature(newPoint);
    //  });

    // Hover
    const info = document.getElementById("info");
    map.on("pointermove", function(evt) {
      if (evt.dragging) {
        return;
      }
      const pixel = map.getEventPixel(evt.originalEvent);
      let currentFeature;
      const displayFeatureInfo = function(pixel) {
        const feature = map.forEachFeatureAtPixel(pixel, function(feature) {
          // Get label
          const labelId = feature.getProperties().labelId;
          const overlay = map.getOverlayById(labelId);
          const coord = map.getCoordinateFromPixel(pixel);
          // Check if extent coordinate
          const isContainOverlay = containsCoordinate(
            getLabelExtent(overlay, map),
            coord,
          );
          // Check if extent line
          const isContainLine = feature
            .getGeometry()
            .getGeometries()[1]
            .intersectsCoordinate(coord);

          if (!isContainOverlay && !isContainLine) return feature;
        });
        if (feature) {
          const coordinate = feature
            .getGeometry()
            .getGeometries()[0]
            .getCoordinates();

          info.style.left = pixel[0] + "px";
          info.style.top = pixel[1] + "px";
          if (feature !== currentFeature) {
            info.style.visibility = "visible";
            info.innerText = `${coordinate[0]}-${coordinate[1]}`;
          }
        } else {
          info.style.visibility = "hidden";
        }
        currentFeature = feature;
      };
      displayFeatureInfo(pixel);
    });

    addSelectInteraction(map);

    // DRAW
    // const draw = new Draw({
    //   source: vectorSource,
    //   type: "Circle",
    // });
    // map.addInteraction(draw);

    // const modify = new Modify({ source: vectorSource });
    // map.addInteraction(modify);

    // window["addSelect"] = function () {
    //   map.removeInteraction(draw);

    //   const selectClick = new Select({
    //     condition: click,
    //     style: new Style({
    //       fill: new Fill({
    //         color: "#eeeeee",
    //       }),
    //       stroke: new Stroke({
    //         color: "rgba(255, 255, 255, 0.7)",
    //         width: 2,
    //       }),
    //     }),
    //   });

    //   selectClick.on("select", (feat) => {
    //     console.log("feat", feat);
    //   });

    //   map.addInteraction(selectClick);
    // };

    // if (!mapInstance) {
    //   setMapInstance(map);
    // }

    // return () => {
    //   map?.setTarget(null);
    // };
    // }, []);

    return {
      mapInstance,
    };
  }
