---
title: Core Components
description: API server, scheduler, controller manager, etcd — the control plane at a glance.
---

# Core Components

The Kubernetes control plane consists of several core components that work together to manage your cluster. Understanding these components helps you troubleshoot issues and understand how Kubernetes works under the hood.

## Control Plane Components

### 1. API Server (kube-apiserver)

The **API Server** is the front-end to the Kubernetes control plane. It's the only component that communicates with etcd.

**Responsibilities:**
- Validates and processes all API requests
- Authenticates and authorizes users (RBAC)
- Acts as the gateway for all cluster operations
- Maintains the REST API that `kubectl` and other tools use

**Key Points:**
- All communication goes through the API Server
- It's stateless and can be scaled horizontally
- Multiple API servers can run for high availability

### 2. etcd

**etcd** is a distributed key-value store that serves as Kubernetes' backing store for all cluster data.

**Responsibilities:**
- Stores all cluster state (pods, services, configs, secrets)
- Only the API Server communicates with etcd directly
- Provides watch capabilities for change notifications

**Key Points:**
- Highly consistent and available
- Can be run in a cluster for redundancy
- Backups are critical for disaster recovery

### 3. Controller Manager (kube-controller-manager)

The **Controller Manager** runs controllers that handle routine tasks in the cluster.

**What Controllers Do:**
- **Node Controller**: Monitors node health and responds to failures
- **Replication Controller**: Maintains the correct number of pod replicas
- **Endpoints Controller**: Populates Endpoints objects (joins Services & Pods)
- **Service Account & Token Controllers**: Create default accounts and API access tokens

**Key Points:**
- Controllers watch the API Server for changes
- They reconcile actual state with desired state
- Multiple controllers run in a single process

### 4. Scheduler (kube-scheduler)

The **Scheduler** assigns newly created pods to nodes.

**How It Works:**
1. Watches for pods with `nodeName` unset
2. Filters nodes based on resource requirements and constraints
3. Scores remaining nodes (affinity, anti-affinity, etc.)
4. Selects the best node and binds the pod

**Scheduling Factors:**
- Resource requests (CPU, memory)
- Node affinity/anti-affinity rules
- Taints and tolerations
- Pod affinity/anti-affinity
- Resource availability

### 5. Cloud Controller Manager

Runs controllers that interact with the underlying cloud provider (optional, cloud-specific).

**Handles:**
- Node controller interactions with cloud APIs
- Route controller for cloud load balancers
- Service controller for cloud provider integrations

## Node Components

### kubelet

The **kubelet** is an agent that runs on each node and ensures containers are running in a pod.

**Responsibilities:**
- Registers the node with the API Server
- Receives pod specifications and ensures containers are running
- Reports node and pod status back to the control plane
- Executes liveness and readiness probes

### kube-proxy

**kube-proxy** maintains network rules on nodes, enabling service abstraction.

**Functions:**
- Implements service networking
- Routes traffic to pods based on service definitions
- Can use iptables, IPVS, or userspace mode

### Container Runtime

The **Container Runtime** (containerd, CRI-O, Docker) actually runs the containers.

## How They Work Together

1. **User runs `kubectl create deployment`** → API Server receives request
2. **API Server validates** → Stores desired state in etcd
3. **Controller Manager** → Creates a ReplicaSet
4. **ReplicaSet Controller** → Creates Pod objects (no node assigned yet)
5. **Scheduler** → Finds suitable node and assigns pod
6. **kubelet on that node** → Creates containers via container runtime
7. **kube-proxy** → Updates networking rules for services

## Checking Component Health

```bash
# Check control plane component status
kubectl get componentstatuses

# Check API Server health
kubectl get --raw /healthz

# View scheduler logs (if you have access)
kubectl logs -n kube-system <scheduler-pod>

# Check etcd health (requires etcdctl)
ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 endpoint health
```

Understanding these components is key to troubleshooting cluster issues and designing reliable applications.
