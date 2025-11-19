import * as tf from '@tensorflow/tfjs-node';

// Global model instance
let model = null;
let isModelLoaded = false;

// 32 input features for NBA predictions
const FEATURE_NAMES = [
  // Offensive Stats (6)
  'homePointsPerGame', 'awayPointsPerGame',
  'homeFieldGoalPercent', 'awayFieldGoalPercent',
  'homeThreePointPercent', 'awayThreePointPercent',
  
  // Advanced Offensive (4)
  'homeAssistsPerGame', 'awayAssistsPerGame',
  'homeOffensiveRating', 'awayOffensiveRating',
  
  // Pace & Tempo (2)
  'homePace', 'awayPace',
  
  // Defensive Stats (4)
  'homePointsAllowedPerGame', 'awayPointsAllowedPerGame',
  'homeDefensiveRating', 'awayDefensiveRating',
  
  // Defensive Activity (4)
  'homeReboundsPerGame', 'awayReboundsPerGame',
  'homeStealsPerGame', 'awayStealsPerGame',
  
  // Defensive Presence (2)
  'homeBlocksPerGame', 'awayBlocksPerGame',
  
  // Star Player Impact (4)
  'homeStarPoints', 'awayStarPoints',
  'homeStarAssists', 'awayStarAssists',
  
  // Team Momentum & Situational (4)
  'homeRecentForm', 'awayRecentForm',
  'homeBackToBack', 'awayBackToBack',
  
  // Matchup Analysis (2)
  'offensiveDefensiveDifferential', 'paceMatchup'
];

async function initializeModel() {
  if (isModelLoaded && model) {
    return model;
  }

  try {
    console.log('🏀 Initializing NBA AI Model...');
    
    // Create neural network with same architecture as baseball model
    model = tf.sequential({
      layers: [
        // Input layer: 32 features
        tf.layers.dense({
          inputShape: [32],
          units: 64,
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }),
          name: 'input_layer'
        }),
        
        // Dropout for regularization
        tf.layers.dropout({ 
          rate: 0.3,
          name: 'dropout_1'
        }),
        
        // Hidden layer 2
        tf.layers.dense({
          units: 32,
          activation: 'relu', 
          kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }),
          name: 'hidden_layer_2'
        }),
        
        // Dropout 2
        tf.layers.dropout({ 
          rate: 0.2,
          name: 'dropout_2'
        }),
        
        // Hidden layer 3
        tf.layers.dense({
          units: 16,
          activation: 'relu',
          name: 'hidden_layer_3'
        }),
        
        // Output layer: 7 predictions
        tf.layers.dense({
          units: 7,
          activation: 'sigmoid',
          name: 'output_layer'
        })
      ]
    });

    // Compile model
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    console.log('⚡ NBA Model architecture created successfully');
    console.log(`📊 Model summary: ${model.countParams()} total parameters`);
    
    isModelLoaded = true;
    return model;
    
  } catch (error) {
    console.error('❌ NBA Model initialization error:', error);
    throw error;
  }
}

