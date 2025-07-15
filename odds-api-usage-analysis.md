# Odds API Usage Analysis

## Current Daily API Call Count: ~400-450 calls/day

### Breakdown by Component:

#### 1. Frontend Dashboard (Primary Usage)
- **Route**: `/api/odds/live/:sport` 
- **Frequency**: Every 30 seconds when dashboard is active
- **Sports**: NFL, NBA, MLB (3 calls per refresh)
- **Daily estimate**: 3 × 120 refreshes = **360 calls/day**

#### 2. Article Generation System  
- **Route**: `getCurrentOdds('baseball_mlb')`
- **Frequency**: 4 times daily (every 6 hours)
- **Daily total**: **4 calls/day**

#### 3. Backend API Routes
- `/api/odds/current/:sport` - On-demand
- `/api/odds/events/:sport` - Occasional  
- `/api/mlb/complete-schedule` - Regular intervals
- **Daily estimate**: **20-30 calls/day**

#### 4. GPT Export System
- **Route**: `getCurrentOdds('baseball_mlb')` 
- **Frequency**: On-demand (when GPT is accessed)
- **Daily estimate**: **10-20 calls/day**

### API Call Locations in Code:
```
server/services/oddsApi.ts:46 - getCurrentOdds() 
server/routes.ts:107,195,337,394 - Various endpoints
server/routes-gpt-export.ts:100,217,575 - GPT exports  
server/routes-odds.ts:70 - Live odds endpoint
```

### The Odds API Free Tier Limit: 500 calls/month

**Current Usage**: 400-450 calls/day × 30 days = **12,000-13,500 calls/month**

⚠️ **CRITICAL**: You're using 24-27x the free tier limit!

### Recommendations:
1. Implement caching with 5-10 minute TTL
2. Reduce frontend refresh frequency to 2-5 minutes  
3. Add API call monitoring and throttling
4. Consider upgrading to paid plan ($25/month for 10,000 calls)