# Game State Design Reference - Pick Tiles Visual Guide

## Overview
This document shows the exact visual states for Pick of the Day and Logged In Lock Pick tiles across different game phases.

## State 1: Upcoming Games (Scheduled)
**When:** Game hasn't started yet, shows full betting interface

### Desktop Expanded View
```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 Pick of the Day                    Grade B+ [info]       │
│ Jul 24 at 3:10 PM EST • Globe Life Field                   │
│                                                             │
│ Atlanta Braves @ Texas Rangers                              │
│ ┌─────────────────┐ vs ┌─────────────────┐                │
│ │ ATL             │    │ TEX             │                │
│ │ +165            │    │ -185            │ [Pick] [Fade]  │
│ │ Sean Murphy     │    │ Adolis García   │                │
│ └─────────────────┘    └─────────────────┘                │
│                                                             │
│ Analysis Factors (6 factors in 2 columns):                 │
│ [info] Market Edge        82  [info] Pitching Matchup   75 │
│ [info] Situational Edge   78  [info] Team Momentum      73 │
│ [info] System Confidence  85  [info] Offensive Prod.    79 │
│                                                             │
│ Pick Details: Texas Rangers ML                             │
│ Reasoning: Strong home field advantage...                  │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Collapsed View
```
┌─────────────────────────────────────────────┐
│ 🤖 Pick of the Day              Grade B+    │
│ TEX +165 vs ATL                             │
│                           [Show Analysis ▼] │
└─────────────────────────────────────────────┘
```

## State 2: Live Games (In Progress)
**When:** Game has started, shows frozen odds + live scores

### Desktop Expanded View with Live Scorebug
```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 Pick of the Day                    Grade B+ [info]       │
│ Jul 24 at 3:10 PM EST • Globe Life Field                   │
│                                                             │
│ Atlanta Braves @ Texas Rangers                              │
│ ┌─────────────────┐ vs ┌─────────────────┐                │
│ │ ATL             │    │ TEX             │                │
│ │ +165 (frozen)   │    │ -185 (frozen)   │ [Pick] [Fade]  │
│ │ Sean Murphy     │    │ Adolis García   │                │
│ └─────────────────┘    └─────────────────┘                │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │            🏟️ LIVE SCOREBOARD                          │ │
│ │                                                         │ │
│ │     ATL    │    T6    │    TEX                         │ │
│ │      2     │  ⚾ Live  │     4                          │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Analysis Factors: [Collapsed during live games]            │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Collapsed View with Mini Scorebug
```
┌─────────────────────────────────────────────┐
│ 🤖 Pick of the Day              Grade B+    │
│ TEX +165 vs ATL                             │
│ ┌─────────────────┐              [Expand ▲] │
│ │ ATL  TEX        │                        │
│ │  2    4   T6    │                        │
│ └─────────────────┘                        │
└─────────────────────────────────────────────┘
```

## State 3: Finished Games (Completed)
**When:** Game has ended, shows final scores + win/loss badge

### Desktop Expanded View with Won Badge
```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 Pick of the Day                    Grade B+ [info]  [WON]│
│ Jul 24 at 3:10 PM EST • Globe Life Field                   │
│                                                             │
│ Atlanta Braves @ Texas Rangers                              │
│ ┌─────────────────┐ vs ┌─────────────────┐                │
│ │ ATL             │    │ TEX             │                │
│ │ +165 (final)    │    │ -185 (final)    │ [Pick] [Fade]  │
│ │ Sean Murphy     │    │ Adolis García   │                │
│ └─────────────────┘    └─────────────────┘                │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │            🏆 FINAL SCORE                               │ │
│ │                                                         │ │
│ │     ATL    │     F     │    TEX                         │ │
│ │      3     │   Final   │     7                          │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Pick Result: ✅ Texas Rangers won 7-3                      │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Collapsed View with Won Badge  
```
┌─────────────────────────────────────────────┐
│ 🤖 Pick of the Day              Grade B+ [WON]│
│ TEX +165 vs ATL                             │
│ ┌─────────────────┐              [Expand ▲] │
│ │ ATL  TEX        │                        │
│ │  3    7    F    │                        │
│ └─────────────────┘                        │
└─────────────────────────────────────────────┘
```

### Desktop Expanded View with Lost Badge
```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 Pick of the Day                    Grade B+ [info] [LOST]│
│ Jul 24 at 3:10 PM EST • Globe Life Field                   │
│                                                             │
│ Atlanta Braves @ Texas Rangers                              │
│ ┌─────────────────┐ vs ┌─────────────────┐                │
│ │ ATL             │    │ TEX             │                │
│ │ +165 (final)    │    │ -185 (final)    │ [Pick] [Fade]  │
│ │ Sean Murphy     │    │ Adolis García   │                │
│ └─────────────────┘    └─────────────────┘                │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │            💔 FINAL SCORE                               │ │
│ │                                                         │ │
│ │     ATL    │     F     │    TEX                         │ │
│ │      8     │   Final   │     2                          │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Pick Result: ❌ Texas Rangers lost 2-8                     │
└─────────────────────────────────────────────────────────────┘
```

## Badge Colors and Styling

### Win/Loss Badges (Top-Right Corner)
- **WON**: Green background (`bg-green-500`), white text, font-bold
- **LOST**: Red background (`bg-red-500`), white text, font-bold  
- **TIED**: Gray background (`bg-gray-500`), white text, font-bold

### Grade Badges (Header)
- **A+/A**: Blue background (`bg-blue-500/400`), black text
- **B+/B**: Blue background (`bg-blue-300`), black text
- **C+/C**: Gray background (`bg-gray-500`), black text
- **D+/D**: Orange background (`bg-orange-500`), black text

### Mini Scorebug Styling
- Background: Light gray (`bg-gray-100 dark:bg-gray-800`)
- Team abbreviations: Small font (`text-xs`), gray text
- Scores: Bold font (`font-bold text-sm`)
- Status: "F" for final, inning number for live (e.g., "T6", "B3")

## Responsive Behavior

### Desktop (xl+ screens): 
- Side-by-side Pick of the Day and Lock Pick
- Analysis factors start expanded
- Large scoreboards for live/finished games

### Mobile (< xl screens):
- Stacked layout, one pick above the other  
- Analysis factors start collapsed with "Show Analysis" buttons
- Mini scorebugs in collapsed views

## Automatic State Transitions

1. **2 AM Daily**: New picks generated, replaces previous day
2. **Game Start**: Switches to live mode, freezes odds, shows live scores
3. **Game End**: Displays final scores, automatically grades pick, shows badge
4. **Next Day 2 AM**: Resets to new picks for next day's games

The Rangers game will show the live scorebug once the system detects it has started based on the scheduled game time and MLB API status updates.