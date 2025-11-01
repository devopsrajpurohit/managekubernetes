---
title: Troubleshooting Kubernetes Pods Stuck in Pending State
description: Learn how to diagnose and fix pods stuck in Pending state, including resource issues, scheduling problems, and storage configuration.
date: 2024-12-18
category: Troubleshooting
---

# Troubleshooting Kubernetes Pods Stuck in Pending State

A pod in Kubernetes enters the **Pending** state when it has been created and accepted by the Kubernetes control plane but hasn't been scheduled to run on any node yet. Understanding why pods get stuck in this state is crucial for maintaining healthy Kubernetes clusters.

## What is the Pending State?

The Pending state indicates that either:
- The Kubernetes scheduler is still trying to find a suitable node for the pod
- Container images are being downloaded
- Required resources (like PersistentVolumes) are being provisioned

You can identify pending pods using:

```bash
kubectl get pods

NAME               READY   STATUS    RESTARTS   AGE
my-app-pod         0/1     Pending  0          5m
```

## Impact of Pending Pods

- Applications won't start running until pods are scheduled
- Dependent services and workloads will be delayed
- Deployment rollouts may stall or fail
- Auto-scaling operations may malfunction
- Production availability issues can occur

**In short**: A Pending pod indicates a scheduling or provisioning issue that must be resolved before your workload can function.

## Common Causes and Solutions

### 1. Insufficient Node Resources

**Symptom**: No nodes have enough CPU or memory to satisfy the pod's resource requests.

**Diagnosis**:
```bash
# Check node resource availability
kubectl top nodes

# Check pod resource requests
kubectl describe pod <pod-name> | grep -A 5 "Requests:"
```

**Solutions**:
- Increase cluster capacity by adding nodes
- Reduce pod resource requests
- Clear unused pods to free resources
- Implement resource quotas to prevent resource hoarding

### 2. NodeSelector or Affinity Mismatch

**Symptom**: Pod's node selection rules don't match any available node.

**Diagnosis**:
```bash
kubectl describe pod <pod-name> | grep -A 10 "Node-Selectors:"
kubectl get nodes --show-labels
```

**Solutions**:
- Remove restrictive node selectors if not needed
- Add matching labels to nodes: `kubectl label nodes <node-name> <key>=<value>`
- Adjust affinity rules to match your cluster topology

### 3. Taints and Tolerations

**Symptom**: Nodes have taints that the pod doesn't tolerate.

**Diagnosis**:
```bash
kubectl describe node <node-name> | grep -A 5 "Taints:"
kubectl describe pod <pod-name> | grep -A 5 "Tolerations:"
```

**Solutions**:
- Add matching tolerations to your pod spec
- Remove unnecessary taints from nodes
- Create a dedicated node pool without taints for workloads

### 4. PersistentVolumeClaim Issues

**Symptom**: Pod references a PVC that isn't bound to a PersistentVolume.

**Diagnosis**:
```bash
kubectl get pvc
kubectl describe pvc <pvc-name>
```

**Solutions**:
- Check storage class configuration
- Verify storage provisioner is running
- Ensure sufficient storage capacity exists
- Review PVC access modes (ReadWriteOnce, ReadOnlyMany, ReadWriteMany)

### 5. Network Plugin Not Ready

**Symptom**: CNI plugin hasn't initialized on nodes.

**Diagnosis**:
```bash
kubectl get nodes
kubectl describe node <node-name> | grep -i "network"
```

**Solutions**:
- Wait for CNI plugin to initialize (usually automatic)
- Restart CNI pods if stuck
- Check CNI pod logs: `kubectl logs -n kube-system <cni-pod-name>`

### 6. All Nodes Unschedulable

**Symptom**: All nodes are cordoned or marked unschedulable.

**Diagnosis**:
```bash
kubectl get nodes
kubectl describe node <node-name> | grep -i "unschedulable"
```

**Solutions**:
- Uncordon nodes: `kubectl uncordon <node-name>`
- Check why nodes were cordoned (maintenance, issues)
- Ensure at least some nodes are schedulable

## Step-by-Step Troubleshooting Process

### Step 1: Check Pod Events

```bash
kubectl describe pod <pod-name>
```

Look for events that explain why the pod isn't scheduling, such as:
- "Insufficient cpu"
- "Insufficient memory"
- "0/3 nodes are available"

### Step 2: Check Node Capacity

```bash
kubectl get nodes -o custom-columns=NAME:.metadata.name,CPU:.status.capacity.cpu,MEMORY:.status.capacity.memory
kubectl top nodes
```

### Step 3: Verify Pod Requirements

```bash
kubectl get pod <pod-name> -o yaml | grep -A 10 "resources:"
```

### Step 4: Check Scheduling Constraints

```bash
kubectl get pod <pod-name> -o yaml | grep -A 5 "nodeSelector:"
kubectl get pod <pod-name> -o yaml | grep -A 10 "affinity:"
```

## Quick Fixes

### Immediate Actions

1. **Delete and recreate**: Sometimes recreating the pod helps
   ```bash
   kubectl delete pod <pod-name>
   ```

2. **Add a node**: Quickly add capacity to your cluster

3. **Remove resource constraints**: Temporarily remove resource requests to test

4. **Check for stuck PVCs**: Delete and recreate PVCs if they're stuck

### Preventive Measures

- Set appropriate resource requests (not too high, not too low)
- Use HorizontalPodAutoscaler for dynamic scaling
- Implement resource quotas at namespace level
- Monitor node capacity and plan scaling
- Use node affinity carefully (prefer soft affinity)
- Document node taints and ensure pods have tolerations

## Related Resources

- [Basic Troubleshooting Commands](/learn/basic-troubleshooting)
- [Monitor Pods & Resources](/ops/monitor-pods)
- [Check Cluster Health](/ops/check-cluster-health)
- [Troubleshooting CrashLoopBackOff Pods](/blog/troubleshooting-pods-crashloopbackoff)

## Conclusion

Pods stuck in Pending state are usually caused by resource constraints, scheduling rules, or provisioning issues. Use `kubectl describe pod` to identify the specific cause, then apply the appropriate solution based on the error message.

Remember: Most Pending state issues can be resolved by either adjusting pod requirements or adding cluster capacity.

