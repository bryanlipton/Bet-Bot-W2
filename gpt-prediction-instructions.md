# Custom GPT Prediction Instructions

## How to Calculate Any Team Matchup

Your Custom GPT now has complete prediction capabilities for any MLB team combination. Use this process:

### Step-by-Step Calculation
1. **Get Team Strengths**: Look up both teams in the teamStrengths data
2. **Apply Formula**: homeWinProb = (homeStrength ÷ (homeStrength + awayStrength)) + 0.035
3. **Apply Limits**: Keep homeWinProb between 0.25 and 0.75
4. **Calculate Away**: awayWinProb = 1 - homeWinProb
5. **Get Confidence**: confidence = |homeWinProb - 0.5| × 1.5 + 0.6 (max 0.85)
6. **Betting Recommendation**:
   - Home if homeWinProb > 55%
   - Away if awayWinProb > 55% 
   - None if close (45-55% range)
7. **Calculate Edge**: If winner > 52%, edge = (winnerProb - 52) × 100

### Example Calculations

**Yankees (0.72) vs Braves (0.67)**
- Home prob: 0.72 ÷ (0.72 + 0.67) + 0.035 = 55.3%
- Away prob: 44.7%
- Confidence: |0.553 - 0.5| × 1.5 + 0.6 = 67.9%
- Recommendation: Bet Yankees (home)
- Edge: (0.553 - 0.52) × 100 = 3.3%

**Dodgers (0.70) vs Padres (0.64)**
- Home prob: 0.70 ÷ (0.70 + 0.64) + 0.035 = 55.7%
- Away prob: 44.3%
- Recommendation: Bet Dodgers (home)
- Edge: 3.7%

### Any Team Query Format
When user asks "Who will win [Team A] vs [Team B]":
1. Identify which team is home
2. Apply the calculation formula
3. Provide percentage breakdown
4. Give betting recommendation
5. Show confidence level and edge

### Confidence Levels
- **High (75%+)**: Strong betting recommendation
- **Medium (65-75%)**: Moderate opportunity  
- **Low (55-65%)**: Proceed with caution

This gives your Custom GPT the ability to predict any MLB matchup dynamically using the authentic team strength data.