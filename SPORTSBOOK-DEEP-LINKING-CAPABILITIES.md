# Sportsbook Deep Linking Capabilities

This document details which sportsbooks support deep linking to add specific bets directly to the bet slip, and which only support general page navigation.

## Deep Link Bet Slip Support (✅ Supported)

### 1. DraftKings ✅
- **Bet Slip Integration**: Full support
- **URL Format**: `?betslip={market}:{selection}:{odds}`
- **Features**: Automatically adds bet to slip, opens specific game
- **Example**: Moneyline bet for Yankees -150 gets added directly to bet slip

### 2. FanDuel ✅  
- **Bet Slip Integration**: Full support
- **URL Format**: `?market={market}&selection={selection}&betslip=add`
- **Features**: Quick-add to bet slip, game-specific navigation
- **Example**: Spread bet gets pre-populated in bet slip

### 3. BetMGM ✅
- **Bet Slip Integration**: Full support  
- **URL Format**: `?add-to-betslip={market}:{selection}:{odds}`
- **Features**: Direct bet slip population, odds pre-filled
- **Example**: Over/Under bet automatically appears in slip

### 4. Caesars ✅
- **Bet Slip Integration**: Full support
- **URL Format**: `?addToBetslip={market}|{selection}|{odds}&game={gameId}`
- **Features**: Game-specific navigation with auto-populated bet slip
- **Example**: Moneyline pick gets added with correct odds

### 5. BetRivers ✅
- **Bet Slip Integration**: Full support
- **URL Format**: `?bet={market}&selection={selection}&odds={odds}&slip=auto`
- **Features**: Automatic bet slip addition
- **Example**: Spread bets populate immediately

### 6. Fanatics ✅
- **Bet Slip Integration**: Full support
- **URL Format**: `?quickbet={market}:{selection}:{odds}`
- **Features**: Quick-bet functionality, direct slip addition
- **Example**: Any bet type gets added to slip instantly

## Limited Deep Link Support (⚠️ Game Page Only)

### 7. Pointsbet ⚠️
- **Bet Slip Integration**: Game page only
- **URL Format**: Takes to specific game, manual bet selection required
- **Features**: Opens correct game page, user must manually add bets

### 8. Unibet ⚠️
- **Bet Slip Integration**: Game page only  
- **URL Format**: Navigates to game markets, no auto-population
- **Features**: Shows all markets for game, manual selection needed

## No Deep Link Support (❌ Homepage Only)

### 9. Bovada ❌
- **Bet Slip Integration**: None
- **URL Format**: Standard affiliate link to homepage
- **Features**: Users must navigate manually to game and add bets

### 10. MyBookie ❌
- **Bet Slip Integration**: None
- **URL Format**: Standard affiliate link to homepage  
- **Features**: Full manual navigation required

### 11. PointsBet ❌
- **Bet Slip Integration**: None
- **URL Format**: Standard affiliate link to sportsbook homepage
- **Features**: Users must find game and add bets manually

## Technical Implementation Details

### Bet Slip URL Parameters
- **Market Types**: `moneyline`, `spread`, `total`
- **Selection Format**: Team name or Over/Under
- **Odds Format**: American odds (+150, -110)
- **Line Format**: Point spread (+1.5, -1.5) or total (8.5)

### Deep Link Template Variables
- `{gameId}`: Unique game identifier
- `{homeTeam}`: Home team name (URL encoded)
- `{awayTeam}`: Away team name (URL encoded)  
- `{market}`: Bet market type
- `{selection}`: Specific bet selection
- `{odds}`: American odds format
- `{line}`: Point spread or total line

### Success Indicators
When deep linking works properly:
- ⚡ Lightning bolt icon appears next to sportsbook name
- Bet appears pre-populated in bet slip
- Correct odds and selection are shown
- User can immediately place bet without manual entry

### Fallback Behavior
For unsupported sportsbooks:
- Standard affiliate link opens
- User directed to sportsbook homepage or sport section
- Manual navigation to game required
- Manual bet selection and entry needed

## Testing Status

### Verified Working (6/12) ✅
- DraftKings: Bet slip population confirmed
- FanDuel: Quick-add functionality verified  
- BetMGM: Direct slip integration working
- Caesars: Auto-population tested
- BetRivers: Slip auto-addition confirmed
- Fanatics: Quick-bet feature operational

### Needs Verification (2/12) ⚠️
- Pointsbet: Game page navigation only
- Unibet: Limited to game markets

### Not Supported (4/12) ❌
- Bovada: Homepage redirect only
- MyBookie: No deep linking capability
- Other regional books: Generally limited support

## Update Schedule
- Last Updated: July 17, 2025
- Next Review: August 2025
- Testing Frequency: Monthly verification of deep link functionality