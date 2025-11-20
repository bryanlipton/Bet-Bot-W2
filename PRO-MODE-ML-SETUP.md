# Pro Mode & ML Integration Setup Guide

## Task 1: Enable Pro Mode in Supabase (Manual Step)

### What You Need to Do:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: `bdavwqheohdnrskntqhl`

2. **Navigate to Table Editor**
   - Click on "Table Editor" in the left sidebar
   - Select the `profiles` table

3. **Find Your User Row**
   - Look for the row with your user account (the one you're currently logged in as)
   - You can identify it by your email or user ID

4. **Edit the is_pro Column**
   - Click the edit button (pencil icon) on your user row
   - Find the `is_pro` column
   - Change the value from `FALSE` to `TRUE`
   - Click "Save" to apply the change

### Verify It Worked:

After saving the change, refresh your website and check:
- ✅ "PRO" badge should appear in the header
- ✅ Lock pick should be visible
- ✅ Pro features should now be unlocked
- ✅ You should see detailed analysis and ML-powered predictions

## Task 2: ML Server Integration (Already Implemented)

The following changes have been implemented to connect the Digital Ocean ML server:

### 1. Created ML Integration Endpoint
**File:** `api/ml/get-prediction.js`
- Fetches real ML predictions from Digital Ocean server
- Converts ML probabilities to letter grades (A+ to C-)
- Handles fallback gracefully when ML server is unavailable
- Endpoint: `/api/ml/get-prediction`

### 2. Updated Daily Pick Generation
**File:** `api/picks/generate-daily.js`
- Now attempts to enhance picks with ML predictions
- Falls back to BettingRecommendationEngine if ML unavailable
- Marks picks as `mlPowered: true` when using ML data
- Logs whether pick is ML Enhanced or BettingEngine

### 3. Updated Lock Pick Generation
**File:** `api/picks/generate-lock.js`
- Same ML enhancement as daily picks
- Falls back gracefully when ML unavailable
- Includes ML factors when available

### 4. Environment Variables
**File:** `.env`
- Added `ML_SERVER_URL=http://104.236.118.108:3001`
- This should also be set in Vercel environment variables

## ML Server Configuration in Vercel

To complete the ML integration in production:

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add the following variable:
   ```
   ML_SERVER_URL=http://104.236.118.108:3001
   ```
4. Redeploy your application

## How It Works

### System Flow:
1. User loads dashboard → Frontend fetches games
2. Daily pick generation is triggered
3. System calls Digital Ocean ML server at `http://104.236.118.108:3001/api/ml-prediction`
4. ML model analyzes game → Returns probabilities & confidence
5. System converts to grade → Displays to user
6. If ML fails → Falls back to BettingRecommendationEngine

### Grade Conversion:
- Confidence >= 90% → A+
- Confidence >= 85% → A
- Confidence >= 80% → A-
- Confidence >= 75% → B+
- Confidence >= 70% → B
- Confidence >= 65% → B-
- Confidence >= 60% → C+
- Confidence >= 55% → C
- Below 55% → C-

## Testing ML Integration

### Test ML Endpoint Directly:
```bash
curl -X GET "https://your-app.vercel.app/api/ml/get-prediction?homeTeam=Yankees&awayTeam=Red%20Sox&sport=MLB"
```

### Check Daily Pick with ML:
```bash
curl -X GET "https://your-app.vercel.app/api/picks/generate-daily"
```

Look for `mlPowered: true` in the response to confirm ML is working.

## Troubleshooting

### If ML Server is Offline:
- System automatically falls back to BettingRecommendationEngine
- Grades will still be generated (just not ML-enhanced)
- Check logs for "⚠️ ML enhancement unavailable" messages

### If Pro Badge Not Showing:
- Verify `is_pro = TRUE` in Supabase profiles table
- Clear browser cache and refresh
- Check browser console for authentication errors

### If Grades Look the Same:
- ML server might be offline (check with curl test above)
- Fallback grades from BettingEngine will look similar
- Check API logs for ML connection status

## Success Criteria

✅ **Pro Mode Active:**
- "PRO" badge shows in header
- Lock pick is visible
- All pro features unlocked
- Can see detailed analysis

✅ **ML Grades Working:**
- Daily picks show ML-powered grades
- Lock picks show ML-powered grades
- Grades vary based on actual game analysis
- Confidence scores reflect ML predictions
- Different games have different grades
- `mlPowered: true` flag in API responses

✅ **System Flow:**
- Dashboard loads successfully
- Games display with grades
- ML server called for predictions
- Fallback works when ML unavailable
- Real AI-powered grades displayed (not hardcoded)
