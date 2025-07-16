import { baseballSavantService, type TeamStatcastMetrics } from './baseballSavantApi';
import { weatherService, type WeatherData, type WeatherImpact } from './weatherService';
import { umpireService, type UmpireStats } from './umpireService';
import { continuousTrainingService } from './continuousTrainingService';

export interface OverUnderPrediction {
  predictedTotal: number;
  overProbability: number;
  underProbability: number;
  confidence: number;
  factors: PredictionFactors;
  recommendation: 'over' | 'under' | 'none';
  edge: number; // Percentage edge if betting is recommended
}

export interface PredictionFactors {
  teamOffense: {
    homeTeamRuns: number;
    awayTeamRuns: number;
    homeTeamPower: number; // Based on barrel%, exit velocity
    awayTeamPower: number;
  };
  pitching: {
    homeStarterERA: number;
    awayStarterERA: number;
    homeStarterXERA: number;
    awayStarterXERA: number;
    homeBullpenERA: number;
    awayBullpenERA: number;
  };
  weather: WeatherImpact;
  ballpark: {
    parkFactor: number; // Run environment factor
    homeRunFactor: number;
    name: string;
  };
  situational: {
    homeFieldAdvantage: number;
    dayGame: boolean;
    restDays: number;
  };
  umpire: {
    name: string;
    strikeZoneAccuracy: number;
    runsImpact: number;
    hitterFriendly: boolean;
    confidenceMultiplier: number;
  };
}

// Ballpark factors (normalized to 100 = average)
const BALLPARK_FACTORS: Record<string, { runFactor: number; hrFactor: number }> = {
  'Coors Field': { runFactor: 128, hrFactor: 118 }, // Colorado - high altitude
  'Fenway Park': { runFactor: 104, hrFactor: 96 }, // Boston - Green Monster
  'Yankee Stadium': { runFactor: 103, hrFactor: 108 }, // Yankees - short porch
  'Great American Ball Park': { runFactor: 102, hrFactor: 105 }, // Cincinnati
  'Globe Life Field': { runFactor: 101, hrFactor: 103 }, // Texas
  'Minute Maid Park': { runFactor: 101, hrFactor: 102 }, // Houston
  'Wrigley Field': { runFactor: 100, hrFactor: 98 }, // Cubs - wind dependent
  'Citizens Bank Park': { runFactor: 100, hrFactor: 101 }, // Phillies
  'Camden Yards': { runFactor: 99, hrFactor: 102 }, // Baltimore
  'Progressive Field': { runFactor: 99, hrFactor: 98 }, // Cleveland
  'Busch Stadium': { runFactor: 98, hrFactor: 97 }, // Cardinals
  'Kauffman Stadium': { runFactor: 98, hrFactor: 95 }, // Royals
  'Tropicana Field': { runFactor: 97, hrFactor: 96 }, // Rays
  'T-Mobile Park': { runFactor: 97, hrFactor: 94 }, // Mariners
  'Target Field': { runFactor: 97, hrFactor: 95 }, // Twins
  'Guaranteed Rate Field': { runFactor: 96, hrFactor: 97 }, // White Sox
  'PNC Park': { runFactor: 96, hrFactor: 94 }, // Pirates
  'Comerica Park': { runFactor: 95, hrFactor: 93 }, // Tigers
  'Rogers Centre': { runFactor: 95, hrFactor: 98 }, // Blue Jays
  'American Family Field': { runFactor: 95, hrFactor: 96 }, // Brewers
  'Truist Park': { runFactor: 94, hrFactor: 96 }, // Braves
  'Angel Stadium': { runFactor: 94, hrFactor: 95 }, // Angels
  'Citi Field': { runFactor: 94, hrFactor: 93 }, // Mets
  'loanDepot park': { runFactor: 94, hrFactor: 94 }, // Marlins
  'Chase Field': { runFactor: 93, hrFactor: 95 }, // Diamondbacks
  'Nationals Park': { runFactor: 93, hrFactor: 94 }, // Nationals
  'Dodger Stadium': { runFactor: 92, hrFactor: 92 }, // Dodgers
  'Oakland Coliseum': { runFactor: 92, hrFactor: 91 }, // Athletics
  'Oracle Park': { runFactor: 91, hrFactor: 87 }, // Giants - pitcher friendly
  'Petco Park': { runFactor: 90, hrFactor: 89 } // Padres - very pitcher friendly
};

