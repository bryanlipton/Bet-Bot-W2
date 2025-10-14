# ML Models Feature Comparison

## Quick Reference Table

| Sport | Features | Output Range | Specific Features |
|-------|----------|--------------|-------------------|
| **Baseball** | 27 | 0-20 runs | Batting avg, ERA, OPS, Statcast metrics |
| **NFL** | 32 | 0-70 points | QB stats, rushing/passing yards, turnovers |
| **NBA** | 32 | 180-260 points | Shooting %, pace, ratings, star player impact |
| **CFB** | 36 | 10-80 points | Rankings, rivalry games, advanced metrics |

## Feature Categories Breakdown

### Baseball (27 features)
```
Basic Team Stats (10)
├── Batting averages (home/away)
├── ERA (home/away)
├── OPS (home/away)
└── Starter ERA & WHIP (home/away)

Statcast Metrics (10)
├── xwOBA (home/away)
├── Barrel % (home/away)
├── Hard Hit % (home/away)
├── Exit Velocity (home/away)
└── Pitching xwOBA (home/away)

Situational (5)
├── Home field advantage
├── Weather score
├── Recent form (home/away)
└── Head-to-head record

Weather (2)
├── Temperature
└── Wind speed
```

### NFL (32 features)
```
Offensive Stats (8)
├── Passing yards per game (home/away)
├── Rushing yards per game (home/away)
├── Points per game (home/away)
└── Turnovers (home/away)

Offensive Efficiency (4)
├── Red zone efficiency (home/away)
└── Third down conversion % (home/away)

Defensive Stats (6)
├── Yards allowed (home/away)
├── Points allowed (home/away)
└── Sacks (home/away)

Defensive Playmaking (4)
├── Interceptions (home/away)
└── Tackles for loss (home/away)

QB Stats (4)
├── QB rating (home/away)
└── Completion % (home/away)

Team Momentum (4)
├── Recent form - last 5 games (home/away)
└── Rest days (home/away)

Weather (2)
├── Temperature
└── Wind speed
```

### NBA (32 features)
```
Offensive Stats (6)
├── Points per game (home/away)
├── Field goal % (home/away)
└── Three-point % (home/away)

Advanced Offensive (4)
├── Assists per game (home/away)
└── Offensive rating (home/away)

Pace & Tempo (2)
└── Pace (home/away)

Defensive Stats (4)
├── Points allowed per game (home/away)
└── Defensive rating (home/away)

Defensive Activity (4)
├── Rebounds per game (home/away)
└── Steals per game (home/away)

Defensive Presence (2)
└── Blocks per game (home/away)

Star Player Impact (4)
├── Star player points (home/away)
└── Star player assists (home/away)

Team Momentum (4)
├── Recent form - last 10 games (home/away)
└── Back-to-back games flag (home/away)

Matchup Analysis (2)
├── Offensive-defensive rating differential
└── Pace matchup
```

### CFB (36 features)
```
Offensive Stats (6)
├── Points per game (home/away)
├── Total yards per game (home/away)
└── Rushing yards (home/away)

Offensive Passing (2)
└── Passing yards (home/away)

Turnovers (2)
└── Turnovers (home/away)

Defensive Stats (6)
├── Yards allowed (home/away)
├── Points allowed (home/away)
└── Sacks (home/away)

Defensive Playmaking (2)
└── Turnovers forced (home/away)

Advanced Metrics (4)
├── Success rate (home/away)
└── Explosiveness (home/away)

Line Play (2)
└── Line yards (home/away)

Rankings & Strength (4)
├── AP poll rank (home/away) *inverted*
└── Strength of schedule (home/away)

Home Field & Rivalry (2)
├── Home field advantage (stronger effect)
└── Rivalry game flag

Situational (2)
└── Bye week flag (home/away)

Conference (2)
└── Conference game flag (home/away)

Weather (2)
├── Temperature
└── Weather impact score
```

## Key Differences

### Normalization Ranges

