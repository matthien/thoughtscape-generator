import Link from "next/link";
import { GRID_TILE_URL } from "@/lib/mat";
import styles from "./ShareNotice.module.css";

// What a shared link shows when it can't show a canvas: expired, or the
// feeds wouldn't load. Not from the share design (which only covered the
// button and toast); built from the corner panel's look.
export default function ShareNotice({ message }: { message: string }) {
  return (
    <main className={styles.mat} style={{ backgroundImage: GRID_TILE_URL }}>
      <div className={styles.panel}>
        <p className={styles.message}>{message}</p>
        <Link href="/" className={styles.button}>
          make your own
        </Link>
      </div>
    </main>
  );
}
