---
title: Smart Alerting & Notifications
description: Turn signals into sensible alerts. Reduce noise, keep actionability.
---

# Smart Alerting & Notifications

Good alerting saves you from incidents. Bad alerting keeps you awake with false alarms. This guide shows you how to create actionable alerts that actually help instead of overwhelm.

## Alerting Principles

### 1. Alert on Symptoms, Not Causes

**Bad**: Alert on "high CPU usage"
**Good**: Alert on "response time > 500ms for 5 minutes"

**Why:**
- Symptoms tell you users are affected
- Causes might not impact users
- Focus on what matters

### 2. Alert on What You Can Action

**Bad**: Alert on "node disk usage > 80%"
**Good**: Alert on "node disk usage > 85% for 10 minutes"

**Why:**
- Temporary spikes are noise
- Sustained issues need attention
- Actionable alerts = clear response

### 3. Use Alert Severity Appropriately

**Critical**: Users are affected, action needed immediately
**Warning**: Potential issue, investigate soon
**Info**: Notable event, no immediate action

### 4. Reduce Noise

- Group related alerts
- Suppress during known maintenance
- Use alert fatigue thresholds
- Route non-critical to different channels

## What to Alert On

### Application-Level Alerts

**High Priority:**
- Error rate spike (> 1% for 5 minutes)
- Response time degradation (p95 > threshold)
- Availability drop (health checks failing)
- Critical business metrics (orders failing, payments failing)

**Medium Priority:**
- Warning rate increase
- Resource usage approaching limits
- Dependency health issues

### Infrastructure Alerts