| Feature Type | Baseball | NFL | NBA | CFB |
|--------------|----------|-----|-----|-----|
| **Points** | N/A | 10-40 | 90-130 | 10-50 |
| **Win Probability** | 0-1 | 0-1 | 0-1 | 0-1 |
| **Predicted Total** | 0-20 runs | 0-70 pts | 180-260 pts | 10-80 pts |

### Sport-Specific Features

**Baseball Only:**
- Statcast metrics (xwOBA, barrel %, exit velocity)
- Pitcher-specific stats (ERA, WHIP)
- Small-ball metrics (OPS, batting average)

**NFL Only:**
- Red zone efficiency
- Third down conversions
- Tackles for loss
- Rest days (short week games)

**NBA Only:**
- Pace statistics
- Back-to-back game indicators
- Star player impact (individual performance matters more)
- Offensive/Defensive ratings

**CFB Only:**
- AP Poll rankings (prestige matters)
- Rivalry game indicators
- Bye week advantages
- Conference game factors
- Line yards (more run-heavy)
- Success rate & explosiveness

### Home Field Advantage

| Sport | Home Win % | Notes |
|-------|-----------|-------|
| Baseball | ~54% | Moderate advantage |
| NFL | ~57% | Strong advantage |
| NBA | ~60% | Strong advantage |
| CFB | ~58-66% | Strongest advantage, varies by program |

### Weather Impact

| Sport | Temperature Range | Wind Impact | Notes |
|-------|------------------|-------------|-------|
| Baseball | 40-100°F | High | Wind affects fly balls significantly |
| NFL | 20-100°F | Very High | Cold/wind affects passing games |
| NBA | N/A | None | Indoor sport (mostly) |
| CFB | 30-100°F | High | Outdoor, weather affects play style |

## Model Outputs (Identical Across All Sports)

All models return 7 predictions plus metadata:

```javascript
{
  // Win Probabilities
  homeWinProbability: 0.0 - 1.0,
  awayWinProbability: 0.0 - 1.0,
  
  // Over/Under
  overProbability: 0.0 - 1.0,
  underProbability: 0.0 - 1.0,
  predictedTotal: <sport-specific range>,
  
  // Spread
  homeSpreadProbability: 0.0 - 1.0,
  awaySpreadProbability: 0.0 - 1.0,
  
  // Metadata
  confidence: 0.65 - 0.95,
  features: 27/32/36,
  sport: 'MLB'|'NFL'|'NBA'|'CFB',
  timestamp: ISO8601
}
```

## Implementation Status

| Component | Baseball | NFL | NBA | CFB |
|-----------|----------|-----|-----|-----|
| Model File | ✅ Existing | ✅ New | ✅ New | ✅ New |
| Feature Extraction | ✅ | ✅ | ✅ | ✅ |
| Normalization | ✅ | ✅ | ✅ | ✅ |
| Neural Network | ✅ | ✅ | ✅ | ✅ |
| Error Handling | ✅ | ✅ | ✅ | ✅ |
| API Endpoint | ✅ | ✅ Ready | ✅ Ready | ✅ Ready |
| Real Data Integration | 🔄 Partial | ⏳ Pending | ⏳ Pending | ⏳ Pending |
| Model Training | ⏳ Pending | ⏳ Pending | ⏳ Pending | ⏳ Pending |

Legend:
- ✅ Complete
- 🔄 In Progress
- ⏳ Pending
- ❌ Not Started

## Next Steps for Each Model

### All Models
1. Integrate real-time data APIs
2. Train with historical game data
3. Save and load trained weights
4. Add model versioning
5. Implement A/B testing

### NFL Specific
- Integrate with NFL.com Stats API
- Add player injury tracking
- Consider playoff vs regular season contexts

### NBA Specific  
- Integrate with NBA Stats API
- Add player load management factors
- Consider playoff intensification

### CFB Specific
- Integrate with CollegeFootballData.com
- Add recruiting rankings impact
- Consider conference strength variations
- Add bowl game contexts
