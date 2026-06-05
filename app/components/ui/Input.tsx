"use client";

import { forwardRef } from "react";

const variants = {
  default: "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition",
  sm: "w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition",
};

type InputVariant = keyof typeof variants;

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ variant = "default", className, ...props }, ref) => (
    <input ref={ref} className={`${variants[variant]} ${className ?? ""}`} {...props} />
  )
);
Input.displayName = "Input";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  variant?: InputVariant;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ variant = "default", className, children, ...props }, ref) => (
    <select ref={ref} className={`${variants[variant]} ${className ?? ""}`} {...props}>
      {children}
    </select>
  )
);
Select.displayName = "Select";
