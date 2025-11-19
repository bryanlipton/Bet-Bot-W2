import * as tf from '@tensorflow/tfjs-node';

// Global model instance
let model = null;
let isModelLoaded = false;

// 32 input features for NFL predictions
const FEATURE_NAMES = [
  // Offensive Stats (8)
  'homePassingYardsPerGame', 'awayPassingYardsPerGame',
  'homeRushingYardsPerGame', 'awayRushingYardsPerGame',
  'homePointsPerGame', 'awayPointsPerGame',
  'homeTurnovers', 'awayTurnovers',
  
  // Offensive Efficiency (4)
  'homeRedZoneEfficiency', 'awayRedZoneEfficiency',
  'homeThirdDownConversion', 'awayThirdDownConversion',
  
  // Defensive Stats (6)
  'homeYardsAllowed', 'awayYardsAllowed',
  'homePointsAllowed', 'awayPointsAllowed',
  'homeSacks', 'awaySacks',
  
  // Defensive Playmaking (4)
  'homeInterceptions', 'awayInterceptions',
  'homeTacklesForLoss', 'awayTacklesForLoss',
  
  // QB Stats (4)
  'homeQBRating', 'awayQBRating',
  'homeCompletionPercent', 'awayCompletionPercent',
  
  // Team Momentum & Situational (4)
  'homeRecentForm', 'awayRecentForm',
  'homeRestDays', 'awayRestDays',
  
  // Weather (2)
  'temperature', 'windSpeed'
];

async function initializeModel() {
  if (isModelLoaded && model) {
    return model;
  }

  try {
    console.log('🏈 Initializing NFL AI Model...');
    
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

    console.log('⚡ NFL Model architecture created successfully');
    console.log(`📊 Model summary: ${model.countParams()} total parameters`);
    
    isModelLoaded = true;
    return model;
    
  } catch (error) {
    console.error('❌ NFL Model initialization error:', error);
    throw error;
  }
}

async function extractGameFeatures(homeTeam, awayTeam, gameDate, oddsData = null) {
  try {
    console.log(`🔍 Extracting NFL features for ${awayTeam} @ ${homeTeam}`);
    
    // Get team statistics from various sources
    const [teamStats, weatherData, recentForm] = await Promise.all([
      getTeamStatistics(homeTeam, awayTeam),
      getWeatherData(homeTeam, gameDate),
      getRecentForm(homeTeam, awayTeam)
    ]);

    // Build the 32-feature vector
    const features = [
      // Offensive Stats (8)
      teamStats.home.passingYardsPerGame || 240.0,
      teamStats.away.passingYardsPerGame || 240.0,
      teamStats.home.rushingYardsPerGame || 120.0,
      teamStats.away.rushingYardsPerGame || 120.0,
      teamStats.home.pointsPerGame || 22.0,
      teamStats.away.pointsPerGame || 22.0,
      teamStats.home.turnovers || 1.2,
      teamStats.away.turnovers || 1.2,
      
      // Offensive Efficiency (4)
      teamStats.home.redZoneEfficiency || 0.55,
      teamStats.away.redZoneEfficiency || 0.55,
      teamStats.home.thirdDownConversion || 0.40,
      teamStats.away.thirdDownConversion || 0.40,
      
      // Defensive Stats (6)
      teamStats.home.yardsAllowed || 360.0,
      teamStats.away.yardsAllowed || 360.0,
      teamStats.home.pointsAllowed || 22.0,
      teamStats.away.pointsAllowed || 22.0,
      teamStats.home.sacks || 2.5,
      teamStats.away.sacks || 2.5,
      
      // Defensive Playmaking (4)
      teamStats.home.interceptions || 0.8,
      teamStats.away.interceptions || 0.8,
      teamStats.home.tacklesForLoss || 6.0,
      teamStats.away.tacklesForLoss || 6.0,
      
      // QB Stats (4)
      teamStats.home.qbRating || 90.0,
      teamStats.away.qbRating || 90.0,
      teamStats.home.completionPercent || 0.64,
      teamStats.away.completionPercent || 0.64,
      
      // Team Momentum & Situational (4)
      recentForm.home || 0.5,
      recentForm.away || 0.5,
      teamStats.home.restDays || 7,
      teamStats.away.restDays || 7,
      
      // Weather (2)
      weatherData.temperature || 65,
      weatherData.windSpeed || 8
    ];

    // Normalize features to 0-1 range
    const normalizedFeatures = normalizeFeatures(features);
    
    console.log(`✅ Extracted ${normalizedFeatures.length} NFL features successfully`);
    return normalizedFeatures;
    
  } catch (error) {
    console.error('❌ NFL Feature extraction error:', error);
    
    // Return default normalized features if extraction fails
    return new Array(32).fill(0.5);
  }
}

