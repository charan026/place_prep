const variantClasses = {
  easy: 'badge-easy',
  medium: 'badge-medium',
  hard: 'badge-hard',
  solved: 'badge-solved',
  attempted: 'badge-attempted',
  todo: 'badge-todo',
  default: 'badge bg-primary-500/15 text-primary-400 border border-primary-500/25',
  success: 'badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  warning: 'badge bg-amber-500/15 text-amber-400 border border-amber-500/25',
  danger: 'badge bg-rose-500/15 text-rose-400 border border-rose-500/25',
  info: 'badge bg-cyan-500/15 text-cyan-400 border border-cyan-500/25',
};

const Badge = ({ children, variant = 'default', className = '' }) => {
  return (
    <span className={`${variantClasses[variant] || variantClasses.default} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
