import styles from "./Footer.module.css";

const repositoryUrl = "https://github.com/GadCoder/UNMSM-Admission-Analytics";

function Icon({ name }: { name: "contribute" | "external" | "info" | "github" }) {
  const paths = {
    contribute: (
      <>
        <circle cx="6" cy="5" r="2.2" />
        <circle cx="18" cy="19" r="2.2" />
        <path d="M6 7.2v4.3a4.5 4.5 0 0 0 4.5 4.5H15M18 16.8v-4.3A4.5 4.5 0 0 0 13.5 8H9" />
      </>
    ),
    external: (
      <>
        <path d="M14 4h6v6M20 4l-9 9" />
        <path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </>
    ),
    github: (
      <>
        <path d="M9 19c-4.3 1.4-4.3-2.2-6-2.8m12 5v-3.1a2.7 2.7 0 0 0-.8-2.1c2.7-.3 5.5-1.3 5.5-6a4.7 4.7 0 0 0-1.3-3.3 4.3 4.3 0 0 0-.1-3.3s-1-.3-3.4 1.3a11.7 11.7 0 0 0-6.2 0C6.3 4.1 5.3 4.4 5.3 4.4a4.3 4.3 0 0 0-.1 3.3A4.7 4.7 0 0 0 4 11c0 4.7 2.8 5.7 5.5 6a2.7 2.7 0 0 0-.8 2.1v2.1" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.mainContent}>
          <section className={styles.contribution} aria-labelledby="footer-contribution-title">
            <h2 id="footer-contribution-title">
              <Icon name="contribute" />
              Código abierto
            </h2>
            <p>
              Resultados UNMSM es de código abierto. ¿Tienes una idea o mejora? ¡Las contribuciones
              son bienvenidas!
            </p>
            <a href={repositoryUrl} target="_blank" rel="noopener noreferrer">
              Contribuir en GitHub <Icon name="external" />
            </a>
          </section>
          <section className={styles.disclaimer} aria-labelledby="footer-independence-title">
            <h2 id="footer-independence-title">
              <Icon name="info" />
              Iniciativa independiente
            </h2>
            <p>
              Este es un proyecto independiente, no afiliado ni respaldado por la Universidad
              Nacional Mayor de San Marcos. La información presentada tiene fines informativos y no
              reemplaza las publicaciones oficiales.
            </p>
          </section>
        </div>

        <div className={styles.attribution}>
          <p>© {new Date().getFullYear()} Resultados UNMSM</p>
          <p>
            Desarrollado por{" "}
            <a href="https://github.com/GadCoder" target="_blank" rel="noopener noreferrer">
              <Icon name="github" />
              GadCoder
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
