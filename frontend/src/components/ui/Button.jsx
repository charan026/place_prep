const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'px-6 py-3 bg-gradient-to-r from-rose-600 to-rose-500 text-white font-semibold rounded-xl hover:from-rose-500 hover:to-rose-400 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-rose-500/25 focus:outline-none focus:ring-2 focus:ring-rose-500/50',
};

const Button = ({ children, variant = 'primary', className = '', disabled = false, loading = false, ...props }) => {
  return (
    <button
      className={`${variants[variant]} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {children}
        </span>
      ) : children}
    </button>
  );
};

export default Button;