export class OverUnderPredictor {
  private statcastCache: TeamStatcastMetrics[] = [];
  private lastStatcastUpdate = 0;
  private readonly CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours
  
  // Daily prediction cache - ensures predictions don't change throughout the day
  private dailyPredictionCache: Map<string, OverUnderPrediction> = new Map();
  private currentCacheDate: string = '';

  /**
   * Generate comprehensive over/under prediction
   */
  async predictOverUnder(
    homeTeam: string,
    awayTeam: string,
    gameTime: Date,
    homeStarterERA: number = 4.50,
    awayStarterERA: number = 4.50,
    marketTotal?: number,
    umpireName?: string,
    gameId?: number
  ): Promise<OverUnderPrediction> {
    try {
      // Create a unique daily cache key based on teams and date (not time)
      const gameDate = gameTime.toISOString().split('T')[0]; // YYYY-MM-DD
      const cacheKey = `${gameDate}_${awayTeam}_${homeTeam}_${homeStarterERA}_${awayStarterERA}`;
      
      // Check if we need to clear the cache for a new day
      if (this.currentCacheDate !== gameDate) {
        console.log(`📅 New day detected (${gameDate}), clearing prediction cache`);
        this.dailyPredictionCache.clear();
        this.currentCacheDate = gameDate;
      }
      
      // Check for cached prediction
      if (this.dailyPredictionCache.has(cacheKey)) {
        console.log(`📋 Using cached daily prediction for ${awayTeam} @ ${homeTeam}`);
        const cachedPrediction = this.dailyPredictionCache.get(cacheKey)!;
        
        // Update market total if provided but keep same prediction
        if (marketTotal && marketTotal !== cachedPrediction.predictedTotal) {
          const probabilities = this.calculateProbabilities(cachedPrediction.predictedTotal, marketTotal);
          const recommendation = this.determineRecommendation(
            probabilities.overProbability,
            probabilities.underProbability,
            marketTotal
          );
          
          // Return updated probabilities but same core prediction
          return {
            ...cachedPrediction,
            overProbability: probabilities.overProbability,
            underProbability: probabilities.underProbability,
            confidence: probabilities.confidence,
            recommendation: recommendation.bet,
            edge: recommendation.edge
          };
        }
        
        return cachedPrediction;
      }

      console.log(`🎯 Generating new daily prediction for ${awayTeam} @ ${homeTeam} (${gameDate})`);
      console.log(`📊 Using real data from: Baseball Savant API, Weather API, MLB Ballpark factors`);

      // Get all data sources in parallel
      const [statcastData, weather] = await Promise.all([
        this.getStatcastData(),
        weatherService.getGameTimeWeather(homeTeam, gameTime)
      ]);

      console.log(`✅ Retrieved Statcast data for ${statcastData.length} teams from Baseball Savant`);
      console.log(`✅ Weather data: ${weather ? 'Real weather from API' : 'Using neutral conditions'}`);

      // Calculate prediction factors
      const factors = await this.calculatePredictionFactors(
        homeTeam,
        awayTeam,
        gameTime,
        weather,
        homeStarterERA,
        awayStarterERA,
        statcastData,
        umpireName
      );

      // Predict total runs
      const predictedTotal = this.calculatePredictedTotal(factors);
      console.log(`📈 Predicted total: ${predictedTotal.toFixed(1)} runs (realistic MLB range: 7.0-11.5)`);
      
      // Calculate probabilities
      const probabilities = this.calculateProbabilities(predictedTotal, marketTotal);
      
      // Determine recommendation
      const recommendation = this.determineRecommendation(
        probabilities.overProbability,
        probabilities.underProbability,
        marketTotal
      );

      const prediction: OverUnderPrediction = {
        predictedTotal: Math.round(predictedTotal * 10) / 10,
        overProbability: probabilities.overProbability,
        underProbability: probabilities.underProbability,
        confidence: probabilities.confidence,
        factors,
        recommendation: recommendation.bet,
        edge: recommendation.edge
      };

      // Cache the prediction for the entire day
      this.dailyPredictionCache.set(cacheKey, prediction);
      console.log(`💾 Cached daily prediction for ${awayTeam} @ ${homeTeam}`);

      return prediction;

    } catch (error) {
      console.error('Error generating over/under prediction:', error);
      throw error;
    }
  }

