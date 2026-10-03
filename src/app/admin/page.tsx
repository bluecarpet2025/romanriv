import Link from "next/link";
import styles from "./page.module.css";

export const metadata = {
  title: "Admin | romanriv.com",
};

export default function AdminHomePage() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Content management</p>
        <h1>Admin</h1>
        <p>Manage your photo library and anime collection.</p>
      </header>
      <div className={styles.grid}>
        <section className={styles.card} aria-labelledby="photos-heading">
          <span className={styles.icon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8" cy="8" r="1.5" />
              <path d="m3 17 5-5 4 4 4-6 5 7" />
            </svg>
          </span>
          <h2 id="photos-heading">Photos</h2>
          <p>Upload new images or edit titles, descriptions, and tags in your photo library.</p>
          <nav className={styles.actions} aria-label="Photo management">
            <Link href="/admin/photos" className={styles.primary}>Upload photos <span aria-hidden="true">→</span></Link>
            <Link href="/admin/photos/manage">Manage photos <span aria-hidden="true">→</span></Link>
          </nav>
        </section>
        <section className={styles.card} aria-labelledby="anime-heading">
          <span className={styles.icon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <path d="m10 8 6 4-6 4V8Z" />
            </svg>
          </span>
          <h2 id="anime-heading">Anime</h2>
          <p>Keep your anime collection up to date. Manage entries, details, and cover images.</p>
          <nav className={styles.actions} aria-label="Anime management">
            <Link href="/admin/anime" className={styles.primary}>Manage anime <span aria-hidden="true">→</span></Link>
          </nav>
        </section>
      </div>
    </div>
  );
}
