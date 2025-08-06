export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Return empty array for now - this will prevent crashes
  res.status(200).json([]);
}
