---
title: Check Cluster Health
description: Read node conditions, component status, and kubelet health in minutes.
---

# Check Cluster Health

Regularly checking your Kubernetes cluster health helps you catch issues before they impact your applications. This guide shows you how to quickly assess the overall health of your cluster.

## Quick Health Check

### 1. Check Node Status

```bash
# List all nodes and their status
kubectl get nodes

# Detailed node information
kubectl get nodes -o wide

# Describe a specific node
kubectl describe node <node-name>
```

**What to Look For:**
- Status should be `Ready`
- All nodes should be in `Ready` state
- Check age - recently created nodes might still be initializing

**Example Output:**
```
NAME           STATUS   ROLES           AGE   VERSION
control-plane  Ready    control-plane   30d   v1.28.0
worker-1       Ready    <none>          30d   v1.28.0
worker-2       Ready    <none>          30d   v1.28.0
```

### 2. Check Node Conditions

Node conditions provide detailed health information:

```bash
# View node conditions
kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{range .status.conditions[*]}{.type}{"="}{.status}{"\t"}{end}{"\n"}{end}'
```

**Key Conditions:**
- **Ready**: Node is healthy and ready to accept pods (`True` = good)
- **MemoryPressure**: Node has insufficient memory (`False` = good)
- **DiskPressure**: Node has insufficient disk space (`False` = good)
- **PIDPressure**: Node has insufficient process IDs (`False` = good)
- **NetworkUnavailable**: Node network is not configured (`False` = good)

**Using describe for detailed conditions:**
```bash
kubectl describe node <node-name>
```

Look for the Conditions section:
```
Conditions:
  Type                 Status  Reason                       Message
  ----                 ------  ------                       -------
  NetworkUnavailable   False   FlannelIsUp                  Flannel is running on this node
  MemoryPressure       False   KubeletHasSufficientMemory   kubelet has sufficient memory available
  DiskPressure         False   KubeletHasSufficientDisk     kubelet has sufficient disk space available
  PIDPressure          False   KubeletHasSufficientPID      kubelet has sufficient PID available
  Ready                True    KubeletReady                  kubelet is posting ready status
```

### 3. Check Control Plane Components

```bash
# Check component statuses (legacy command)
kubectl get componentstatuses

# Check control plane pods
kubectl get pods -n kube-system

# Check API server health
kubectl get --raw /healthz

# Check API server readiness
kubectl get --raw /readyz
```

**Key Components:**
- **kube-apiserver**: API server pods should be running
- **kube-controller-manager**: Controller manager should be running
- **kube-scheduler**: Scheduler should be running
- **etcd**: etcd pods should be running (if self-hosted)

**Example:**
```bash
kubectl get pods -n kube-system | grep -E "kube-apiserver|kube-controller|kube-scheduler|etcd"
```

### 4. Check kubelet Health

```bash
# Check kubelet status on a node
# SSH to node or use kubectl exec if you have access
systemctl status kubelet

# Check kubelet logs (on the node)
journalctl -u kubelet -n 50

# Check kubelet service (from cluster)
# View node status for kubelet conditions
kubectl describe node <node-name> | grep -A 5 "KubeletReady"
```

**What to Check:**
- kubelet service should be active and running
- No frequent restarts
- Logs should show successful node heartbeat

### 5. Check Pod Distribution

```bash
# Check pods per node
kubectl get pods -o wide --all-namespaces | awk '{print $7}' | sort | uniq -c

# See pods that can't be scheduled
kubectl get pods --all-namespaces --field-selector=status.phase=Pending

# Check for CrashLoopBackOff pods
kubectl get pods --all-namespaces | grep CrashLoopBackOff
```

### 6. Check Resource Usage

```bash
# Node resource usage (requires metrics-server)
kubectl top nodes

# Pod resource usage
kubectl top pods --all-namespaces

# Node capacity vs allocatable
kubectl describe node <node-name> | grep -A 5 "Capacity\|Allocatable"
```

