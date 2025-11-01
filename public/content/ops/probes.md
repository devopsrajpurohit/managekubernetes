---
title: Readiness & Liveness Probes
description: Design endpoints & timeouts to avoid flapping and false restarts.
---

# Readiness & Liveness Probes

Probes are Kubernetes' way of checking if your containers are healthy and ready to serve traffic. Properly configured probes prevent unnecessary restarts and ensure traffic only goes to ready pods.

## Types of Probes

### Liveness Probe

**Purpose**: Determines if the container is running properly.

**What happens if it fails:**
- Kubernetes kills the container
- Container restarts (if restart policy allows)
- New container instance is created

**Use when:**
- Application can get into a broken state
- Restarting might fix the issue
- Deadlock or infinite loop scenarios

### Readiness Probe

**Purpose**: Determines if the container is ready to accept traffic.

**What happens if it fails:**
- Pod is removed from Service endpoints
- Traffic stops being routed to this pod
- Container keeps running (doesn't restart)

**Use when:**
- Application needs time to start up
- Application temporarily can't serve traffic
- Database connections need to be established

## Probe Mechanisms

### HTTP Get Probe

Most common for web applications:

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
    scheme: HTTP
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  successThreshold: 1
  failureThreshold: 3
```

**Best practices:**
- Use a dedicated health endpoint (not your main API)
- Keep the endpoint lightweight (no database queries)
- Return 200 for healthy, anything else for unhealthy

### TCP Socket Probe

For non-HTTP services:

```yaml
livenessProbe:
  tcpSocket:
    port: 3306
  initialDelaySeconds: 30
  periodSeconds: 10
```

**Use when:**
- Database services
- Non-HTTP applications
- Services that don't expose HTTP endpoints

### Exec Probe

Run a command inside the container:

```yaml
livenessProbe:
  exec:
    command:
    - /bin/sh
    - -c
    - "pgrep -f myapp || exit 1"
  initialDelaySeconds: 30
  periodSeconds: 10
```

**Use sparingly:**
- More expensive than HTTP/TCP
- Requires shell access
- Harder to debug

## Probe Parameters

### initialDelaySeconds

**Purpose**: Wait time before first probe after container starts.

**Example:**
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30  # Wait 30 seconds after startup
```

**Best practices:**
- Set based on actual startup time
- Add buffer (startup time + 10-20 seconds)
- Too low = premature failures
- Too high = slow detection of issues

### periodSeconds

**Purpose**: How often to perform the probe.

**Example:**
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  periodSeconds: 10  # Check every 10 seconds
```

**Best practices:**
- Balance between detection speed and load
- Common: 5-30 seconds
- For liveness: Can be longer (10-30s)
- For readiness: Can be shorter (5-10s)

### timeoutSeconds

**Purpose**: Time to wait for probe response.

**Example:**
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  timeoutSeconds: 5  # Fail if no response in 5 seconds
```

**Best practices:**
- Should be less than periodSeconds
- Typical: 1-5 seconds
- Account for network latency
- Too low = false failures under load

### successThreshold

**Purpose**: Number of consecutive successes needed to mark probe as successful.

**Example:**
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  successThreshold: 1  # One success = healthy (default)
```

**Best practices:**
- Default is 1 (immediate)
- Increase to 2-3 for flaky endpoints
- Helps avoid flapping

### failureThreshold

**Purpose**: Number of consecutive failures before marking as failed.

**Example:**
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  failureThreshold: 3  # Fail after 3 consecutive failures
```

**Best practices:**
- Default is 3
- Higher = more tolerant of temporary failures
- Lower = faster failure detection
- Balance between false positives and detection speed

## Complete Example

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web-app
spec:
  containers:
  - name: app
    image: my-app:latest
    ports:
    - containerPort: 8080
    livenessProbe:
      httpGet:
        path: /health/live
        port: 8080
      initialDelaySeconds: 30
      periodSeconds: 10
      timeoutSeconds: 5
      failureThreshold: 3
    readinessProbe:
      httpGet:
        path: /health/ready
        port: 8080
      initialDelaySeconds: 5
      periodSeconds: 5
      timeoutSeconds: 3
      failureThreshold: 3
```

## Common Patterns

### Pattern 1: Separate Endpoints

**Best practice**: Use different endpoints for liveness and readiness.

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 8080

readinessProbe:
  httpGet:
    path: /health/ready
    port: 8080
```

**Why:**
- Liveness: Check if process is alive (simple)
- Readiness: Check if ready to serve (check dependencies)

### Pattern 2: Startup Probe

**Use for**: Slow-starting applications.

```yaml
startupProbe:
  httpGet:
    path: /health/startup
    port: 8080
  initialDelaySeconds: 0
  periodSeconds: 5
  failureThreshold: 30  # Allow up to 2.5 minutes to start

livenessProbe:
  httpGet:
    path: /health/live
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 10
```

**Why:**
- Prevents liveness probe from killing slow-starting apps
- Once startup succeeds, liveness takes over
- Use for apps that take >30 seconds to start

### Pattern 3: Conservative Readiness

**Use for**: Applications with external dependencies.

```yaml
readinessProbe:
  httpGet:
    path: /health/ready
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 1  # Remove from service immediately
  successThreshold: 2  # Require 2 successes before adding back
```

**Why:**
- Prevents sending traffic to unhealthy pods
- Avoids flapping (rapid add/remove cycles)

## Avoiding Common Pitfalls

### Pitfall 1: Probes Too Aggressive

**Problem:**
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 5  # Too short!
  periodSeconds: 1        # Too frequent!
```

**Issues:**
- App killed before fully started
- High load from probe checks
- False restarts

**Solution:**
- Increase initialDelaySeconds to actual startup time
- Use periodSeconds of 10+ seconds
- Add startupProbe for slow starters

### Pitfall 2: Heavy Health Checks

**Problem:**
```yaml
# Health endpoint performs database query
readinessProbe:
  httpGet:
    path: /health  # This queries the database!
```

**Issues:**
- Database overload from health checks
- Slow responses cause probe failures
- Cascading failures

**Solution:**
- Health endpoint should be lightweight
- Check dependencies separately
- Cache health status if needed

### Pitfall 3: Same Endpoint for Both

**Problem:**
```yaml
livenessProbe:
  httpGet:
    path: /health
readinessProbe:
  httpGet:
    path: /health  # Same endpoint!
```

**Issues:**
- Can't differentiate between "dead" and "not ready"
- Inappropriate restarts
- Traffic routing issues

**Solution:**
- Use `/health/live` for liveness
- Use `/health/ready` for readiness
- Different logic in each endpoint

### Pitfall 4: Wrong Failure Threshold

**Problem:**
```yaml
livenessProbe:
  failureThreshold: 1  # Too sensitive!
```

**Issues:**
- Single network hiccup = restart
- False positives cause unnecessary restarts
- Application instability

**Solution:**
- Use failureThreshold: 3 (default)
- Increase for flaky networks
- Monitor probe failures to tune

## Health Endpoint Implementation

### Example: Go Application

```go
func healthLive(w http.ResponseWriter, r *http.Request) {
    // Simple check: is the process running?
    w.WriteHeader(http.StatusOK)
    w.Write([]byte("OK"))
}

func healthReady(w http.ResponseWriter, r *http.Request) {
    // Check: can we serve traffic?
    // - Database connection OK?
    // - External dependencies available?
    
    if !db.IsConnected() {
        http.Error(w, "DB not connected", http.StatusServiceUnavailable)
        return
    }
    
    w.WriteHeader(http.StatusOK)
    w.Write([]byte("OK"))
}
```

### Example: Node.js Application

```javascript
// Liveness: simple process check
app.get('/health/live', (req, res) => {
  res.status(200).send('OK');
});

// Readiness: check dependencies
app.get('/health/ready', async (req, res) => {
  try {
    await db.ping();
    await redis.ping();
    res.status(200).send('OK');
  } catch (error) {
    res.status(503).send('Not ready');
  }
});
```

## Testing Probes

### Test Liveness Probe

```bash
# Create pod
kubectl apply -f pod-with-probes.yaml

# Watch pod status
kubectl get pods -w

# Check probe status
kubectl describe pod <pod-name> | grep -A 10 "Liveness\|Readiness"

# Force probe failure (make endpoint return 500)
kubectl exec -it <pod-name> -- curl http://localhost:8080/health -X POST -d "fail=true"
```

### Monitor Probe Failures

```bash
# View events
kubectl get events --field-selector involvedObject.name=<pod-name>

# Check for probe failures
kubectl describe pod <pod-name> | grep -i "probe\|unhealthy"

# View container logs
kubectl logs <pod-name>
```

## Troubleshooting

### Probe Failing Immediately

**Check:**
```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```

**Common causes:**
- Wrong path or port
- Application not listening on that port
- Firewall/network issues
- Application crash on startup

### Probe Timing Out

**Check:**
```bash
# Test endpoint manually
kubectl exec -it <pod-name> -- curl http://localhost:8080/health

# Check response time
kubectl exec -it <pod-name> -- time curl http://localhost:8080/health
```

**Solutions:**
- Increase timeoutSeconds
- Optimize health endpoint
- Check application performance

### Pod Flapping (Rapid Ready/NotReady)

**Symptoms:**
- Pod repeatedly becomes ready/unready
- Service endpoints changing constantly

**Solutions:**
- Increase successThreshold for readiness
- Fix flaky health endpoint
- Check for resource constraints
- Verify external dependencies

## Best Practices Summary

1. ✅ Use separate endpoints for liveness and readiness
2. ✅ Make health endpoints lightweight and fast
3. ✅ Set appropriate initialDelaySeconds
4. ✅ Use startupProbe for slow-starting apps
5. ✅ Avoid heavy operations in probe endpoints
6. ✅ Test probes under load
7. ✅ Monitor probe failure rates
8. ✅ Use failureThreshold > 1 to avoid false positives
9. ✅ Tune periodSeconds based on application needs
10. ✅ Document probe behavior in application code

## Quick Reference

```yaml
# Standard configuration
livenessProbe:
  httpGet:
    path: /health/live
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health/ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
  successThreshold: 2
```

Properly configured probes are essential for reliable Kubernetes applications. They ensure traffic only goes to healthy pods and that unhealthy containers are restarted when needed!
