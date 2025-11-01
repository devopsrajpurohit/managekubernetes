---
title: Troubleshooting Kubernetes Pods in Evicted State
description: Complete guide to understanding and fixing evicted pods, including resource pressure, disk space issues, and node maintenance scenarios.
date: 2024-12-20
category: Troubleshooting
image: /images/blog-evicted.svg
---

![Troubleshooting Kubernetes Pods in Evicted State](/images/blog-evicted.svg)

# Troubleshooting Kubernetes Pods in Evicted State

A pod in the **Evicted** state means that the Kubernetes node forcibly terminated and removed the pod from the node. This occurs when the node faces resource pressure, usually due to low memory, disk space, or node-level problems. The kubelet evicts pods to free up resources for system stability.

Unlike CrashLoopBackOff or Error states, evicted pods cannot restart automatically. You'll need to recreate them manually or rely on a higher-level controller (Deployment, ReplicaSet, DaemonSet) to restore them.

You can identify this state using:

```bash
kubectl get pods

NAME              READY   STATUS    RESTARTS   AGE
api-pod           0/1     Evicted   0          10m
```

## Impact of Evicted State

When a pod is evicted, it is terminated permanently on that node.

**Consequences**:
- The pod and its data (if not backed by persistent storage) are lost
- The application may experience downtime until the controller reschedules a new pod
- Jobs or batch workloads may fail if not retried automatically
- Critical services running without redundancy may become unavailable

**Bottom line**: An evicted pod means the node was under stress, so Kubernetes decided to remove workloads to protect system health.

## Common Causes and Solutions

### 1. Memory Pressure

**Symptom**: Node ran out of memory; kubelet evicted low-priority pods to reclaim resources.

**Diagnosis**:
```bash
kubectl describe pod <pod-name> | grep -i "evicted\|memory"
kubectl top nodes
kubectl get nodes -o custom-columns=NAME:.metadata.name,MEMORY:.status.capacity.memory
```

**Solutions**:
- Free up node memory by removing unnecessary pods
- Increase memory limits for pods that need more
- Add more nodes to the cluster
- Increase node memory capacity
- Adjust eviction thresholds in kubelet configuration

### 2. Disk Pressure

**Symptom**: Disk usage exceeded thresholds (configured in `--eviction-hard` settings).

**Diagnosis**:
```bash
kubectl describe pod <pod-name> | grep -i "disk\|evicted"
kubectl get nodes -o jsonpath='{.items[*].status.conditions[?(@.type=="DiskPressure")]}'
df -h  # On the node
```

**Solutions**:
- Clean up unused container images: `docker system prune -a` or `crictl rmi --prune`
- Remove old logs and temporary files
- Increase disk space on nodes
- Clean up unused PersistentVolumes
- Adjust eviction thresholds
- Use image garbage collection policies

### 3. CPU or Ephemeral Storage Pressure

**Symptom**: Node experienced high CPU or ephemeral storage usage.

**Diagnosis**:
```bash
kubectl top nodes
kubectl describe node <node-name> | grep -i "pressure"
```

**Solutions**:
- Scale down resource-intensive pods
- Distribute workloads across more nodes
- Increase node resources
- Implement resource quotas to prevent resource exhaustion

### 4. Node Maintenance

**Symptom**: Admin used `kubectl drain` or `kubectl cordon` for upgrades or maintenance.

**Diagnosis**:
```bash
kubectl get nodes
kubectl describe node <node-name> | grep -i "cordon\|drain\|unschedulable"
```

**Solutions**:
- Wait for maintenance to complete
- Uncordon node: `kubectl uncordon <node-name>`
- Pods should be rescheduled automatically by controllers
- Plan maintenance during low-traffic periods

### 5. Pod Priority Preemption

**Symptom**: Higher-priority workloads preempted the pod.

**Diagnosis**:
```bash
kubectl get pod <pod-name> -o jsonpath='{.spec.priority}'
kubectl get priorityclass
```

**Solutions**:
- Increase pod priority if it's critical
- Create PriorityClass with appropriate priority value
- Ensure critical pods have higher priority than non-critical ones

