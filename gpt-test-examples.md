# Test Examples for Your Custom GPT

Once you upload the files, test your Custom GPT with these examples:

## 1. Basic Prediction Queries

**Input:** "Who will win Yankees vs Dodgers?"
**Expected Output:**
- Dodgers 52.8%, Yankees 47.2%
- Confidence: 64.2%
- Recommendation: No bet (too close)
- Edge: 0.8%

**Input:** "Predict Astros vs White Sox"
**Expected Output:**
- Astros 60.6%, White Sox 39.4%
- Confidence: 75.9% 
- Recommendation: Bet Astros (away)
- Edge: 8.6%

**Input:** "Giants at Yankees prediction"
**Expected Output:**
- Yankees 56.0%, Giants 44.0%
- Confidence: 69.0%
- Recommendation: Bet Yankees (home)
- Edge: 4.0%

## 2. Team Information Queries

**Input:** "Show me team strength rankings"
**Expected Output:**
Top teams with percentages:
1. Yankees: 72%
2. Dodgers: 70%
3. Astros: 68%
[...continue through all 30 teams...]

**Input:** "How good are the Phillies?"
**Expected Output:**
- Phillies strength: 65% (5th strongest)
- League: NL East
- Analysis of their competitive level

## 3. Betting Analysis

**Input:** "Best bets today"
**Expected Output:**
- Request for current date/games
- Analysis of highest-edge opportunities
- Specific recommendations with reasoning

**Input:** "Value betting opportunities"
**Expected Output:**
- Explanation of value betting concept
- How to compare model vs market odds
- Kelly Criterion sizing guidance

## 4. Advanced Queries

**Input:** "Yankees vs Braves series analysis"
**Expected Output:**
- Head-to-head prediction
- Historical context
- Key factors affecting the matchup

**Input:** "AL East rankings"
**Expected Output:**
Teams ranked by strength:
1. Yankees (72%)
2. Orioles (61%)
3. Red Sox (58%)
4. Blue Jays (48%)
5. Rays (50%)

## 5. Edge Case Testing

**Input:** "Who will win Lakers vs Cowboys?"
**Expected Output:**
- Error message explaining NBA/NFL teams not supported
- Redirect to MLB teams available

**Input:** "Predict Boston vs New York"
**Expected Output:**
- Request clarification (Red Sox vs Yankees? Mets?)
- Show available options

## File Upload Checklist

Upload these files to your Custom GPT:

1. **gpt-complete-system.json** - Main data file with teams, odds, API info
2. **gpt-instructions.md** - Detailed instructions for how to behave
3. **gpt-test-examples.md** - This file for testing

## API Key Requirements

Your Custom GPT will need:
- **THE_ODDS_API_KEY** - For live odds data
- **OPENAI_API_KEY** - Already provided by ChatGPT

## Verification Steps

1. Upload all files to Custom GPT knowledge base
2. Test with "Who will win Yankees vs Dodgers?"
3. Verify calculations match expected results
4. Test edge cases and error handling
5. Confirm betting recommendations appear

Your Custom GPT should now have complete access to the Bet Bot prediction system!