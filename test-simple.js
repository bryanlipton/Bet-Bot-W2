// Simple test to check if endpoint is working
fetch('https://bet-bot-blipton03.replit.app/api/gpt/prediction-fixed', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ homeTeam: 'Yankees', awayTeam: 'Red Sox' })
})
.then(res => res.json())
.then(data => console.log('Result:', JSON.stringify(data, null, 2)))
.catch(err => console.log('Error:', err.message));