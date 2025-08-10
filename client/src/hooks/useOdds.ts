import { useState, useEffect } from 'react';
import { oddsApi } from '../services/api';

export interface OddsData {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers: any[];
}

export const useOdds = () => {
  const [odds, setOdds] = useState<OddsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOdds = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await oddsApi.getMLBOdds();
      setOdds(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch odds');
      setOdds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOdds();
    const interval = setInterval(fetchOdds, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { odds, loading, error, refetch: fetchOdds };
};
