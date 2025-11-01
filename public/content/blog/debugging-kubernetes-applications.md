---
title: Debugging Kubernetes Applications: Common Issues and Solutions
description: A comprehensive guide to debugging common issues in Kubernetes applications, with practical troubleshooting tips.
date: 2024-12-05
category: Troubleshooting
---

# Debugging Kubernetes Applications: Common Issues and Solutions

Debugging applications running in Kubernetes can be challenging, but with the right tools and techniques, you can quickly identify and resolve issues. This guide covers common problems and their solutions.

## Common Debugging Scenarios

### Pods Not Starting

**Symptoms**: Pods stuck in `Pending` or `ContainerCreating` state.

**Debugging steps**:

1. Check pod status:
```bash
kubectl describe pod <pod-name>
```

2. Check node resources:
```bash
kubectl top nodes
kubectl describe node <node-name>
```

3. Check events:
```bash
kubectl get events --sort-by='.lastTimestamp'
```

**Common causes**:
- Insufficient node resources
- Image pull errors
- Resource quota limits
- Node selectors not matching

### Pods Crashing or Restarting

**Symptoms**: Pods in `CrashLoopBackOff` state.

**Debugging steps**:

1. Check pod logs:
```bash
kubectl logs <pod-name>
kubectl logs <pod-name> --previous  # Previous container instance
```

2. Execute into the pod:
```bash
kubectl exec -it <pod-name> -- /bin/sh
```

3. Check container exit codes:
```bash
kubectl describe pod <pod-name>
```

**Common causes**:
- Application errors
- Missing environment variables
- Incorrect resource limits
- Health check failures

### Services Not Accessible

**Symptoms**: Can't reach services from other pods or external traffic.

**Debugging steps**:

1. Verify service endpoints:
```bash
kubectl get endpoints <service-name>
```

2. Check service selector:
```bash
kubectl get svc <service-name> -o yaml
```

3. Test connectivity:
```bash
kubectl run -it --rm debug --image=busybox --restart=Never -- wget -O- <service-name>
```

**Common causes**:
- Selector mismatch between service and pods
- Port configuration errors
- Network policies blocking traffic

### Application Performance Issues

**Symptoms**: Slow response times, high latency, resource exhaustion.

**Debugging steps**:

1. Check resource usage:
```bash
kubectl top pods
kubectl top pods --containers
```

2. Analyze metrics:
```bash
kubectl get --raw /apis/metrics.k8s.io/v1beta1/namespaces/<namespace>/pods
```

3. Check for throttling:
```bash
kubectl describe pod <pod-name> | grep -i throttl
```

**Solutions**:
- Increase resource requests and limits
- Optimize application code
- Implement caching strategies
- Use horizontal pod autoscaling

## Essential Debugging Commands

### Get Detailed Pod Information

```bash
kubectl get pod <pod-name> -o yaml
kubectl describe pod <pod-name>
```

### View Logs

```bash
# Current logs
kubectl logs <pod-name>

# Follow logs
kubectl logs -f <pod-name>

# Logs from all containers
kubectl logs <pod-name> --all-containers=true

# Logs from specific container
kubectl logs <pod-name> -c <container-name>
```

### Execute Commands in Pods

```bash
kubectl exec <pod-name> -- <command>
kubectl exec -it <pod-name> -- /bin/bash
```

### Check Events

```bash
kubectl get events --all-namespaces
kubectl get events -n <namespace> --sort-by='.lastTimestamp'
```

### Inspect Resources

```bash
kubectl get all -n <namespace>
kubectl get pods -o wide
kubectl get pods --show-labels
```

## Debugging Tools

### kubectl Debug

Kubectl debug allows you to create debugging sessions in running pods:

```bash
kubectl debug <pod-name> -it --image=busybox --target=<container-name>
```

### Ephemeral Containers

Use ephemeral containers to debug running pods without modifying the original pod spec:

```bash
kubectl debug <pod-name> -it --image=busybox --target=<container-name>
```

## Best Practices

1. **Enable detailed logging**: Configure log levels appropriately
2. **Use health checks**: Implement liveness and readiness probes
3. **Monitor metrics**: Set up Prometheus and Grafana for observability
4. **Document common issues**: Keep a runbook of known problems and solutions
5. **Use structured logging**: Makes log analysis easier

## Related Resources

- [Basic Troubleshooting Commands](/learn/basic-troubleshooting)
- [Monitor Pods & Resources](/ops/monitor-pods)
- [Check Cluster Health](/ops/check-cluster-health)

## Conclusion

Effective debugging in Kubernetes requires understanding the different layers (pods, services, nodes) and using the right tools. Start with basic commands like `kubectl describe` and `kubectl logs`, then gradually expand your debugging toolkit.

Remember: Most issues can be resolved by carefully examining pod status, logs, and events.

