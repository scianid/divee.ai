# Top Performing Articles - Feature Plan

## Overview
Add a "Top Performing Articles" card to the Dashboard that shows the best performing articles based on impressions and user engagement (questions asked).

## Data Sources

| Metric | Table | Field | Notes |
|--------|-------|-------|-------|
| Impressions | `analytics_impressions` | `url` | Group by URL |
| Custom Questions | `analytics_events` | `event_data->>'article_url'` | `event_type = 'custom_question_asked'` |
| Suggested Questions | `analytics_events` | `event_data->>'article_url'` | `event_type = 'suggestion_question_asked'` |
| Article Title | `article` | `title` | Join on URL |
| Article ID | `article` | `unique_id` | For linking |
| Article Thumbnail | `article` | `image_url` | For visual display |

## Implementation Tasks

### 1. SQL Migration
**File:** `supabase/migrations/20260131000001_top_articles_aggregation.sql`

Create a function `get_top_articles_aggregated` that:
- Accepts: `p_project_ids`, `p_start_date`, `p_end_date`, `p_limit`, `p_sort_by`
- Returns: `url`, `title`, `image_url`, `impressions`, `custom_questions`, `suggested_questions`, `total_questions`
- Joins `analytics_impressions` with `analytics_events` and `article` table
- Supports sorting by "impressions" or "engagement" (questions/impressions ratio)

### 2. Stats Edge Function Handler
**File:** `supabase/functions/stats/visualizations/topArticles.ts`

```typescript
interface TopArticle {
  url: string;
  title: string;
  imageUrl: string | null;  // Thumbnail from article.image_url
  impressions: number;
  customQuestions: number;
  suggestedQuestions: number;
  totalQuestions: number;
  engagementRate: number; // (totalQuestions / impressions) * 100
}
```

**Endpoint:** `GET /stats/top-articles`

**Query params:**
- `account_id` (optional)
- `project_id` (optional)
- `start_date` (required)
- `end_date` (required)
- `limit` (default: 5)
- `sort_by` (default: "impressions" | "engagement")

### 3. Update Stats Index
**File:** `supabase/functions/stats/index.ts`

Add route for `/top-articles` endpoint.

### 4. Dashboard UI Component
**File:** `web/src/pages/Dashboard.tsx`

#### Design Specs (card grid with large images - inspired by social analytics):

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Top Performing Articles  ⓘ                               [Views] [Engagement]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐               │
│  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│   │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│   │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│               │
│  │▓▓▓  IMAGE  ▓▓▓▓▓│   │▓▓▓  IMAGE  ▓▓▓▓▓│   │▓▓▓  IMAGE  ▓▓▓▓▓│               │
│  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│   │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│   │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│               │
│  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│   │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│   │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│               │
│  └─────────────────┘   └─────────────────┘   └─────────────────┘               │
│  Article title here... This post has no...  Ready to start the...             │
│                                                                                 │
│  ▷ Views          218  ▷ Views           50  ▷ Views           41              │
│  🔗 Engagement    733  🔗 Engagement     19  🔗 Engagement     35              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Card specs:**
- Layout: Responsive grid (3 columns desktop, 2 tablet, 1 mobile)
- Image: Large, fills card width, 16:9 aspect ratio with rounded corners (8px)
- Title: Truncated with ellipsis, single line, below image
- Metrics: Views count + Engagement (questions) count with icons
- Fallback: Gradient placeholder with document icon if `image_url` is null
- Max cards: 3 (configurable)

#### Component Structure:
- Toggle: "Views" / "Engagement" (pill buttons, switches sort order)
- Grid of top 3 article cards with:
  - Large article image (clickable, opens article in new tab)
  - Article title below image (truncated)
  - Views metric row
  - Engagement metric row

#### Data Fetching:
Add to existing `fetchStats()` function:
```typescript
const topArticlesRes = await fetch(`${STATS_URL}/top-articles?${params}`);
stats.topArticles = await topArticlesRes.json();
```

### 5. Dashboard Layout Update
Position the card in the dashboard grid:
- Full width on all screen sizes
- Place after the existing stats cards
- Internal grid for the 3 article cards

## UI/UX Details

### Article Card Component:
```tsx
<div className="article-card group cursor-pointer" onClick={() => window.open(article.url, '_blank')}>
  {/* Large Image */}
  <div className="aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 mb-3">
    {article.imageUrl ? (
      <img 
        src={article.imageUrl} 
        alt={article.title} 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        <DocumentTextIcon className="w-12 h-12" />
      </div>
    )}
  </div>
  
  {/* Title */}
  <h3 className="font-medium text-gray-900 truncate mb-3 group-hover:text-blue-600">
    {article.title || 'Untitled Article'}
  </h3>
  
  {/* Metrics */}
  <div className="space-y-1 text-sm">
    <div className="flex justify-between text-gray-600">
      <span className="flex items-center gap-1.5">
        <PlayIcon className="w-4 h-4" /> Views
      </span>
      <span className="font-medium">{article.impressions.toLocaleString()}</span>
    </div>
    <div className="flex justify-between text-gray-600">
      <span className="flex items-center gap-1.5">
        <LinkIcon className="w-4 h-4" /> Engagement
      </span>
      <span className="font-medium">{article.totalQuestions.toLocaleString()}</span>
    </div>
  </div>
</div>
```

### Top Performing Articles Card Container:
```tsx
<div className="bg-white rounded-xl border border-gray-200 p-6">
  {/* Header */}
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-lg font-semibold text-gray-900">Top Performing Articles</h2>
    <div className="flex rounded-lg border border-gray-200 p-1">
      <button className={`px-3 py-1 text-sm rounded-md ${sortBy === 'views' ? 'bg-gray-100 font-medium' : ''}`}>
        Views
      </button>
      <button className={`px-3 py-1 text-sm rounded-md ${sortBy === 'engagement' ? 'bg-gray-100 font-medium' : ''}`}>
        Engagement
      </button>
    </div>
  </div>
  
  {/* Cards Grid */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {topArticles.map((article) => (
      <ArticleCard key={article.url} article={article} />
    ))}
  </div>
</div>
```

### Empty State:
"No article data yet. Articles will appear here once your widgets start receiving traffic."

### Loading State:
Skeleton loader with 5 placeholder rows.

## Sorting Options

| Sort By | Logic |
|---------|-------|
| Views (default) | ORDER BY impressions DESC |
| Engagement | ORDER BY (total_questions::float / NULLIF(impressions, 0)) DESC |

## Future Enhancements
- [ ] Click-through to detailed article analytics
- [ ] Time comparison (vs previous period)
- [ ] Export to CSV
- [ ] Filter by widget/project within the card
- [ ] Show trend arrows (up/down from previous period)

## Dependencies
- SDK must send `article_url` and `article_id` in question events ✅ (implemented)
- Need some historical data to populate the view

## Estimated Effort
- SQL Migration: 30 min
- Edge Function: 30 min  
- Dashboard UI: 1 hour
- Testing: 30 min
- **Total: ~2.5 hours**
