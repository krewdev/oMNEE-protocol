# Test Bot Usage Guide

## Quick Start

```bash
cd backend
python3 test_bot.py
```

**Note:** Requires Python 3 and the `requests` library:
```bash
pip install requests
```

## Configuration

Edit the top of `test_bot.py` to change settings:

### Basic Settings

```python
BASE_URL = "http://localhost:8000"  # Your API URL
DELAY_BETWEEN_REQUESTS = 0.3        # Seconds (use < 0.5 to trigger speed trap)
MAX_REQUESTS = 20                    # How many requests to make
FOLLOW_MAZE_LINKS = True            # Follow links when trapped
VERBOSE = True                       # Show detailed output
```

### Test with Agent Key (Bypass Traps)

```python
AGENT_KEY = "your_generated_key_here"  # Use key from frontend or /generate-key endpoint
```

### Test with Wallet Address

```python
WALLET_ADDRESS = "0xYourWalletAddress..."  # Ethereum wallet address
```

## Test Scenarios

### Scenario 1: Trigger Speed Trap (Bot Detection)
```python
DELAY_BETWEEN_REQUESTS = 0.2  # Fast requests trigger trap
ENDPOINTS = ["/me"]
```
This will make rapid requests and get redirected to the maze.

### Scenario 2: Legitimate User (Slow Requests)
```python
DELAY_BETWEEN_REQUESTS = 1.0  # Slow requests = legitimate
ENDPOINTS = ["/me"]
```
This simulates a normal user browsing slowly.

### Scenario 3: Agent Key Bypass
```python
AGENT_KEY = "your_key_here"
DELAY_BETWEEN_REQUESTS = 0.1  # Even fast requests allowed with key
ENDPOINTS = ["/me"]
```
This shows how agent keys bypass the speed trap.

### Scenario 4: Deep Maze Crawling
```python
DELAY_BETWEEN_REQUESTS = 0.3
MAX_REQUESTS = 50
FOLLOW_MAZE_LINKS = True
```
This tests how deep a bot can go into the maze.

## Example Output

```
🤖 Starting Test Bot...
   Base URL: http://localhost:8000
   Delay: 0.3s
   Max Requests: 20
   Follow Maze: True
--------------------------------------------------
[1] 📍 http://localhost:8000/me → 200 (0.05s)
[2] 📍 http://localhost:8000/me → 307 (0.01s)
🚨 TRAPPED IN MAZE! Level: 1
[3] 📍 http://localhost:8000/maze/1 → 200 (2.05s)
🕷️  Following maze links...
🔗 Following link: /maze/2?q=1234
[4] 📍 http://localhost:8000/maze/2 → 200 (2.03s)
...
--------------------------------------------------
✅ Bot finished: 20 requests made
🚨 Bot was trapped at maze level 3
```

## Watch the Dashboard

While the bot runs, check the stats endpoint to see:
- The bot appearing in "Active Threats"
- The trap count increasing
- The bot's IP and maze level

```bash
curl http://localhost:8000/stats/trapped
```

## Getting an Agent Key

### Method 1: From API
```bash
curl -X POST http://localhost:8000/generate-key
# Returns: {"key":"abc123..."}
```

### Method 2: From Frontend
1. Navigate to `/faucet` or `/teleport` page
2. Connect wallet
3. Blue Team component generates key automatically
4. Check browser console for the key

### Method 3: Use in Script
```python
import requests
response = requests.post("http://localhost:8000/generate-key")
AGENT_KEY = response.json()["key"]
```

## Advanced Usage

### Test Multiple Endpoints
```python
ENDPOINTS = ["/me", "/stats/trapped", "/generate-key"]
```

### Custom Headers
The bot automatically includes:
- `User-Agent`: TestBot/1.0
- `X-Agent-Auth`: (if AGENT_KEY is set)
- `X-Wallet-Address`: (if WALLET_ADDRESS is set)

### Monitor in Real-Time
Run the bot in one terminal and watch stats in another:
```bash
# Terminal 1
python3 test_bot.py

# Terminal 2
watch -n 1 'curl -s http://localhost:8000/stats/trapped | python3 -m json.tool'
```

## Troubleshooting

### "ModuleNotFoundError: No module named 'requests'"
```bash
pip install requests
```

### Bot Not Getting Trapped
- Check `DELAY_BETWEEN_REQUESTS` is < 0.5
- Verify backend is running
- Check endpoint is protected (not `/stats/trapped`)

### Connection Refused
- Make sure backend is running: `cd backend && npm start`
- Check BASE_URL is correct

### Agent Key Not Working
- Verify key is correct
- Check backend is using same AGENT_KEY
- Make sure header is being sent: `X-Agent-Auth`

