---
title: Monitor Pods & Resources
description: Monitor Kubernetes pods effectively. Track CPU, memory, restarts, and throttling. Learn what metrics matter and how to optimize your K8s resources.
---

# Monitor Pods & Resources

Monitoring your pods is essential for maintaining application reliability. Understanding what to watch and why helps you catch issues early and optimize resource usage.

## What to Monitor

### 1. Resource Usage (CPU & Memory)

**Why it matters:**
- Prevents resource exhaustion
- Identifies memory leaks
- Ensures proper resource allocation
- Detects performance bottlenecks

**How to check:**
```bash
# Current resource usage
kubectl top pods

# Per namespace
kubectl top pods -n production

# All namespaces
kubectl top pods --all-namespaces

# Sorted by CPU
kubectl top pods --sort-by=cpu

# Sorted by memory
kubectl top pods --sort-by=memory

# Specific pod
kubectl top pod <pod-name>
```

**What to look for:**
- Pods using close to their limits
- Pods with consistently high CPU (potential infinite loops)
- Memory usage trending upward (possible leaks)
- Pods with zero resource usage (might be idle)

### 2. Restart Count

**Why it matters:**
- Indicates application instability
- Shows if health checks are failing
- Highlights configuration issues
- Reveals resource constraint problems

**How to check:**
```bash
# Pods with restarts
kubectl get pods

# Filter pods with restarts
kubectl get pods --all-namespaces | awk '$4>0 {print}'

# Watch restarts in real-time
kubectl get pods -w

# Describe to see restart reason
kubectl describe pod <pod-name>
```

**What to look for:**
- Restart count increasing (investigate immediately)
- Recent restarts (check events and logs)
- CrashLoopBackOff status
- RestartLoopOff status

**Common causes:**
- Application crashes
- Failed liveness probes
- Out of memory (OOMKilled)
- Configuration errors
- Missing dependencies

### 3. Container State

**Why it matters:**
- Shows current pod health
- Identifies stuck containers
- Reveals startup issues
- Highlights readiness problems

**How to check:**
```bash
# Get pod status
kubectl get pods

# Detailed state information
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.containerStatuses[*].state}{"\n"}{end}'

# Describe for detailed state
kubectl describe pod <pod-name>
```

**States to watch:**
- **Running**: Normal operation
- **Waiting**: Container waiting to start (check reason)
- **Terminated**: Container stopped (check exit code)
- **CrashLoopBackOff**: Container repeatedly crashing
- **ImagePullBackOff**: Can't pull container image
- **ErrImagePull**: Image pull failed

### 4. CPU Throttling

**Why it matters:**
- Indicates CPU limits are too low
- Causes application slowdowns
- Leads to poor user experience
- Shows resource planning issues

**How to check:**
```bash
# Check if metrics-server shows throttling (advanced)
# Requires prometheus or similar

# Check CPU limits
kubectl describe pod <pod-name> | grep -A 2 "Limits"

# Compare requests vs limits
kubectl get pod <pod-name> -o jsonpath='{.spec.containers[*].resources}'
```

**What to look for:**
- Pods with CPU usage at limit (being throttled)
- High latency during high CPU usage
- Application timeouts
- Request/limit mismatches

**Signs of throttling:**
- CPU usage hitting the limit
- Slow response times under load
- Requests timing out

### 5. Memory Pressure

**Why it matters:**
- Can cause OOMKilled errors
- Leads to pod evictions
- Causes application instability
- Affects overall cluster health

**How to check:**
```bash
# Memory usage
kubectl top pods --sort-by=memory

# Memory requests and limits
kubectl describe pod <pod-name> | grep -A 5 "Requests\|Limits"

# Check for OOMKilled
kubectl get pod <pod-name> -o jsonpath='{.status.containerStatuses[*].lastState.terminated.reason}'
```

**What to look for:**
- Memory usage approaching limits
- OOMKilled in events
- Pods being evicted
- Memory spikes

## Monitoring Commands Cheat Sheet

### Basic Monitoring

```bash
# All pods with resource usage
kubectl top pods --all-namespaces

# Pods by status
kubectl get pods --all-namespaces --field-selector=status.phase=Running
kubectl get pods --all-namespaces --field-selector=status.phase=Pending
kubectl get pods --all-namespaces --field-selector=status.phase=Failed

# Watch pods in real-time
kubectl get pods -w --all-namespaces
```

### Detailed Analysis

```bash
# Pod with restarts
kubectl get pods --all-namespaces -o wide | grep -v "0/"

# Pods in CrashLoopBackOff
kubectl get pods --all-namespaces | grep CrashLoopBackOff

# Pods not ready
kubectl get pods --all-namespaces --field-selector=status.phase!=Running,status.phase!=Succeeded

# Resource requests vs usage
kubectl top pods --all-namespaces && kubectl get pods --all-namespaces -o json | jq '.items[] | {name: .metadata.name, requests: .spec.containers[].resources.requests, limits: .spec.containers[].resources.limits}'
```

