import styles from "./input.module.css";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, ...props }: InputProps) {
  return (
    <label className={styles.wrapper}>
      <span>{label}</span>
      <input className={styles.input} {...props} />
      {error ? <small className={styles.error}>{error}</small> : null}
    </label>
  );
}
