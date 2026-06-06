const Card = ({ children, className = '', hover = false, onClick, ...props }) => {
  return (
    <div
      className={`${hover ? 'glass-card-hover cursor-pointer' : 'glass-card'} p-6 ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
