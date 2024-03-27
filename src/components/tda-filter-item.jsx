import { generateTDAFilterItem } from "../utils";
import InputCheckbox from "./input-checkbox";

function TDAFilterItem({ data, ...props }) {
  return (
    <div className="flex gap-2" {...props}>
      <h4>{data?.name}</h4>
      {generateTDAFilterItem(data?.id).map((filter) => {
        return (
          <InputCheckbox
            key={filter.value}
            value={filter.value}
            onChange={() => {}}
          />
        );
      })}
    </div>
  );
}

export default TDAFilterItem;
