import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "outline";
  size?: "default" | "small";
};

export function Button({
  children,
  className = "",
  size = "default",
  variant = "primary",
  ...props
}: Readonly<ButtonProps>) {
  const classes = ["button", `button--${variant}`];
  if (size === "small") classes.push("button--small");
  if (className) classes.push(className);

  return (
    <button className={classes.join(" ")} {...props}>
      {children}
    </button>
  );
}
