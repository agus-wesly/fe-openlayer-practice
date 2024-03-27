import { Feature, View } from "ol";
import TileLayer from "ol/layer/Tile";
import { fromLonLat } from "ol/proj";
import { OSM } from "ol/source";
import { useCallback, useEffect, useRef, useState } from "react";
import Map from "ol/Map.js";

import { defaults as defaultControls } from "ol/control";
import { Point } from "ol/geom";
import { Icon, Style } from "ol/style";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { TracksTab } from "./components/tracks-tab";

const iconFeature = new Feature(new Point(fromLonLat([106.60981, -6.914744])));

const iconStyle = new Style({
  image: new Icon({
    anchorXUnits: "fraction",
    anchorYUnits: "pixels",
    src: "https://avatars.githubusercontent.com/u/98297487?v=4",
    width: 50,
    height: 50,
  }),
});
iconFeature.setStyle(iconStyle);

const vectorSource = new VectorSource({
  features: [iconFeature],
});

const vectorLayer = new VectorLayer({
  source: vectorSource,
});

const generateStyle = (selectedMode) => {
  return new Style({
    image: new Icon({
      anchorXUnits: "fraction",
      anchorYUnits: "pixels",
      src:
        selectedMode === "allid-allenv"
          ? "https://avatars.githubusercontent.com/u/98297487?v=4"
          : "/profile.jpg",
      width: 50,
      height: 50,
    }),
  });
};

export default function FeatureModify() {
  const mapRef = useRef();
  const [mapInstance, setMapInstance] = useState(null);
  const onClickMapRef = useRef(() => {});
  const [selectedMode, setSelectedMode] = useState("allid-allenv");

  const [selectedFeatures, setSelectedFeatures] = useState([]);

  useEffect(function initMap() {
    if (!mapRef.current) return;

    const tile = new TileLayer({ source: new OSM() });

    const map = new Map({
      layers: [tile, vectorLayer],
      view: new View({
        center: fromLonLat([107.60981, -6.914744]),
        zoom: 12,
      }),
      target: mapRef.current,
      controls: defaultControls({ zoom: true }),
    });

    setMapInstance(map);

    return () => {
      map.setTarget(null);
      setMapInstance(null);
    };
  }, []);

  if (mapInstance) {
    mapInstance.removeEventListener("click", onClickMapRef.current);

    onClickMapRef.current = (evt) => {
      const iconFeature = new Feature(new Point(evt.coordinate));
      iconFeature.setProperties({ mode: selectedMode });

      const iconStyle = generateStyle(selectedMode);
      iconFeature.setStyle(iconStyle);
      vectorLayer.getSource().addFeature(iconFeature);
    };

    mapInstance.addEventListener("click", onClickMapRef.current);
  }

  const showPoint = useCallback(
    (selectedMode) => {
      const originalSource = vectorLayer.getSource();
      const allFeatures = originalSource.getFeatures();

      const filterFeatures = (feature) => {
        return selectedMode.includes(feature.getProperties().mode);
      };

      // Loop through all features and set their visibility based on the filter function
      allFeatures.forEach(function (feature) {
        if (filterFeatures(feature)) {
          feature.setStyle(generateStyle(feature.getProperties().mode));
        } else {
          feature.setStyle(null);
        }
      });
    },

    [],
  );

  const onInputCheckboxChange = (e) => {
    if (e.target.checked) {
      setSelectedFeatures((prev) => {
        const newFeatures = [...prev, e.target.name];
        showPoint(newFeatures);
        return newFeatures;
      });
    } else {
      setSelectedFeatures((prev) => {
        const newFeatures = [...prev.filter((item) => item !== e.target.name)];
        showPoint(newFeatures);
        return newFeatures;
      });
    }
  };

  return (
    <div className="w-screen h-screen flex justify-end relative" ref={mapRef}>
      <div className="absolute z-[2] right-8 bottom-1/4 flex flex-col gap-4 text-white items-end">
        <TracksTab
          selectedFeatures={selectedFeatures}
          onInputCheckboxChange={onInputCheckboxChange}
        />

        <button
          className="bg-neutral-800 p-3 rounded"
          onClick={() => {
            setSelectedMode("allid-allenv");
          }}
        >
          All Id All Env
        </button>
        <button
          className="bg-neutral-800 p-3 rounded"
          onClick={() => {
            setSelectedMode("unknown-air");
          }}
        >
          Unknown Air
        </button>
      </div>
    </div>
  );
}
