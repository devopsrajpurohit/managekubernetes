---
title: Pods & Services
description: How containers become pods, get traffic, and stay resilient.
---

# Pods & Services

Understanding pods, nodes, and services is fundamental to working with Kubernetes. These concepts form the foundation of how your applications run and communicate.

## Pods: The Basic Unit

A **Pod** is the smallest deployable unit in Kubernetes. It represents one or more containers that share:
- Network namespace (same IP address)
- Storage volumes
- A lifecycle (created and destroyed together)

### Pod Characteristics

**Single Container Pod (Most Common):**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
spec:
  containers:
  - name: nginx
    image: nginx:1.21
```

**Multi-Container Pods:**
Useful for sidecar patterns (logging, monitoring, proxies):
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-with-sidecar
spec:
  containers:
  - name: app
    image: my-app:latest
  - name: sidecar
    image: logging-sidecar:latest
```

### Pod Lifecycle

1. **Pending**: Pod accepted, but containers not created yet
2. **Running**: Pod bound to a node, containers created and running
3. **Succeeded**: All containers terminated successfully
4. **Failed**: At least one container terminated in failure
5. **Unknown**: Pod state couldn't be determined

### Pod IP Addresses

- Each pod gets its own IP address
- Pods can communicate with each other using these IPs
- IPs are ephemeral - they change when pods are recreated

## Nodes: Where Pods Run

A **Node** is a worker machine in Kubernetes. It can be a physical or virtual machine.

### Node Components

- **kubelet**: Agent that communicates with the control plane
- **kube-proxy**: Maintains network rules
- **Container Runtime**: Runs containers (containerd, CRI-O, etc.)

### Node Status

Nodes can be in different states:
- **Ready**: Node is healthy and ready to accept pods
- **NotReady**: Node isn't responding to health checks
- **Unknown**: Controller can't reach the node

### Viewing Nodes

```bash
# List all nodes
kubectl get nodes

# Get detailed node information
kubectl describe node <node-name>

# View node resources
kubectl top node <node-name>
```

## Services: Stable Networking

A **Service** provides a stable IP address and DNS name for a set of pods. Since pod IPs change, services are essential for reliable communication.

### Service Types

**ClusterIP (Default):**
- Internal IP accessible only within the cluster
- Used for pod-to-pod communication

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 8080
```

**NodePort:**
- Exposes the service on each node's IP at a static port
- Accessible from outside the cluster via `<NodeIP>:<NodePort>`

**LoadBalancer:**
- Creates an external load balancer (cloud provider specific)
- Automatically assigned an external IP

**ExternalName:**
- Maps a service to an external DNS name
- Used for accessing external services

### How Services Route Traffic

1. **Service selector** matches pods with specific labels
2. **Endpoints** are automatically created and updated
3. **kube-proxy** maintains iptables/IPVS rules
4. Traffic is load-balanced across matching pods

### Service Discovery

**DNS-based:**
- Services get DNS names: `<service-name>.<namespace>.svc.cluster.local`
- Short name `<service-name>` works within the same namespace
- Pods can resolve services by name

## How Containers Become Pods

### 1. Container Image → Pod Spec

```bash
# Simple way (creates deployment, which creates pods)
kubectl create deployment nginx --image=nginx:1.21
```

### 2. Pod Scheduling

The scheduler assigns pods to nodes based on:
- Resource requirements (CPU, memory)
- Node capacity
- Affinity/anti-affinity rules
- Taints and tolerations

### 3. Container Runtime

The kubelet on the assigned node:
- Pulls the container image
- Creates the container using the container runtime
- Starts the container with the specified configuration

## Keeping Applications Resilient

### Replicas with Deployments

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: app
        image: my-app:latest
```

### Health Checks

**Liveness Probe:**
Determines if a container is running properly. If it fails, Kubernetes restarts the container.

**Readiness Probe:**
Determines if a container is ready to accept traffic. If it fails, the pod is removed from service endpoints.

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Practical Commands

```bash
# Create a pod
kubectl run nginx --image=nginx:1.21

# View pods
kubectl get pods
kubectl get pods -o wide  # Shows node info

# Describe a pod
kubectl describe pod <pod-name>

# View pod logs
kubectl logs <pod-name>

# Execute command in pod
kubectl exec -it <pod-name> -- /bin/bash

# Create a service
kubectl expose deployment nginx --port=80 --target-port=8080

# View services and endpoints
kubectl get svc
kubectl get endpoints
```

Understanding pods, nodes, and services is essential for deploying and managing applications in Kubernetes effectively.
