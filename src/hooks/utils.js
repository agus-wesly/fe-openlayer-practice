import Feature from "ol/Feature.js";
import { Icon, Stroke, Style } from "ol/style";
import { Overlay, getUid } from "ol";
import { GeometryCollection, LineString, Point } from "ol/geom";
import { getSize } from "ol/extent";

const ICON_WIDTH = 36;
const ICON_HEIGHT = 36;

export function setOverlayPosition(overlay, newCoordinate, map) {
  // GET LINE
  const featureId = getOverlayFeatureId(overlay);
  const feature = getFeatureById(featureId, map);
  const lineGeometry = getFeatureGeometry(feature, "line");
  // SET LINE
  lineGeometry.setCoordinates([
    lineGeometry.getCoordinates()[0],
    newCoordinate,
  ]);
  // Set Geometry Group
  const pointGeometry = getFeatureGeometry(feature, "point");
  feature.getGeometry().setGeometries([pointGeometry, lineGeometry]);

  overlay.setPosition(newCoordinate);
}

export function getFeatureGeometry(feature, type = "line") {
  const geometries = feature.getGeometry().getGeometries();
  if (type === "point") return geometries[0];
  if (type === "line") return geometries[1];
  return null;
}

export function getOverlayFeatureId(overlay) {
  return overlay.getProperties().pointFeature;
}

export function getFeatureById(id, map) {
  const feature = map.getLayers().getArray()[1].getSource().getFeatureById(id);
  return feature;
}

// Helper function to calculate the extent
function calculateExtent(pixel, width, height, map) {
  const topLeftPixel = [pixel[0] - width / 2, pixel[1] - height / 2];
  const bottomRightPixel = [pixel[0] + width / 2, pixel[1] + height / 2];

  // Convert pixel coordinates to map coordinates
  const topLeftCoord = map.getCoordinateFromPixel(topLeftPixel);
  const bottomRightCoord = map.getCoordinateFromPixel(bottomRightPixel);

  return [
    topLeftCoord[0],
    bottomRightCoord[1],
    bottomRightCoord[0],
    topLeftCoord[1],
  ];
}

// Function to get label extent
export function getLabelExtent(labelOverlay, map) {
  const pixel = map.getPixelFromCoordinate(labelOverlay.getPosition());
  const label = labelOverlay.getElement();
  const width = label.offsetWidth;
  const height = label.offsetHeight;

  return calculateExtent(pixel, width, height, map);
}

// Function to get icon extent
export function getIconExtent(feature, map) {
  const pointGeom = getFeatureGeometry(feature, "point");
  const pixel = map.getPixelFromCoordinate(pointGeom.getCoordinates());
  const width = ICON_WIDTH;
  const height = ICON_HEIGHT;

  return calculateExtent(pixel, width, height, map);
}

let id = 0;
export function createPoint(map, coordinate) {
  const lat = coordinate[0];
  const long = coordinate[1];

  const newCoordinate = [coordinate[0] + 100000, coordinate[1]];

  // POINT
  const pointGeom = new Point([lat, long]);

  // LINE
  const lineGeom = new LineString([coordinate, newCoordinate]);

  const pointFeature = new Feature({
    geometry: new GeometryCollection([pointGeom, lineGeom]),
  });
  // Set the feature's id to its uid so we can query later
  pointFeature.setId(getUid(pointFeature));

  pointFeature.setStyle([
    new Style({
      image: new Icon({
        src: "/vite.svg",
        width: ICON_WIDTH,
        height: ICON_HEIGHT,
      }),
      stroke: new Stroke({ color: "blue", width: 1 }),
    }),
  ]);

  console.log("featId", pointFeature.getId());

  // OVERLAY
  const label = document.createElement("div");
  label.classList.add("label");
  document.getElementById("map").appendChild(label);
  label.textContent = "LABELLLLLLLLLLLLL" + id;

  const labelOverlay = new Overlay({
    element: label,
    positioning: "center-center",
    id: id++,
  });

  labelOverlay.setPosition(newCoordinate);
  labelOverlay.setProperties({
    initialPosition: newCoordinate,
    pointFeature: pointFeature.getId(),
  });

  window["checkExtent"] = function(coord) {
    console.log(getSize(getIconExtent(pointFeature, map)));
  };

  map.addOverlay(labelOverlay);

  return pointFeature;
}
[-8212372.615080704, 6041816.146222739];
