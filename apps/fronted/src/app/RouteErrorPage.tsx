import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";

import styles from "./RouteErrorPage.module.css";

type PageMessageProps = {
  code: string;
  title: string;
  message: string;
};

function PageMessage({ code, title, message }: PageMessageProps) {
  return (
    <main className={styles.page}>
      <section className={styles.message} aria-labelledby="page-message-title">
        <p className={styles.face} aria-hidden="true">:(</p>
        <p className={styles.code}>{code}</p>
        <h1 id="page-message-title">{title}</h1>
        <p className={styles.description}>{message}</p>
        <Link className={styles.homeLink} to="/">Volver al inicio</Link>
      </section>
    </main>
  );
}

export function NotFoundPage() {
  return (
    <PageMessage
      code="404"
      title="No encontramos esa página"
      message="Revisa la dirección o vuelve al inicio para seguir explorando los resultados de admisión."
    />
  );
}

export function RouteErrorPage() {
  const error = useRouteError();
  const isMissingRoute = isRouteErrorResponse(error) && error.status === 404;

  return (
    <PageMessage
      code={isMissingRoute ? "404" : "Error"}
      title={isMissingRoute ? "No encontramos esa página" : "No pudimos cargar esta página"}
      message={isMissingRoute
        ? "Revisa la dirección o vuelve al inicio para seguir explorando los resultados de admisión."
        : "Ocurrió un problema al mostrar esta página. Puedes volver al inicio e intentarlo de nuevo."}
    />
  );
}
