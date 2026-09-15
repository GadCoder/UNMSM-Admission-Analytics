import styles from "../pages/DashboardPage.module.css";

function SkeletonLine({ className = "" }: { className?: string }) {
  return <span className={`${styles.skeletonLine} ${className}`} aria-hidden="true" />;
}

export function DashboardLoadingSkeleton() {
  return (
    <div className={styles.skeletonPage} role="status" aria-label="Cargando resultados de admisión">
      <span className={styles.visuallyHidden}>Cargando resultados de admisión…</span>
      <div className={styles.skeletonKpis} aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => <div className={styles.skeletonKpi} key={index}><SkeletonLine className={styles.skeletonKpiLabel} /><SkeletonLine className={styles.skeletonKpiValue} /></div>)}
      </div>
      <div className={styles.skeletonCard} aria-hidden="true">
        <SkeletonLine className={styles.skeletonSectionTitle} />
        <SkeletonLine className={styles.skeletonSectionDescription} />
        <div className={styles.skeletonRows}>{Array.from({ length: 5 }, (_, index) => <SkeletonLine className={styles.skeletonRow} key={index} />)}</div>
      </div>
    </div>
  );
}

export function DashboardOverviewLoadingSkeleton() {
  return (
    <div className={styles.skeletonPage} role="status" aria-label="Cargando indicadores">
      <span className={styles.visuallyHidden}>Cargando indicadores…</span>
      <div className={styles.skeletonKpis} aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => <div className={styles.skeletonKpi} key={index}><SkeletonLine className={styles.skeletonKpiLabel} /><SkeletonLine className={styles.skeletonKpiValue} /></div>)}
      </div>
      <div className={styles.skeletonCard} aria-hidden="true"><SkeletonLine className={styles.skeletonSectionTitle} /><SkeletonLine className={styles.skeletonSectionDescription} /><div className={styles.skeletonRows}>{Array.from({ length: 5 }, (_, index) => <SkeletonLine className={styles.skeletonRow} key={index} />)}</div></div>
    </div>
  );
}

export function MajorDetailLoadingSkeleton() {
  return (
    <div className={styles.skeletonPage} role="status" aria-label="Cargando detalle de la carrera">
      <span className={styles.visuallyHidden}>Cargando detalle de la carrera…</span>
      <div className={styles.skeletonBack} aria-hidden="true"><SkeletonLine className={styles.skeletonBackLine} /></div>
      <div className={styles.skeletonDetailHero} aria-hidden="true"><div><SkeletonLine className={styles.skeletonEyebrow} /><SkeletonLine className={styles.skeletonDetailTitle} /><SkeletonLine className={styles.skeletonDescription} /></div><SkeletonLine className={styles.skeletonBadge} /></div>
      <div className={styles.skeletonKpis} aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => <div className={styles.skeletonKpi} key={index}><SkeletonLine className={styles.skeletonKpiLabel} /><SkeletonLine className={styles.skeletonKpiValue} /></div>)}
      </div>
      <div className={styles.skeletonCard} aria-hidden="true"><SkeletonLine className={styles.skeletonSectionTitle} /><div className={styles.skeletonRows}>{Array.from({ length: 6 }, (_, index) => <SkeletonLine className={styles.skeletonRow} key={index} />)}</div></div>
    </div>
  );
}
