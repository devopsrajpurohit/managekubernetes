---
title: Control Plane Overview
description: What happens when you run kubectl — the request path explained.
---

# Control Plane Overview

When you run `kubectl`, a complex series of interactions happens behind the scenes. Understanding this flow helps you debug issues and understand how Kubernetes orchestrates your applications.

## What Happens When You Run kubectl

Let's trace a simple command: `kubectl create deployment nginx --image=nginx:1.21`

### Step 1: kubectl Processes the Command

```bash
kubectl create deployment nginx --image=nginx:1.21
```

**What kubectl does:**
1. Parses the command and flags
2. Constructs an API request (HTTP POST to `/apis/apps/v1/namespaces/default/deployments`)
3. Reads your kubeconfig file for authentication
4. Sends the request to the API Server

### Step 2: Request Reaches API Server

The **API Server** is the central hub for all Kubernetes operations.

**What happens:**
1. **Authentication**: Verifies who you are (certificate, token, or basic auth)
2. **Authorization**: Checks if you have permission to create deployments (RBAC)
3. **Admission Control**: Validates and potentially mutates the request (ValidatingAdmissionWebhooks, MutatingAdmissionWebhooks)
4. **Schema Validation**: Ensures the object structure is correct

**If validation fails:**
- Request is rejected with an error message
- You see the error in `kubectl` output

**If validation succeeds:**
- Object is stored in etcd
- API Server returns success response to kubectl

### Step 3: etcd Stores the State

**etcd** is the source of truth for all cluster data.

- The Deployment object is written to etcd
- etcd notifies watchers (controllers) about the change
- The change is persistent and survives API Server restarts

### Step 4: Controllers React

Multiple controllers watch for changes via the API Server:

#### Deployment Controller
1. Notices the new Deployment object
2. Creates a ReplicaSet to manage pod replicas
3. Sets desired replica count based on Deployment spec

#### ReplicaSet Controller
1. Notices the new ReplicaSet
2. Compares desired replicas vs actual pod count
3. Creates Pod objects (but they're not scheduled yet)

**Pod objects at this stage:**
- Have no `nodeName` assigned
- Status: `Pending`
- Waiting for scheduler

### Step 5: Scheduler Assigns Pods to Nodes

The **Scheduler** watches for pods without a node assignment.

**Scheduling Process:**

1. **Filtering Phase:**
   - Check if node has enough resources (CPU, memory)
   - Check node selector matches
   - Check taints/tolerations
   - Check pod affinity/anti-affinity rules

2. **Scoring Phase:**
   - Score remaining nodes based on:
     - Resource availability
     - Affinity preferences
     - Spread constraints (distribute pods across nodes/zones)

3. **Binding:**
   - Selects highest-scoring node
   - Updates pod with `nodeName: <selected-node>`
   - Writes binding to API Server

### Step 6: kubelet Creates Containers

The **kubelet** on the assigned node:

1. **Watches API Server** for pods assigned to its node
2. **Pulls Container Image** from the registry
3. **Creates Pod Runtime Environment:**
   - Sets up network namespace
   - Mounts volumes
   - Creates container runtime specification

4. **Starts Containers** using container runtime (containerd, CRI-O, etc.)

5. **Reports Status** back to API Server:
   - Pod phase: `Running`
   - Container statuses
   - Resource usage

### Step 7: kube-proxy Updates Networking

**kube-proxy** on each node:

1. Watches for Service and Endpoint changes
2. Updates iptables/IPVS rules
3. Enables service discovery and load balancing

## Visual Flow Diagram

```
┌─────────┐
│ kubectl │
└────┬────┘
     │ HTTP POST /apis/apps/v1/deployments
     ▼
┌──────────────────┐
│   API Server     │ ◄─── Authentication
│                  │ ◄─── Authorization  
│                  │ ◄─── Validation
└────┬─────────────┘
     │ Write to etcd
     ▼
┌─────────┐
│  etcd   │ ◄─── Persistent storage
└────┬────┘
     │ Notify watchers
     ▼
┌─────────────────────┐
│ Deployment Controller│ ──► Creates ReplicaSet
└─────────────────────┘
     │
     ▼
┌──────────────────┐
│ ReplicaSet       │ ──► Creates Pods (no node)
│ Controller       │
└──────────────────┘
     │
     ▼
┌──────────────┐
│  Scheduler   │ ──► Assigns Pod to Node
└──────────────┘
     │
     ▼
┌─────────┐
│ kubelet │ ──► Creates containers
└─────────┘
     │
     ▼
┌──────────┐
│ Pod      │ ──► Running
│ Running  │
└──────────┘
```

## Request Types

### Write Operations (Create, Update, Delete)

```
kubectl → API Server → etcd → Controllers → Nodes
```

### Read Operations (Get, List, Watch)

```
kubectl ← API Server ← etcd
```

Reads are fast because they come directly from etcd via the API Server.

### Watch Operations

```
kubectl ← API Server ← etcd (continuous updates)
```

`kubectl get pods -w` establishes a long-lived connection for real-time updates.

## Common kubectl Commands and Their Paths

### `kubectl get pods`
1. kubectl sends GET request to API Server
2. API Server queries etcd
3. Returns list of pods
4. kubectl formats and displays

### `kubectl logs <pod>`
1. kubectl requests logs from API Server
2. API Server forwards request to kubelet on pod's node
3. kubelet reads logs from container runtime
4. Returns logs through API Server to kubectl

### `kubectl exec -it <pod> -- /bin/bash`
1. kubectl establishes exec connection
2. API Server proxies connection to kubelet
3. kubelet executes command in container
4. Streams stdin/stdout back

### `kubectl apply -f file.yaml`
1. kubectl reads and parses YAML
2. Converts to API objects
3. Sends to API Server (POST/PATCH)
4. Same flow as create/update above

## Debugging the Request Path

### See API Requests

```bash
# Verbose output shows API calls
kubectl get pods -v=8
```

### Check API Server Logs

```bash
# View API Server logs (requires access)
kubectl logs -n kube-system kube-apiserver-<node>
```

### Verify Objects in etcd

```bash
# Requires etcdctl access
etcdctl get /registry/deployments/default/nginx
```

### Watch Events

```bash
# See events as they happen
kubectl get events --watch

# View events for a specific resource
kubectl describe pod <pod-name>
```

## Key Takeaways

1. **Everything goes through API Server** - It's the single entry point
2. **etcd is the source of truth** - All state is stored there
3. **Controllers react to changes** - They continuously reconcile state
4. **Scheduler assigns pods** - Based on resource and policy constraints
5. **kubelet runs containers** - It's the bridge between API Server and containers
6. **Operations are eventually consistent** - Changes propagate through the system

Understanding this flow helps you:
- Debug why pods aren't starting
- Understand why resources aren't updating
- Know where to look when things go wrong
- Design applications that work well with Kubernetes

This is the foundation of how Kubernetes orchestrates your applications!
