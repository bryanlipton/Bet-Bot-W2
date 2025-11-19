import * as tf from '@tensorflow/tfjs-node';

// Global model instance
let model = null;
let isModelLoaded = false;

// 36 input features for College Football predictions
const FEATURE_NAMES = [
  // Offensive Stats (6)
  'homePointsPerGame', 'awayPointsPerGame',
  'homeYardsPerGame', 'awayYardsPerGame',
  'homeRushingYards', 'awayRushingYards',
  
  // Offensive Passing (2)
  'homePassingYards', 'awayPassingYards',
  
  // Turnovers (2)
  'homeTurnovers', 'awayTurnovers',
  
  // Defensive Stats (6)
  'homeYardsAllowed', 'awayYardsAllowed',
  'homePointsAllowed', 'awayPointsAllowed',
  'homeSacks', 'awaySacks',
  
  // Defensive Playmaking (2)
  'homeTurnoversForced', 'awayTurnoversForced',
  
  // Advanced Metrics (4)
  'homeSuccessRate', 'awaySuccessRate',
  'homeExplosiveness', 'awayExplosiveness',
  
  // Line Play (2)
  'homeLineYards', 'awayLineYards',
  
  // Rankings & Strength (4)
  'homeAPRank', 'awayAPRank',
  'homeStrengthOfSchedule', 'awayStrengthOfSchedule',
  
  // Home Field & Rivalry (2)
  'homeFieldAdvantage', 'rivalryGame',
  
  // Situational (2)
  'homeByeWeek', 'awayByeWeek',
  
  // Conference (2)
  'homeConferenceGame', 'awayConferenceGame',
  
  // Weather (2)
  'temperature', 'weatherImpact'
];