### 6. Volume Issues

**Symptom**: Pod's volume ran out of space.

**Diagnosis**:
```bash
kubectl describe pod <pod-name> | grep -A 10 "Volumes:"
kubectl get pvc
```

**Solutions**:
- Increase PersistentVolume size
- Clean up data in volumes
- Use volume expansion feature
- Monitor volume usage proactively

## Step-by-Step Troubleshooting

### Step 1: Check Eviction Reason

```bash
kubectl describe pod <pod-name>
# Look for:
# Reason:       Evicted
# Message:     The node was low on resource: memory
```

### Step 2: Check Node Resources

```bash
kubectl top nodes
kubectl describe node <node-name>
# Check for pressure conditions (MemoryPressure, DiskPressure)
```

### Step 3: Check Node Events

```bash
kubectl get events --field-selector involvedObject.name=<node-name> --sort-by='.lastTimestamp'
```

### Step 4: Verify Controller Will Recreate

```bash
kubectl get deployment,replicaset -o wide
# Deployment/ReplicaSet will recreate the pod
```

### Step 5: Clean Up Evicted Pods

```bash
# List all evicted pods
kubectl get pods --all-namespaces --field-selector=status.phase=Failed

# Delete evicted pods (controllers will recreate)
kubectl delete pod <evicted-pod-name>
```

## Quick Fixes

### Immediate Actions

1. **Delete evicted pod** (controller will recreate):
   ```bash
   kubectl delete pod <evicted-pod-name>
   ```

2. **Clean up node resources**:
   ```bash
   # On the node
   docker system prune -a  # For Docker
   crictl rmi --prune      # For containerd
   ```

3. **Add more nodes**: Quickly scale cluster to reduce resource pressure

4. **Increase node resources**: Upgrade node instance types if using cloud

### Long-term Solutions

1. **Configure eviction thresholds**:
   ```yaml
   # kubelet config
   evictionHard:
     memory.available: "500Mi"
     nodefs.available: "10%"
     imagefs.available: "15%"
   ```

2. **Implement resource requests and limits**:
   ```yaml
   resources:
     requests:
       memory: "256Mi"
       cpu: "250m"
     limits:
       memory: "512Mi"
       cpu: "500m"
   ```

3. **Use pod priority classes**:
   ```yaml
   apiVersion: scheduling.k8s.io/v1
   kind: PriorityClass
   metadata:
     name: high-priority
   value: 1000
   ```

4. **Monitor and alert**: Set up monitoring for node resource usage

## Preventing Pod Evictions

1. **Right-size resources**: Set appropriate requests and limits
2. **Monitor cluster capacity**: Track resource usage trends
3. **Implement horizontal autoscaling**: Scale pods before resource exhaustion
4. **Use resource quotas**: Prevent any namespace from consuming all resources
5. **Regular cleanup**: Clean unused images, volumes, and logs
6. **Capacity planning**: Add nodes before reaching capacity
7. **Use pod disruption budgets**: Protect critical pods from eviction

## Eviction Policies

### Soft Eviction

Gradually evict pods with grace period:

```yaml
evictionSoft:
  memory.available: "1Gi"
evictionSoftGracePeriod:
  memory.available: "30s"
```

### Hard Eviction

Immediate eviction when threshold reached:

```yaml
evictionHard:
  memory.available: "500Mi"
  nodefs.available: "10%"
```

## Related Resources

- [Check Cluster Health](/ops/check-cluster-health)
- [Monitor Pods & Resources](/ops/monitor-pods)
- [Troubleshooting Pending Pods](/blog/troubleshooting-pods-pending-state)
- [Troubleshooting OOM Killed Pods](/blog/troubleshooting-pods-oom-killed)

## Conclusion

Pod evictions are typically caused by node resource pressure (memory, disk, CPU). Once a pod is evicted, it needs to be recreated by its controller. Focus on preventing evictions by monitoring node resources, right-sizing pods, and maintaining adequate cluster capacity.

Remember: Evicted pods are permanently removed from the node and must be recreated. Always have controllers (Deployments, ReplicaSets) managing your pods for automatic recovery.

