---
title: Troubleshooting Basics
description: Your first 6 commands: get, describe, logs, exec, events, top.
---

# Troubleshooting Basics

When something goes wrong in Kubernetes, these six essential commands will help you diagnose and fix issues quickly. Master these, and you'll be able to troubleshoot most problems.

## 1. kubectl get - See What's Running

**Purpose**: List and view resources in your cluster.

### Basic Usage

```bash
# Get all pods
kubectl get pods

# Get pods in a specific namespace
kubectl get pods -n production

# Get pods with more details
kubectl get pods -o wide

# Watch pods in real-time
kubectl get pods -w

# Get all resources
kubectl get all

# Get deployments
kubectl get deployments

# Get services
kubectl get services
```

### Advanced Options

```bash
# Show labels
kubectl get pods --show-labels

# Filter by label
kubectl get pods -l app=my-app

# Custom output format
kubectl get pods -o yaml
kubectl get pods -o json

# Sort by age
kubectl get pods --sort-by=.metadata.creationTimestamp
```

**What to Look For:**
- Pod status: `Running`, `Pending`, `CrashLoopBackOff`, `Error`
- Number of replicas: Are all expected pods running?
- Age: Have pods been restarting recently?
- Node: Which nodes are pods running on?

## 2. kubectl describe - Deep Dive into Resources

**Purpose**: Get detailed information about a resource, including events and state.

### Usage

```bash
# Describe a pod
kubectl describe pod <pod-name>

# Describe a deployment
kubectl describe deployment <deployment-name>

# Describe a node
kubectl describe node <node-name>

# Describe all pods
kubectl describe pods
```

### What You'll See

- **Events**: Recent events that affected the resource
- **Conditions**: Current state conditions
- **Labels/Annotations**: Metadata
- **Resource Requests/Limits**: CPU and memory configuration
- **Volume Mounts**: Storage configuration
- **Container States**: Running, waiting, terminated states

### Example Output to Watch For

```
Events:
  Warning  FailedScheduling  pod has unbound immediate PersistentVolumeClaims
  Warning  FailedMount      Unable to attach or mount volumes
  Normal   Pulling          pulling image "nginx:1.21"
  Normal   Pulled           Successfully pulled image "nginx:1.21"
```

**Key Sections:**
- **Status**: Overall resource state
- **Conditions**: Detailed state breakdown
- **Events**: Chronological list of what happened

## 3. kubectl logs - See What Applications Are Saying

**Purpose**: View container logs to see what your application is doing.

### Basic Usage

```bash
# Get logs from a pod
kubectl logs <pod-name>

# Get logs from a specific container in a pod
kubectl logs <pod-name> -c <container-name>

# Follow logs (like tail -f)
kubectl logs -f <pod-name>

# Get logs from previous container instance
kubectl logs <pod-name> --previous

# Get logs from all pods with a label
kubectl logs -l app=my-app

# Get last 100 lines
kubectl logs <pod-name> --tail=100

# Get logs from last 10 minutes
kubectl logs <pod-name> --since=10m
```

### Advanced Options

```bash
# Get logs with timestamps
kubectl logs <pod-name> --timestamps

# Get logs from all containers
kubectl logs <pod-name> --all-containers=true

# Follow logs from deployment
kubectl logs -f deployment/<deployment-name>
```

**What to Look For:**
- Error messages
- Application startup logs
- Health check endpoints being hit
- Database connection attempts
- Authentication failures

**Common Patterns:**
- `Connection refused`: Service isn't running or wrong port
- `404 Not Found`: Wrong endpoint or routing issue
- `503 Service Unavailable`: Application not ready
- `Timeout`: Network or dependency issue

## 4. kubectl exec - Execute Commands in Containers

**Purpose**: Run commands inside running containers for debugging.

### Basic Usage

```bash
# Execute command in pod
kubectl exec <pod-name> -- ls -la

# Interactive shell
kubectl exec -it <pod-name> -- /bin/bash

# Execute in specific container
kubectl exec -it <pod-name> -c <container-name> -- /bin/sh

# Execute multiple commands
kubectl exec <pod-name> -- sh -c "env | grep DB"
```

### Common Debugging Tasks

```bash
# Check environment variables
kubectl exec <pod-name> -- env

# Check file system
kubectl exec <pod-name> -- ls -la /app

# Check network connectivity
kubectl exec <pod-name> -- curl http://localhost:8080/health

# Check DNS resolution
kubectl exec <pod-name> -- nslookup my-service

# View process list
kubectl exec <pod-name> -- ps aux

# Check disk space
kubectl exec <pod-name> -- df -h
```

