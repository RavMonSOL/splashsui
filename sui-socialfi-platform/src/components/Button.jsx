// src/components/Button.jsx
import React from 'react';

const Button = ({ children, onClick, variant = 'primary', size = 'md', className = "", icon: Icon, disabled = false }) => {
  const baseStyles = "font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-150 ease-in-out flex items-center justify-center";
  const variantStyles = {
    primary: `bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 ${disabled ? 'bg-blue-400 cursor-not-allowed' : ''}`,
    secondary: `bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 focus:ring-gray-400 ${disabled ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''}`,
    danger: `bg-red-500 hover:bg-red-600 text-white focus:ring-red-400 ${disabled ? 'bg-red-300 cursor-not-allowed' : ''}`,
    ghost: `bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 focus:ring-blue-500 ${disabled ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' : ''}`,
  };
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled}
    >
      {Icon && <Icon size={size === 'sm' ? 16 : 20} className={children ? "mr-2" : ""} />}
      {children}
    </button>
  );
};

export default Button;