**High Priority:**
- Pods crash looping
- Nodes not ready
- Control plane components down
- Out of capacity (pods can't be scheduled)

**Medium Priority:**
- High resource usage
- Disk space warning
- Network issues

### Business-Critical Alerts

**High Priority:**
- Revenue-generating features down
- Customer-facing services unavailable
- Security incidents
- Data loss risks

## Alert Examples

### Example 1: Pod CrashLoopBackOff

**Alert:**
```yaml
groups:
- name: kubernetes.pods
  rules:
  - alert: PodCrashLooping
    expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Pod {{ $labels.pod }} is crash looping"
      description: "Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} has restarted {{ $value }} times in the last 15 minutes"
```

**Why it works:**
- Only alerts on sustained crashes (5 minutes)
- Includes context (namespace, pod name)
- Critical severity = immediate attention

### Example 2: High Error Rate

**Alert:**
```yaml
- alert: HighErrorRate
  expr: |
    sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)
    /
    sum(rate(http_requests_total[5m])) by (service)
    > 0.05
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High error rate for {{ $labels.service }}"
    description: "Error rate is {{ $value | humanizePercentage }} for the last 5 minutes"
```

**Why it works:**
- Percentage based (scales with traffic)
- 5-minute window prevents false positives
- Warning level (investigate, not critical yet)

### Example 3: Node Not Ready

**Alert:**
```yaml
- alert: NodeNotReady
  expr: kube_node_status_condition{condition="Ready",status="true"} == 0
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "Node {{ $labels.node }} is not ready"
    description: "Node {{ $labels.node }} has been not ready for more than 2 minutes"
```

**Why it works:**
- Short duration (nodes should recover quickly)
- Critical (affects pod scheduling)
- Clear description

### Example 4: Response Time Degradation

**Alert:**
```yaml
- alert: HighResponseTime
  expr: |
    histogram_quantile(0.95,
      sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)
    ) > 0.5
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "High response time for {{ $labels.service }}"
    description: "95th percentile response time is {{ $value }}s for {{ $labels.service }}"
```

**Why it works:**
- Uses percentile (p95) - accounts for outliers
- 10-minute window - sustained performance issue
- Warning level - investigate before it becomes critical

## Alert Routing

### Route by Severity

**Critical Alerts:**
- Slack: #critical-alerts (with @here)
- PagerDuty: Immediate escalation
- Email: Sent immediately

**Warning Alerts:**
- Slack: #alerts channel
- PagerDuty: Low urgency
- Email: Daily digest

**Info Alerts:**
- Slack: #monitoring channel
- No PagerDuty
- Email: Weekly digest

### Route by Team

- Frontend team → Frontend alerts
- Backend team → Backend alerts
- Infrastructure team → Cluster alerts

### Route by Service

- Critical services → Immediate notification
- Non-critical services → Standard routing
- Development → Dev channel only

## Reducing Alert Noise

### 1. Use Alert Grouping

Group related alerts to reduce noise:

```yaml
route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10m
  repeat_interval: 12h
```

**Benefits:**
- Multiple pod failures = one alert group
- Reduces notification spam
- Easier to triage

### 2. Suppress During Maintenance

```yaml
inhibit_rules:
- source_match:
    severity: 'critical'
  target_match:
    severity: 'warning'
  equal: ['alertname', 'cluster']
```

**Why:**
- If critical alert fires, suppress warnings
- Reduces duplicate alerts
- Focus on what matters

### 3. Alert Fatigue Thresholds

Don't alert on every single event:

```yaml
- alert: PodRestart
  expr: increase(kube_pod_container_status_restarts_total[1h]) > 0
  # Only alert if > 3 restarts in an hour
  expr: increase(kube_pod_container_status_restarts_total[1h]) > 3
```

### 4. Time-Based Routing

Route alerts based on time:

```yaml
routes:
- match:
    severity: warning
  receiver: 'weekday-only'
  # Only route during business hours
```

## Alert Best Practices

### 1. Include Context

**Bad:**
```
Alert: High CPU usage
```

**Good:**
```
Alert: High CPU usage on pod web-app-abc123
Namespace: production
CPU: 850m / 1000m (85%)
Duration: 10 minutes
Node: worker-1
```

### 2. Include Runbooks

Every alert should link to a runbook:

```yaml
annotations:
  summary: "Pod crash looping"
  description: "Pod {{ $labels.pod }} is crash looping"
  runbook_url: "https://wiki.company.com/runbooks/pod-crashloop"
```

### 3. Test Alerts

```bash
# Test alert rule
promtool test rules alert-rules.yml

# Send test alert
curl -X POST http://alertmanager:9093/api/v1/alerts \
  -d '[{
    "labels": {"alertname": "TestAlert", "severity": "warning"}
  }]'
```

### 4. Review and Tune

**Regular review:**
- Weekly: Review alert frequency
- Monthly: Remove unused alerts
- Quarterly: Review alert thresholds

**Metrics to track:**
- Alert volume
- False positive rate
- Mean time to acknowledge
- Mean time to resolve

## Practical Alert Configuration

### Prometheus AlertManager Config

```yaml
global:
  resolve_timeout: 5m

route:
  receiver: 'default-receiver'
  group_by: ['alertname', 'cluster']
  group_wait: 10s
  group_interval: 10m
  repeat_interval: 12h
  
  routes:
  # Critical alerts - immediate
  - match:
      severity: critical
    receiver: 'critical-team'
    continue: true
    
  # Warning alerts - business hours
  - match:
      severity: warning
    receiver: 'warning-team'
    routes:
    - match_re:
        time: '^(09|10|11|12|13|14|15|16|17):'
      receiver: 'warning-team-immediate'
    - receiver: 'warning-team-delayed'

inhibit_rules:
- source_match:
    severity: 'critical'
  target_match:
    severity: 'warning'
  equal: ['alertname', 'cluster']

receivers:
- name: 'critical-team'
  slack_configs:
  - api_url: 'YOUR_SLACK_WEBHOOK'
    channel: '#critical-alerts'
    title: '🚨 Critical Alert'
    text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
    
- name: 'warning-team'
  slack_configs:
  - api_url: 'YOUR_SLACK_WEBHOOK'
    channel: '#alerts'
    title: '⚠️ Warning'
```

## Common Alert Patterns

### Pattern 1: Rate-Based Alerts

```yaml
# Alert on increasing error rate
expr: rate(http_requests_total{status="500"}[5m]) > 10
```

### Pattern 2: Threshold Alerts

```yaml
# Alert on resource usage
expr: (container_memory_usage_bytes / container_spec_memory_limit_bytes) > 0.9
```

### Pattern 3: Absence Alerts

```yaml
# Alert when metric disappears
expr: up{job="my-service"} == 0
```

### Pattern 4: Comparison Alerts

```yaml
# Alert when current vs historical
expr: |
  (avg_over_time(metric[1h]) - avg_over_time(metric[6h])) 
  / avg_over_time(metric[6h]) > 0.2
```

## Monitoring Alert Health

### Track Alert Metrics

- Alert volume over time
- Alert resolution time
- False positive rate
- Alert acknowledgment time

### Alert on Alerts

```yaml
# Alert if too many alerts firing
- alert: TooManyAlerts
  expr: count(ALERTS{alertstate="firing"}) > 50
  annotations:
    summary: "Too many alerts firing"
```

## Key Takeaways

1. **Alert on symptoms users experience**, not just technical metrics
2. **Use appropriate severity levels** - not everything is critical
3. **Include context** in alert messages
4. **Group related alerts** to reduce noise
5. **Test your alerts** before production
6. **Review regularly** and tune thresholds
7. **Link to runbooks** for faster resolution
8. **Route intelligently** based on severity and team
9. **Monitor alert health** itself
10. **Start simple**, add complexity only when needed

Good alerting is an art. Start with the basics, measure what happens, and continuously improve. Your future self (and your team) will thank you!
