import { useMap } from "./hooks/useMap";

function App() {
  const {
    mapRef,
    measureTooltipElementRef,
    drawFeature,
    addInteractions,
    zoomButtonRef,
    removeFeature,
  } = useMap();

  return (
    <>
      <div className="w-screen h-screen relative" ref={mapRef}>
        <div
          ref={measureTooltipElementRef}
          className="text-white bg-black/80 ol-tooltip ol-tooltip-measure  p-1 text-xs"
        />
        <div className="absolute z-[2] right-8 bottom-1/4 flex flex-col gap-4">
          {drawFeature ? (
            <button
              onClick={() => {
                removeFeature();
              }}
              className="p-2 bg-neutral-800 rounded ml-[1px]"
            >
              <img src="/close.svg" className="size-5" />
            </button>
          ) : null}

          <button
            onClick={() => {
              addInteractions("LineString");
            }}
            className="p-2 bg-neutral-800 rounded ml-[1px]"
          >
            <img src="/spline.svg" className="size-5" />
          </button>

          <button
            onClick={() => {
              addInteractions("Polygon");
            }}
            className="p-2 rounded bg-neutral-800 ml-[1px]"
          >
            <img src="diamond.svg" className="size-5" />
          </button>

          <button
            onClick={() => {
              addInteractions("Point");
            }}
            className="p-2 bg-neutral-800 rounded ml-[1px]"
          >
            <img src="/locate.svg" className="size-5" />
          </button>

          <div ref={zoomButtonRef} id="btn-container"></div>
        </div>
      </div>
    </>
  );
}

export default App;