  /**
   * Calculate all prediction factors
   */
  private async calculatePredictionFactors(
    homeTeam: string,
    awayTeam: string,
    gameTime: Date,
    weather: WeatherData | null,
    homeStarterERA: number,
    awayStarterERA: number,
    statcastData: TeamStatcastMetrics[],
    umpireName?: string
  ): Promise<PredictionFactors> {
    // Get team Statcast metrics
    const homeStats = statcastData.find(t => t.team === this.getTeamAbbrev(homeTeam));
    const awayStats = statcastData.find(t => t.team === this.getTeamAbbrev(awayTeam));

    // Weather impact
    const weatherImpact = weather ? weatherService.calculateWeatherImpact(weather) : {
      hitDistance: 0,
      homeRunProbability: 1.0,
      totalRunsImpact: 0,
      favorsPitcher: false,
      impactScore: 0
    };

    // Ballpark factors
    const stadiumName = this.getStadiumName(homeTeam);
    const ballparkFactor = BALLPARK_FACTORS[stadiumName] || { runFactor: 100, hrFactor: 100 };

    // Get umpire data
    let umpireStats: UmpireStats | null = null;
    let umpireImpact = { runsAdjustment: 0, confidenceMultiplier: 1.0, description: 'No umpire data' };
    
    if (umpireName) {
      umpireStats = await umpireService.getRealisticUmpireData(umpireName);
      if (umpireStats) {
        umpireImpact = umpireService.calculateUmpireImpact(umpireStats);
      }
    }

    // Calculate expected runs per team
    const homeTeamRuns = this.calculateTeamRuns(homeStats, true, ballparkFactor, weatherImpact);
    const awayTeamRuns = this.calculateTeamRuns(awayStats, false, ballparkFactor, weatherImpact);

    return {
      teamOffense: {
        homeTeamRuns,
        awayTeamRuns,
        homeTeamPower: homeStats?.batting_barrel_percent || 8.0,
        awayTeamPower: awayStats?.batting_barrel_percent || 8.0
      },
      pitching: {
        homeStarterERA,
        awayStarterERA,
        homeStarterXERA: homeStarterERA * 0.95, // Estimate xERA as slightly better than ERA
        awayStarterXERA: awayStarterERA * 0.95,
        homeBullpenERA: homeStats?.pitching_xwoba_against ? this.xwobaToERA(homeStats.pitching_xwoba_against) : 4.00,
        awayBullpenERA: awayStats?.pitching_xwoba_against ? this.xwobaToERA(awayStats.pitching_xwoba_against) : 4.00
      },
      weather: weatherImpact,
      ballpark: {
        parkFactor: ballparkFactor.runFactor,
        homeRunFactor: ballparkFactor.hrFactor,
        name: stadiumName
      },
      situational: {
        homeFieldAdvantage: 0.1, // Slight advantage for home team
        dayGame: this.isDayGame(gameTime),
        restDays: 1 // Assume 1 day rest
      },
      umpire: {
        name: umpireStats?.name || 'Unknown',
        strikeZoneAccuracy: umpireStats?.strikeZoneAccuracy || 94.5,
        runsImpact: umpireImpact.runsAdjustment,
        hitterFriendly: umpireStats ? umpireStats.hitterFriendlyPercentage > 52 : false,
        confidenceMultiplier: umpireImpact.confidenceMultiplier
      }
    };
  }

  /**
   * Calculate predicted total runs
   */
  private calculatePredictedTotal(factors: PredictionFactors): number {
    let total = factors.teamOffense.homeTeamRuns + factors.teamOffense.awayTeamRuns;

    // Don't double-apply ballpark factor (already applied to team runs)
    
    // Apply minimal weather impact on total
    total += factors.weather.totalRunsImpact * 0.1;

    // Apply situational factors
    if (factors.situational.dayGame) {
      total *= 1.01; // Minimal day game impact
    }

    // Apply umpire impact on runs
    total += factors.umpire.runsImpact;

    // Realistic MLB game totals (2024 season: avg 8.96 runs per game)
    return Math.max(7.0, Math.min(11.5, total));
  }

