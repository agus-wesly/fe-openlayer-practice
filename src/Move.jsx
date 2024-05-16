import OLCesium from "olcs";
import olView from "ol/View.js";
import { defaults as olControlDefaults } from "ol/control.js";
import olSourceOSM from "ol/source/OSM.js";
import olLayerTile from "ol/layer/Tile.js";
import olSourceVector from "ol/source/Vector.js";
import olLayerVector from "ol/layer/Vector.js";
import olStyleIcon from "ol/style/Icon.js";
import olStyleStyle from "ol/style/Style.js";
import olFeature from "ol/Feature.js";
import olGeomPoint from "ol/geom/Point.js";
import olMap from "ol/Map.js";
import { useEffect } from "react";
import { fromLonLat } from "ol/proj";
import { flightData } from "./flightData";

export default function Move() {
  useEffect(() => {
    const point = new olGeomPoint([700000, 200000, 100000]);

    const iconFeature = new olFeature({
      geometry: point,
    });

    const iconStyle = new olStyleStyle({
      image: new olStyleIcon(
        /** @type {olx.style.IconOptions} */ ({
          anchor: [0.5, 46],
          anchorXUnits: "fraction",
          anchorYUnits: "pixels",
          opacity: 0.75,
          src: "/vite.svg",
        }),
      ),
    });

    iconFeature.setStyle(iconStyle);

    const vectorSource2 = new olSourceVector({
      features: [iconFeature],
    });
    const vectorLayer2 = new olLayerVector({
      renderMode: "image",
      source: vectorSource2,
    });

    const map = new olMap({
      layers: [
        new olLayerTile({
          source: new olSourceOSM(),
        }),
        vectorLayer2,
      ],
      target: "map2d",
      controls: olControlDefaults({
        attributionOptions: {
          collapsible: false,
        },
      }),
      view: new olView({
        center: fromLonLat([flightData[0].longitude, flightData[0].latitude]),
        zoom: 18,
      }),
    });

    // Cesium.Ion.defaultAccessToken = OLCS_ION_TOKEN;
    const ol3d = new OLCesium({ map /*, target: 'map3d'*/ });
    const scene = ol3d.getCesiumScene();
    window.Cesium.createWorldTerrainAsync().then(
      (tp) => (scene.terrainProvider = tp),
    );
    ol3d.setEnabled(true);

    function createModel(url, height) {
      const Cesium = window.Cesium;
      const cesiumSource = ol3d.getDataSourceDisplay().defaultDataSource;
      const entities = cesiumSource.entities;
      entities.removeAll();

      const start = Cesium.JulianDate.fromDate(new Date(2018, 11, 12, 15));
      const totalSeconds = 30 * (flightData.length - 1);
      const stop = Cesium.JulianDate.addSeconds(
        start,
        totalSeconds,
        new Cesium.JulianDate(),
      );

      scene.startTime = start.clone();
      scene.stopTime = stop.clone();
      scene.currentTime = start.clone();

      const position = new Cesium.SampledPositionProperty();

      for (let i = 0; i < flightData.length; ++i) {
        const dataPoint = flightData[i];
        const time = Cesium.JulianDate.addSeconds(
          start,
          i * 30,
          new Cesium.JulianDate(),
        );

        const location = Cesium.Cartesian3.fromDegrees(
          dataPoint.longitude,
          dataPoint.latitude,
          0,
        );
        position.addSample(time, location);
        entities.add({
          description: `Location:`,
          position: location,
          point: { pixelSize: 5, color: Cesium.Color.RED },
        });
      }

      console.log("p", position);

      const airplaneEntity = new Cesium.Entity({
        name: "Cesium air",
        position: position,
        //position: Cesium.Cartesian3.fromDegrees(-123.0744619, latitude, height),
        orientation: new Cesium.VelocityOrientationProperty(position), // Automatically set the vehicle's orientation to the direction it's facing.
        availability: new Cesium.TimeIntervalCollection([
          new Cesium.TimeInterval({ start: start, stop: stop }),
        ]),
        model: {
          uri: url,
          minimumPixelSize: 64,
          maximumScale: 20000,
          runAnimations: false,
        },
        path: new Cesium.PathGraphics({ width: 3 }),
      });

      entities.add(airplaneEntity);

      // scene.postRender.addEventListener(function () {
      //   const position = airplaneEntity.position.getValue(scene.startTime);
      //   if (Cesium.defined(position)) {
      //     scene.screenSpaceCameraController.enableInputs = true;
      //   }
      // });

      scene.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          flightData[0].longitude,
          flightData[0].latitude,
          0,
        ),
      });

      return airplaneEntity;
    }

    let tracking = false;
    window["toggleTracking"] = function () {
      tracking = !tracking;
      // if (!tracking) return;
      ol3d.trackedFeature = tracking ? iconFeature : undefined;
      // ol3d.getCamera().setPosition();
    };

    window["moveTruck"] = function (entity) {
      console.log("e", entity);
      const Cesium = window.Cesium;
      const speed = 10;
      let previousTime = Cesium.JulianDate.now();
      const direction = new Cesium.Cartesian3(1, 0, 0); // Move along the x-axis

      setInterval(() => {
        console.log("runnn");
        // Get the current position
        const currentPosition = entity.position.getValue(
          Cesium.JulianDate.now(),
        );

        // Calculate the distance to move based on speed and direction
        const distance =
          speed *
          Cesium.JulianDate.secondsDifference(
            Cesium.JulianDate.now(),
            previousTime,
          );

        // Calculate the new position
        const newPosition = Cesium.Cartesian3.add(
          currentPosition,
          Cesium.Cartesian3.multiplyByScalar(
            direction,
            distance,
            new Cesium.Cartesian3(),
          ),
          new Cesium.Cartesian3(),
        );

        // Update the entity's position
        entity.position = new Cesium.ConstantPositionProperty(newPosition);

        // Update the previous time
        previousTime = Cesium.JulianDate.now();
      }, 100);
    };

    window["createTruck"] = function () {
      return createModel("/plane.glb", 0);
    };

    setInterval(() => {
      const old = point.getCoordinates();
      const coordd = [
        old[0] + 1000 * Math.random(),
        old[1] + 1000 * Math.random(),
        old[2],
      ];
      point.setCoordinates(coordd);
      // ol3d.getCamera().setPosition([coordd[0], coordd[1], 999999]);
      iconFeature.changed();
    }, 100);

    return () => {
      map.setTarget(null);
    };
  }, []);

  return (
    <>
      <div
        id="map2d"
        style={{
          width: "100%",
          height: "100vh",
        }}
      ></div>
    </>
  );
}
