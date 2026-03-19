import clsx from "clsx";
import styles from "./button.module.css";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
}

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return <button className={clsx(styles.button, styles[variant], className)} {...props} />;
}
