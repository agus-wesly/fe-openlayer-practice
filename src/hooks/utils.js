import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import { Fill, Stroke, Style } from "ol/style";
import CircleStyle from "ol/style/Circle";
import { Overlay, getUid } from "ol";
import { GeometryCollection, LineString } from "ol/geom";

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

export function getLabelExtent(labelOverlay, map) {
  const pixel = map.getPixelFromCoordinate(labelOverlay.getPosition());
  const label = labelOverlay.getElement();

  const width = label.offsetWidth;
  const height = label.offsetHeight;
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

let id = 0;

export function createPoint(map, coordinate) {
  const lat = coordinate[0];
  const long = coordinate[1];

  const newCoordinate = [coordinate[0] + 90000, coordinate[1]];

  // POINT
  const pointGeom = new Point([lat, long]);

  // LINE
  const lineGeom = new LineString([coordinate, newCoordinate]);

  const pointFeature = new Feature({
    geometry: new GeometryCollection([pointGeom, lineGeom]),
  });
  // Set the feature's id to its uid so we can query later
  pointFeature.setId(getUid(pointFeature));

  pointFeature.setStyle(
    new Style({
      image: new CircleStyle({
        radius: 10,
        fill: new Fill({ color: "rgba(255, 0, 0, 0.1)" }),
        stroke: new Stroke({ color: "red", width: 1 }),
      }),
      stroke: new Stroke({ color: "blue", width: 3 }),
    }),
  );

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
  map.addOverlay(labelOverlay);

  return pointFeature;
}
