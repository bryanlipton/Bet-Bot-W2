// Mock user API - replace with real authentication
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Mock authentication - return null for unauthenticated, user object for authenticated
  // In production, check actual session/JWT token here
  
  // For testing: return authenticated user 
  // Change this to `return res.status(401).json({ error: 'Not authenticated' });` to test logged out state
  
  const mockUser = {
    id: "user_123",
    email: "user@example.com", 
    name: "Test User",
    isAuthenticated: true,
    subscription: {
      status: "active",
      plan: "free" // Change to "pro" to test pro features
    }
  };

  res.status(200).json(mockUser);
}
