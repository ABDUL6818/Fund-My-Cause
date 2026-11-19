/**
 * Loading skeleton for profile route segment — Issue #1285
 *
 * Displays while profile data is being fetched. Built from the shared
 * skeleton primitives in @fund-my-cause/components so the pulse animation
 * and styling live in one place (Issue #1669).
 */

import { Skeleton, SkeletonText } from "@fund-my-cause/components";

export default function ProfileLoading() {
  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "30px" }}>
        <Skeleton
          variant="circular"
          width={120}
          height={120}
          style={{ margin: "0 auto 20px" }}
        />
        <Skeleton
          width={300}
          height={28}
          style={{ margin: "0 auto 10px" }}
        />
        <Skeleton width={200} height={16} style={{ margin: "0 auto" }} />
      </div>

      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{ marginBottom: "20px" }}>
          <div
            style={{
              backgroundColor: "#f5f5f5",
              padding: "16px",
              borderRadius: "8px",
            }}
          >
            <Skeleton
              width="100%"
              height={20}
              style={{ marginBottom: "12px" }}
            />
            <SkeletonText lines={2} height={20} />
          </div>
        </div>
      ))}
    </div>
  );
}
