import type { ButtonHTMLAttributes } from "react";

export type RetroButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "gold" | "paper" | "quiet";
};

export function RetroButton({
  variant = "gold",
  className = "",
  type = "button",
  ...props
}: RetroButtonProps) {
  return (
    <button
      type={type}
      className={`retro-button retro-button--${variant} ${className}`.trim()}
      {...props}
    />
  );
}
