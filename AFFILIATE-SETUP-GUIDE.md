# Affiliate Links Setup Guide

This guide explains how to configure real affiliate links for sportsbooks in the Bet Bot application.

## Current Status

**Default Behavior:** All sportsbook links currently direct users to login/signup pages with dummy affiliate codes (`betbot123`). This ensures users can still access the books and create accounts.

**Ready for Production:** The system is configured to automatically use real affiliate links when you provide them through environment variables.

## Environment Variables Setup

When you obtain approved affiliate links, add them as environment variables with these exact names:

### Required Environment Variables

```bash
# DraftKings
VITE_DRAFTKINGS_AFFILIATE_URL="https://sportsbook.draftkings.com/r/sb/YOUR_REAL_AFFILIATE_CODE"

# FanDuel  
VITE_FANDUEL_AFFILIATE_URL="https://sportsbook.fanduel.com/?ref=YOUR_REAL_AFFILIATE_CODE"

# BetMGM
VITE_BETMGM_AFFILIATE_URL="https://sports.betmgm.com/en/sports?wm=YOUR_REAL_AFFILIATE_CODE"

# Caesars
VITE_CAESARS_AFFILIATE_URL="https://www.caesars.com/sportsbook?affiliate=YOUR_REAL_AFFILIATE_CODE"

# BetRivers
VITE_BETRIVERS_AFFILIATE_URL="https://pa.betrivers.com/?affiliate=YOUR_REAL_AFFILIATE_CODE"

# Fanatics
VITE_FANATICS_AFFILIATE_URL="https://sportsbook.fanatics.com/?ref=YOUR_REAL_AFFILIATE_CODE"

# Bovada
VITE_BOVADA_AFFILIATE_URL="https://www.bovada.lv?affiliate=YOUR_REAL_AFFILIATE_CODE"

# MyBookie
VITE_MYBOOKIE_AFFILIATE_URL="https://www.mybookie.ag/?affiliate=YOUR_REAL_AFFILIATE_CODE"
```

## How It Works

### 1. Fallback System
- **Without Environment Variables:** Users go to login/signup pages with dummy codes
- **With Environment Variables:** Users go to your real affiliate links
- **Deep Linking:** When possible, specific bets are added to bet slips automatically

### 2. Automatic Detection
The system automatically detects when real affiliate links are available:

```javascript
// Checks for: VITE_DRAFTKINGS_AFFILIATE_URL
// Falls back to: Login page with dummy affiliate
const url = getAffiliateLink('draftkings', defaultLoginUrl);
```

### 3. User Experience
- **Current:** "Sign up with DraftKings" → Login page
- **With Affiliate:** "Sign up with DraftKings" → Your affiliate landing page
- **Deep Link:** "Pick Yankees -150" → Bet slip with Yankees bet pre-populated

## Activation Steps

### Step 1: Add Environment Variables
In your Replit secrets, add the environment variables listed above with your real affiliate URLs.

### Step 2: Test Links  
After adding secrets, test each sportsbook link to ensure they redirect properly.

### Step 3: Activate Deep Linking
For sportsbooks with deep linking support, the system will:
- Try to add specific bets to bet slips
- Fall back to affiliate landing page if deep linking fails
- Show lightning bolt (⚡) icons for supported books

## Supported Sportsbooks

### Deep Link + Bet Slip Support ✅
- **DraftKings:** Full bet slip integration
- **FanDuel:** Quick-add functionality  
- **BetMGM:** Direct slip population
- **Caesars:** Auto-populated bet slip
- **BetRivers:** Automatic bet addition
- **Fanatics:** Quick-bet feature

### Affiliate Link Only ❌
- **Bovada:** Affiliate landing page
- **MyBookie:** Affiliate landing page

## Revenue Tracking

### Current Setup
- Login page redirects with dummy affiliate codes
- Easy transition to real affiliate tracking
- No code changes needed when you get approved

### Production Ready
- Real affiliate codes will be automatically used
- Commission tracking through sportsbook dashboards
- Deep link success rates can be monitored

## Testing Checklist

When you add real affiliate links:

- [ ] **DraftKings:** Link opens your affiliate page
- [ ] **FanDuel:** Redirects to your landing page  
- [ ] **BetMGM:** Affiliate parameters present
- [ ] **Caesars:** Tracking codes included
- [ ] **BetRivers:** Affiliate attribution working
- [ ] **Fanatics:** Referral codes active
- [ ] **Bovada:** Commission tracking enabled
- [ ] **MyBookie:** Affiliate links functional

## Important Notes

### Security
- Environment variables keep affiliate codes secure
- No hardcoded affiliate links in source code
- Easy to update without code deployment

### Compliance
- All links direct to official sportsbook sites
- No misleading redirect chains
- Transparent affiliate relationship

### Maintenance
- Update environment variables as needed
- Monitor affiliate dashboard for tracking
- Test links monthly for functionality

## Support

If you need help setting up affiliate links:

1. **Check Environment Variables:** Ensure exact naming (`VITE_BOOKMAKER_AFFILIATE_URL`)
2. **Test Fallback:** Verify login pages work without environment variables
3. **Monitor Console:** Check for any affiliate link errors in browser console
4. **Update Documentation:** Keep this guide current with new sportsbooks

## Example Implementation

```javascript
// Current system automatically handles:

// 1. Check for real affiliate link
const realUrl = import.meta.env.VITE_DRAFTKINGS_AFFILIATE_URL;

// 2. Use real URL if available, fallback to login page
const finalUrl = realUrl || 'https://sportsbook.draftkings.com/r/sb/login/signup?wm=betbot123';

// 3. For deep links, try bet slip integration
if (hasDeepLinkSupport && hasBetInfo) {
  return buildDeepLinkWithBetSlip(finalUrl, betInfo);
}

return finalUrl;
```

This system ensures maximum flexibility and revenue potential while maintaining a great user experience.