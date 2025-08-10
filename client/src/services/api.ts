const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://bet-bot-w2.vercel.app' 
  : 'http://localhost:3000';

export const oddsApi = {
  async getMLBOdds() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/odds`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching MLB odds:', error);
      return [];
    }
  }
};
