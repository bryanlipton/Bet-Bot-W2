// Example usage of the new ML models
// This shows how to make requests to each model endpoint

// Example 1: NFL Model Request
const nflExample = {
  endpoint: '/api/ml/nfl-model',
  method: 'POST',
  body: {
    homeTeam: 'Kansas City Chiefs',
    awayTeam: 'Buffalo Bills',
    gameDate: '2025-01-20T18:00:00Z',
    oddsData: {
      spread: -2.5,
      moneyline: { home: -140, away: +120 },
      total: 50.5
    }
  }
};

// Example 2: NBA Model Request
const nbaExample = {
  endpoint: '/api/ml/nba-model',
  method: 'POST',
  body: {
    homeTeam: 'Los Angeles Lakers',
    awayTeam: 'Boston Celtics',
    gameDate: '2025-01-20T22:00:00Z',
    oddsData: {
      spread: -3.5,
      moneyline: { home: -160, away: +140 },
      total: 225.5
    }
  }
};

// Example 3: College Football Model Request
const cfbExample = {
  endpoint: '/api/ml/cfb-model',
  method: 'POST',
  body: {
    homeTeam: 'Alabama',
    awayTeam: 'Georgia',
    gameDate: '2025-01-20T20:00:00Z',
    oddsData: {
      spread: -7.0,
      moneyline: { home: -280, away: +220 },
      total: 52.5
    }
  }
};

// Expected Response Format (same for all models):
const exampleResponse = {
  homeWinProbability: 0.58,      // 58% chance home team wins
  awayWinProbability: 0.42,      // 42% chance away team wins
  overProbability: 0.52,          // 52% chance game goes over
  underProbability: 0.48,         // 48% chance game goes under
  predictedTotal: 48.5,           // Predicted total score (varies by sport)
  homeSpreadProbability: 0.54,    // 54% chance home covers spread
  awaySpreadProbability: 0.46,    // 46% chance away covers spread
  confidence: 0.73,               // 73% confidence in prediction
  features: 32,                   // Number of features used (32 or 36)
  sport: 'NFL',                   // Sport identifier
  timestamp: '2025-01-20T15:30:00.000Z'
};

// Using with fetch:
async function getNFLPrediction(homeTeam, awayTeam, gameDate, oddsData) {
  try {
    const response = await fetch('/api/ml/nfl-model', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        homeTeam,
        awayTeam,
        gameDate,
        oddsData
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const prediction = await response.json();
    console.log('NFL Prediction:', prediction);
    return prediction;
  } catch (error) {
    console.error('Error getting NFL prediction:', error);
    throw error;
  }
}

async function getNBAPrediction(homeTeam, awayTeam, gameDate, oddsData) {
  try {
    const response = await fetch('/api/ml/nba-model', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        homeTeam,
        awayTeam,
        gameDate,
        oddsData
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const prediction = await response.json();
    console.log('NBA Prediction:', prediction);
    return prediction;
  } catch (error) {
    console.error('Error getting NBA prediction:', error);
    throw error;
  }
}

async function getCFBPrediction(homeTeam, awayTeam, gameDate, oddsData) {
  try {
    const response = await fetch('/api/ml/cfb-model', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        homeTeam,
        awayTeam,
        gameDate,
        oddsData
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const prediction = await response.json();
    console.log('CFB Prediction:', prediction);
    return prediction;
  } catch (error) {
    console.error('Error getting CFB prediction:', error);
    throw error;
  }
}

// Example: Get predictions for all sports
async function getAllPredictions() {
  try {
    // NFL
    const nflPrediction = await getNFLPrediction(
      'Kansas City Chiefs',
      'Buffalo Bills',
      '2025-01-20T18:00:00Z',
      { spread: -2.5, moneyline: { home: -140, away: +120 }, total: 50.5 }
    );

    // NBA
    const nbaPrediction = await getNBAPrediction(
      'Los Angeles Lakers',
      'Boston Celtics',
      '2025-01-20T22:00:00Z',
      { spread: -3.5, moneyline: { home: -160, away: +140 }, total: 225.5 }
    );

    // CFB
    const cfbPrediction = await getCFBPrediction(
      'Alabama',
      'Georgia',
      '2025-01-20T20:00:00Z',
      { spread: -7.0, moneyline: { home: -280, away: +220 }, total: 52.5 }
    );

    return {
      nfl: nflPrediction,
      nba: nbaPrediction,
      cfb: cfbPrediction
    };
  } catch (error) {
    console.error('Error getting predictions:', error);
    throw error;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getNFLPrediction,
    getNBAPrediction,
    getCFBPrediction,
    getAllPredictions,
    nflExample,
    nbaExample,
    cfbExample,
    exampleResponse
  };
}

// Example usage in browser console or Node.js:
// getAllPredictions().then(predictions => console.log(predictions));