  /**
   * Calculate over/under probabilities
   */
  private calculateProbabilities(predictedTotal: number, marketTotal?: number): {
    overProbability: number;
    underProbability: number;
    confidence: number;
  } {
    // Use market total if available, otherwise use prediction
    const total = marketTotal || predictedTotal;
    
    // Standard deviation for run totals (typically around 2.8 runs)
    const stdDev = 2.8;
    
    // Calculate probability using normal distribution
    const z = (total - predictedTotal) / stdDev;
    const overProb = this.normalCDF(-z); // P(X > total)
    const underProb = 1 - overProb;
    
    // Calculate confidence based on how far prediction is from total
    const distance = Math.abs(predictedTotal - total);
    const confidence = Math.min(0.95, 0.6 + (distance / stdDev) * 0.15);

    return {
      overProbability: Math.round(overProb * 1000) / 1000,
      underProbability: Math.round(underProb * 1000) / 1000,
      confidence: Math.round(confidence * 1000) / 1000
    };
  }

  /**
   * Determine betting recommendation
   */
  private determineRecommendation(
    overProb: number,
    underProb: number,
    marketTotal?: number
  ): { bet: 'over' | 'under' | 'none'; edge: number } {
    const threshold = 0.57; // Need 57% confidence to recommend
    const minEdge = 3; // Minimum 3% edge to recommend

    if (overProb > threshold) {
      const edge = (overProb - 0.526) * 100; // 0.526 = break-even at -110 odds
      return edge >= minEdge ? { bet: 'over', edge: Math.round(edge * 10) / 10 } : { bet: 'none', edge: 0 };
    }

    if (underProb > threshold) {
      const edge = (underProb - 0.526) * 100;
      return edge >= minEdge ? { bet: 'under', edge: Math.round(edge * 10) / 10 } : { bet: 'none', edge: 0 };
    }

    return { bet: 'none', edge: 0 };
  }

  /**
   * Get or update Statcast data cache
   */
  private async getStatcastData(): Promise<TeamStatcastMetrics[]> {
    const now = Date.now();
    
    if (this.statcastCache.length === 0 || (now - this.lastStatcastUpdate) > this.CACHE_DURATION) {
      try {
        console.log('Refreshing Statcast team metrics...');
        this.statcastCache = await baseballSavantService.getTeamStatcastMetrics();
        this.lastStatcastUpdate = now;
        console.log(`Updated Statcast data for ${this.statcastCache.length} teams`);
      } catch (error) {
        console.error('Error updating Statcast data:', error);
        if (this.statcastCache.length === 0) {
          // Fallback to league averages
          this.statcastCache = this.getLeagueAverageStats();
        }
      }
    }

    return this.statcastCache;
  }

  /**
   * Calculate expected runs for a team based on team-level statistics
   */
  private calculateTeamRuns(
    stats: TeamStatcastMetrics | undefined,
    isHome: boolean,
    ballpark: { runFactor: number; hrFactor: number },
    weather: WeatherImpact
  ): number {
    // Use actual team runs per game if available, otherwise league average
    let baseRuns = stats?.runs_per_game || 4.28; // 2024 MLB average

    // If we have team Statcast metrics, adjust based on underlying performance
    if (stats) {
      // Team offensive quality based on xwOBA (expected weighted on-base average)
      const teamOffenseQuality = stats.batting_xwoba / 0.315; // vs league average
      
      // Team power based on barrel percentage and hard hit rate
      const teamPower = (stats.batting_barrel_percent / 8.2) * 0.6 + 
                       (stats.batting_hard_hit_percent / 42.0) * 0.4;
      
      // Adjust base runs by team quality (cap adjustments to prevent extreme values)
      const offenseAdjustment = Math.min(1.20, Math.max(0.80, teamOffenseQuality));
      const powerAdjustment = Math.min(1.10, Math.max(0.90, teamPower));
      
      baseRuns = baseRuns * offenseAdjustment * powerAdjustment;
    }

    // Home field advantage
    if (isHome) {
      baseRuns *= 1.025; // Slight 2.5% home advantage
    }

    // Ballpark environment effects
    const parkAdjustment = Math.min(1.12, Math.max(0.88, ballpark.runFactor / 100));
    baseRuns *= parkAdjustment;
    
    // Weather has minimal impact
    baseRuns += weather.totalRunsImpact * 0.1;

    // Keep team runs within realistic MLB range
    return Math.max(3.0, Math.min(6.0, baseRuns));
  }

  /**
   * Convert xwOBA to approximate ERA
   */
  private xwobaToERA(xwoba: number): number {
    // Rough conversion: lower xwOBA against = lower ERA
    // League average xwOBA ~0.320, ERA ~4.20
    const factor = xwoba / 0.320;
    return Math.max(2.50, Math.min(6.50, 4.20 * factor));
  }