## Comprehensive Health Check Script

Create a simple script to check everything:

```bash
#!/bin/bash

echo "=== Node Status ==="
kubectl get nodes

echo -e "\n=== Node Conditions ==="
for node in $(kubectl get nodes -o name); do
  echo "$node:"
  kubectl get $node -o jsonpath='{range .status.conditions[*]}{.type}={.status} {end}' && echo
done

echo -e "\n=== Control Plane Pods ==="
kubectl get pods -n kube-system | grep -E "kube-apiserver|kube-controller|kube-scheduler|etcd"

echo -e "\n=== API Server Health ==="
kubectl get --raw /healthz && echo " OK" || echo " FAILED"

echo -e "\n=== Pending Pods ==="
kubectl get pods --all-namespaces --field-selector=status.phase=Pending

echo -e "\n=== CrashLoopBackOff Pods ==="
kubectl get pods --all-namespaces | grep CrashLoopBackOff || echo "None"

echo -e "\n=== Node Resource Usage ==="
kubectl top nodes 2>/dev/null || echo "metrics-server not available"
```

## Common Issues and Solutions

### Node NotReady

**Symptoms:**
```
NAME      STATUS     ROLES    AGE   VERSION
node-1    NotReady   <none>   5d    v1.28.0
```

**Check:**
```bash
kubectl describe node node-1
# Look for:
# - Network issues
# - kubelet not running
# - Resource pressure
```

**Solutions:**
1. Check kubelet service: `systemctl status kubelet`
2. Check network connectivity
3. Check resource pressure (memory, disk)
4. Review kubelet logs

### Memory/Disk Pressure

**Symptoms:**
- Node condition shows `MemoryPressure=True` or `DiskPressure=True`
- Pods can't be scheduled
- Existing pods might be evicted

**Check:**
```bash
kubectl describe node <node-name> | grep -A 2 "Pressure"
```

**Solutions:**
1. Free up disk space
2. Add more memory or nodes
3. Clean up unused images: `docker system prune` (if using Docker)
4. Remove unused volumes

### Control Plane Issues

**Symptoms:**
- API server not responding
- `kubectl` commands fail
- Components showing as unavailable

**Check:**
```bash
kubectl get pods -n kube-system
kubectl logs -n kube-system kube-apiserver-<node>
```

**Solutions:**
1. Restart control plane components
2. Check etcd health (if self-hosted)
3. Verify network connectivity between components
4. Check logs for errors

### High Resource Usage

**Symptoms:**
- Node showing high CPU/memory usage
- Pods being throttled
- Slow application performance

**Check:**
```bash
kubectl top nodes
kubectl top pods --all-namespaces --sort-by=cpu
```

**Solutions:**
1. Identify resource-heavy pods
2. Add resource limits to pods
3. Scale cluster horizontally
4. Optimize application resource usage

## Regular Health Check Schedule

**Daily:**
- Quick node status check
- Pending/CrashLoopBackOff pods

**Weekly:**
- Full cluster health check
- Resource usage review
- Control plane component status

**Monthly:**
- Capacity planning review
- Node condition deep dive
- Historical trend analysis

## Monitoring Tools

While manual checks are important, consider setting up:

1. **Prometheus + Grafana**: Comprehensive metrics and alerting
2. **kubectl-who-can**: Audit permissions
3. **kube-score**: Static analysis of YAML files
4. **Popeye**: Kubernetes cluster sanitizer

## Key Takeaways

1. **Check nodes first** - They're the foundation of your cluster
2. **Monitor conditions** - They provide early warning signs
3. **Watch control plane** - If it's unhealthy, nothing works
4. **Track resource usage** - Prevent capacity issues
5. **Automate checks** - Regular automated health checks catch issues early

A healthy cluster is the foundation for reliable applications. Regular health checks help you catch and fix issues before they impact your users!
