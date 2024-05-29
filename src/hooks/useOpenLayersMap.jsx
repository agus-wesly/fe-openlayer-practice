import Map from "ol/Map.js";
import { useEffect, useState } from "react";
import { DragBox, Draw } from "ol/interaction";
import { platformModifierKeyOnly } from "ol/events/condition";
import { intersects } from "ol/extent";
import { getLabelExtent, setOverlayPosition } from "./utils";
import { Fill, Stroke, Style } from "ol/style";

function generateCirclePixel(idx, i, n) {
  const r = 12;
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

function addRightClickInteraction(map) {
  const div = map.getTargetElement();
  div.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    const coordinate = map.getCoordinateFromPixel([e.x, e.y]);
    if (!coordinate) return;
    const extent = [
      coordinate[0], // minX
      coordinate[1], // minY
      coordinate[0], // maxX
      coordinate[1], // maxY
    ];
    const vectorSource = map.getLayers().getArray()[1].getSource();
    const feature = vectorSource.getFeaturesInExtent(extent)[0];
    if (feature) {
      const newStyle = new Style({
        stroke: new Stroke({
          color: "red",
        }),
      });
      feature.setStyle(newStyle);
    }
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

export function useOpenLayersMap(mapDivRef, getInitialOptions) {
  const [mapInstance, setMapInstance] = useState(null);

  useEffect(() => {
    const map = new Map({
      target: mapDivRef.current ?? undefined,
      ...getInitialOptions(),
    });

    map.on("click", (e) => {
      const resolution = map.getView().getResolution();
      const coordinate = e.coordinate;
      console.log("co", coordinate);

      map.forEachFeatureAtPixel(e.pixel, function (f) {
        console.log({ f });
      });
      // const newPoint = createPoint(map, coordinate, resolution);
      // map.getLayers().getArray()[1].getSource().addFeature(newPoint);
    });

    addRightClickInteraction(map);
    addSelectInteraction(map);

    if (!mapInstance) {
      setMapInstance(map);
    }

    return () => {
      map?.setTarget(null);
    };
  }, []);

  return {
    mapInstance,
  };
}
