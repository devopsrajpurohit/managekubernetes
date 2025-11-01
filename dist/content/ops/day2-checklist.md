---
title: Day-2 Checklist
description: Printable weekly checklist for SLOs, backups, and security basics.
---

# Day-2 Checklist

A practical weekly checklist for maintaining your Kubernetes cluster. Print this out, keep it handy, and use it to ensure nothing falls through the cracks.

## Weekly Checklist

### Cluster Health

- [ ] **Check node status**
  ```bash
  kubectl get nodes
  ```
  - All nodes should be `Ready`
  - No nodes in `NotReady` for extended time

- [ ] **Review node conditions**
  ```bash
  kubectl describe nodes | grep -A 5 "Conditions"
  ```
  - No MemoryPressure
  - No DiskPressure
  - No PIDPressure

- [ ] **Check control plane health**
  ```bash
  kubectl get pods -n kube-system
  kubectl get --raw /healthz
  ```
  - All control plane pods running
  - API server healthy

- [ ] **Review pending pods**
  ```bash
  kubectl get pods --all-namespaces --field-selector=status.phase=Pending
  ```
  - Investigate any pending pods
  - Check for resource constraints

### Application Health

- [ ] **Check for crash looping pods**
  ```bash
  kubectl get pods --all-namespaces | grep -E "CrashLoopBackOff|Error"
  ```
  - Investigate and fix crash loops
  - Review logs for root cause

- [ ] **Review pod restarts**
  ```bash
  kubectl get pods --all-namespaces | awk '$4>0'
  ```
  - Investigate pods with frequent restarts
  - Check if restarts are expected

- [ ] **Check resource usage**
  ```bash
  kubectl top pods --all-namespaces
  kubectl top nodes
  ```
  - Identify pods using excessive resources
  - Check for throttling/OOMKilled

- [ ] **Review application logs**
  ```bash
  # Check error logs
  kubectl logs -l app=my-app --tail=100 | grep -i error
  ```
  - Look for error patterns
  - Check for warnings

### Performance Monitoring

- [ ] **Review response times**
  - Check p95/p99 latency metrics
  - Compare with SLO targets
  - Investigate if above thresholds

- [ ] **Check error rates**
  ```bash
  # If using Prometheus
  rate(http_requests_total{status=~"5.."}[5m])
  ```
  - Error rate should be < 1%
  - Investigate spikes

- [ ] **Review throughput**
  - Check request volume trends
  - Identify peak usage periods
  - Plan capacity accordingly

### Capacity Planning

- [ ] **Check node utilization**
  ```bash
  kubectl top nodes
  kubectl describe nodes | grep -A 2 "Capacity\|Allocatable"
  ```
  - CPU utilization: Target 70-80%
  - Memory utilization: Target 70-80%
  - Plan scaling if > 90%

- [ ] **Review resource requests/limits**
  ```bash
  kubectl describe pod <pod-name> | grep -A 4 "Requests\|Limits"
  ```
  - Compare requests vs actual usage
  - Identify over-provisioned pods
  - Identify under-provisioned pods

- [ ] **Check for scheduling issues**
  ```bash
  kubectl get events --all-namespaces | grep -i "insufficient"
  ```
  - Look for "Insufficient cpu" or "Insufficient memory"
  - Plan node scaling if frequent

### Security

- [ ] **Review RBAC**
  ```bash
  kubectl get roles,rolebindings --all-namespaces
  kubectl get clusterroles,clusterrolebindings
  ```
  - Check for overly permissive roles
  - Review service account permissions
  - Remove unused bindings

- [ ] **Check for exposed secrets**
  ```bash
  kubectl get secrets --all-namespaces
  ```
  - Review secret usage
  - Rotate secrets if needed
  - Check for secrets in logs

- [ ] **Review network policies**
  ```bash
  kubectl get networkpolicies --all-namespaces
  ```
  - Ensure policies are applied
  - Review and tighten rules

- [ ] **Check image vulnerabilities**
  - Scan container images
  - Update base images if needed
  - Review security advisories

- [ ] **Review pod security**
  ```bash
  kubectl get pods --all-namespaces -o jsonpath='{.items[*].spec.securityContext}'
  ```
  - Ensure pods don't run as root
  - Check security contexts
  - Review privilege escalations

### Backups & Disaster Recovery

- [ ] **Verify etcd backups**
  - Confirm backups are running
  - Test restore procedure
  - Verify backup integrity

- [ ] **Review application backups**
  - Database backups verified
  - Application data backed up
  - Backup retention policy reviewed

- [ ] **Test disaster recovery**
  - Document recovery procedures
  - Test restore from backup (quarterly)
  - Update runbooks if needed

### Configuration Management

- [ ] **Review ConfigMaps and Secrets**
  ```bash
  kubectl get configmaps,secrets --all-namespaces
  ```
  - Remove unused ConfigMaps
  - Remove unused Secrets
  - Review for sensitive data

