const Input = ({ label, error, className = '', ...props }) => {
  return (
    <div className={className}>
      {label && <label className="input-label">{label}</label>}
      <input className={`input-field ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''}`} {...props} />
      {error && <p className="mt-1 text-sm text-rose-400">{error}</p>}
    </div>
  );
};

export const TextArea = ({ label, error, className = '', ...props }) => {
  return (
    <div className={className}>
      {label && <label className="input-label">{label}</label>}
      <textarea
        className={`input-field resize-none ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-rose-400">{error}</p>}
    </div>
  );
};

export const Select = ({ label, error, options = [], className = '', placeholder, ...props }) => {
  return (
    <div className={className}>
      {label && <label className="input-label">{label}</label>}
      <select className={`input-field ${error ? 'border-rose-500' : ''}`} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-rose-400">{error}</p>}
    </div>
  );
};

export default Input;
