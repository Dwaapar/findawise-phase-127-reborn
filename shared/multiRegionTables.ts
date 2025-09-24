/**
 * Multi-Region Load Orchestrator Database Schema
 * Enterprise-grade tables for global load balancing and failover management
 */

import { pgTable, text, integer, jsonb, timestamp, boolean, real, uuid } from 'drizzle-orm/pg-core';

// ================================
// REGION CONFIGURATION
// ================================

export const regions = pgTable('regions', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  location: jsonb('location').notNull(), // { country, continent, coordinates }
  endpoints: jsonb('endpoints').notNull(), // { primary, secondary, websocket }
  capacity: jsonb('capacity').notNull(), // { max_concurrent_users, max_requests_per_second, bandwidth_mbps }
  load_balancing: jsonb('load_balancing').notNull(), // { weight, priority, sticky_sessions }
  auto_scaling: jsonb('auto_scaling').notNull(), // { enabled, min_instances, max_instances, targets, thresholds }
  status: text('status').notNull().default('healthy'), // healthy, degraded, unhealthy, maintenance
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// ================================
// REGION HEALTH MONITORING
// ================================

export const regionHealth = pgTable('region_health', {
  id: uuid('id').defaultRandom().primaryKey(),
  region_id: text('region_id').notNull().references(() => regions.id, { onDelete: 'cascade' }),
  status: text('status').notNull(), // healthy, degraded, unhealthy, maintenance
  response_time_ms: integer('response_time_ms').notNull().default(0),
  cpu_usage: real('cpu_usage').notNull().default(0),
  memory_usage: real('memory_usage').notNull().default(0),
  disk_usage: real('disk_usage').notNull().default(0),
  network_throughput: real('network_throughput').notNull().default(0),
  error_rate: real('error_rate').notNull().default(0),
  active_connections: integer('active_connections').notNull().default(0),
  queue_length: integer('queue_length').notNull().default(0),
  availability_percentage: real('availability_percentage').notNull().default(100),
  health_score: real('health_score').notNull().default(100), // Composite health score
  check_timestamp: timestamp('check_timestamp').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// ================================
// LOAD BALANCING RULES
// ================================

export const loadBalancingRules = pgTable('load_balancing_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // geo, latency, capacity, custom, ai_driven
  conditions: jsonb('conditions').notNull(), // Array of rule conditions
  actions: jsonb('actions').notNull(), // Array of rule actions
  priority: integer('priority').notNull().default(0),
  enabled: boolean('enabled').notNull().default(true),
  effectiveness_score: real('effectiveness_score').notNull().default(0),
  usage_count: integer('usage_count').notNull().default(0),
  created_by: text('created_by').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// ================================
// TRAFFIC DISTRIBUTION ANALYTICS
// ================================

export const trafficDistribution = pgTable('traffic_distribution', {
  id: uuid('id').defaultRandom().primaryKey(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  total_requests: integer('total_requests').notNull().default(0),
  total_users: integer('total_users').notNull().default(0),
  average_response_time: real('average_response_time').notNull().default(0),
  global_error_rate: real('global_error_rate').notNull().default(0),
  peak_concurrent_users: integer('peak_concurrent_users').notNull().default(0),
  bandwidth_utilization: real('bandwidth_utilization').notNull().default(0),
  distribution_efficiency: real('distribution_efficiency').notNull().default(0), // AI-calculated efficiency
  regions_data: jsonb('regions_data').notNull(), // Per-region statistics
  geographic_spread: jsonb('geographic_spread').notNull(), // Geographic distribution analysis
  user_experience_score: real('user_experience_score').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// ================================
// FAILOVER EVENTS
// ================================

export const failoverEvents = pgTable('failover_events', {
  id: text('id').primaryKey(), // Custom ID like failover_timestamp
  event_type: text('event_type').notNull(), // automatic, manual, scheduled
  trigger_reason: text('trigger_reason').notNull(), // health_check_failed, overload, maintenance, etc.
  from_region: text('from_region').notNull().references(() => regions.id),
  to_region: text('to_region').notNull().references(() => regions.id),
  affected_users: integer('affected_users').notNull().default(0),
  affected_requests: integer('affected_requests').notNull().default(0),
  recovery_time_seconds: integer('recovery_time_seconds').notNull().default(0),
  downtime_seconds: integer('downtime_seconds').notNull().default(0),
  data_consistency_check: boolean('data_consistency_check').notNull().default(false),
  rollback_available: boolean('rollback_available').notNull().default(false),
  impact_assessment: jsonb('impact_assessment').notNull(), // Detailed impact analysis
  automated_actions: jsonb('automated_actions').notNull(), // Actions taken during failover
  manual_interventions: jsonb('manual_interventions'), // Manual steps taken
  lessons_learned: text('lessons_learned'), // Post-incident analysis
  resolution_status: text('resolution_status').notNull().default('resolved'), // ongoing, resolved, investigating
  created_at: timestamp('created_at').defaultNow().notNull(),
  resolved_at: timestamp('resolved_at')
});

// ================================
// ROUTING DECISIONS
// ================================

export const routingDecisions = pgTable('routing_decisions', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: text('user_id'),
  session_id: text('session_id'),
  request_id: text('request_id'),
  user_location: jsonb('user_location'), // { country, continent, coordinates, ip, timezone }
  user_agent: text('user_agent'),
  selected_region: text('selected_region').notNull().references(() => regions.id),
  routing_algorithm: text('routing_algorithm').notNull(), // geo, latency, capacity, ai_optimized
  applied_rules: jsonb('applied_rules'), // Rules that influenced the decision
  decision_factors: jsonb('decision_factors'), // Factors considered in routing
  routing_latency_ms: integer('routing_latency_ms').notNull().default(0),
  prediction_confidence: real('prediction_confidence').notNull().default(0),
  actual_performance: jsonb('actual_performance'), // Actual performance after routing
  user_satisfaction_score: real('user_satisfaction_score'), // Feedback-based score
  business_impact: jsonb('business_impact'), // Revenue, conversion impact
  created_at: timestamp('created_at').defaultNow().notNull()
});

// ================================
// AUTO-SCALING EVENTS
// ================================

export const autoScalingEvents = pgTable('auto_scaling_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  region_id: text('region_id').notNull().references(() => regions.id, { onDelete: 'cascade' }),
  scaling_action: text('scaling_action').notNull(), // scale_up, scale_down, maintain
  trigger_metric: text('trigger_metric').notNull(), // cpu, memory, requests, custom
  trigger_value: real('trigger_value').notNull(),
  threshold_value: real('threshold_value').notNull(),
  instances_before: integer('instances_before').notNull(),
  instances_after: integer('instances_after').notNull(),
  scaling_duration_seconds: integer('scaling_duration_seconds').notNull().default(0),
  cost_impact: real('cost_impact').notNull().default(0), // Cost change from scaling
  performance_impact: jsonb('performance_impact'), // Performance metrics before/after
  prediction_accuracy: real('prediction_accuracy'), // How accurate was the scaling prediction
  rollback_triggered: boolean('rollback_triggered').notNull().default(false),
  automation_confidence: real('automation_confidence').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// ================================
// GLOBAL PERFORMANCE METRICS
// ================================

export const globalPerformanceMetrics = pgTable('global_performance_metrics', {
  id: uuid('id').defaultRandom().primaryKey(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  metric_type: text('metric_type').notNull(), // hourly, daily, weekly, real_time
  
  // Overall System Performance
  global_uptime_percentage: real('global_uptime_percentage').notNull().default(100),
  average_response_time: real('average_response_time').notNull().default(0),
  p95_response_time: real('p95_response_time').notNull().default(0),
  p99_response_time: real('p99_response_time').notNull().default(0),
  
  // Traffic Metrics
  total_requests: integer('total_requests').notNull().default(0),
  successful_requests: integer('successful_requests').notNull().default(0),
  failed_requests: integer('failed_requests').notNull().default(0),
  peak_concurrent_users: integer('peak_concurrent_users').notNull().default(0),
  
  // Geographic Distribution
  regions_active: integer('regions_active').notNull().default(0),
  cross_region_requests: integer('cross_region_requests').notNull().default(0),
  geographic_efficiency: real('geographic_efficiency').notNull().default(0),
  
  // Business Impact
  revenue_impact: real('revenue_impact').notNull().default(0),
  conversion_rate: real('conversion_rate').notNull().default(0),
  user_satisfaction_avg: real('user_satisfaction_avg').notNull().default(0),
  sla_compliance_percentage: real('sla_compliance_percentage').notNull().default(100),
  
  // Predictive Analytics
  predicted_growth_rate: real('predicted_growth_rate').notNull().default(0),
  capacity_utilization: real('capacity_utilization').notNull().default(0),
  optimization_opportunities: jsonb('optimization_opportunities'), // AI-identified optimization chances
  
  created_at: timestamp('created_at').defaultNow().notNull()
});

// ================================
// DISASTER RECOVERY SCENARIOS
// ================================

export const disasterRecoveryScenarios = pgTable('disaster_recovery_scenarios', {
  id: uuid('id').defaultRandom().primaryKey(),
  scenario_name: text('scenario_name').notNull(),
  scenario_type: text('scenario_type').notNull(), // region_failure, network_partition, ddos, natural_disaster
  affected_regions: jsonb('affected_regions').notNull(), // Array of region IDs
  backup_regions: jsonb('backup_regions').notNull(), // Array of backup region IDs
  
  // Recovery Strategy
  recovery_strategy: jsonb('recovery_strategy').notNull(), // Detailed recovery plan
  estimated_recovery_time: integer('estimated_recovery_time').notNull().default(0), // seconds
  data_recovery_method: text('data_recovery_method').notNull(), // sync, async, manual
  business_continuity_plan: jsonb('business_continuity_plan'), // Business continuity steps
  
  // Testing & Validation
  last_tested: timestamp('last_tested'),
  test_success_rate: real('test_success_rate').notNull().default(0),
  identified_gaps: jsonb('identified_gaps'), // Gaps found during testing
  
  // Execution History
  times_executed: integer('times_executed').notNull().default(0),
  average_execution_time: real('average_execution_time').notNull().default(0),
  success_rate: real('success_rate').notNull().default(0),
  
  created_by: text('created_by').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});