- [ ] **Check for deprecated APIs**
  ```bash
  kubectl get --raw /api/v1 | grep -i deprecated
  ```
  - Review deprecation warnings
  - Plan API version migrations

- [ ] **Review resource versions**
  - Check Kubernetes version compatibility
  - Plan upgrades if needed

### Cost Optimization

- [ ] **Review resource waste**
  ```bash
  kubectl top pods --all-namespaces
  ```
  - Identify over-provisioned pods
  - Identify idle pods
  - Right-size resources

- [ ] **Check for unused resources**
  ```bash
  kubectl get deployments,services,pvc --all-namespaces
  ```
  - Remove unused deployments
  - Remove unused services
  - Clean up unused PVCs

- [ ] **Review node costs**
  - Check node utilization
  - Consider spot instances for non-critical
  - Review reserved instance usage

### Monitoring & Alerting

- [ ] **Review alert history**
  - Check alert volume
  - Review false positives
  - Tune alert thresholds if needed

- [ ] **Verify monitoring coverage**
  - All critical services monitored
  - Key metrics being collected
  - Dashboards up to date

- [ ] **Test alerting**
  - Verify alerts are firing
  - Check alert routing
  - Update runbooks if needed

### Documentation

- [ ] **Update runbooks**
  - Document new procedures
  - Update outdated information
  - Review incident responses

- [ ] **Review architecture docs**
  - Update service diagrams
  - Document configuration changes
  - Update contact information

- [ ] **Review change log**
  - Document recent changes
  - Note any issues encountered
  - Update lessons learned

## Monthly Checklist

### Capacity Review

- [ ] **Review growth trends**
  - Analyze resource usage trends
  - Project future capacity needs
  - Plan scaling accordingly

- [ ] **Review SLOs/SLAs**
  - Compare actual vs targets
  - Adjust targets if needed
  - Review with stakeholders

### Security Audit

- [ ] **Comprehensive RBAC review**
  - Audit all roles and bindings
  - Remove unnecessary permissions
  - Document access patterns

- [ ] **Vulnerability scanning**
  - Scan all container images
  - Review security advisories
  - Update vulnerable components

- [ ] **Review network policies**
  - Audit all network rules
  - Tighten policies if possible
  - Document network topology

### Cost Analysis

- [ ] **Detailed cost breakdown**
  - Analyze costs by namespace
  - Analyze costs by service
  - Identify optimization opportunities

- [ ] **Review resource allocation**
  - Right-size all workloads
  - Remove unused resources
  - Optimize node types

### Disaster Recovery

- [ ] **Test backup restore**
  - Restore from etcd backup
  - Test application restore
  - Document any issues

- [ ] **Review DR procedures**
  - Update recovery procedures
  - Test failover scenarios
  - Update contact lists

## Quarterly Checklist

### Upgrade Planning

- [ ] **Review Kubernetes versions**
  - Check current versions
  - Review upgrade paths
  - Plan upgrade schedule

- [ ] **Review dependency versions**
  - Update base images
  - Review library versions
  - Plan dependency updates

### Architecture Review

- [ ] **Review architecture**
  - Evaluate current architecture
  - Identify improvement opportunities
  - Plan architectural changes

- [ ] **Performance optimization**
  - Review performance metrics
  - Identify bottlenecks
  - Plan optimizations

### Team Training

- [ ] **Review team skills**
  - Identify training needs
  - Plan knowledge sharing
  - Update documentation

## Quick Commands Reference

```bash
# Cluster health
kubectl get nodes
kubectl get pods -n kube-system
kubectl get --raw /healthz

# Application health
kubectl get pods --all-namespaces
kubectl top pods --all-namespaces
kubectl get events --sort-by='.lastTimestamp' | tail -20

# Resource usage
kubectl top nodes
kubectl describe nodes | grep -A 5 "Capacity\|Allocatable"

# Security
kubectl get roles,rolebindings --all-namespaces
kubectl get networkpolicies --all-namespaces

# Troubleshooting
kubectl describe pod <pod-name>
kubectl logs <pod-name>
kubectl get events --field-selector involvedObject.name=<pod-name>
```

## Notes Section

Use this space to document issues, findings, or action items:

_________________________________________________________________________
_________________________________________________________________________
_________________________________________________________________________
_________________________________________________________________________
_________________________________________________________________________

## Tips

- **Automate what you can**: Use tools to automate routine checks
- **Focus on trends**: Look for patterns over time, not just current state
- **Document everything**: Future you will thank current you
- **Don't skip reviews**: Regular reviews prevent small issues becoming big ones
- **Share knowledge**: Document findings for the team

---

**Last Review Date:** _________________

**Reviewed By:** _________________

**Next Review Date:** _________________

Keep this checklist visible and make it part of your routine. Consistent maintenance prevents incidents and reduces stress!
