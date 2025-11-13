---
title: Performance & Cost Insights
description: Optimize Kubernetes costs and performance. Learn to right-size resource requests and limits, identify waste, and maintain predictable latency in your K8s cluster.
---

# Performance & Cost Insights

Optimizing for performance and cost in Kubernetes requires balancing resource allocation, identifying waste, and ensuring predictable latency. This guide shows you how to right-size your workloads and reduce costs without sacrificing performance.

## Understanding Resource Requests and Limits

### Requests vs Limits

**Requests:**
- Guaranteed minimum resources
- Used by scheduler to place pods
- Reserved for the pod
- **Cost impact**: Nodes need capacity for requests

**Limits:**
- Maximum resources pod can use
- Throttling occurs if exceeded
- OOMKilled if memory limit exceeded
- **Cost impact**: Less direct, but affects node density

### The Right-Sizing Process

1. **Baseline Measurement**
   ```bash
   # Monitor actual usage over time
   kubectl top pods --all-namespaces --containers
   ```

2. **Analyze Usage Patterns**
   - Average usage (set requests)
   - Peak usage (set limits)
   - Add 20-30% buffer for limits

3. **Apply Changes Gradually**
   - Start with non-critical workloads
   - Monitor for issues
   - Adjust based on feedback

4. **Continuous Optimization**
   - Review monthly
   - Adjust for traffic patterns
   - Remove unused resources

## Identifying Waste

### 1. Over-Provisioned Pods

**Signs:**
- Actual usage << requests
- CPU throttling rare or never
- Memory usage well below limits

**How to find:**
```bash
# Compare requests vs actual usage
kubectl top pods --all-namespaces
kubectl describe pod <pod-name> | grep -A 2 "Requests\|Limits"
```

**Example:**
```
Pod: web-app-xyz
Requests: CPU 1000m, Memory 1Gi
Actual:    CPU 50m,   Memory 128Mi
Waste:     95% CPU, 87% Memory
```

**Solution:**
```yaml
resources:
  requests:
    cpu: "100m"    # Down from 1000m
    memory: "256Mi" # Down from 1Gi
  limits:
    cpu: "500m"     # Still have headroom
    memory: "512Mi" # But not excessive
```

### 2. Idle Pods

**Signs:**
- Pods with zero or near-zero usage
- High replica counts with low traffic
- Pods that never receive requests

**How to find:**
```bash
# Pods with zero resource usage
kubectl top pods --all-namespaces | awk '$3==0 && $4==0'

# Low-traffic services
kubectl get hpa --all-namespaces
# Check if min replicas > actual needed
```

**Solution:**
- Reduce replica count
- Use HPA with lower min replicas
- Consider removing unused services

### 3. Zombie Resources

**Signs:**
- Old deployments still running
- Unused ConfigMaps/Secrets
- Orphaned PVCs
- Services pointing to nothing

**How to find:**
```bash
# Find unused deployments
kubectl get deployments --all-namespaces
# Check if any have zero desired replicas

# Find unused PVCs
kubectl get pvc --all-namespaces
# Compare with actual pod usage

# Find services without endpoints
kubectl get svc --all-namespaces -o wide
kubectl get endpoints --all-namespaces
```

**Solution:**
- Delete unused resources
- Clean up old PVCs
- Remove orphaned services

### 4. Inefficient Node Utilization

**Signs:**
- Nodes with low resource usage
- Many small nodes vs fewer large ones
- High ratio of system overhead

**How to find:**
```bash
# Node resource usage
kubectl top nodes

# Check node capacity
kubectl describe nodes | grep -A 5 "Capacity\|Allocatable"

# Calculate utilization
# (Allocatable - Available) / Allocatable
```

**Target utilization:**
- CPU: 70-80%
- Memory: 70-80%
- Below 50% = waste
- Above 90% = risk of issues

## Right-Sizing Strategies

### Strategy 1: Start Conservative, Scale Up

**Initial deployment:**
```yaml
resources:
  requests:
    cpu: "100m"
    memory: "128Mi"
  limits:
    cpu: "500m"
    memory: "512Mi"
```

**After monitoring:**
- Adjust based on actual usage
- Scale up if hitting limits frequently
- Scale down if consistently low

### Strategy 2: Use HPA with Resource Metrics

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

**Benefits:**
- Automatically scales based on usage
- Reduces waste during low traffic
- Handles traffic spikes

### Strategy 3: Vertical Pod Autoscaler (VPA)

**VPA automatically adjusts resource requests:**

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: web-app-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  updatePolicy:
    updateMode: "Auto"  # or "Off", "Initial"
  resourcePolicy:
    containerPolicies:
    - containerName: '*'
      minAllowed:
        cpu: 50m
        memory: 64Mi
      maxAllowed:
        cpu: 2
        memory: 4Gi
```

**Use when:**
- Workload patterns vary
- Manual optimization is difficult
- You want automatic right-sizing

## Performance Optimization

### 1. CPU Throttling Prevention

**Problem:**
- Pods hitting CPU limits
- Throttling causing slow responses
- Poor user experience

**Detection:**
```bash
# Check throttling (requires metrics)
# Look for pods with CPU usage at limit
kubectl top pods --all-namespaces

# Check events for throttling
kubectl get events --all-namespaces | grep -i throttle
```

**Solution:**
```yaml
resources:
  limits:
    cpu: "1000m"  # Increase limit
    # Or remove limit if trust the app
