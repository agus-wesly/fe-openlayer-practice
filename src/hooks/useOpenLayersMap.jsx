import Map from "ol/Map.js";
import { useEffect, useState } from "react";
import { DragBox } from "ol/interaction";
import { platformModifierKeyOnly } from "ol/events/condition";
import { intersects } from "ol/extent";
import { createPoint, getLabelExtent, setOverlayPosition } from "./utils";

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
      const newPoint = createPoint(map, coordinate, resolution);
      map.getLayers().getArray()[1].getSource().addFeature(newPoint);
    });

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
