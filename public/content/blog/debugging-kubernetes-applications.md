---
title: Debugging Kubernetes Applications: Common Issues and Solutions
description: Debug Kubernetes applications effectively. Master kubectl commands, log analysis, and troubleshooting techniques. Fix common K8s issues with step-by-step debugging strategies.
date: 2024-12-05
category: Troubleshooting
image: /images/blog-debugging.svg
---

![Debugging Kubernetes Applications](/images/blog-debugging.svg)

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
- [Image pull errors](/blog/troubleshooting-image-pull-errors)
- Resource quota limits
- Node selectors not matching

For more details, see our guide on [troubleshooting pods in Pending state](/blog/troubleshooting-pods-pending-state).

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

Learn more about [troubleshooting CrashLoopBackOff pods](/blog/troubleshooting-pods-crashloopbackoff) and [understanding pod error states](/blog/troubleshooting-pods-error-state).

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

For memory-related issues, see our guide on [troubleshooting OOM killed pods](/blog/troubleshooting-pods-oom-killed). Learn about [monitoring pods](/ops/monitor-pods) and [cost optimization](/ops/cost-optimization) strategies.

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
2. **Use health checks**: Implement [liveness and readiness probes](/ops/probes) for better reliability
3. **Monitor metrics**: Set up Prometheus and Grafana for observability. Learn about [monitoring pods](/ops/monitor-pods) and [smart alerts](/ops/smart-alerts)
4. **Document common issues**: Keep a runbook of known problems and solutions
5. **Use structured logging**: Makes log analysis easier

For production deployments, follow our [Kubernetes best practices guide](/blog/kubernetes-best-practices) and [Day-2 operations checklist](/ops/day2-checklist).

## Related Resources

### Learning Resources
- [What is Kubernetes?](/learn/what-is-kubernetes) - Start with the basics
- [Kubernetes Core Components](/learn/core-components) - Understand the architecture
- [Basic Troubleshooting Commands](/learn/basic-troubleshooting) - Essential kubectl commands

### Operations Guides
- [Monitor Pods & Resources](/ops/monitor-pods) - Monitoring strategies
- [Check Cluster Health](/ops/check-cluster-health) - Health check procedures
- [Probes Configuration](/ops/probes) - Health check configuration

### Troubleshooting Guides
- [Troubleshooting Pods in Pending State](/blog/troubleshooting-pods-pending-state)
- [Troubleshooting CrashLoopBackOff](/blog/troubleshooting-pods-crashloopbackoff)
- [Troubleshooting Image Pull Errors](/blog/troubleshooting-image-pull-errors)
- [Troubleshooting OOM Killed Pods](/blog/troubleshooting-pods-oom-killed)
- [Troubleshooting Evicted Pods](/blog/troubleshooting-pods-evicted)

## Conclusion

Effective debugging in Kubernetes requires understanding the different layers (pods, services, nodes) and using the right tools. Start with basic commands like `kubectl describe` and `kubectl logs`, then gradually expand your debugging toolkit.

Remember: Most issues can be resolved by carefully examining pod status, logs, and events.