async function extractGameFeatures(homeTeam, awayTeam, gameDate, oddsData = null) {
  try {
    console.log(`🔍 Extracting NBA features for ${awayTeam} @ ${homeTeam}`);
    
    // Get team statistics from various sources
    const [teamStats, recentForm, matchupData] = await Promise.all([
      getTeamStatistics(homeTeam, awayTeam),
      getRecentForm(homeTeam, awayTeam),
      getMatchupAnalysis(homeTeam, awayTeam)
    ]);

    // Build the 32-feature vector
    const features = [
      // Offensive Stats (6)
      teamStats.home.pointsPerGame || 112.0,
      teamStats.away.pointsPerGame || 112.0,
      teamStats.home.fieldGoalPercent || 0.46,
      teamStats.away.fieldGoalPercent || 0.46,
      teamStats.home.threePointPercent || 0.36,
      teamStats.away.threePointPercent || 0.36,
      
      // Advanced Offensive (4)
      teamStats.home.assistsPerGame || 24.0,
      teamStats.away.assistsPerGame || 24.0,
      teamStats.home.offensiveRating || 110.0,
      teamStats.away.offensiveRating || 110.0,
      
      // Pace & Tempo (2)
      teamStats.home.pace || 100.0,
      teamStats.away.pace || 100.0,
      
      // Defensive Stats (4)
      teamStats.home.pointsAllowedPerGame || 112.0,
      teamStats.away.pointsAllowedPerGame || 112.0,
      teamStats.home.defensiveRating || 110.0,
      teamStats.away.defensiveRating || 110.0,
      
      // Defensive Activity (4)
      teamStats.home.reboundsPerGame || 44.0,
      teamStats.away.reboundsPerGame || 44.0,
      teamStats.home.stealsPerGame || 7.5,
      teamStats.away.stealsPerGame || 7.5,
      
      // Defensive Presence (2)
      teamStats.home.blocksPerGame || 5.0,
      teamStats.away.blocksPerGame || 5.0,
      
      // Star Player Impact (4)
      teamStats.home.starPoints || 25.0,
      teamStats.away.starPoints || 25.0,
      teamStats.home.starAssists || 6.0,
      teamStats.away.starAssists || 6.0,
      
      // Team Momentum & Situational (4)
      recentForm.home || 0.5,
      recentForm.away || 0.5,
      teamStats.home.backToBack || 0,
      teamStats.away.backToBack || 0,
      
      // Matchup Analysis (2)
      matchupData.offDefDifferential || 0.5,
      matchupData.paceMatchup || 0.5
    ];

    // Normalize features to 0-1 range
    const normalizedFeatures = normalizeFeatures(features);
    
    console.log(`✅ Extracted ${normalizedFeatures.length} NBA features successfully`);
    return normalizedFeatures;
    
  } catch (error) {
    console.error('❌ NBA Feature extraction error:', error);
    
    // Return default normalized features if extraction fails
    return new Array(32).fill(0.5);
  }
}

async function getTeamStatistics(homeTeam, awayTeam) {
  try {
    // In a full implementation, this would call NBA APIs (ESPN, NBA.com, etc.)
    // For now, return realistic NBA averages with variation
    
    const baseStats = {
      pointsPerGame: 105.0 + (Math.random() * 20.0), // 105-125 range
      fieldGoalPercent: 0.43 + (Math.random() * 0.10), // 0.43-0.53 range
      threePointPercent: 0.33 + (Math.random() * 0.10), // 0.33-0.43 range
      assistsPerGame: 20.0 + (Math.random() * 10.0), // 20-30 range
      offensiveRating: 105.0 + (Math.random() * 15.0), // 105-120 range
      pace: 95.0 + (Math.random() * 10.0), // 95-105 range
      pointsAllowedPerGame: 105.0 + (Math.random() * 20.0), // 105-125 range
      defensiveRating: 105.0 + (Math.random() * 15.0), // 105-120 range
      reboundsPerGame: 40.0 + (Math.random() * 10.0), // 40-50 range
      stealsPerGame: 6.0 + (Math.random() * 4.0), // 6-10 range
      blocksPerGame: 4.0 + (Math.random() * 4.0), // 4-8 range
      starPoints: 20.0 + (Math.random() * 15.0), // 20-35 range
      starAssists: 4.0 + (Math.random() * 8.0), // 4-12 range
      backToBack: Math.random() > 0.8 ? 1 : 0 // 20% chance of back-to-back
    };

    return {
      home: { ...baseStats },
      away: { ...baseStats }
    };
    
  } catch (error) {
    console.error('NBA team statistics error:', error);
    return {
      home: {},
      away: {}
    };
  }
}

async function getRecentForm(homeTeam, awayTeam) {
  try {
    // Mock recent form - in production, get last 10 games from NBA API
    return {
      home: 0.2 + (Math.random() * 0.6), // 0.2-0.8 range (20-80% recent win rate)
      away: 0.2 + (Math.random() * 0.6)
    };
  } catch (error) {
    return {
      home: 0.5,
      away: 0.5
    };
  }
}

async function getMatchupAnalysis(homeTeam, awayTeam) {
  try {
    // Mock matchup analysis - in production, calculate from team stats
    return {
      offDefDifferential: 0.3 + (Math.random() * 0.4), // 0.3-0.7 range
      paceMatchup: 0.3 + (Math.random() * 0.4) // 0.3-0.7 range
    };
  } catch (error) {
    return {
      offDefDifferential: 0.5,
      paceMatchup: 0.5
    };
  }
}

