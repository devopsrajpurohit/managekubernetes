---
title: Troubleshooting Kubernetes Image Pull Errors
description: Complete guide to fixing ImagePullBackOff and ErrImagePull errors, including authentication, registry access, and network issues.
date: 2024-12-16
category: Troubleshooting
image: /images/blog-image-pull.svg
---

![Troubleshooting Kubernetes Image Pull Errors](/images/blog-image-pull.svg)

# Troubleshooting Kubernetes Image Pull Errors

Image pull errors prevent pods from starting because Kubernetes can't download the required container images. Understanding and fixing these issues is essential for successful deployments.

## What are Image Pull Errors?

Kubernetes shows image pull errors when:
- **ImagePullBackOff**: Kubernetes failed to pull the image and is backing off before retrying
- **ErrImagePull**: An error occurred while attempting to pull the image

You can identify these states using:

```bash
kubectl get pods

NAME              READY   STATUS             RESTARTS   AGE
my-app-pod        0/1     ImagePullBackOff   0          2m
```

## Impact of Image Pull Errors

- **Application never starts**: Pods can't run without their container images
- **Deployment failures**: Rollouts stall indefinitely
- **Production downtime**: Services remain unavailable
- **CI/CD pipeline issues**: Automated deployments fail
- **Development delays**: Teams can't deploy new versions

**Bottom line**: Image pull errors completely block pod execution until resolved.

## Common Causes and Solutions

### 1. Incorrect Image Name or Tag

**Symptom**: Image name, repository, or tag doesn't exist in the registry.

**Diagnosis**:
```bash
kubectl describe pod <pod-name> | grep -A 5 "Events:"
# Look for: "Failed to pull image" or "not found"
```

**Solutions**:
- Verify image name and tag are correct
- Check if tag exists in registry
- Use specific tags instead of `latest`
- Test image pull manually: `docker pull <image-name>:<tag>`

### 2. Private Registry Authentication

**Symptom**: Missing or invalid imagePullSecret for private registries.

**Diagnosis**:
```bash
kubectl describe pod <pod-name> | grep -i "unauthorized\|forbidden\|secret"
kubectl get pod <pod-name> -o yaml | grep -A 5 "imagePullSecrets:"
```

**Solutions**:

1. **Create imagePullSecret**:
```bash
kubectl create secret docker-registry regcred \
  --docker-server=<registry-url> \
  --docker-username=<username> \
  --docker-password=<password> \
  --docker-email=<email>
```

2. **Add to pod spec**:
```yaml
spec:
  imagePullSecrets:
  - name: regcred
  containers:
  - name: myapp
    image: private-registry.com/myapp:latest
```

3. **Add to service account** (recommended for all pods in namespace):
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: default
imagePullSecrets:
- name: regcred
```

### 3. Registry Access Issues

**Symptom**: Network or DNS problems preventing registry access.

**Diagnosis**:
```bash
kubectl describe pod <pod-name> | grep -i "network\|timeout\|connection"
# Test from a pod
kubectl run -it --rm debug --image=busybox --restart=Never -- wget -O- <registry-url>
```

**Solutions**:
- Check cluster network connectivity
- Verify DNS resolution for registry domain
- Check firewall rules allow registry access
- Configure proxy settings if needed
- Test registry access from nodes directly

### 4. Docker Hub Rate Limiting

**Symptom**: Exceeded Docker Hub anonymous pull limits.

**Diagnosis**:
```bash
kubectl describe pod <pod-name> | grep -i "rate limit\|too many requests"
```

**Solutions**:
- Create Docker Hub account and use authenticated pulls
- Use imagePullSecret with Docker Hub credentials
- Migrate to alternative registries (GitHub Container Registry, AWS ECR, etc.)
- Use a local registry mirror
- Implement image caching strategies

### 5. Registry Network Policies

**Symptom**: Network policies blocking egress to registry.

**Diagnosis**:
```bash
kubectl get networkpolicies --all-namespaces
kubectl describe networkpolicy <policy-name>
```

**Solutions**:
- Allow egress to registry IP/domain in network policies
- Add exception for registry ports (usually 443 for HTTPS)
- Temporarily disable network policies to test
- Use namespace-specific network policies

### 6. Wrong Registry Endpoint

**Symptom**: Registry URL is incorrect or unreachable.

**Diagnosis**:
```bash
kubectl get pod <pod-name> -o jsonpath='{.spec.containers[*].image}'
# Try pulling manually from node
```

**Solutions**:
- Verify registry URL is correct
- Check if using correct protocol (http vs https)
- Ensure registry endpoint is accessible from cluster
- Update image references to correct registry

### 7. Image Tag Policy Issues

**Symptom**: Using `latest` tag that changed or was deleted.

**Diagnosis**:
```bash
# Check what tag is being used
kubectl get pod <pod-name> -o jsonpath='{.spec.containers[*].image}'
```

**Solutions**:
- Use specific, immutable tags (semantic versioning)
- Avoid `latest` tag in production
- Implement image versioning strategy
- Use image digests for maximum stability

## Step-by-Step Troubleshooting Process

### Step 1: Check Pod Events

```bash
kubectl describe pod <pod-name>
```

Look for specific error messages in Events section:
- "Failed to pull image"
- "unauthorized: authentication required"
- "connection refused"
- "rate limit exceeded"

### Step 2: Verify Image Exists

```bash
# Try pulling manually from your machine
docker pull <image-name>:<tag>