### Event Monitoring

```bash
# Recent events
kubectl get events --all-namespaces --sort-by='.lastTimestamp' | tail -20

# Events for specific pod
kubectl get events --field-selector involvedObject.name=<pod-name>

# Warning events only
kubectl get events --all-namespaces --field-selector type=Warning
```

## Setting Up Resource Requests and Limits

### Why They Matter

**Requests:**
- Reserve resources for the pod
- Used by scheduler to place pods
- Guaranteed minimum resources

**Limits:**
- Maximum resources pod can use
- Prevents one pod from consuming all resources
- Triggers throttling/OOMKilled when exceeded

### Example Configuration

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app
spec:
  containers:
  - name: app
    image: my-app:latest
    resources:
      requests:
        memory: "128Mi"
        cpu: "100m"
      limits:
        memory: "256Mi"
        cpu: "200m"
```

### Right-Sizing Resources

**Process:**
1. Deploy without limits initially
2. Monitor actual usage over time
3. Set requests to average usage
4. Set limits to peak usage + buffer (20-30%)
5. Monitor and adjust

```bash
# Monitor current usage
kubectl top pods --containers

# Check what's currently set
kubectl describe pod <pod-name> | grep -A 4 "Requests\|Limits"
```

## Identifying Common Issues

### High Restart Count

**Check:**
```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name> --previous
kubectl get events --field-selector involvedObject.name=<pod-name>
```

**Common causes:**
- Liveness probe too aggressive
- Application crash on startup
- Out of memory
- Missing configuration

### CPU Throttling

**Symptoms:**
- Slow response times
- Timeouts under load
- High latency

**Solution:**
```yaml
resources:
  limits:
    cpu: "500m"  # Increase limit
```

### Memory Leaks

**Symptoms:**
- Memory usage gradually increasing
- Pods eventually OOMKilled
- Restarts don't help

**Investigation:**
```bash
# Monitor memory over time
watch -n 5 'kubectl top pod <pod-name>'

# Check for memory leaks in application logs
kubectl logs <pod-name> | grep -i memory
```

### Resource Starvation

**Symptoms:**
- Pods in Pending state
- "Insufficient cpu" or "Insufficient memory" events
- Pods can't be scheduled

**Check:**
```bash
kubectl describe node <node-name>
kubectl top nodes
kubectl get pods --all-namespaces --field-selector=status.phase=Pending
```

## Best Practices

### 1. Always Set Resource Limits

```yaml
resources:
  requests:
    memory: "64Mi"
    cpu: "100m"
  limits:
    memory: "128Mi"
    cpu: "200m"
```

### 2. Monitor Continuously

Set up alerts for:
- Restart count > 3 in 5 minutes
- CPU usage > 80% of limit
- Memory usage > 90% of limit
- Pods not ready for > 5 minutes

### 3. Use HorizontalPodAutoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### 4. Regular Review

- Weekly resource usage review
- Monthly right-sizing exercise
- Quarterly capacity planning

## Monitoring Tools

### Built-in (kubectl)

- `kubectl top`: Basic resource usage
- `kubectl get pods`: Status and restarts
- `kubectl describe`: Detailed information
- `kubectl logs`: Application logs
- `kubectl get events`: Cluster events

### Recommended Tools

1. **Prometheus + Grafana**: Metrics and dashboards
2. **Datadog**: Full observability platform
3. **New Relic**: APM and infrastructure monitoring
4. **kubectl-cost**: Cost analysis

## Key Metrics Summary

| Metric | Why Watch | What to Do |
|--------|-----------|------------|
| **CPU Usage** | Throttling, performance | Increase limits if hitting ceiling |
| **Memory Usage** | OOMKilled, evictions | Investigate leaks, adjust limits |
| **Restart Count** | Stability issues | Check logs, fix root cause |
| **Container State** | Health status | Investigate non-running states |
| **Resource Limits** | Capacity planning | Right-size based on usage |

## Quick Health Check Script

```bash
#!/bin/bash

echo "=== Resource Usage ==="
kubectl top pods --all-namespaces 2>/dev/null || echo "metrics-server not available"

echo -e "\n=== Pods with Restarts ==="
kubectl get pods --all-namespaces | awk 'NR==1 || $4>0'

echo -e "\n=== Problem Pods ==="
kubectl get pods --all-namespaces | grep -E "CrashLoopBackOff|Error|ImagePullBackOff"

echo -e "\n=== Pending Pods ==="
kubectl get pods --all-namespaces --field-selector=status.phase=Pending
```

Monitoring pods proactively helps you maintain reliable applications and catch issues before they impact users!