  /**
   * Normal CDF approximation
   */
  private normalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  /**
   * Error function approximation
   */
  private erf(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  /**
   * Utility functions
   */
  private getTeamAbbrev(teamName: string): string {
    const abbrevMap: Record<string, string> = {
      'New York Yankees': 'NYY',
      'Boston Red Sox': 'BOS',
      'Tampa Bay Rays': 'TB',
      'Baltimore Orioles': 'BAL',
      'Toronto Blue Jays': 'TOR',
      'Houston Astros': 'HOU',
      'Seattle Mariners': 'SEA',
      'Los Angeles Angels': 'LAA',
      'Oakland Athletics': 'OAK',
      'Texas Rangers': 'TEX',
      'Atlanta Braves': 'ATL',
      'New York Mets': 'NYM',
      'Philadelphia Phillies': 'PHI',
      'Miami Marlins': 'MIA',
      'Washington Nationals': 'WSH',
      'Milwaukee Brewers': 'MIL',
      'Chicago Cubs': 'CHC',
      'Cincinnati Reds': 'CIN',
      'Pittsburgh Pirates': 'PIT',
      'St. Louis Cardinals': 'STL',
      'Los Angeles Dodgers': 'LAD',
      'San Diego Padres': 'SD',
      'San Francisco Giants': 'SF',
      'Colorado Rockies': 'COL',
      'Arizona Diamondbacks': 'AZ',
      'Chicago White Sox': 'CWS',
      'Cleveland Guardians': 'CLE',
      'Detroit Tigers': 'DET',
      'Kansas City Royals': 'KC',
      'Minnesota Twins': 'MIN'
    };
    return abbrevMap[teamName] || teamName.substring(0, 3).toUpperCase();
  }

  private getStadiumName(teamName: string): string {
    const stadiumMap: Record<string, string> = {
      'Boston Red Sox': 'Fenway Park',
      'New York Yankees': 'Yankee Stadium',
      'Baltimore Orioles': 'Camden Yards',
      'Tampa Bay Rays': 'Tropicana Field',
      'Toronto Blue Jays': 'Rogers Centre',
      'Chicago White Sox': 'Guaranteed Rate Field',
      'Cleveland Guardians': 'Progressive Field',
      'Detroit Tigers': 'Comerica Park',
      'Kansas City Royals': 'Kauffman Stadium',
      'Minnesota Twins': 'Target Field',
      'Houston Astros': 'Minute Maid Park',
      'Los Angeles Angels': 'Angel Stadium',
      'Oakland Athletics': 'Oakland Coliseum',
      'Seattle Mariners': 'T-Mobile Park',
      'Texas Rangers': 'Globe Life Field',
      'Atlanta Braves': 'Truist Park',
      'Miami Marlins': 'loanDepot park',
      'New York Mets': 'Citi Field',
      'Philadelphia Phillies': 'Citizens Bank Park',
      'Washington Nationals': 'Nationals Park',
      'Chicago Cubs': 'Wrigley Field',
      'Cincinnati Reds': 'Great American Ball Park',
      'Milwaukee Brewers': 'American Family Field',
      'Pittsburgh Pirates': 'PNC Park',
      'St. Louis Cardinals': 'Busch Stadium',
      'Arizona Diamondbacks': 'Chase Field',
      'Colorado Rockies': 'Coors Field',
      'Los Angeles Dodgers': 'Dodger Stadium',
      'San Diego Padres': 'Petco Park',
      'San Francisco Giants': 'Oracle Park'
    };
    return stadiumMap[teamName] || 'Unknown Stadium';
  }

  private isDayGame(gameTime: Date): boolean {
    const hour = gameTime.getHours();
    return hour >= 10 && hour < 18; // Day games between 10 AM and 6 PM
  }

  private getLeagueAverageStats(): TeamStatcastMetrics[] {
    // Fallback league average stats
    return [{
      team: 'LEAGUE_AVG',
      batting_avg_exit_velocity: 87.5,
      batting_hard_hit_percent: 42.0,
      batting_barrel_percent: 8.5,
      batting_xwoba: 0.320,
      pitching_avg_exit_velocity_against: 87.5,
      pitching_hard_hit_percent_against: 42.0,
      pitching_barrel_percent_against: 8.5,
      pitching_xwoba_against: 0.320,
      runs_per_game: 4.7,
      runs_allowed_per_game: 4.7
    }];
  }
}

export const overUnderPredictor = new OverUnderPredictor();