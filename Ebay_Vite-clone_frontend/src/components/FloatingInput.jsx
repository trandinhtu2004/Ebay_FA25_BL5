// src/components/FloatingInput.jsx
import React from 'react';

const FloatingInput = ({ label, type = "text", ...props }) => {
  return (
    <div className="relative w-full group">
      <input
        type={type}
        className="block px-4 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-white rounded-lg border-1 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
        placeholder=" "
        {...props}
      />
      <label
        className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-3"
      >
        {label}
      </label>
    </div>
  );
};

export default FloatingInput;