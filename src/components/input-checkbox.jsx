function InputCheckbox({ onChange, ...props }) {
  return (
    <input
      className="h-5 w-5 appearance-none border-2 border-white rounded-md checked:bg-white checked:border-transparent"
      type="checkbox"
      onChange={onChange}
      {...props}
    />
  );
}

export default InputCheckbox;
