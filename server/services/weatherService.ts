import fetch from 'node-fetch';

export interface WeatherData {
  temperature: number; // Fahrenheit
  humidity: number; // Percentage
  windSpeed: number; // MPH
  windDirection: number; // Degrees
  pressure: number; // inHg
  conditions: string; // Clear, Cloudy, Rain, etc.
  stadium: string;
  gameTime: string;
}

export interface WeatherImpact {
  hitDistance: number; // % change in hit distance
  homeRunProbability: number; // Multiplier for HR probability
  totalRunsImpact: number; // Expected change in total runs
  favorsPitcher: boolean; // Whether conditions favor pitcher or hitter
  impactScore: number; // -100 to 100, negative favors pitchers
}

// MLB Stadium Coordinates
const STADIUM_COORDS: Record<string, { lat: number; lon: number; name: string }> = {
  'Boston Red Sox': { lat: 42.3467, lon: -71.0972, name: 'Fenway Park' },
  'New York Yankees': { lat: 40.8296, lon: -73.9262, name: 'Yankee Stadium' },
  'Baltimore Orioles': { lat: 39.2840, lon: -76.6217, name: 'Oriole Park at Camden Yards' },
  'Tampa Bay Rays': { lat: 27.7683, lon: -82.6534, name: 'Tropicana Field' },
  'Toronto Blue Jays': { lat: 43.6414, lon: -79.3894, name: 'Rogers Centre' },
  'Chicago White Sox': { lat: 41.8299, lon: -87.6338, name: 'Guaranteed Rate Field' },
  'Cleveland Guardians': { lat: 41.4958, lon: -81.6852, name: 'Progressive Field' },
  'Detroit Tigers': { lat: 42.3390, lon: -83.0485, name: 'Comerica Park' },
  'Kansas City Royals': { lat: 39.0517, lon: -94.4803, name: 'Kauffman Stadium' },
  'Minnesota Twins': { lat: 44.9817, lon: -93.2776, name: 'Target Field' },
  'Houston Astros': { lat: 29.7573, lon: -95.3555, name: 'Minute Maid Park' },
  'Los Angeles Angels': { lat: 33.8003, lon: -117.8827, name: 'Angel Stadium' },
  'Oakland Athletics': { lat: 37.7516, lon: -122.2005, name: 'Oakland Coliseum' },
  'Seattle Mariners': { lat: 47.5914, lon: -122.3326, name: 'T-Mobile Park' },
  'Texas Rangers': { lat: 32.7511, lon: -97.0829, name: 'Globe Life Field' },
  'Atlanta Braves': { lat: 33.8906, lon: -84.4677, name: 'Truist Park' },
  'Miami Marlins': { lat: 25.7781, lon: -80.2197, name: 'loanDepot park' },
  'New York Mets': { lat: 40.7571, lon: -73.8458, name: 'Citi Field' },
  'Philadelphia Phillies': { lat: 39.9061, lon: -75.1665, name: 'Citizens Bank Park' },
  'Washington Nationals': { lat: 38.8730, lon: -77.0074, name: 'Nationals Park' },
  'Chicago Cubs': { lat: 41.9484, lon: -87.6553, name: 'Wrigley Field' },
  'Cincinnati Reds': { lat: 39.0974, lon: -84.5068, name: 'Great American Ball Park' },
  'Milwaukee Brewers': { lat: 43.0280, lon: -87.9712, name: 'American Family Field' },
  'Pittsburgh Pirates': { lat: 40.4469, lon: -80.0057, name: 'PNC Park' },
  'St. Louis Cardinals': { lat: 38.6226, lon: -90.1928, name: 'Busch Stadium' },
  'Arizona Diamondbacks': { lat: 33.4453, lon: -112.0667, name: 'Chase Field' },
  'Colorado Rockies': { lat: 39.7559, lon: -104.9942, name: 'Coors Field' },
  'Los Angeles Dodgers': { lat: 34.0739, lon: -118.2400, name: 'Dodger Stadium' },
  'San Diego Padres': { lat: 32.7073, lon: -117.1566, name: 'Petco Park' },
  'San Francisco Giants': { lat: 37.7786, lon: -122.3893, name: 'Oracle Park' }
};