function normalizeFeatures(features) {
  // Define normalization ranges for each feature type
  const ranges = {
    // Points: 90-130
    points: { min: 90.0, max: 130.0 },
    // FG%: 0.40-0.55
    fgPercent: { min: 0.40, max: 0.55 },
    // 3P%: 0.30-0.45
    threePercent: { min: 0.30, max: 0.45 },
    // Assists: 18-32
    assists: { min: 18.0, max: 32.0 },
    // Rating: 100-120
    rating: { min: 100.0, max: 120.0 },
    // Pace: 92-108
    pace: { min: 92.0, max: 108.0 },
    // Rebounds: 38-52
    rebounds: { min: 38.0, max: 52.0 },
    // Steals: 5-12
    steals: { min: 5.0, max: 12.0 },
    // Blocks: 3-9
    blocks: { min: 3.0, max: 9.0 },
    // Star points: 15-40
    starPoints: { min: 15.0, max: 40.0 },
    // Star assists: 3-15
    starAssists: { min: 3.0, max: 15.0 }
  };

  const normalized = [];
  
  for (let i = 0; i < features.length; i++) {
    let value = features[i];
    let range;
    
    // Determine appropriate range based on feature index
    if (i < 2) range = ranges.points; // Points per game
    else if (i < 4) range = ranges.fgPercent; // FG%
    else if (i < 6) range = ranges.threePercent; // 3P%
    else if (i < 8) range = ranges.assists; // Assists
    else if (i < 10) range = ranges.rating; // Offensive rating
    else if (i < 12) range = ranges.pace; // Pace
    else if (i < 14) range = ranges.points; // Points allowed
    else if (i < 16) range = ranges.rating; // Defensive rating
    else if (i < 18) range = ranges.rebounds; // Rebounds
    else if (i < 20) range = ranges.steals; // Steals
    else if (i < 22) range = ranges.blocks; // Blocks
    else if (i < 24) range = ranges.starPoints; // Star player points
    else if (i < 26) range = ranges.starAssists; // Star player assists
    else if (i < 28) range = { min: 0, max: 1 }; // Recent form
    else if (i < 30) range = { min: 0, max: 1 }; // Back-to-back (binary)
    else range = { min: 0, max: 1 }; // Matchup analysis
    
    // Normalize to 0-1 range
    const normalizedValue = Math.max(0, Math.min(1, 
      (value - range.min) / (range.max - range.min)
    ));
    
    normalized.push(normalizedValue);
  }
  
  return normalized;
}

export default async function handler(req, res) {
  try {
    const { homeTeam, awayTeam, gameDate, oddsData } = req.body;
    
    if (!homeTeam || !awayTeam) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    console.log(`🏀 NBA ML Prediction Request: ${awayTeam} @ ${homeTeam}`);
    
    // Initialize model
    const mlModel = await initializeModel();
    
    // Extract 32 features
    const features = await extractGameFeatures(homeTeam, awayTeam, gameDate, oddsData);
    
    // Make prediction
    const featureVector = tf.tensor2d([features]);
    const prediction = mlModel.predict(featureVector);
    const predictionData = await prediction.data();
    
    // Clean up tensors
    featureVector.dispose();
    prediction.dispose();
    
    // Process 7 output predictions
    const result = {
      homeWinProbability: predictionData[0],
      awayWinProbability: predictionData[1], 
      overProbability: predictionData[2],
      underProbability: predictionData[3],
      predictedTotal: (predictionData[4] * 80) + 180, // Denormalize (0-1 -> 180-260 points)
      homeSpreadProbability: predictionData[5],
      awaySpreadProbability: predictionData[6],
      
      // Additional analysis
      confidence: calculateModelConfidence(predictionData),
      features: features.length,
      sport: 'NBA',
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ NBA ML Prediction: Home ${(result.homeWinProbability * 100).toFixed(1)}%, Away ${(result.awayWinProbability * 100).toFixed(1)}%`);
    
    res.status(200).json(result);
    
  } catch (error) {
    console.error('❌ NBA ML Model error:', error);
    res.status(500).json({ 
      error: 'NBA model prediction failed',
      details: error.message 
    });
  }
}

function calculateModelConfidence(predictions) {
  // Calculate confidence based on prediction certainty
  const maxProb = Math.max(...predictions.slice(0, 2)); // Home/Away win probs
  const margin = Math.abs(predictions[0] - predictions[1]); // Difference between home/away
  
  // Higher confidence when prediction is more certain
  const baseConfidence = 0.65; // 65% base confidence
  const certaintyBonus = margin * 0.3; // Up to 30% bonus for certainty
  const strengthBonus = (maxProb - 0.5) * 0.2; // Up to 10% bonus for strong prediction
  
  return Math.min(0.95, baseConfidence + certaintyBonus + strengthBonus);
}
