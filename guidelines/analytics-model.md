# Analytics Data Model

## Overview
To support the dashboard analytics (Impressions, Interactions, Geo-location, and Widget performance), we will introduce two high-volume tables to track user activity.

These tables are designed to support high-throughput inserts and aggregated reporting.

## Entities

### 1. Analytics Impressions (`analytics_impressions`)
Tracks every time a widget is loaded on a client site.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `bigint` (generated always as identity) | Primary Key |
| `project_id` | `text` | FK references `projects.project_id`. Specifies which widget was loaded. |
| `visitor_id` | `uuid` | A unique identifier (cookie/local storage) to track unique visitors vs total views. |
| `session_id` | `uuid` | To group events within a single browsing session. |
| `url` | `text` | The full URL where the widget was loaded. |
| `referrer` | `text` | The referrer URL. |
| `user_agent` | `text` | Browser user agent string. |
| `geo_country` | `text` | Country code (e.g., 'US', 'IL'). Derived from IP. |
| `geo_city` | `text` | City name. Derived from IP. |
| `geo_lat` | `float` | Latitude. |
| `geo_lng` | `float` | Longitude. |
| `created_at` | `timestamptz` | When the impression occurred. Default `now()`. |

**Indexes needed:**
- `(project_id, created_at)`: For filtering by date and project.
- `(created_at)`: For global trends (e.g., "Total Impressions" sparkline).

### 2. Analytics Events (`analytics_events`)
Tracks user interactions within the widget (Clicks, Questions, Form Submits).

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `bigint` (generated always as identity) | Primary Key |
| `project_id` | `text` | FK references `projects.project_id`. |
| `visitor_id` | `uuid` | Correlates with the impression. |
| `session_id` | `uuid` | Correlates with the impression session. |
| `event_type` | `text` / `enum` | Type of interaction: `click_bubble`, `open_chat`, `ask_question`, `click_suggestion`, `submit_form`, `click_contact`. |
| `event_label` | `text` | Optional label (e.g., "Booking Button", "Email Link"). |
| `event_data` | `jsonb` | Rich data (e.g., the actual question text asked, form payload metadata). |
| `created_at` | `timestamptz` | When the event occurred. Default `now()`. |

**Indexes needed:**
- `(project_id, event_type, created_at)`: For "Top Widgets" and "Interactions" charts.
- `(created_at)`: For "Total Interactions" line chart.

---

## Mapping to Dashboard Components

| Dashboard Component | Data Source | Query Logic |
| :--- | :--- | :--- |
| **Total Interactions (Header Card)** | `analytics_events` | `COUNT(*)` where `created_at` > start_date. Group by day for the Sparkline/Line Chart. |
| **Total Impressions (Header Card)** | `analytics_impressions` | `COUNT(*)` where `created_at` > start_date. |
| **Top 3 Widgets (List)** | `analytics_events` | `COUNT(*)` grouped by `project_id`, sort desc, limit 3. |
| **Impressions by Widget (Donut)** | `analytics_impressions` | `COUNT(*)` grouped by `project_id`. |
| **Impressions by Location (Map)** | `analytics_impressions` | `COUNT(*)` grouped by `geo_lat`, `geo_lng` (or clustered by city). |

---

## Future Considerations
- **Data Retention**: These tables grow fast. Consider partitioning by month (Postgres Partitioning) if volume exceeds millions of rows/month.
- **Rollups**: For faster dashboard loading, a background job (or materialized view) should aggregagte these raw rows into `daily_analytics_stats` (project_id, date, impressions_count, interactions_count).