async function getTeamStatistics(homeTeam, awayTeam) {
  try {
    // In a full implementation, this would call NFL APIs (ESPN, NFL.com, etc.)
    // For now, return realistic NFL averages with variation
    
    const baseStats = {
      passingYardsPerGame: 220.0 + (Math.random() * 80.0), // 220-300 range
      rushingYardsPerGame: 100.0 + (Math.random() * 60.0), // 100-160 range
      pointsPerGame: 18.0 + (Math.random() * 14.0), // 18-32 range
      turnovers: 0.8 + (Math.random() * 1.0), // 0.8-1.8 range
      redZoneEfficiency: 0.45 + (Math.random() * 0.25), // 0.45-0.70 range
      thirdDownConversion: 0.35 + (Math.random() * 0.20), // 0.35-0.55 range
      yardsAllowed: 320.0 + (Math.random() * 100.0), // 320-420 range
      pointsAllowed: 18.0 + (Math.random() * 14.0), // 18-32 range
      sacks: 2.0 + (Math.random() * 2.0), // 2.0-4.0 range
      interceptions: 0.5 + (Math.random() * 1.0), // 0.5-1.5 range
      tacklesForLoss: 5.0 + (Math.random() * 4.0), // 5.0-9.0 range
      qbRating: 80.0 + (Math.random() * 30.0), // 80-110 range
      completionPercent: 0.58 + (Math.random() * 0.14), // 0.58-0.72 range
      restDays: 7 // Standard week
    };

    return {
      home: { ...baseStats },
      away: { ...baseStats }
    };
    
  } catch (error) {
    console.error('NFL team statistics error:', error);
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
      temperature: 40 + (Math.random() * 45), // 40-85°F range
      windSpeed: 0 + (Math.random() * 20) // 0-20 mph range
    };
  } catch (error) {
    return {
      temperature: 65,
      windSpeed: 8
    };
  }
}

async function getRecentForm(homeTeam, awayTeam) {
  try {
    // Mock recent form - in production, get last 5 games from NFL API
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

function normalizeFeatures(features) {
  // Define normalization ranges for each feature type
  const ranges = {
    // Passing yards: 180-350
    passingYards: { min: 180.0, max: 350.0 },
    // Rushing yards: 80-180
    rushingYards: { min: 80.0, max: 180.0 },
    // Points: 10-40
    points: { min: 10.0, max: 40.0 },
    // Turnovers: 0.5-2.5
    turnovers: { min: 0.5, max: 2.5 },
    // Yards: 280-450
    yards: { min: 280.0, max: 450.0 },
    // Sacks: 1.0-5.0
    sacks: { min: 1.0, max: 5.0 },
    // Interceptions: 0.3-2.0
    interceptions: { min: 0.3, max: 2.0 },
    // Tackles for loss: 4.0-10.0
    tfl: { min: 4.0, max: 10.0 },
    // QB Rating: 70-115
    qbRating: { min: 70.0, max: 115.0 },
    // Completion %: 0.55-0.75
    completionPct: { min: 0.55, max: 0.75 },
    // Rest days: 3-14
    restDays: { min: 3, max: 14 },
    // Temperature: 20-100
    temp: { min: 20, max: 100 },
    // Wind Speed: 0-30
    wind: { min: 0, max: 30 }
  };

  const normalized = [];
  
  for (let i = 0; i < features.length; i++) {
    let value = features[i];
    let range;
    
    // Determine appropriate range based on feature index
    if (i < 2) range = ranges.passingYards; // Passing yards
    else if (i < 4) range = ranges.rushingYards; // Rushing yards
    else if (i < 6) range = ranges.points; // Points per game
    else if (i < 8) range = ranges.turnovers; // Turnovers
    else if (i < 12) range = { min: 0, max: 1 }; // Efficiency percentages
    else if (i < 16) range = ranges.yards; // Yards allowed
    else if (i === 16 || i === 17) range = ranges.points; // Points allowed
    else if (i < 20) range = ranges.sacks; // Sacks
    else if (i < 22) range = ranges.interceptions; // Interceptions
    else if (i < 24) range = ranges.tfl; // Tackles for loss
    else if (i < 26) range = ranges.qbRating; // QB Rating
    else if (i < 28) range = ranges.completionPct; // Completion %
    else if (i < 30) range = { min: 0, max: 1 }; // Recent form
    else if (i === 30) range = ranges.restDays; // Rest days
    else if (i === 31) range = ranges.temp; // Temperature
    else if (i === 32) range = ranges.wind; // Wind speed
    else range = { min: 0, max: 1 }; // Default
    
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

    console.log(`🏈 NFL ML Prediction Request: ${awayTeam} @ ${homeTeam}`);
    
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
      predictedTotal: predictionData[4] * 70, // Denormalize (0-1 -> 0-70 points)
      homeSpreadProbability: predictionData[5],
      awaySpreadProbability: predictionData[6],
      
      // Additional analysis
      confidence: calculateModelConfidence(predictionData),
      features: features.length,
      sport: 'NFL',
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ NFL ML Prediction: Home ${(result.homeWinProbability * 100).toFixed(1)}%, Away ${(result.awayWinProbability * 100).toFixed(1)}%`);
    
    res.status(200).json(result);
    
  } catch (error) {
    console.error('❌ NFL ML Model error:', error);
    res.status(500).json({ 
      error: 'NFL model prediction failed',
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