# Or check registry directly
curl https://<registry-url>/v2/<image-name>/tags/list
```

### Step 3: Check Network Connectivity

```bash
# Test from a pod
kubectl run -it --rm debug --image=busybox --restart=Never -- \
  wget -O- https://<registry-url>
```

### Step 4: Verify ImagePullSecrets

```bash
# Check if secret exists
kubectl get secrets | grep regcred

# Verify secret is correct
kubectl get secret regcred -o yaml

# Check if pod references secret
kubectl get pod <pod-name> -o yaml | grep imagePullSecrets
```

### Step 5: Test from Node

```bash
# SSH into node and try pulling
docker pull <image-name>:<tag>
```

## Quick Fixes

### Immediate Actions

1. **Use public image temporarily**: Test with a known working image
   ```yaml
   image: nginx:1.21  # Known working public image
   ```

2. **Add imagePullPolicy**: Force pull always
   ```yaml
   imagePullPolicy: Always
   ```

3. **Check image digest**: Use immutable references
   ```yaml
   image: myapp@sha256:abc123...
   ```

4. **Create pull secret quickly**:
   ```bash
   kubectl create secret docker-registry regcred \
     --docker-server=docker.io \
     --docker-username=<user> \
     --docker-password=<token> \
     --namespace=<namespace>
   ```

## Best Practices to Prevent Image Pull Errors

1. **Use specific tags**: Avoid `latest`, use version tags
2. **Implement imagePullSecrets properly**: Use service accounts
3. **Monitor registry health**: Set up alerts for pull failures
4. **Cache images locally**: Use node image caching
5. **Use private registry**: Host images in controlled registry
6. **Implement retry logic**: Handle temporary network issues
7. **Document registry requirements**: Include auth setup in docs

## Registry-Specific Tips

### Docker Hub
- Create account to avoid rate limits
- Use personal access tokens
- Consider Docker Hub Pro for higher limits

### AWS ECR
- Use IAM roles for authentication
- Use `aws ecr get-login-password` for credentials
- Implement ECR image scanning

### Google Container Registry (GCR)
- Use service accounts with proper permissions
- Configure workload identity for GKE
- Use `gcloud auth configure-docker`

### GitHub Container Registry (ghcr.io)
- Use GitHub personal access tokens
- Create package with proper permissions
- Use `docker login ghcr.io`

## Related Resources

- [Basic Troubleshooting Commands](/learn/basic-troubleshooting)
- [Troubleshooting Pending Pods](/blog/troubleshooting-pods-pending-state)
- [Getting Started with Kubernetes](/blog/getting-started-with-kubernetes)

## Conclusion

Image pull errors are usually caused by authentication issues, network problems, or incorrect image references. Start by checking pod events with `kubectl describe pod`, then verify image availability and authentication. Most issues can be resolved by properly configuring imagePullSecrets and ensuring network access to registries.

Remember: Always use specific image tags in production and ensure proper authentication for private registries!

