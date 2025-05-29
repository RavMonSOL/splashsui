// src/components/Textarea.jsx
import React from 'react';

const Textarea = ({ label, placeholder, value, onChange, name, required = false, rows = 3, className = "" }) => (
  <div className={`mb-4 ${className}`}>
    {label && <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}{required && <span className="text-red-500">*</span>}</label>}
    <textarea
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      rows={rows}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
    />
  </div>
);

export default Textarea;