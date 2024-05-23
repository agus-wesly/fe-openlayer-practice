import React from "react";

let count = 0;
function Component() {
  const countRef = React.useRef(count++);
  console.log(countRef.current);

  return <div> Hello{countRef.current}</div>;
}

const Experiment = () => {
  const [show, setShow] = React.useState(false);
  return (
    <div>
      <button onClick={() => setShow((prev) => !prev)}>Toggle</button>
      {true ? <Component /> : null}
    </div>
  );
};

export default Experiment;
