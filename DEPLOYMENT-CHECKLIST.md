# 🚀 Deployment Checklist for Bet Bot

## Pre-Deployment Verification

### 1. Environment Variables
- [ ] Verify all environment variables are set in Replit Secrets
- [ ] Confirm `DATABASE_URL` points to production database
- [ ] Ensure `THE_ODDS_API_KEY` is valid and has sufficient quota
- [ ] Check `SESSION_SECRET` is secure and unique

### 2. Database Schema
- [ ] Run `npm run db:push` to sync schema changes
- [ ] Verify database migrations are applied
- [ ] Check that all required tables exist and have data

### 3. Build Process
- [ ] Test build locally: `npm run build`
- [ ] Ensure no build errors or TypeScript issues
- [ ] Verify all assets are properly bundled

### 4. Critical Features
- [ ] Daily Pick generation working with BetBot integration
- [ ] Lock Pick generation with duplicate team prevention
- [ ] User authentication and session management
- [ ] Database persistence (picks, users, etc.)
- [ ] API endpoints responding correctly

### 5. Performance & Security
- [ ] Check for any hardcoded temporary paths
- [ ] Verify no sensitive data in logs
- [ ] Confirm all file operations use persistent storage
- [ ] Test WebSocket connections

## Deployment Steps

1. **Push all changes to Replit:**
   ```
   git add .
   git commit -m "Pre-deployment: Ready for production"
   ```

2. **Trigger deployment:**
   - Click "Deploy" button in Replit
   - Select deployment target (autoscale recommended)
   - Monitor deployment logs

3. **Post-deployment verification:**
   - [ ] Test main pages load correctly
   - [ ] Verify database connections work
   - [ ] Check API endpoints respond
   - [ ] Confirm daily picks are generated
   - [ ] Test user authentication flow

## Rollback Plan

If deployment fails:
1. Check deployment logs in Replit console
2. Verify environment variables in production
3. Use Replit's rollback feature if available
4. Report specific error messages for debugging

## Important Notes

- **File Persistence**: All application data is stored in PostgreSQL database
- **Static Assets**: All critical assets are bundled, no external dependencies
- **Environment Config**: Production uses `NODE_ENV=production`
- **Port Configuration**: Uses `0.0.0.0:5000` for proper accessibility

## When to Redeploy

✅ **Always redeploy after these changes:**
- Database schema updates (shared/schema.ts)
- Environment variable changes
- New API endpoints or routes
- Build configuration changes
- Critical bug fixes
- New features affecting production users

🔔 **Reminder**: This checklist ensures your BetBot integration with C+ grade filtering and duplicate team prevention works reliably in production.