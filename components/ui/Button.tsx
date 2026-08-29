import { type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

/**
 * Customizable button component with multiple variants and sizes.
 * @param props - The button properties.
 * @param props.variant - The button style variant (default: "primary").
 * @param props.size - The button size (default: "md").
 * @param props.fullWidth - Whether the button should take full width (default: false).
 * @param props.className - Additional CSS classes to apply.
 * @param props.children - The button content.
 * @returns The button component.
 */
const Button = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...props
}: ButtonProps) => {
  const baseClass = "btn";
  const variantClass = `btn--${variant}`;
  const sizeClass = `btn--${size}`;
  const fullWidthClass = fullWidth ? "btn--full" : "";

  const combinedClasses = [
    baseClass,
    variantClass,
    sizeClass,
    fullWidthClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
};

export default Button;
