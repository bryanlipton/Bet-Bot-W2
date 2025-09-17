const ML_API_BASE = import.meta.env.VITE_ML_SERVER_URL || import.meta.env.REACT_APP_ML_API_URL;

export class MLApiService {
  static async getNFLPicks() {
    try {
      const response = await fetch(`${ML_API_BASE}/api/nfl/picks`);
      if (!response.ok) throw new Error('Failed to fetch NFL picks');
      const result = await response.json();
      return result.data.picks;
    } catch (error) {
      console.error('Error fetching NFL picks:', error);
      return [];
    }
  }

  static async getCFBPicks() {
    try {
      const response = await fetch(`${ML_API_BASE}/api/cfb/picks`);
      if (!response.ok) throw new Error('Failed to fetch CFB picks');
      const result = await response.json();
      return result.data.picks;
    } catch (error) {
      console.error('Error fetching CFB picks:', error);
      return [];
    }
  }

  static async checkHealth() {
    try {
      const response = await fetch(`${ML_API_BASE}/health`);
      return response.json();
    } catch (error) {
      return { status: 'offline', error: error.message };
    }
  }
}
