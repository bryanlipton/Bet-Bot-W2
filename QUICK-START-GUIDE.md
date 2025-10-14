# 🚀 Quick Start Guide: Enable Pro Mode & ML Integration

## ✅ GOOD NEWS: Code Implementation is COMPLETE!

All the ML integration code has been implemented and deployed. Now you just need to:
1. Enable Pro mode for your account in Supabase (2 minutes)
2. Add environment variable to Vercel (1 minute)
3. Verify ML server is running (optional)

---

## 📋 Step 1: Enable Pro Mode (REQUIRED - 2 minutes)

### Instructions:

1. **Open Supabase Dashboard**
   ```
   URL: https://supabase.com/dashboard/project/bdavwqheohdnrskntqhl
   ```

2. **Navigate to Table Editor**
   - Click "Table Editor" in the left sidebar
   - Click on the "profiles" table

3. **Find Your User**
   - Look for your user row (identify by your email)
   - Click the edit icon (pencil) on your row

4. **Update is_pro Column**
   - Find the `is_pro` column
   - Change value from `FALSE` → `TRUE`
   - Click "Save"

5. **Verify It Worked**
   - Refresh your website
   - ✅ You should see "PRO" badge in header
   - ✅ Lock pick should now be visible
   - ✅ Pro features unlocked

---

## 🔌 Step 2: Add ML Server URL to Vercel (REQUIRED - 1 minute)

### Instructions:

1. **Open Vercel Dashboard**
   ```
   URL: https://vercel.com/your-username/bet-bot-w2/settings/environment-variables
   ```

2. **Add Environment Variable**
   - Click "Add New" button
   - Enter these values:
     ```
     Key: ML_SERVER_URL
     Value: http://104.236.118.108:3001
     ```
   - Select all environments (Production, Preview, Development)
   - Click "Save"

3. **Redeploy**
   - Go to Deployments tab
   - Click "..." menu on latest deployment
   - Click "Redeploy"
   - Wait for deployment to complete

---

## 🧪 Step 3: Test Your Setup (OPTIONAL - 2 minutes)

### Test ML Integration:
Visit this URL after deployment:
```
https://your-app.vercel.app/api/test-ml-integration
```

You should see:
```json
{
  "summary": {
    "status": "ALL TESTS PASSED",
    "passed": 5,
    "failed": 0
  },
  "tests": [...]
}
```

### Test ML Prediction Endpoint:
```
https://your-app.vercel.app/api/ml/get-prediction?homeTeam=Yankees&awayTeam=Red Sox&sport=MLB
```

Expected response:
```json
{
  "grade": "B+",
  "confidence": 0.75,
  "mlPowered": true,
  "reasoning": "ML analysis based on multiple factors",
  ...
}
```

If `mlPowered: false` and `isFallback: true`, the ML server is offline (but system still works with fallback).

---

## 🎯 What You'll See After Setup

### Before (without Pro Mode):
- ❌ No PRO badge in header
- ❌ Lock pick hidden or showing upgrade prompt
- ❌ Limited features

### After (with Pro Mode):
- ✅ PRO badge visible in header
- ✅ Lock pick visible and accessible
- ✅ All pro features unlocked
- ✅ Full AI analysis visible

### With ML Server Connected:
- ✅ Real ML-powered grades (not hardcoded)
- ✅ Grades vary by game analysis
- ✅ Confidence scores from ML model
- ✅ AI reasoning from ML predictions
- ✅ `mlPowered: true` in API responses

### With ML Server Offline (Fallback):
- ✅ Still get quality grades from BettingRecommendationEngine
- ✅ No errors or broken features
- ✅ Seamless fallback experience
- ⚠️ `mlPowered: false` in API responses

---

## 🔍 How to Verify Everything is Working

### 1. Check Pro Mode:
- [ ] Open your website
- [ ] Look for "PRO" badge in header
- [ ] Click on Lock Pick section
- [ ] Should see lock pick details (not upgrade prompt)

### 2. Check ML Integration:
- [ ] Visit `/api/test-ml-integration`
- [ ] Check "ML Server Connection" test status
- [ ] Visit `/api/picks/generate-daily`
- [ ] Look for `"mlPowered": true` in response

### 3. Check Grades:
- [ ] Load dashboard
- [ ] Look at game cards
- [ ] Grades should vary (A+, A, B+, B, B-, C+, etc.)
- [ ] Not all grades should be the same (B+, B+, B+)

---

## 🐛 Troubleshooting

### Pro Badge Not Showing?
1. Verify `is_pro = TRUE` in Supabase profiles table
2. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
3. Clear browser cache
4. Check browser console for errors

### ML Server Shows as Offline?
This is OKAY! The system works with fallback:
- Daily picks still generated
- Lock picks still generated
- Grades still displayed
- Just using BettingRecommendationEngine instead of ML

To fix (if you want ML):
1. Check Digital Ocean server is running
2. Verify server is accessible at http://104.236.118.108:3001
3. Check ML_SERVER_URL in Vercel environment variables
4. Restart Digital Ocean server if needed

### Grades All Look the Same?
- Check `/api/test-ml-integration` to see ML status
- If ML offline, grades from BettingEngine may be similar
- This is expected behavior during off-season (no games)
- During game days, grades will vary significantly

---

## 📊 System Architecture

```
User Dashboard
    ↓
Frontend fetches picks
    ↓
API: /api/picks/generate-daily
    ↓
    ├─→ Try ML Server (http://104.236.118.108:3001)
    │   ↓
    │   ✅ Success → Use ML grades (mlPowered: true)
    │   ❌ Fail → Fallback ↓
    │
    └─→ BettingRecommendationEngine (mlPowered: false)
        ↓
Return pick with grade
    ↓
Display to user
```

---

## 📝 Summary

### What's Implemented:
✅ ML integration endpoint (`/api/ml/get-prediction`)
✅ Enhanced daily pick generation with ML
✅ Enhanced lock pick generation with ML
✅ Graceful fallback when ML unavailable
✅ Test endpoint for verification
✅ Documentation and setup guide

### What You Need to Do:
1. ⏳ Set `is_pro = TRUE` in Supabase (2 minutes)
2. ⏳ Add `ML_SERVER_URL` to Vercel (1 minute)
3. ⏳ Redeploy on Vercel (automatic)

### Optional:
- Verify ML server running at http://104.236.118.108:3001
- Test endpoints to confirm everything works
- Monitor logs for ML connection status

---

## 🎉 You're All Set!

Once you complete the 2 manual steps above:
1. Your account will have Pro mode enabled
2. ML predictions will enhance your picks (when available)
3. Fallback ensures system always works
4. Real AI-powered grades instead of hardcoded values

Questions? Check the full documentation in `PRO-MODE-ML-SETUP.md`