**When to Use:**
- Application is running but behaving strangely
- Need to check configuration files
- Test connectivity from inside the pod
- Verify environment variables
- Debug file permission issues

## 5. kubectl get events - See What's Happening

**Purpose**: View events across the cluster to understand what's happening.

### Usage

```bash
# Get all events
kubectl get events

# Watch events in real-time
kubectl get events -w

# Get events in specific namespace
kubectl get events -n production

# Sort by time (most recent first)
kubectl get events --sort-by='.lastTimestamp'

# Filter by involved object
kubectl get events --field-selector involvedObject.name=<pod-name>
```

### Understanding Event Types

**Normal Events:**
- `SuccessfulCreate`: Pod/ReplicaSet created
- `Pulled`: Image pulled successfully
- `Started`: Container started
- `Scheduled`: Pod assigned to node

**Warning Events:**
- `FailedScheduling`: Pod couldn't be scheduled
- `FailedMount`: Volume mount failed
- `Failed`: Container failed to start
- `BackOff`: Container restarting (CrashLoopBackOff)
- `Unhealthy`: Health check failed

**Example Events:**

```
LAST SEEN   TYPE     REASON      OBJECT          MESSAGE
10m         Normal   Scheduled   pod/my-app      Successfully assigned default/my-app to node-1
10m         Normal   Pulling     pod/my-app      Pulling image "nginx:1.21"
9m          Normal   Pulled      pod/my-app      Successfully pulled image "nginx:1.21"
9m          Normal   Created     pod/my-app      Created container nginx
9m          Normal   Started     pod/my-app      Started container nginx
2m          Warning  Unhealthy   pod/my-app      Liveness probe failed
```

## 6. kubectl top - Monitor Resource Usage

**Purpose**: See CPU and memory usage for nodes and pods.

### Prerequisites

Requires metrics-server installed:
```bash
# Check if metrics-server is running
kubectl get pods -n kube-system | grep metrics-server

# Install metrics-server (if not installed)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

### Usage

```bash
# View node resource usage
kubectl top nodes

# View pod resource usage
kubectl top pods

# View pods in namespace
kubectl top pods -n production

# View specific pod
kubectl top pod <pod-name>

# View pods sorted by CPU
kubectl top pods --sort-by=cpu

# View pods sorted by memory
kubectl top pods --sort-by=memory
```

### Example Output

```
NAME       CPU(cores)   MEMORY(bytes)
pod-1      100m         128Mi
pod-2      50m          64Mi
```

**What to Look For:**
- **High CPU**: Application might be doing heavy computation
- **High Memory**: Possible memory leak or insufficient limits
- **Consistent usage**: Normal operation
- **Spikes**: Sudden load or issues

## Troubleshooting Workflow

### Step 1: Quick Health Check
```bash
kubectl get pods
kubectl get events --sort-by='.lastTimestamp' | tail -20
```

### Step 2: Inspect Problematic Resources
```bash
kubectl describe pod <problem-pod>
```

### Step 3: Check Logs
```bash
kubectl logs <pod-name>
kubectl logs <pod-name> --previous  # If container restarted
```

### Step 4: Debug Inside Container (if needed)
```bash
kubectl exec -it <pod-name> -- /bin/bash
```

### Step 5: Check Resource Usage
```bash
kubectl top pod <pod-name>
kubectl top nodes
```

## Common Issues and Solutions

### Pod in Pending State

```bash
kubectl describe pod <pod-name>
# Look for: FailedScheduling, resource constraints
```

### Pod in CrashLoopBackOff

```bash
kubectl logs <pod-name> --previous
kubectl describe pod <pod-name>
# Look for: application errors, configuration issues
```

### Pod Running but Not Responding

```bash
kubectl exec -it <pod-name> -- curl http://localhost:8080/health
kubectl logs <pod-name>
```

### High Resource Usage

```bash
kubectl top pod <pod-name>
kubectl describe pod <pod-name>  # Check limits
```

## Quick Reference Card

```bash
# 1. See what's running
kubectl get pods -o wide

# 2. Get details
kubectl describe pod <pod-name>

# 3. View logs
kubectl logs <pod-name> -f

# 4. Execute in container
kubectl exec -it <pod-name> -- /bin/bash

# 5. Check events
kubectl get events --sort-by='.lastTimestamp'

# 6. Monitor resources
kubectl top pods
```

Master these six commands, and you'll be able to diagnose and fix most Kubernetes issues!
