import { generateTDAFilterItem } from "../utils";
import InputCheckbox from "./input-checkbox";

const TDA_FILTERS = [
  {
    name: "All Id",
    id: "allid",
  },
  {
    name: "Unknown",
    id: "unknown",
  },
  {
    name: "Friend",
    id: "friend",
  },
  {
    name: "Assume Friend",
    id: "asm-friend",
  },
  {
    name: "Pending",
    id: "pending",
  },
  {
    name: "Neutral",
    id: "neutral",
  },
  {
    name: "Suspect",
    id: "suspect",
  },
  {
    name: "Hostile",
    id: "hostile",
  },
];

export function TracksTab({ selectedFeatures, onInputCheckboxChange }) {
  return (
    <div className="bg-neutral-700 p-5 rounded-xl">
      <div className="flex flex-col w-full mb-3 items-start justify-start gap-2 [writing-mode:vertical-lr] rotate-180 text-xs">
        <h4 className="w-5">Unknown</h4>
        <h4 className="w-5">Land</h4>
        <h4 className="w-5">Subsurface</h4>
        <h4 className="w-5">Surface</h4>
        <h4 className="w-5">Air</h4>
        <h4 className="w-5">All Env.</h4>
      </div>
      <div className="flex flex-col gap-2 items-end text-xs">
        {TDA_FILTERS.map((filter) => {
          return (
            <div className="flex gap-2" key={filter.id}>
              <h4>{filter?.name}</h4>
              {generateTDAFilterItem(filter.id).map((filterItem) => {
                return (
                  <InputCheckbox
                    key={filterItem.value}
                    name={filterItem.value}
                    checked={selectedFeatures.includes(filterItem.value)}
                    onChange={onInputCheckboxChange}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
