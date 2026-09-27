$env:PATH += ";C:\Program Files\Git\bin"
Set-Location "C:\Users\USER\Documents\Fund-My-Cause"

git add -f apps/interface/src/lib/rate-limit/rate-limiter.ts
git add -f apps/interface/src/lib/rate-limit/middleware.ts
git add -f apps/interface/src/lib/rate-limit/metrics.ts
git add -f apps/interface/src/app/api/rate-limit/metrics/route.ts
git diff --cached --stat
