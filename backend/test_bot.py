#!/usr/bin/env python3
"""
Simple bot for testing the Blue Team Auth trap system.
Easily configurable to test different scenarios.
"""

import requests
import time
import random
import re
import sys

# === CONFIGURATION ===
BASE_URL = "http://localhost:8000"
DELAY_BETWEEN_REQUESTS = 0.3  # Seconds - MUST be < 0.5 to trigger speed trap (0.5 = threshold)
MAX_REQUESTS = 20  # Maximum number of requests to make
FOLLOW_MAZE_LINKS = True  # Whether to follow links when trapped in maze
AGENT_KEY = None  # Set to your agent key to bypass traps: "your_key_here"
WALLET_ADDRESS = None  # Set to wallet address for token auth: "0xYourWalletAddress..."
VERBOSE = True  # Print detailed information

# === ENDPOINTS TO TEST ===
# Note: /me endpoint is protected by speed trap
# Use /me to trigger the speed trap
ENDPOINTS = [
    "/me",  # This will trigger speed trap if DELAY < 0.5
    # "/stats/trapped",  # Excluded from speed trap
]

class TestBot:
    def __init__(self):
        self.session = requests.Session()
        self.request_count = 0
        self.trapped = False
        self.maze_level = 0
        
        # Set headers
        headers = {
            "User-Agent": "TestBot/1.0 (Testing Blue Team Auth)"
        }
        
        # Add agent key if provided
        if AGENT_KEY:
            headers["X-Agent-Auth"] = AGENT_KEY
            if VERBOSE:
                print(f"🔑 Using Agent Key: {AGENT_KEY[:10]}...")
        
        # Add wallet address for token auth if provided
        if WALLET_ADDRESS:
            headers["X-Wallet-Address"] = WALLET_ADDRESS
            if VERBOSE:
                print(f"💰 Using Wallet Address: {WALLET_ADDRESS[:10]}...")
        
        self.session.headers.update(headers)
    
    def log(self, message):
        if VERBOSE:
            print(f"[{self.request_count}] {message}")
    
    def make_request(self, url):
        """Make a request to the specified URL"""
        if self.request_count >= MAX_REQUESTS:
            self.log("❌ Max requests reached")
            return None
        
        self.request_count += 1
        full_url = f"{BASE_URL}{url}" if url.startswith("/") else url
        
        try:
            start_time = time.time()
            response = self.session.get(full_url, allow_redirects=True, timeout=5)
            elapsed = time.time() - start_time
            
            self.log(f"📍 {full_url} → {response.status_code} ({elapsed:.2f}s)")
            
            # Check if we're in the maze
            if "/maze/" in response.url:
                self.trapped = True
                # Extract maze level from URL
                try:
                    self.maze_level = int(response.url.split("/maze/")[1].split("?")[0].split("/")[0])
                    self.log(f"🚨 TRAPPED IN MAZE! Level: {self.maze_level}")
                except:
                    pass
            
            return response
        except Exception as e:
            self.log(f"❌ Error: {e}")
            return None
    
    def extract_maze_links(self, html_content):
        """Extract links from maze HTML using regex"""
        try:
            # Find all href="/maze/..." patterns
            pattern = r'href=["\'](/maze/\d+[^"\']*)["\']'
            links = re.findall(pattern, html_content)
            return links
        except:
            return []
    
    def run(self):
        """Run the bot"""
        print("🤖 Starting Test Bot...")
        print(f"   Base URL: {BASE_URL}")
        print(f"   Delay: {DELAY_BETWEEN_REQUESTS}s")
        print(f"   Max Requests: {MAX_REQUESTS}")
        print(f"   Follow Maze: {FOLLOW_MAZE_LINKS}")
        print("-" * 50)
        
        # Test initial endpoints - make multiple requests to trigger speed trap
        for endpoint in ENDPOINTS:
            # Make at least 2 requests quickly to trigger speed trap
            for i in range(2):
                response = self.make_request(endpoint)
                if response:
                    if response.status_code == 200:
                        self.log(f"✅ Successfully accessed {endpoint}")
                    elif response.status_code in [307, 308]:  # Redirect (trapped!)
                        self.log(f"🚨 Got redirect response (trapped!)")
                # Only sleep if we haven't reached max and not trapped yet
                if self.request_count < MAX_REQUESTS and not self.trapped:
                    time.sleep(DELAY_BETWEEN_REQUESTS)
                if self.trapped:
                    break
            if self.trapped:
                break
        
        # If trapped, follow maze links
        if self.trapped and FOLLOW_MAZE_LINKS:
            self.log("🕷️  Following maze links...")
            visited_levels = set()
            
            while self.request_count < MAX_REQUESTS and len(visited_levels) < 10:
                # Make a request to current maze level
                maze_url = f"/maze/{self.maze_level}"
                response = self.make_request(maze_url)
                
                if response and response.status_code == 200:
                    visited_levels.add(self.maze_level)
                    
                    # Extract and follow a random link
                    links = self.extract_maze_links(response.text)
                    if links:
                        next_link = random.choice(links)
                        self.log(f"🔗 Following link: {next_link}")
                        response = self.make_request(next_link)
                        
                        # Update maze level from response
                        if response and "/maze/" in response.url:
                            try:
                                new_level = int(response.url.split("/maze/")[1].split("?")[0])
                                self.maze_level = new_level
                            except:
                                self.maze_level += 1
                    else:
                        self.maze_level += 1
                
                time.sleep(DELAY_BETWEEN_REQUESTS)
        
        print("-" * 50)
        print(f"✅ Bot finished: {self.request_count} requests made")
        if self.trapped:
            print(f"🚨 Bot was trapped at maze level {self.maze_level}")
        else:
            print("✅ Bot was NOT trapped")

if __name__ == "__main__":
    bot = TestBot()
    try:
        bot.run()
    except KeyboardInterrupt:
        print("\n⚠️  Bot interrupted by user")
        sys.exit(0)

