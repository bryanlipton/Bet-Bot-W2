import * as tf from '@tensorflow/tfjs-node';

// Global model instance
let model = null;
let isModelLoaded = false;

// 27 input features as defined in your Replit system
const FEATURE_NAMES = [
  // Basic Team Stats (10)
  'homeTeamBattingAvg', 'awayTeamBattingAvg',
  'homeTeamERA', 'awayTeamERA',
  'homeTeamOPS', 'awayTeamOPS', 
  'homeStarterERA', 'awayStarterERA',
  'homeStarterWHIP', 'awayStarterWHIP',
  
  // Enhanced Statcast Features (10)
  'homeTeamXWOBA', 'awayTeamXWOBA',
  'homeTeamBarrelPercent', 'awayTeamBarrelPercent',
  'homeTeamHardHitPercent', 'awayTeamHardHitPercent',
  'homeTeamExitVelocity', 'awayTeamExitVelocity',
  'homePitchingXWOBA', 'awayPitchingXWOBA',
  
  // Situational Factors (5)
  'homeFieldAdvantage', 'weatherScore',
  'recentHomeForm', 'recentAwayForm', 'headToHeadRecord',
  
  // Weather Features (2)
  'temperature', 'windSpeed'
];

async function initializeModel() {
  if (isModelLoaded && model) {
    return model;
  }

  try {
    console.log('🧠 Initializing Baseball AI Model...');
    
    // Create the same neural network architecture as your Replit
    model = tf.sequential({
      layers: [
        // Input layer: 27 features
        tf.layers.dense({
          inputShape: [27],
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

    // Compile model with same settings as Replit
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    // Initialize with random weights (in production, you'd load trained weights)
    console.log('⚡ Model architecture created successfully');
    console.log(`📊 Model summary: ${model.countParams()} total parameters`);
    
    isModelLoaded = true;
    return model;
    
  } catch (error) {
    console.error('❌ Model initialization error:', error);
    throw error;
  }
}

async function extractGameFeatures(homeTeam, awayTeam, gameDate, oddsData = null) {
  try {
    console.log(`🔍 Extracting features for ${awayTeam} @ ${homeTeam}`);
    
    // Get team statistics from various sources
    const [teamStats, weatherData, recentForm] = await Promise.all([
      getTeamStatistics(homeTeam, awayTeam),
      getWeatherData(homeTeam, gameDate),
      getRecentForm(homeTeam, awayTeam)
    ]);

    // Build the 27-feature vector
    const features = [
      // Basic Team Stats (10)
      teamStats.home.battingAvg || 0.260,
      teamStats.away.battingAvg || 0.260,
      teamStats.home.era || 4.20,
      teamStats.away.era || 4.20,
      teamStats.home.ops || 0.750,
      teamStats.away.ops || 0.750,
      teamStats.home.starterERA || 4.20,
      teamStats.away.starterERA || 4.20,
      teamStats.home.starterWHIP || 1.30,
      teamStats.away.starterWHIP || 1.30,
      
      // Enhanced Statcast Features (10)
      teamStats.home.xwOBA || 0.320,
      teamStats.away.xwOBA || 0.320,
      teamStats.home.barrelPercent || 8.0,
      teamStats.away.barrelPercent || 8.0,
      teamStats.home.hardHitPercent || 35.0,
      teamStats.away.hardHitPercent || 35.0,
      teamStats.home.exitVelocity || 88.0,
      teamStats.away.exitVelocity || 88.0,
      teamStats.home.pitchingXWOBA || 0.320,
      teamStats.away.pitchingXWOBA || 0.320,
      
      // Situational Factors (5)
      0.54, // homeFieldAdvantage (54% home win rate)
      weatherData.score || 0.5,
      recentForm.home || 0.5,
      recentForm.away || 0.5,
      teamStats.headToHead || 0.5,
      
      // Weather Features (2)
      weatherData.temperature || 72,
      weatherData.windSpeed || 5
    ];

    // Normalize features to 0-1 range
    const normalizedFeatures = normalizeFeatures(features);
    
    console.log(`✅ Extracted ${normalizedFeatures.length} features successfully`);
    return normalizedFeatures;
    
  } catch (error) {
    console.error('❌ Feature extraction error:', error);
    
    // Return default normalized features if extraction fails
    return new Array(27).fill(0.5);
  }
}

async function getTeamStatistics(homeTeam, awayTeam) {
  try {
    // In a full implementation, this would call multiple APIs
    // For now, return realistic MLB averages with some variation
    
    const baseStats = {
      battingAvg: 0.250 + (Math.random() * 0.060), // 0.250-0.310 range
      era: 3.80 + (Math.random() * 1.40), // 3.80-5.20 range
      ops: 0.700 + (Math.random() * 0.200), // 0.700-0.900 range
      starterERA: 3.50 + (Math.random() * 2.00), // 3.50-5.50 range
      starterWHIP: 1.10 + (Math.random() * 0.50), // 1.10-1.60 range
      xwOBA: 0.300 + (Math.random() * 0.060), // 0.300-0.360 range
      barrelPercent: 6.0 + (Math.random() * 6.0), // 6.0-12.0 range
      hardHitPercent: 30.0 + (Math.random() * 15.0), // 30.0-45.0 range
      exitVelocity: 86.0 + (Math.random() * 6.0), // 86.0-92.0 range
      pitchingXWOBA: 0.300 + (Math.random() * 0.060) // 0.300-0.360 range
    };

    return {
      home: { ...baseStats },
      away: { ...baseStats },
      headToHead: 0.4 + (Math.random() * 0.2) // 0.4-0.6 range
    };
    
  } catch (error) {
    console.error('Team statistics error:', error);
    return {
      home: {},
      away: {},
      headToHead: 0.5
    };
  }
}

async function getWeatherData(homeTeam, gameDate) {
  try {
    // Mock weather data - in production, integrate with weather API
    return {
      score: 0.3 + (Math.random() * 0.4), // 0.3-0.7 range
      temperature: 65 + (Math.random() * 25), // 65-90°F range
      windSpeed: 0 + (Math.random() * 15) // 0-15 mph range
    };
  } catch (error) {
    return {
      score: 0.5,
      temperature: 75,
      windSpeed: 5
    };
  }
}

async function getRecentForm(homeTeam, awayTeam) {
  try {
    // Mock recent form - in production, get last 10 games from MLB API
    return {
      home: 0.3 + (Math.random() * 0.4), // 0.3-0.7 range (30-70% recent win rate)
      away: 0.3 + (Math.random() * 0.4)
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
    // Batting averages: 0.200-0.350
    battingAvg: { min: 0.200, max: 0.350 },
    // ERA: 2.50-6.00
    era: { min: 2.50, max: 6.00 },
    // OPS: 0.600-1.000
    ops: { min: 0.600, max: 1.000 },
    // WHIP: 1.00-1.80
    whip: { min: 1.00, max: 1.80 },
    // xwOBA: 0.250-0.400
    xwoba: { min: 0.250, max: 0.400 },
    // Barrel%: 3.0-15.0
    barrel: { min: 3.0, max: 15.0 },
    // Hard Hit%: 25.0-50.0
    hardHit: { min: 25.0, max: 50.0 },
    // Exit Velocity: 85.0-95.0
    exitVelo: { min: 85.0, max: 95.0 },
    // Temperature: 40-100
    temp: { min: 40, max: 100 },
    // Wind Speed: 0-20
    wind: { min: 0, max: 20 }
  };

  const normalized = [];
  
  for (let i = 0; i < features.length; i++) {
    let value = features[i];
    let range;
    
    // Determine appropriate range based on feature index
    if (i < 2) range = ranges.battingAvg; // Batting averages
    else if (i < 4) range = ranges.era; // ERAs
    else if (i < 6) range = ranges.ops; // OPS
    else if (i < 8) range = ranges.era; // Starter ERAs
    else if (i < 10) range = ranges.whip; // Starter WHIPs
    else if (i < 12) range = ranges.xwoba; // xwOBAs
    else if (i < 14) range = ranges.barrel; // Barrel %s
    else if (i < 16) range = ranges.hardHit; // Hard Hit %s
    else if (i < 18) range = ranges.exitVelo; // Exit Velocities
    else if (i < 20) range = ranges.xwoba; // Pitching xwOBAs
    else if (i < 25) range = { min: 0, max: 1 }; // Percentages/ratios
    else if (i === 25) range = ranges.temp; // Temperature
    else if (i === 26) range = ranges.wind; // Wind speed
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

    console.log(`🎯 ML Prediction Request: ${awayTeam} @ ${homeTeam}`);
    
    // Initialize model
    const mlModel = await initializeModel();
    
    // Extract 27 features
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
      predictedTotal: predictionData[4] * 20, // Denormalize (0-1 -> 0-20 runs)
      homeSpreadProbability: predictionData[5],
      awaySpreadProbability: predictionData[6],
      
      // Additional analysis
      confidence: calculateModelConfidence(predictionData),
      features: features.length,
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ ML Prediction: Home ${(result.homeWinProbability * 100).toFixed(1)}%, Away ${(result.awayWinProbability * 100).toFixed(1)}%`);
    
    res.status(200).json(result);
    
  } catch (error) {
    console.error('❌ ML Model error:', error);
    res.status(500).json({ 
      error: 'Model prediction failed',
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
