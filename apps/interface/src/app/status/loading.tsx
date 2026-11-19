/**
 * Loading skeleton for status route segment — Issue #1285
 *
 * Displays while status data is being fetched. Built from the shared
 * skeleton primitives in `@fund-my-cause/components` so the pulse
 * animation and styling stay consistent across the app (Issue #1669).
 */

import {
  Skeleton,
  SkeletonCard,
  SkeletonList,
  SkeletonText,
} from "@fund-my-cause/components";

export default function StatusLoading() {
  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ marginBottom: "30px" }}>
        <Skeleton width="300px" height="32px" style={{ marginBottom: "10px" }} />
        <Skeleton width="500px" height="20px" />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      <div style={{ marginTop: "30px" }}>
        <Skeleton width="200px" height="28px" style={{ marginBottom: "15px" }} />
        <SkeletonList rows={5} />
      </div>
    </div>
  );
}
