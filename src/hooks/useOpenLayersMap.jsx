import Map from "ol/Map.js";
import { useEffect, useState } from "react";
import { DragBox } from "ol/interaction";
import { platformModifierKeyOnly } from "ol/events/condition";
import { intersects } from "ol/extent";
import { createPoint, getLabelExtent, setOverlayPosition } from "./utils";

function getNewPixel(prevPixel, index) {
  const random = Math.random() * (20 - 10) + 10;
  // Determine the area based on index
  index = (index % 4) + 1;
  switch (index) {
    case 1:
      return [prevPixel[0] - random, prevPixel[1] - random];
    case 2:
      return [prevPixel[0] + random, prevPixel[1] - random];
    case 3:
      return [prevPixel[0] - random, prevPixel[1] + random];
    case 4:
      return [prevPixel[0] + random, prevPixel[1] + random];
    default:
      return [prevPixel[0] + random, prevPixel[1] - random];
  }
}

function beginDeclutterMode(intersectedElement, map) {
  // Context menu
  const length = intersectedElement.length;
  if (length < 2) return;

  const intersected = new Set();

  for (let i = 0; i < length; ++i) {
    for (let j = 0; j < length; ++j) {
      if (i === j) continue;
      const firstExtent = getLabelExtent(intersectedElement[i], map);
      const secondExtent = getLabelExtent(intersectedElement[j], map);

      if (intersects(firstExtent, secondExtent)) {
        intersected.add(intersectedElement[i]);
        intersected.add(intersectedElement[j]);
      }
    }
  }

  const TRUE = true;

  // MOVE INTERSECTED
  const arrayIntersected = Array.from(intersected);
  console.log({ arrayIntersected });
  arrayIntersected.forEach((labelOverlay, index) => {
    const coordinate = labelOverlay.getPosition();
    const pixel = map.getPixelFromCoordinate(coordinate);
    let newPixel = pixel;

    while (TRUE) {
      newPixel = getNewPixel(newPixel, index);
      const newCoordinate = map.getCoordinateFromPixel(newPixel);
      labelOverlay.setPosition(newCoordinate);

      let overlapDetected = false;
      for (
        let otherIndex = 0;
        otherIndex < arrayIntersected.length;
        ++otherIndex
      ) {
        // Skip self-comparison
        if (index !== otherIndex) {
          const otherLabelOverlay = arrayIntersected[otherIndex];
          const otherExtent = getLabelExtent(otherLabelOverlay, map);
          const newExtent = getLabelExtent(labelOverlay, map);
          // If overlap is detected, set flag to continue looping
          if (intersects(newExtent, otherExtent)) {
            overlapDetected = true;
            break;
          }
        }
      }
      if (overlapDetected) {
        continue;
      } else {
        break;
      }
    }
    const newCoordinate = map.getCoordinateFromPixel(newPixel);
    // THE GOAT
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