```

### 2. Memory Leak Prevention

**Problem:**
- Memory usage gradually increasing
- Eventually OOMKilled
- Frequent restarts

**Detection:**
```bash
# Monitor memory trends
kubectl top pods -w

# Check for OOMKilled
kubectl describe pod <pod-name> | grep -i oom
kubectl get events | grep OOMKilled
```

**Solution:**
- Fix memory leak in application
- Increase memory limit temporarily
- Set appropriate memory limits to catch early

### 3. Network Latency Optimization

**Problem:**
- High latency between services
- Slow service-to-service communication

**Optimizations:**
- Use NodePort/LoadBalancer for external traffic
- Keep services in same namespace (faster DNS)
- Use service mesh for optimization (Istio, Linkerd)
- Optimize pod placement (affinity rules)

### 4. Storage Performance

**Problem:**
- Slow disk I/O
- High latency on storage operations

**Solutions:**
- Use SSD-backed storage classes
- Optimize database queries
- Use local storage for hot data
- Cache frequently accessed data

## Cost Optimization Techniques

### 1. Use Spot Instances

**For:**
- Stateless workloads
- Batch jobs
- Non-critical services
- Development/staging

**Configuration:**
```yaml
# Node selector for spot instances
nodeSelector:
  node.kubernetes.io/instance-type: spot
```

### 2. Cluster Autoscaling

**Automatically add/remove nodes:**
- Scales down during low usage
- Scales up during peak
- Reduces idle node costs

### 3. Resource Quotas

**Prevent resource waste:**
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-quota
spec:
  hard:
    requests.cpu: "10"
    requests.memory: 20Gi
    limits.cpu: "20"
    limits.memory: 40Gi
```

### 4. Right-Size Nodes

**Choose appropriate instance types:**
- Match workload requirements
- Avoid over-provisioned nodes
- Consider reserved instances for stable workloads

### 5. Image Optimization

**Reduce:**
- Image pull time
- Storage costs
- Network transfer

**Techniques:**
- Multi-stage builds
- Use distroless/minimal base images
- Remove unnecessary packages
- Use image layers efficiently

## Monitoring and Metrics

### Key Metrics to Track

**Resource Utilization:**
- CPU usage vs requests/limits
- Memory usage vs requests/limits
- Network I/O
- Storage I/O

**Cost Metrics:**
- Cost per pod
- Cost per namespace
- Cost per service
- Node utilization

**Performance Metrics:**
- Response time (p50, p95, p99)
- Error rate
- Throughput
- Request latency

### Tools for Cost Analysis

**kubectl-cost:**
```bash
# Install
kubectl krew install cost

# View costs
kubectl cost namespace --show-cpu --show-memory
kubectl cost pod --show-cpu --show-memory
```

**Cloud Provider Tools:**
- AWS Cost Explorer
- GCP Cost Management
- Azure Cost Management

**Third-Party:**
- Kubecost
- OpenCost
- CloudHealth

## Right-Sizing Checklist

### Initial Deployment
- [ ] Set conservative requests
- [ ] Set limits with headroom
- [ ] Monitor for 24-48 hours
- [ ] Review usage patterns

### Optimization Phase
- [ ] Identify over-provisioned pods
- [ ] Identify under-provisioned pods
- [ ] Check for idle resources
- [ ] Review node utilization
- [ ] Calculate waste percentage

### Implementation
- [ ] Adjust requests based on averages
- [ ] Adjust limits based on peaks
- [ ] Add HPA for dynamic scaling
- [ ] Consider VPA for automatic tuning
- [ ] Set up monitoring/alerting

### Continuous Improvement
- [ ] Monthly resource review
- [ ] Quarterly cost analysis
- [ ] Remove unused resources
- [ ] Optimize based on traffic patterns
- [ ] Review and update runbooks

## Example: Right-Sizing Workflow

### Step 1: Baseline

```bash
# Deploy with conservative resources
kubectl apply -f app.yaml

# Monitor for 48 hours
kubectl top pods -w
```

### Step 2: Analyze

```bash
# Get usage stats
kubectl top pods --all-namespaces > usage.txt

# Compare requests vs actual
# Identify waste
```

### Step 3: Optimize

```yaml
# Adjust resources
resources:
  requests:
    cpu: "150m"    # Based on average + buffer
    memory: "256Mi" # Based on average + buffer
  limits:
    cpu: "500m"     # Based on peak + buffer
    memory: "512Mi" # Based on peak + buffer
```

### Step 4: Validate

```bash
# Deploy changes
kubectl apply -f app.yaml

# Monitor for issues
kubectl get events --watch
kubectl top pods -w
```

## Key Takeaways

1. **Right-size based on actual usage**, not guesses
2. **Monitor continuously** to catch drift
3. **Use HPA/VPA** for automatic optimization
4. **Review regularly** (monthly minimum)
5. **Balance cost and performance** - don't optimize one at expense of other
6. **Start conservative**, scale up if needed
7. **Remove unused resources** regularly
8. **Use appropriate instance types** for workloads
9. **Monitor key metrics** (CPU, memory, latency, cost)
10. **Document decisions** for future reference

Cost optimization is an ongoing process. Start with the basics, measure everything, and continuously improve. Your cloud bill (and performance) will thank you!
