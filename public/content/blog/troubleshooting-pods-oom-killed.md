---
title: Troubleshooting Kubernetes Pods Killed by OOM (Out of Memory)
description: Fix Kubernetes OOMKilled pods. Diagnose out-of-memory errors, configure memory limits correctly, and optimize resource usage. Prevent pod terminations with proper memory management.
date: 2024-12-19
category: Troubleshooting
image: /images/blog-oom-killed.svg
---

![Troubleshooting Kubernetes Pods Killed by OOM](/images/blog-oom-killed.svg)

# Troubleshooting Kubernetes Pods Killed by OOM (Out of Memory)

When a pod container in Kubernetes enters the **OOMKilled** state, it means the kernel's Out-Of-Memory (OOM) killer terminated the container because it exceeded its memory limits. This is a runtime failure - the container started successfully but used more memory than allowed.

You can identify this state using:

```bash
kubectl get pods

NAME               READY   STATUS      RESTARTS   AGE
my-app-pod         0/1     OOMKilled   3          4m
```

Confirm with:

```bash
kubectl describe pod <pod-name>
# Look for:
# State:          Terminated
# Reason:         OOMKilled
# Exit Code:      137
```

## Impact of OOMKilled State

- Container is terminated abruptly, and Kubernetes may restart it repeatedly
- Application becomes unavailable or behaves unpredictably
- Deployment rollouts may hang due to constant restarts
- Cluster resources are wasted if the pod keeps restarting
- Continuous OOMKills can impact node stability and cause other pods to be evicted

**Bottom line**: OOMKilled means your application needs more memory or is leaking memory and must be tuned or fixed.

## Common Causes and Solutions

### 1. Memory Limit Too Low

**Symptom**: Container's memory limit is lower than what the application actually requires.

**Diagnosis**:
```bash
kubectl describe pod <pod-name> | grep -A 5 "Limits:"
kubectl top pod <pod-name>
```

**Solutions**:
- Increase memory limit in deployment
- Monitor actual memory usage over time
- Set limits based on peak usage, not average
- Consider setting limits 20-30% higher than peak observed usage

### 2. Memory Leaks

**Symptom**: Application gradually consumes all available memory due to poor memory management.

**Diagnosis**:
```bash
kubectl logs <pod-name> | grep -i "memory\|outofmemory\|heap"
kubectl top pod <pod-name> --containers
# Monitor memory usage over time - if it keeps increasing, there's a leak
```

**Solutions**:
- Fix application memory leaks in code
- Implement proper resource cleanup
- Use memory profiling tools (heap analyzers)
- Restart pods periodically if leaks can't be fixed immediately
- Consider implementing memory limits with automatic restarts

### 3. Unexpected Load or Traffic Spikes

**Symptom**: Increased usage causes application to exceed memory allocation.

**Diagnosis**:
```bash
kubectl top pod <pod-name>
kubectl get events --field-selector involvedObject.name=<pod-name> | grep -i oom
```

**Solutions**:
- Increase memory limits for traffic spikes
- Implement horizontal pod autoscaling
- Add memory buffers for peak loads
- Use request throttling to limit memory usage
- Monitor and set alerts for memory usage patterns

### 4. JVM Heap Misconfiguration

**Symptom**: For Java apps, JVM heap settings are too close to container memory limit.

**Diagnosis**:
```bash
kubectl exec <pod-name> -- env | grep -i jvm\|heap\|xmx
kubectl describe pod <pod-name> | grep -i memory
```

**Solutions**:
- Set JVM heap size lower than container memory limit
- Leave headroom for JVM overhead (usually 20-25% of limit)
- Configure `-XX:MaxRAMPercentage` instead of fixed heap sizes
- Example: For 512Mi limit, use max heap of ~384Mi

### 5. Shared Memory or Caching Issues

**Symptom**: In-memory caching, shared memory, or tmpfs volumes consume unaccounted memory.

**Diagnosis**:
```bash
kubectl exec <pod-name> -- df -h
kubectl exec <pod-name> -- cat /proc/meminfo | grep -i shmem
```

**Solutions**:
- Account for tmpfs mounts in memory limits
- Reduce cache sizes in applications
- Use Redis or external cache instead of in-memory
- Monitor `/dev/shm` usage if using shared memory

## Step-by-Step Troubleshooting

### Step 1: Confirm OOMKilled

```bash
kubectl describe pod <pod-name> | grep -A 10 "Last State"
# Should show: Reason: OOMKilled, Exit Code: 137
```

### Step 2: Check Current Memory Usage

```bash
kubectl top pod <pod-name>
kubectl top pod <pod-name> --containers
```

### Step 3: Review Memory Limits

```bash
kubectl get pod <pod-name> -o jsonpath='{.spec.containers[*].resources.limits.memory}'
```

### Step 4: Analyze Memory Patterns

```bash
# Check if memory grows over time (memory leak indicator)
kubectl top pod <pod-name> --containers --containers
# Run this multiple times and observe growth
```

### Step 5: Check Container Logs

```bash
kubectl logs <pod-name>
kubectl logs <pod-name> --previous
# Look for memory-related errors or warnings
```

## Quick Fixes

### Immediate Actions

1. **Increase memory limit temporarily**:
   ```yaml
   resources:
     limits:
       memory: "1Gi"  # Increase from current limit
   ```

2. **Reduce memory pressure**:
   - Scale down other pods on the same node
   - Evict low-priority pods
   - Add more nodes to cluster

3. **Implement restart policy**:
   ```yaml
   restartPolicy: OnFailure  # For jobs
   # Or let deployment handle restarts
   ```

4. **Add memory requests** (if missing):
   ```yaml
   resources:
     requests:
       memory: "256Mi"
     limits:
       memory: "512Mi"
   ```

## Best Practices to Prevent OOMKilled

1. **Set appropriate memory limits**: Based on actual usage patterns, not guesses
2. **Monitor memory usage**: Use tools like Prometheus to track memory over time
3. **Implement memory requests**: Help scheduler make better placement decisions
4. **Fix memory leaks**: Address application bugs causing gradual memory growth
5. **Right-size resources**: Regularly review and adjust limits based on metrics
6. **Use memory-aware languages**: For Java, configure heap properly
7. **Implement graceful degradation**: Reduce functionality under memory pressure
8. **Set up alerts**: Monitor for memory usage approaching limits

## Resource Configuration Examples

### Correct Memory Configuration

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"  # Leave 20-30% buffer above peak usage
    cpu: "500m"
```

### Java Application Configuration

```yaml
env:
- name: JAVA_OPTS
  value: "-Xmx384m -XX:MaxRAMPercentage=75.0"
resources:
  limits:
    memory: "512Mi"  # Heap (384Mi) + overhead (~128Mi)
```

## Related Resources

- [Monitor Pods & Resources](/ops/monitor-pods)
- [Performance & Cost Insights](/ops/cost-optimization)
- [Troubleshooting CrashLoopBackOff Pods](/blog/troubleshooting-pods-crashloopbackoff)
- [Troubleshooting Pending Pods](/blog/troubleshooting-pods-pending-state)

## Conclusion

OOMKilled pods are usually caused by insufficient memory limits, memory leaks, or unexpected load. Start by increasing memory limits temporarily, then investigate the root cause. Monitor memory usage patterns and set limits based on actual peak usage with appropriate buffers.

Remember: Exit code 137 typically indicates OOMKilled (128 + 9, where 9 is SIGKILL).

