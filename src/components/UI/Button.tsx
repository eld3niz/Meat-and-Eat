import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  // Add any other specific props your button might need, e.g., variant, size
}

const Button: React.FC<ButtonProps> = ({ children, className, onClick, type = 'button', ...props }) => {
  // Basic styling - combine default styles with provided className
  // Adjust Tailwind classes as needed to match your project's design system
  const baseStyle = "px-4 py-2 rounded font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition ease-in-out duration-150";
  const combinedClassName = `${baseStyle} ${className || ''}`;

  return (
    <button
      type={type}
      className={combinedClassName.trim()}
      onClick={onClick}
      {...props} // Spread any other HTML button attributes
    >
      {children}
    </button>
  );
};

export default Button;