class WeatherService {
  private readonly openWeatherApiKey = process.env.OPENWEATHER_API_KEY;
  private readonly baseUrl = 'https://api.openweathermap.org/data/2.5';

  /**
   * Get current weather for a stadium
   */
  async getStadiumWeather(homeTeam: string): Promise<WeatherData | null> {
    try {
      const stadium = STADIUM_COORDS[homeTeam];
      if (!stadium) {
        console.warn(`No stadium coordinates found for ${homeTeam}`);
        return null;
      }

      if (!this.openWeatherApiKey) {
        console.warn('OpenWeather API key not configured');
        return this.getMockWeatherData(homeTeam, stadium.name);
      }

      const url = `${this.baseUrl}/weather?lat=${stadium.lat}&lon=${stadium.lon}&appid=${this.openWeatherApiKey}&units=imperial`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      
      return {
        temperature: Math.round(data.main.temp),
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind?.speed * 2.237 || 0), // Convert m/s to mph
        windDirection: data.wind?.deg || 0,
        pressure: Math.round(data.main.pressure * 0.02953), // Convert hPa to inHg
        conditions: data.weather[0]?.main || 'Clear',
        stadium: stadium.name,
        gameTime: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error fetching weather for ${homeTeam}:`, error);
      return this.getMockWeatherData(homeTeam, STADIUM_COORDS[homeTeam]?.name || 'Unknown Stadium');
    }
  }

  /**
   * Get weather forecast for game time
   */
  async getGameTimeWeather(homeTeam: string, gameTime: Date): Promise<WeatherData | null> {
    try {
      const stadium = STADIUM_COORDS[homeTeam];
      if (!stadium) {
        console.warn(`No stadium coordinates found for ${homeTeam}`);
        return null;
      }

      if (!this.openWeatherApiKey) {
        return this.getMockWeatherData(homeTeam, stadium.name);
      }

      // Use forecast API for future games
      const url = `${this.baseUrl}/forecast?lat=${stadium.lat}&lon=${stadium.lon}&appid=${this.openWeatherApiKey}&units=imperial`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Weather forecast API error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      
      // Find closest forecast to game time
      const gameTimestamp = gameTime.getTime();
      let closestForecast = data.list[0];
      let closestDiff = Math.abs(new Date(data.list[0].dt * 1000).getTime() - gameTimestamp);
      
      for (const forecast of data.list) {
        const forecastTime = new Date(forecast.dt * 1000).getTime();
        const diff = Math.abs(forecastTime - gameTimestamp);
        if (diff < closestDiff) {
          closestDiff = diff;
          closestForecast = forecast;
        }
      }
      
      return {
        temperature: Math.round(closestForecast.main.temp),
        humidity: closestForecast.main.humidity,
        windSpeed: Math.round(closestForecast.wind?.speed * 2.237 || 0),
        windDirection: closestForecast.wind?.deg || 0,
        pressure: Math.round(closestForecast.main.pressure * 0.02953),
        conditions: closestForecast.weather[0]?.main || 'Clear',
        stadium: stadium.name,
        gameTime: gameTime.toISOString()
      };
    } catch (error) {
      console.error(`Error fetching game time weather for ${homeTeam}:`, error);
      return this.getMockWeatherData(homeTeam, STADIUM_COORDS[homeTeam]?.name || 'Unknown Stadium');
    }
  }

  /**
   * Calculate weather impact on game outcomes
   */
  calculateWeatherImpact(weather: WeatherData): WeatherImpact {
    let impactScore = 0;
    let hitDistance = 0;
    let homeRunProbability = 1.0;
    let totalRunsImpact = 0;

    // Temperature impact (optimal around 75-80°F)
    if (weather.temperature > 85) {
      // Hot air = more carry
      hitDistance += (weather.temperature - 85) * 0.5;
      homeRunProbability += (weather.temperature - 85) * 0.01;
      totalRunsImpact += (weather.temperature - 85) * 0.02;
      impactScore += (weather.temperature - 85) * 2;
    } else if (weather.temperature < 60) {
      // Cold air = less carry
      hitDistance -= (60 - weather.temperature) * 0.3;
      homeRunProbability -= (60 - weather.temperature) * 0.008;
      totalRunsImpact -= (60 - weather.temperature) * 0.015;
      impactScore -= (60 - weather.temperature) * 1.5;
    }

    // Wind impact
    if (weather.windSpeed > 10) {
      // Strong winds affect fly balls
      if (weather.windDirection >= 45 && weather.windDirection <= 135) {
        // Tailwind (assuming home plate faces roughly north)
        hitDistance += weather.windSpeed * 0.8;
        homeRunProbability += weather.windSpeed * 0.015;
        totalRunsImpact += weather.windSpeed * 0.03;
        impactScore += weather.windSpeed * 3;
      } else if (weather.windDirection >= 225 && weather.windDirection <= 315) {
        // Headwind
        hitDistance -= weather.windSpeed * 0.6;
        homeRunProbability -= weather.windSpeed * 0.012;
        totalRunsImpact -= weather.windSpeed * 0.025;
        impactScore -= weather.windSpeed * 2.5;
      } else {
        // Crosswind (less predictable)
        hitDistance -= weather.windSpeed * 0.2;
        homeRunProbability -= weather.windSpeed * 0.005;
        totalRunsImpact -= weather.windSpeed * 0.01;
        impactScore -= weather.windSpeed * 1;
      }
    }

    // Humidity impact (high humidity = heavier air)
    if (weather.humidity > 70) {
      hitDistance -= (weather.humidity - 70) * 0.15;
      homeRunProbability -= (weather.humidity - 70) * 0.003;
      totalRunsImpact -= (weather.humidity - 70) * 0.008;
      impactScore -= (weather.humidity - 70) * 0.8;
    }

    // Pressure impact (low pressure = less air resistance)
    if (weather.pressure < 29.5) {
      hitDistance += (29.5 - weather.pressure) * 8;
      homeRunProbability += (29.5 - weather.pressure) * 0.05;
      totalRunsImpact += (29.5 - weather.pressure) * 0.1;
      impactScore += (29.5 - weather.pressure) * 15;
    }

    // Precipitation heavily favors pitchers
    if (weather.conditions.includes('Rain') || weather.conditions.includes('Snow')) {
      impactScore -= 40;
      totalRunsImpact -= 1.5;
      homeRunProbability *= 0.6;
    }

    return {
      hitDistance: Math.round(hitDistance * 10) / 10,
      homeRunProbability: Math.max(0.3, Math.min(2.0, homeRunProbability)),
      totalRunsImpact: Math.round(totalRunsImpact * 10) / 10,
      favorsPitcher: impactScore < 0,
      impactScore: Math.max(-100, Math.min(100, Math.round(impactScore)))
    };
  }

  /**
   * Generate mock weather data when API is not available
   */
  private getMockWeatherData(homeTeam: string, stadiumName: string): WeatherData {
    // Generate realistic weather based on location and season
    const now = new Date();
    const month = now.getMonth(); // 0-11
    
    // Base temperatures by region (summer averages)
    const tempByRegion: Record<string, number> = {
      'Boston Red Sox': 78,
      'New York Yankees': 81,
      'Tampa Bay Rays': 89,
      'Miami Marlins': 87,
      'Houston Astros': 94,
      'Arizona Diamondbacks': 104,
      'Los Angeles Dodgers': 82,
      'San Francisco Giants': 68,
      'Seattle Mariners': 74,
      'Colorado Rockies': 82
    };

    const baseTemp = tempByRegion[homeTeam] || 78;
    const tempVariation = (Math.random() - 0.5) * 20; // ±10°F variation
    
    return {
      temperature: Math.round(baseTemp + tempVariation),
      humidity: Math.round(40 + Math.random() * 40), // 40-80%
      windSpeed: Math.round(Math.random() * 15), // 0-15 mph
      windDirection: Math.round(Math.random() * 360),
      pressure: Math.round((29.8 + (Math.random() - 0.5) * 0.6) * 100) / 100,
      conditions: Math.random() > 0.8 ? 'Cloudy' : 'Clear',
      stadium: stadiumName,
      gameTime: new Date().toISOString()
    };
  }
}

export const weatherService = new WeatherService();