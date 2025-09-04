import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Test write
    const { data, error } = await supabase
      .from('daily_picks')
      .select('*')
      .limit(1);
    
    if (error) throw error;
    
    return res.status(200).json({ 
      success: true, 
      message: 'Supabase connected',
      data 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
