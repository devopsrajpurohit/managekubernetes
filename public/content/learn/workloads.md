---
title: Deployments (the easy way)
description: Master Kubernetes deployments with rolling updates and rollbacks. Learn to manage workloads efficiently with practical kubectl commands and zero theory overload.
---

# Deployments: The Easy Way

Deployments are the most common way to run applications in Kubernetes. They manage replica sets and provide declarative updates, rolling updates, and rollbacks with minimal effort.

## What is a Deployment?

A **Deployment** manages a set of identical pods (replicas) and provides:
- Declarative updates (change the YAML, apply it)
- Rolling updates (zero-downtime updates)
- Rollbacks (revert to previous version)
- Scaling (increase/decrease replicas)

## Creating Your First Deployment

### Simple Approach

```bash
kubectl create deployment my-app --image=nginx:1.21 --replicas=3
```

This single command:
- Creates a Deployment named `my-app`
- Sets the image to `nginx:1.21`
- Creates 3 replicas (pods)
- Sets up a ReplicaSet to manage them

### Using YAML

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
      - name: nginx
        image: nginx:1.21
        ports:
        - containerPort: 80
```

Apply it:
```bash
kubectl apply -f deployment.yaml
```

## Rolling Updates: Zero Downtime

### Update the Image

**Method 1: Command Line**
```bash
kubectl set image deployment/my-app nginx=nginx:1.22
```

**Method 2: Edit the Deployment**
```bash
kubectl edit deployment my-app
# Change the image version in the editor
```

**Method 3: Update YAML**
```yaml
# Change image in your YAML file
image: nginx:1.22
```
```bash
kubectl apply -f deployment.yaml
```

### What Happens During Rolling Update

1. **New ReplicaSet Created**: Kubernetes creates a new ReplicaSet with the new image
2. **Gradual Replacement**: Old pods are terminated as new ones become ready
3. **Zero Downtime**: Traffic continues to flow to old pods until new ones are ready
4. **Automatic Scaling**: You can control how many new pods are created simultaneously

### Control Rolling Update Speed

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Max pods that can be created over desired count
      maxUnavailable: 0  # Max pods that can be unavailable
  replicas: 3
```

## Rollbacks: Revert to Previous Version

### Check Deployment History

```bash
kubectl rollout history deployment/my-app
```

### View Specific Revision

```bash
kubectl rollout history deployment/my-app --revision=2
```

### Rollback to Previous Version

```bash
# Rollback to immediately previous version
kubectl rollout undo deployment/my-app

# Rollback to specific revision
kubectl rollout undo deployment/my-app --to-revision=2
```

### Rollback Status

```bash
kubectl rollout status deployment/my-app
```

## Scaling: Change Replica Count

### Scale Up

```bash
kubectl scale deployment/my-app --replicas=5
```

Or update the YAML:
```yaml
spec:
  replicas: 5
```
```bash
kubectl apply -f deployment.yaml
```

### Scale Down

```bash
kubectl scale deployment/my-app --replicas=1
```

### Auto-scaling (HPA)

```bash
# Create horizontal pod autoscaler
kubectl autoscale deployment my-app --cpu-percent=70 --min=2 --max=10
```

## Common Commands

```bash
# Get deployments
kubectl get deployments

# Describe deployment
kubectl describe deployment my-app

# View rollout status
kubectl rollout status deployment/my-app

# Pause rollout (make multiple changes before applying)
kubectl rollout pause deployment/my-app

# Resume rollout
kubectl rollout resume deployment/my-app

# Restart deployment (recreates all pods)
kubectl rollout restart deployment/my-app

# View pods managed by deployment
kubectl get pods -l app=my-app
```

## Best Practices

### 1. Use Labels Consistently

```yaml
metadata:
  labels:
    app: my-app
    version: v1
    env: production
```

### 2. Set Resource Limits

```yaml
containers:
- name: nginx
  resources:
    requests:
      memory: "64Mi"
      cpu: "250m"
    limits:
      memory: "128Mi"
      cpu: "500m"
```

### 3. Configure Health Checks

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 80
  initialDelaySeconds: 30

readinessProbe:
  httpGet:
    path: /ready
    port: 80
  initialDelaySeconds: 5
```

### 4. Use Specific Image Tags

```yaml
# Avoid 'latest' in production
image: nginx:1.21.6  # Specific version
```

## Real-World Example

Complete deployment with all features:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  labels:
    app: web-app
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
        version: v1.0
    spec:
      containers:
      - name: web
        image: myapp:v1.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
```

## Troubleshooting

**Pods not starting:**
```bash
kubectl describe deployment my-app
kubectl logs deployment/my-app
```

**Rollout stuck:**
```bash
kubectl rollout undo deployment/my-app
```

**Check rollout history:**
```bash
kubectl rollout history deployment/my-app
```

That's it! Deployments make managing applications in Kubernetes straightforward. You can update, scale, and rollback with simple commands - no complex theory needed.
