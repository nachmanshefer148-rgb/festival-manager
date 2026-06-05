"use client";

const variants = {
  primary: "bg-violet-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors",
  cancel: "text-gray-500 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors",
  add: "text-sm text-violet-600 hover:text-violet-700 font-medium border border-dashed border-violet-300 hover:border-violet-400 px-3 py-1.5 rounded-lg transition-colors",
  danger: "border border-red-200 text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors",
  success: "bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors",
};

type ButtonVariant = keyof typeof variants;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = "primary", className, children, ...props }: ButtonProps) {
  return (
    <button className={`${variants[variant]} ${className ?? ""}`} {...props}>
      {children}
    </button>
  );
}
