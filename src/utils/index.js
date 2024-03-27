export const generateTDAFilterItem = (id) => {
  return [
    { value: `${id}-allenv` },
    {
      value: `${id}-air`,
    },
    {
      value: `${id}-surface`,
    },
    {
      value: `${id}-subsurface1`,
    },
    {
      value: `${id}-land`,
    },
    {
      value: `${id}-unknown`,
    },
  ];
};