async function initializeModel() {
  if (isModelLoaded && model) {
    return model;
  }

  try {
    console.log('🏈 Initializing CFB AI Model...');
    
    // Create neural network with same architecture as baseball model
    model = tf.sequential({
      layers: [
        // Input layer: 36 features
        tf.layers.dense({
          inputShape: [36],
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

    console.log('⚡ CFB Model architecture created successfully');
    console.log(`📊 Model summary: ${model.countParams()} total parameters`);
    
    isModelLoaded = true;
    return model;
    
  } catch (error) {
    console.error('❌ CFB Model initialization error:', error);
    throw error;
  }
}

async function extractGameFeatures(homeTeam, awayTeam, gameDate, oddsData = null) {
  try {
    console.log(`🔍 Extracting CFB features for ${awayTeam} @ ${homeTeam}`);
    
    // Get team statistics from various sources
    const [teamStats, weatherData, situationalData, rankings] = await Promise.all([
      getTeamStatistics(homeTeam, awayTeam),
      getWeatherData(homeTeam, gameDate),
      getSituationalData(homeTeam, awayTeam),
      getRankingsData(homeTeam, awayTeam)
    ]);

    // Build the 36-feature vector
    const features = [
      // Offensive Stats (6)
      teamStats.home.pointsPerGame || 28.0,
      teamStats.away.pointsPerGame || 28.0,
      teamStats.home.yardsPerGame || 400.0,
      teamStats.away.yardsPerGame || 400.0,
      teamStats.home.rushingYards || 180.0,
      teamStats.away.rushingYards || 180.0,
      
      // Offensive Passing (2)
      teamStats.home.passingYards || 220.0,
      teamStats.away.passingYards || 220.0,
      
      // Turnovers (2)
      teamStats.home.turnovers || 1.3,
      teamStats.away.turnovers || 1.3,
      
      // Defensive Stats (6)
      teamStats.home.yardsAllowed || 380.0,
      teamStats.away.yardsAllowed || 380.0,
      teamStats.home.pointsAllowed || 26.0,
      teamStats.away.pointsAllowed || 26.0,
      teamStats.home.sacks || 2.2,
      teamStats.away.sacks || 2.2,
      
      // Defensive Playmaking (2)
      teamStats.home.turnoversForced || 1.3,
      teamStats.away.turnoversForced || 1.3,
      
      // Advanced Metrics (4)
      teamStats.home.successRate || 0.42,
      teamStats.away.successRate || 0.42,
      teamStats.home.explosiveness || 0.15,
      teamStats.away.explosiveness || 0.15,
      
      // Line Play (2)
      teamStats.home.lineYards || 3.2,
      teamStats.away.lineYards || 3.2,
      
      // Rankings & Strength (4)
      rankings.home.apRank || 50,
      rankings.away.apRank || 50,
      rankings.home.strengthOfSchedule || 0.5,
      rankings.away.strengthOfSchedule || 0.5,
      
      // Home Field & Rivalry (2)
      situationalData.homeFieldAdvantage || 0.58,
      situationalData.rivalryGame || 0,
      
      // Situational (2)
      situationalData.homeByeWeek || 0,
      situationalData.awayByeWeek || 0,
      
      // Conference (2)
      situationalData.homeConferenceGame || 0,
      situationalData.awayConferenceGame || 0,
      
      // Weather (2)
      weatherData.temperature || 65,
      weatherData.weatherImpact || 0.5
    ];

    // Normalize features to 0-1 range
    const normalizedFeatures = normalizeFeatures(features);
    
    console.log(`✅ Extracted ${normalizedFeatures.length} CFB features successfully`);
    return normalizedFeatures;
    
  } catch (error) {
    console.error('❌ CFB Feature extraction error:', error);
    
    // Return default normalized features if extraction fails
    return new Array(36).fill(0.5);
  }
}

async function getTeamStatistics(homeTeam, awayTeam) {
  try {
    // In a full implementation, this would call CFB APIs (CollegeFootballData.com, ESPN, etc.)
    // For now, return realistic CFB averages with variation
    
    const baseStats = {
      pointsPerGame: 20.0 + (Math.random() * 25.0), // 20-45 range
      yardsPerGame: 350.0 + (Math.random() * 150.0), // 350-500 range
      rushingYards: 130.0 + (Math.random() * 120.0), // 130-250 range
      passingYards: 180.0 + (Math.random() * 120.0), // 180-300 range
      turnovers: 0.8 + (Math.random() * 1.2), // 0.8-2.0 range
      yardsAllowed: 330.0 + (Math.random() * 160.0), // 330-490 range
      pointsAllowed: 18.0 + (Math.random() * 24.0), // 18-42 range
      sacks: 1.5 + (Math.random() * 2.0), // 1.5-3.5 range
      turnoversForced: 0.8 + (Math.random() * 1.2), // 0.8-2.0 range
      successRate: 0.38 + (Math.random() * 0.14), // 0.38-0.52 range
      explosiveness: 0.10 + (Math.random() * 0.15), // 0.10-0.25 range
      lineYards: 2.8 + (Math.random() * 1.2) // 2.8-4.0 range
    };

    return {
      home: { ...baseStats },
      away: { ...baseStats }
    };
    
  } catch (error) {
    console.error('CFB team statistics error:', error);
    return {
      home: {},
      away: {}
    };
  }
}

async function getWeatherData(homeTeam, gameDate) {
  try {
    // Mock weather data - in production, integrate with weather API
    return {
      temperature: 45 + (Math.random() * 40), // 45-85°F range
      weatherImpact: 0.3 + (Math.random() * 0.4) // 0.3-0.7 range
    };
  } catch (error) {
    return {
      temperature: 65,
      weatherImpact: 0.5
    };
  }
}

async function getSituationalData(homeTeam, awayTeam) {
  try {
    // Mock situational data
    return {
      homeFieldAdvantage: 0.54 + (Math.random() * 0.12), // 0.54-0.66 (home advantage is stronger in CFB)
      rivalryGame: Math.random() > 0.85 ? 1 : 0, // 15% chance of rivalry game
      homeByeWeek: Math.random() > 0.9 ? 1 : 0, // 10% chance of bye week
      awayByeWeek: Math.random() > 0.9 ? 1 : 0,
      homeConferenceGame: Math.random() > 0.4 ? 1 : 0, // 60% chance of conference game
      awayConferenceGame: Math.random() > 0.4 ? 1 : 0
    };
  } catch (error) {
    return {
      homeFieldAdvantage: 0.58,
      rivalryGame: 0,
      homeByeWeek: 0,
      awayByeWeek: 0,
      homeConferenceGame: 0,
      awayConferenceGame: 0
    };
  }
}

async function getRankingsData(homeTeam, awayTeam) {
  try {
    // Mock rankings data - in production, get from AP Poll/Coaches Poll APIs
    return {
      home: {
        apRank: 1 + (Math.random() * 130), // 1-130 range (FBS teams)
        strengthOfSchedule: 0.3 + (Math.random() * 0.4) // 0.3-0.7 range
      },
      away: {
        apRank: 1 + (Math.random() * 130),
        strengthOfSchedule: 0.3 + (Math.random() * 0.4)
      }
    };
  } catch (error) {
    return {
      home: { apRank: 65, strengthOfSchedule: 0.5 },
      away: { apRank: 65, strengthOfSchedule: 0.5 }
    };
  }
}

function normalizeFeatures(features) {
  // Define normalization ranges for each feature type
  const ranges = {
    // Points: 10-50
    points: { min: 10.0, max: 50.0 },
    // Total yards: 300-550
    yards: { min: 300.0, max: 550.0 },
    // Rushing yards: 100-300
    rushingYards: { min: 100.0, max: 300.0 },
    // Passing yards: 150-350
    passingYards: { min: 150.0, max: 350.0 },
    // Turnovers: 0.5-2.5
    turnovers: { min: 0.5, max: 2.5 },
    // Sacks: 1.0-4.0
    sacks: { min: 1.0, max: 4.0 },
    // Success rate: 0.35-0.55
    successRate: { min: 0.35, max: 0.55 },
    // Explosiveness: 0.08-0.28
    explosiveness: { min: 0.08, max: 0.28 },
    // Line yards: 2.5-4.5
    lineYards: { min: 2.5, max: 4.5 },
    // AP Rank: 1-130
    apRank: { min: 1, max: 130 },
    // Temperature: 30-100
    temp: { min: 30, max: 100 }
  };

  const normalized = [];
  
  for (let i = 0; i < features.length; i++) {
    let value = features[i];
    let range;
    
    // Determine appropriate range based on feature index
    if (i < 2) range = ranges.points; // Points per game
    else if (i < 4) range = ranges.yards; // Total yards
    else if (i < 6) range = ranges.rushingYards; // Rushing yards
    else if (i < 8) range = ranges.passingYards; // Passing yards
    else if (i < 10) range = ranges.turnovers; // Turnovers
    else if (i < 12) range = ranges.yards; // Yards allowed
    else if (i < 14) range = ranges.points; // Points allowed
    else if (i < 16) range = ranges.sacks; // Sacks
    else if (i < 18) range = ranges.turnovers; // Turnovers forced
    else if (i < 20) range = ranges.successRate; // Success rate
    else if (i < 22) range = ranges.explosiveness; // Explosiveness
    else if (i < 24) range = ranges.lineYards; // Line yards
    else if (i < 26) range = ranges.apRank; // AP Rank (lower is better, will invert)
    else if (i < 28) range = { min: 0, max: 1 }; // Strength of schedule
    else if (i < 34) range = { min: 0, max: 1 }; // Binary situational factors
    else if (i === 34) range = ranges.temp; // Temperature
    else range = { min: 0, max: 1 }; // Weather impact
    
    // Special handling for AP Rank (invert so lower rank = higher normalized value)
    if (i === 24 || i === 25) {
      const normalizedValue = Math.max(0, Math.min(1, 
        1 - ((value - range.min) / (range.max - range.min))
      ));
      normalized.push(normalizedValue);
    } else {
      // Standard normalization to 0-1 range
      const normalizedValue = Math.max(0, Math.min(1, 
        (value - range.min) / (range.max - range.min)
      ));
      normalized.push(normalizedValue);
    }
  }
  
  return normalized;
}

export default async function handler(req, res) {
  try {
    const { homeTeam, awayTeam, gameDate, oddsData } = req.body;
    
    if (!homeTeam || !awayTeam) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    console.log(`🏈 CFB ML Prediction Request: ${awayTeam} @ ${homeTeam}`);
    
    // Initialize model
    const mlModel = await initializeModel();
    
    // Extract 36 features
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
      predictedTotal: (predictionData[4] * 70) + 10, // Denormalize (0-1 -> 10-80 points)
      homeSpreadProbability: predictionData[5],
      awaySpreadProbability: predictionData[6],
      
      // Additional analysis
      confidence: calculateModelConfidence(predictionData),
      features: features.length,
      sport: 'CFB',
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ CFB ML Prediction: Home ${(result.homeWinProbability * 100).toFixed(1)}%, Away ${(result.awayWinProbability * 100).toFixed(1)}%`);
    
    res.status(200).json(result);
    
  } catch (error) {
    console.error('❌ CFB ML Model error:', error);
    res.status(500).json({ 
      error: 'CFB model prediction failed',
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
