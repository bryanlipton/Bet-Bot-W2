// Mock subscription API
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Mock subscription data
  const mockSubscription = {
    id: "sub_123",
    status: "active",
    plan: "free", // Change to "pro" to test pro features
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    cancel_at_period_end: false
  };

  res.status(200).json(mockSubscription);
}
