---
title: Troubleshooting Kubernetes Pods in Error State
description: Complete guide to diagnosing and fixing pods in Error state, including application crashes, configuration issues, and exit code handling.
date: 2024-12-21
category: Troubleshooting
---

# Troubleshooting Kubernetes Pods in Error State

In Kubernetes, a pod enters the **Error** state when one or more of its containers stop running with a non-zero exit code. This indicates that the process inside the container failed unexpectedly, usually when an application crashes, encounters an exception, or cannot complete its intended task.

You can identify this state using:

```bash
kubectl get pods

NAME                  READY   STATUS    RESTARTS   AGE
data-processing-job   0/1     Error     0          2m
```

## Impact of Error State

When a pod is in Error state, execution failed. Kubernetes won't automatically retry unless a controller (Job, Deployment, ReplicaSet) manages it.

**Consequences**:
- The task didn't complete successfully
- Data processing, backup, or script execution may be incomplete
- Dependent workloads (Jobs, CronJobs, Deployments) may fail or hang
- Application remains unavailable until fixed

**Bottom line**: Error state means Kubernetes started the container successfully, but the process inside it failed.

## Common Causes and Solutions

### 1. Application Crash

**Symptom**: Runtime exception causes the main process to crash.

**Diagnosis**:
```bash
kubectl logs <pod-name>
kubectl logs <pod-name> --previous
kubectl describe pod <pod-name> | grep -A 5 "Exit Code:"
```

**Solutions**:
- Fix application bugs causing crashes
- Add proper error handling and logging
- Check application dependencies
- Review recent code changes
- Test application locally before deploying

### 2. Invalid Startup Command

**Symptom**: Container entrypoint or command fails immediately.

**Diagnosis**:
```bash
kubectl describe pod <pod-name> | grep -A 5 "Command:"
kubectl get pod <pod-name> -o yaml | grep -A 10 "command:"
```

**Solutions**:
- Verify entrypoint commands are correct
- Ensure command paths exist in container
- Check for syntax errors in command arrays
- Test commands locally with the same image
- Use absolute paths for commands

### 3. Dependency Failure

**Symptom**: Container exits because it can't connect to external dependency.

**Diagnosis**:
```bash
kubectl logs <pod-name> | grep -i "connection\|timeout\|refused\|unreachable"
kubectl get services,endpoints
```

**Solutions**:
- Ensure dependent services are running
- Check service DNS names and ports
- Verify network policies allow connections
- Add retry logic for dependencies
- Use init containers to wait for dependencies

### 4. Permission Issues

**Symptom**: Process fails due to missing permissions or non-existent files.

**Diagnosis**:
```bash
kubectl logs <pod-name> | grep -i "permission\|denied\|no such file"
kubectl exec <pod-name> -- ls -la /path/to/file
```

**Solutions**:
- Fix file permissions in container image
- Ensure required files are present
- Configure securityContext with correct user
- Verify volume mounts are correct
- Check filesystem permissions

### 5. Exit Code Handling

**Symptom**: Container command explicitly returns a failure exit code.

**Diagnosis**:
```bash
kubectl describe pod <pod-name> | grep "Exit Code:"
# Exit codes other than 0 indicate failure
```

**Solutions**:
- Fix the underlying issue causing non-zero exit
- Review application logic for error handling
- Check script exit codes
- Ensure processes return 0 on success

## Step-by-Step Troubleshooting

### Step 1: Check Exit Code

```bash
kubectl describe pod <pod-name>
# Look for Exit Code in Last State section
```

### Step 2: Examine Logs

```bash
kubectl logs <pod-name>
kubectl logs <pod-name> --previous
kubectl logs <pod-name> --all-containers=true
```

### Step 3: Review Pod Events

```bash
kubectl describe pod <pod-name> | grep -A 10 "Events:"
```

### Step 4: Check Container Configuration

```bash
kubectl get pod <pod-name> -o yaml
# Review command, args, env, volumes
```

### Step 5: Test Locally

```bash
# Run the same image locally to reproduce
docker run <image-name> <command>
```

## Quick Fixes

### Immediate Actions

1. **Check logs first**: Most errors are visible in logs
   ```bash
   kubectl logs <pod-name>
   ```

2. **Restart pod**: If it's managed by a controller
   ```bash
   kubectl delete pod <pod-name>
   ```

3. **Fix configuration**: Update deployment with corrected settings

4. **Add debugging**: Temporarily use a shell to debug
   ```yaml
   command: ["/bin/sh"]
   args: ["-c", "while true; do sleep 3600; done"]
   ```

## Best Practices to Prevent Error State

1. **Proper error handling**: Add try-catch blocks and error logging
2. **Validate configuration**: Check config at startup
3. **Health checks**: Implement liveness and readiness probes
4. **Graceful shutdown**: Handle SIGTERM properly
5. **Dependency checks**: Verify dependencies are available
6. **Testing**: Test containers locally before deploying
7. **Monitoring**: Set up alerts for error states

## Exit Code Reference

Common exit codes and meanings:
- **0**: Success
- **1**: General error
- **2**: Misuse of shell command
- **126**: Command cannot execute
- **127**: Command not found
- **128+N**: Process terminated by signal N
- **130**: Process terminated by SIGINT (Ctrl+C)
- **137**: Process killed (SIGKILL)

## Related Resources

- [Troubleshooting CrashLoopBackOff Pods](/blog/troubleshooting-pods-crashloopbackoff)
- [Debugging Kubernetes Applications](/blog/debugging-kubernetes-applications)
- [Basic Troubleshooting Commands](/learn/basic-troubleshooting)

## Conclusion

Pods in Error state indicate application or configuration failures. Start by checking logs with `kubectl logs`, then examine the exit code and pod events. Most issues can be resolved by fixing the root cause identified in the logs.

Remember: Error state means the container started but the process failed. Always check logs first!

