import styles from "./input.module.css";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  /** Renders after the input (e.g. show-password toggle); input shares one bordered box with the adornment. */
  endAdornment?: React.ReactNode;
}

export function Input({ label, error, endAdornment, ...props }: InputProps) {
  return (
    <label className={styles.wrapper}>
      <span>{label}</span>
      {endAdornment ? (
        <div className={styles.withAdornment}>
          <input className={`${styles.input} ${styles.inputInRow}`} {...props} />
          {endAdornment}
        </div>
      ) : (
        <input className={styles.input} {...props} />
      )}
      {error ? <small className={styles.error}>{error}</small> : null}
    </label>
  );
}
