// src/components/Input.jsx
import React from 'react';

const Input = ({ label, type = 'text', placeholder, value, onChange, name, required = false, className = "" }) => (
  <div className={`mb-4 ${className}`}>
    {label && <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}{required && <span className="text-red-500">*</span>}</label>}
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
    />
  </div>
);

export default Input;