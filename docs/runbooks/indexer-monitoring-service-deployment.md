# Deployment Runbook: Indexer & Monitoring Service

## Overview

This runbook provides procedures for restarting, redeploying, and troubleshooting the `services/indexer` and `services/monitoring-service` during incidents.

**Last Updated**: 2026-09-24  
**Maintained By**: Infrastructure Team  
**Escalation Contact**: See [Escalation](#escalation)

---

## Quick Reference

| Service | Health Check | Restart | Status | Logs |
|---------|--------------|---------|--------|------|
| **Indexer** | `/health` (9001) | `kubectl rollout restart deployment/indexer` | `kubectl get deployment/indexer` | `kubectl logs -f deployment/indexer` |
| **Monitoring** | `/health` (8080) | `kubectl rollout restart deployment/monitoring-service` | `kubectl get deployment/monitoring-service` | `kubectl logs -f deployment/monitoring-service` |

---

## Prerequisites

Before proceeding, ensure you have:

- `kubectl` configured with access to the production cluster
- Appropriate permissions to deploy and restart services
- Access to the relevant Slack channels (#incidents, #infrastructure)
- A terminal with bash shell
- Familiarity with Kubernetes commands

**Verification**:
```bash
kubectl cluster-info
kubectl auth can-i create deployments --namespace=production
```

---

## Service: Indexer

### Health Check

**Endpoint**: `http://<indexer-host>:9001/health`

**Expected Response**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": "2h30m",
  "lastSync": "2026-09-24T15:45:00Z"
}
```

**Check Command**:
```bash
kubectl exec -it deployment/indexer -- curl http://localhost:9001/health
# or
curl http://<indexer-lb>:9001/health
```

### Restart Procedure

#### 1. Graceful Restart (Recommended)

```bash
# Initiate rolling restart - maintains 1 replica at all times
kubectl rollout restart deployment/indexer -n production

# Monitor progress
kubectl rollout status deployment/indexer -n production --timeout=5m
```

**Expected Behavior**:
- Pods terminate gracefully (30-60 seconds)
- New pods start
- Readiness probe passes
- Service continues without downtime

#### 2. Hard Restart (Emergency)

```bash
# Scale down
kubectl scale deployment/indexer --replicas=0 -n production

# Wait 10 seconds
sleep 10

# Scale up
kubectl scale deployment/indexer --replicas=3 -n production

# Verify
kubectl get pods -l app=indexer -n production
```

### Environment Variables Required

Source: `services/indexer/.env.example`

```bash
# Database
DATABASE_URL="postgresql://user:password@db-host:5432/indexer_db"
DATABASE_POOL_SIZE=20
DATABASE_TIMEOUT_MS=30000

# Soroban RPC
SOROBAN_RPC_URL="https://rpc.soroban.mainnet.stellar.org"
SOROBAN_RPC_TIMEOUT_MS=10000
SOROBAN_MAX_RETRIES=3

# Ledger Indexing
LEDGER_SYNC_INTERVAL_MS=5000
LEDGER_BATCH_SIZE=100
LEDGER_START_SEQUENCE=500000

# Server
PORT=9001
LOG_LEVEL=info
NODE_ENV=production

# Metrics
METRICS_ENABLED=true
METRICS_PORT=9090
```

### Rollback Procedure

```bash
# Check rollout history
kubectl rollout history deployment/indexer -n production

# Rollback to previous version
kubectl rollout undo deployment/indexer -n production

# Rollback to specific revision
kubectl rollout undo deployment/indexer --to-revision=5 -n production

# Verify rollback
kubectl rollout status deployment/indexer -n production
```

### Monitoring During Restart

```bash
# Watch logs in real-time
kubectl logs -f deployment/indexer -n production --all-containers=true

# Check pod status
watch kubectl get pods -l app=indexer -n production

# Monitor resource usage
kubectl top pods -l app=indexer -n production
```

---

## Service: Monitoring Service

### Health Check

**Endpoint**: `http://<monitoring-host>:8080/health`

**Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-09-24T15:45:00Z",
  "uptime": "5d2h",
  "metrics_collected": 150000
}
```

**Check Command**:
```bash
kubectl exec -it deployment/monitoring-service -- curl http://localhost:8080/health
# or
curl http://<monitoring-lb>:8080/health
```

### Restart Procedure

#### 1. Graceful Restart (Recommended)

```bash
# Initiate rolling restart
kubectl rollout restart deployment/monitoring-service -n production

# Monitor progress
kubectl rollout status deployment/monitoring-service -n production --timeout=5m
```

#### 2. Hard Restart (Emergency)

```bash
# Scale down
kubectl scale deployment/monitoring-service --replicas=0 -n production

# Wait 10 seconds
sleep 10

# Scale up
kubectl scale deployment/monitoring-service --replicas=2 -n production

# Verify
kubectl get pods -l app=monitoring-service -n production
```

### Environment Variables Required

Source: `services/monitoring-service/.env.example`

```bash
# API Configuration
PORT=8080
API_TIMEOUT_MS=30000
API_RATE_LIMIT_PER_MIN=10000

# Prometheus/Metrics
PROMETHEUS_SCRAPE_INTERVAL=30s
PROMETHEUS_RETENTION=15d
METRICS_ENABLED=true

