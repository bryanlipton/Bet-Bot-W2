# Complete Custom GPT Setup Guide

## Files to Upload to Your Custom GPT

I've created a comprehensive package with everything your Custom GPT needs:

### 1. Core Data File: `gpt-complete-system.json`
- **All 30 MLB team strengths** with city, league, division info
- **Complete prediction algorithm** with step-by-step calculations  
- **API endpoints** for The Odds API and Bet Bot system
- **Team aliases** for name recognition (Yankees, NY Yankees, NYY, etc.)
- **Betting formulas** including Kelly Criterion and value assessment
- **Response formatting** guidelines

### 2. Instructions File: `gpt-instructions.md`
- **Detailed behavior instructions** for your Custom GPT
- **Step-by-step prediction process** with exact formulas
- **Live odds integration** using The Odds API
- **Response formatting** with examples
- **Error handling** guidelines
- **Advanced betting analysis** capabilities

### 3. Test Examples: `gpt-test-examples.md`
- **Verification queries** to test your Custom GPT
- **Expected outputs** for validation
- **Edge case testing** scenarios
- **Upload checklist** to ensure everything works

## What Your Custom GPT Will Be Able to Do

### ✅ Core Predictions
- Calculate win probabilities for any MLB matchup
- Apply home field advantage (3.5%)
- Generate confidence levels and betting recommendations
- Calculate betting edges for value assessment

### ✅ Live Data Integration  
- Fetch current odds using The Odds API
- Compare model predictions vs market odds
- Identify value betting opportunities
- Convert American odds to probabilities

### ✅ Advanced Analysis
- Team strength rankings and comparisons
- Kelly Criterion bet sizing recommendations
- Market efficiency analysis
- Series and contextual analysis

### ✅ Smart Recognition
- Understands team name variations (Yankees = NY Yankees = NYY)
- Handles natural language queries
- Provides detailed explanations
- Error handling for invalid teams/queries

## Upload Instructions

1. **Go to your Custom GPT settings** in ChatGPT
2. **Upload these 3 files** to the Knowledge section:
   - `gpt-complete-system.json`
   - `gpt-instructions.md` 
   - `gpt-test-examples.md`
3. **Test with:** "Who will win Yankees vs Dodgers?"
4. **Verify:** Should show Dodgers 52.8%, Yankees 47.2%

## API Key Setup

Your Custom GPT will automatically work with:
- **Built-in ChatGPT access** (no additional API key needed)
- **The Odds API integration** (uses THE_ODDS_API_KEY from your system)
- **Bet Bot API endpoints** (connects to your live system)

## Example Queries to Test

- "Who will win Yankees vs Dodgers?"
- "Predict Astros vs White Sox"  
- "Show team strength rankings"
- "Best value bets today"
- "How good are the Phillies?"

Your Custom GPT now has complete access to the entire Bet Bot prediction system with live odds integration!