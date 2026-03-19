import styles from "./centered-loader.module.css";

export function CenteredLoader({ label }: { label: string }) {
  return (
    <div className={styles.container}>
      <p>{label}</p>
    </div>
  );
}