# Database
METRICS_DB_URL="postgresql://user:password@db-host:5432/monitoring_db"
METRICS_DB_POOL_SIZE=15

# Alert Configuration
ALERT_ENABLED=true
ALERT_WEBHOOK_URL="https://alerts.example.com/webhook"
ALERT_TIMEOUT_MS=5000

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Server
NODE_ENV=production
DEBUG=false
```

### Rollback Procedure

```bash
# Check rollout history
kubectl rollout history deployment/monitoring-service -n production

# Rollback to previous version
kubectl rollout undo deployment/monitoring-service -n production

# Verify rollback
kubectl rollout status deployment/monitoring-service -n production
```

### Monitoring During Restart

```bash
# Watch logs
kubectl logs -f deployment/monitoring-service -n production

# Check pod status
watch kubectl get pods -l app=monitoring-service -n production

# Verify service endpoints
kubectl get svc monitoring-service -n production
```

---

## Troubleshooting

### Pods Not Starting

```bash
# Describe pod for detailed error
kubectl describe pod <pod-name> -n production

# Check resource constraints
kubectl top nodes
kubectl top pods -n production

# View init container logs
kubectl logs <pod-name> -c init-container -n production
```

### Connectivity Issues

```bash
# Test service connectivity
kubectl run -it debug --image=curl --restart=Never -- \
  curl http://indexer:9001/health

# Check DNS resolution
kubectl exec -it <pod-name> -- nslookup indexer
kubectl exec -it <pod-name> -- nslookup monitoring-service

# Verify network policies
kubectl get networkpolicy -n production
```

### High CPU/Memory Usage

```bash
# Check resource limits
kubectl describe deployment/indexer -n production | grep -A 5 "Limits"

# Adjust if needed
kubectl set resources deployment/indexer \
  --limits=cpu=2000m,memory=2Gi \
  --requests=cpu=1000m,memory=1Gi \
  -n production

# Monitor again
watch kubectl top pods -l app=indexer -n production
```

### Stuck in CrashLoopBackOff

```bash
# Check logs
kubectl logs <pod-name> --tail=100 -n production

# If due to database connection, verify:
kubectl exec -it <pod-name> -- \
  psql -h $DATABASE_URL -c "SELECT 1;"

# If due to RPC endpoint:
kubectl exec -it <pod-name> -- \
  curl https://rpc.soroban.mainnet.stellar.org/
```

---

## Deployment Process

### Blue-Green Deployment

```bash
# Current version is "blue", deploying new "green"
kubectl apply -f services/indexer/k8s/deployment-green.yaml

# After verification, switch traffic
kubectl patch service indexer -p '{"spec":{"selector":{"version":"green"}}}'

# Scale down old version
kubectl scale deployment/indexer-blue --replicas=0
```

### Canary Deployment

```bash
# Deploy to 1 replica with new version
kubectl set image deployment/indexer \
  indexer=registry.io/indexer:v1.1.0 \
  --record -n production

# Monitor metrics
kubectl top pods -l app=indexer -n production

# Complete rollout after 5 minutes of stability
kubectl rollout status deployment/indexer -n production
```

---

## Verification Checklist

### Post-Restart Verification

- [ ] Pods are in Running state: `kubectl get pods -l app=indexer`
- [ ] Health check passes: `curl http://<service>:port/health`
- [ ] No error logs: `kubectl logs deployment/indexer --tail=50`
- [ ] Metrics being collected: Check Prometheus dashboard
- [ ] Performance stable: `kubectl top pods -l app=indexer`
- [ ] Database connectivity OK: Check application metrics
- [ ] Alert status clear: Check monitoring alerts

### Application-Specific Checks

**Indexer**:
- [ ] Latest ledger is being indexed
- [ ] Sync lag is < 1 minute
- [ ] No database connection errors
- [ ] RPC endpoint responding

**Monitoring Service**:
- [ ] Metrics scraped successfully
- [ ] Alert evaluation running
- [ ] Dashboard loading correctly
- [ ] No Prometheus scrape failures

---

## Escalation

### Support Chain

1. **On-Call Infrastructure** (15 min response)
   - Slack: @infrastructure-oncall
   - PagerDuty: Infrastructure Team

2. **Service Owners** (30 min response)
   - Indexer: indexer-team@company.com
   - Monitoring: platform-team@company.com

3. **Engineering Manager** (1 hour response)
   - Slack: @eng-manager

### Severity Levels

| Level | Response | Action |
|-------|----------|--------|
| **SEV-1** | Immediate | All hands, CEO notified |
| **SEV-2** | 15 minutes | Team mobilized |
| **SEV-3** | 1 hour | Standard incident |
| **SEV-4** | Next business day | Low priority |

### Incident Communication

1. **Initial**: Post to #incidents with brief description
2. **Updates**: Every 5 minutes during SEV-1/2
3. **Resolution**: Document in incident system with timeline

---

## Cross-Links

- **Deployment Manifests**: See `k8s/` directory
- **Application Configuration**: See service `.env.example` files
- **Monitoring Dashboards**: https://grafana.internal/d/indexer
- **Incident Playbook**: See [Incident Response Guide](../incident-response.md)
- **Related Issues**: #1274

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-09-24 | 1.0 | Initial runbook creation |

## Approvals

- [ ] Infrastructure Lead
- [ ] On-Call Manager
- [ ] Service Owner
