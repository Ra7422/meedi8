# CLI Tools for Meedi8 Development

This document provides a curated list of command-line tools that enhance the Meedi8 development workflow. These tools were selected from [awesome-cli-apps](https://github.com/agarrharr/awesome-cli-apps) specifically for our tech stack and use case.

## 🔥 High Priority - Install These Now

### 1. API Testing & Development

#### HTTPie
**Purpose:** Human-friendly HTTP client - much better than curl for testing FastAPI endpoints

**Installation:**
```bash
brew install httpie
# or
pip install httpie --break-system-packages
```

**Usage:**
```bash
# Test room creation
http POST localhost:8000/rooms/ name="Test Room" category="family" Authorization:"Bearer $TOKEN"

# Test coaching endpoint
http POST localhost:8000/rooms/{room_id}/coach/respond summary="I feel frustrated" Authorization:"Bearer $TOKEN"

# Pretty-print JSON responses automatically
http GET localhost:8000/rooms/ Authorization:"Bearer $TOKEN"
```

#### ATAC (Alternative)
**Purpose:** Feature-full TUI API client made in Rust

**Installation:**
```bash
brew install atac
```

#### HTTP Prompt
**Purpose:** Interactive HTTP client with autocomplete

**Installation:**
```bash
pip install http-prompt --break-system-packages
```

**Usage:**
```bash
http-prompt http://localhost:8000

# In the prompt:
> Authorization:Bearer YOUR_TOKEN
> POST /rooms/ name="Test Room" category="family"
> GET /rooms/{{room_id}}/coach/turns
```

---

### 2. Database Management

#### pgcli
**Purpose:** PostgreSQL client with autocompletion and syntax highlighting (ESSENTIAL for production debugging)

**Installation:**
```bash
pip install pgcli --break-system-packages
```

**Usage:**
```bash
# Connect to local SQLite (development)
sqlite3 backend/meedi8.db

# Connect to Railway PostgreSQL (production)
pgcli $DATABASE_URL

# Example queries for debugging
SELECT id, phase, created_at FROM rooms ORDER BY created_at DESC LIMIT 10;
SELECT room_id, context, kind, created_at FROM turns WHERE room_id = 'abc123' ORDER BY created_at;
SELECT * FROM safety_events WHERE human_reviewed = false;
```

**Why it's better:**
- Autocomplete table/column names
- Syntax highlighting
- Smart completion (suggests JOIN conditions)
- Multi-line editing
- Query history

#### iredis
**Purpose:** Redis client with autocompletion (essential for debugging WebSocket sessions)

**Installation:**
```bash
pip install iredis --break-system-packages
```

**Usage:**
```bash
iredis -h localhost -p 6379

# Debug break requests
> GET room:abc123:break_requested_by_id
> GET room:abc123:break_requested_at

# Monitor WebSocket sessions
> KEYS session:*
> GET session:xyz789
```

---

### 3. Docker/Container Management

#### lazydocker
**Purpose:** Interactive Docker UI in terminal - THE BEST way to manage containers

**Installation:**
```bash
brew install lazydocker
```

**Usage:**
```bash
lazydocker
```

**Features:**
- View/restart containers with keyboard shortcuts
- See logs for all containers in one place
- Monitor CPU/memory usage
- Execute commands inside containers
- Prune unused images/containers

**Meedi8 Use Cases:**
- Monitor backend/postgres/redis containers
- View backend logs while testing
- Restart services after code changes
- Check container resource usage

---

### 4. Code Quality - CRITICAL FOR MEDIATION PLATFORM

#### alex
**Purpose:** Detects insensitive, inconsiderate writing - ESSENTIAL for Meedi8's coaching language

**Installation:**
```bash
npm install -g alex
```

**Usage:**
```bash
# Check your AI prompts for problematic language
alex backend/app/services/pre_mediation_coach.py
alex backend/app/services/main_room_mediator.py
alex backend/app/utils/prompts.py

# Check documentation
alex README.md CLAUDE.md
```

**Why This Matters for Meedi8:**
- Ensures coaching language is inclusive
- Catches gendered language (e.g., "guys" → "everyone")
- Identifies potentially triggering terms
- Maintains professional, neutral tone in mediation
- Prevents bias in AI prompts

**Example Output:**
```
backend/app/services/pre_mediation_coach.py
  12:15-12:19  warning  `guys` may be insensitive, use `people`, `persons`, `folks` instead  he-her
```

---

### 5. File Search & Navigation

#### ripgrep (rg)
**Purpose:** Blazing fast code search - THE FASTEST way to find things in your codebase

**Installation:**
```bash
brew install ripgrep
```

**Usage:**
```bash
# Find all references to current_speaker_id
rg "current_speaker_id"

# Search only Python files
rg "def.*room" --type py

# Search with context (3 lines before/after)
rg "break_requested" -C 3

# Search and replace preview
rg "OLD_TERM" --files-with-matches | xargs sed -i '' 's/OLD_TERM/NEW_TERM/g'
```

**Common Meedi8 Searches:**
```bash
rg "TODO" --type py                    # Find all TODOs
rg "FIXME"                             # Find all FIXMEs
rg "phase.*transition"                 # Find phase transition logic
rg "def.*coach"                        # Find all coaching functions
rg "current_speaker_id"                # Find turn-taking logic
rg "safety.*flag"                      # Find safety screening code
```

#### fd
**Purpose:** Better `find` command - fast and user-friendly

**Installation:**
```bash
brew install fd
```

**Usage:**
```bash
# Find all Python test files
fd "test_" backend/ --extension py

# Find all migration files
fd "20251" backend/migrations/versions/

# Find all React components
fd . frontend/src/components --extension jsx

# Exclude node_modules and .git
fd "config" --type f --exclude node_modules
```

#### fzf
**Purpose:** General-purpose fuzzy finder - integrate with everything

**Installation:**
```bash
brew install fzf
$(brew --prefix)/opt/fzf/install  # Install shell integrations
```

**Usage:**
```bash
# Fuzzy search command history (Ctrl-R)
# Press Ctrl-R and start typing

# Fuzzy file finder (Ctrl-T)
vim **<TAB>  # Opens fzf to select file

# Fuzzy directory navigation (Alt-C)
cd **<TAB>  # Opens fzf to select directory

# Custom: Find and edit file
fd --type f | fzf | xargs vim
```

---

### 6. Git Workflow

#### lazygit
**Purpose:** TUI for git - manage all git operations in one interface

**Installation:**
```bash
brew install lazygit
```

**Usage:**
```bash
# Run in any git repo
lazygit
```

**Features:**
- Stage/unstage files with space bar
- Write commit messages in editor
- Push/pull with keyboard shortcuts
- View beautiful commit history
- Resolve merge conflicts visually
- Cherry-pick commits
- Rebase interactively

**Keyboard Shortcuts:**
- `?` - Help
- `1-5` - Switch panels (Status, Files, Branches, Commits, Stash)
- `space` - Stage/unstage
- `c` - Commit
- `P` - Push
- `p` - Pull

#### tig
**Purpose:** Text-mode interface for git - great for reviewing history

**Installation:**
```bash
brew install tig
```

**Usage:**
```bash
# View commit history
tig

# View file history
tig backend/app/routes/rooms.py

# View blame
tig blame backend/app/services/main_room_mediator.py

# View stashes
tig stash
```

---

## 📊 Medium Priority - Quality of Life

### 7. Documentation

#### glow
**Purpose:** Render markdown beautifully in terminal

**Installation:**
```bash
brew install glow
```

**Usage:**
```bash
# Read documentation with style
glow CLAUDE.md
glow README.md
glow telegram.md

# Page mode (like less)
glow -p CLAUDE.md

# Render and display on specific page
glow CLAUDE.md -p 3
```

#### doctoc
**Purpose:** Auto-generate table of contents for markdown files

**Installation:**
```bash
npm install -g doctoc
```

**Usage:**
```bash
# Generate TOC for CLAUDE.md
doctoc CLAUDE.md

# Update all markdown files in docs/
doctoc docs/ --title "## Table of Contents"
```

---

### 8. Monitoring

#### glances
**Purpose:** System monitoring tool - see CPU, memory, disk, network in real-time

**Installation:**
```bash
brew install glances
```

**Usage:**
```bash
glances

# Web interface (access from browser)
glances -w

# Export to CSV
glances --export csv --export-csv-file ./glances.csv
```

**Use Cases:**
- Monitor system resources during load testing
- Identify memory leaks in development
- Check if Docker containers are consuming too much RAM

#### bandwhich
**Purpose:** Track bandwidth utilization by process

**Installation:**
```bash
brew install bandwhich
```

**Usage:**
```bash
sudo bandwhich
```

**Use Cases:**
- See which process is hammering your API
- Monitor WebSocket bandwidth usage
- Debug network issues in development

---

### 9. File Management

#### bat
**Purpose:** Better `cat` with syntax highlighting and line numbers

**Installation:**
```bash
brew install bat
```

**Usage:**
```bash
# View file with syntax highlighting
bat backend/app/routes/rooms.py

# View with line numbers
bat -n backend/app/services/pre_mediation_coach.py

# View multiple files
bat backend/app/models/*.py

# Pipe to bat
curl https://api.meedi8.com/health | bat --language json
```

**Alias suggestion:**
```bash
# Add to ~/.zshrc or ~/.bashrc
alias cat='bat --paging=never'
```

#### lsd or eza
**Purpose:** Better `ls` with icons, colors, and tree view

**Installation:**
```bash
brew install lsd
# or
brew install eza
```

**Usage:**
```bash
# lsd
lsd -la                    # List all with details
lsd --tree                 # Tree view
lsd --tree --depth 2       # Limit tree depth

# eza (more features)
eza -la                    # List all with details
eza --tree                 # Tree view
eza --git                  # Show git status
eza --icons                # Show file icons
```

**Alias suggestion:**
```bash
# Add to ~/.zshrc or ~/.bashrc
alias ls='eza --icons --git'
alias ll='eza -la --icons --git'
alias tree='eza --tree --icons'
```

---

## 🎯 Specific to Your Stack

### 10. Testing

#### loadtest
**Purpose:** HTTP load testing - stress test your API

**Installation:**
```bash
npm install -g loadtest
```

**Usage:**
```bash
# Test polling endpoint (simulate 100 concurrent users)
loadtest -c 100 -t 60 http://localhost:8000/rooms/abc123/main-room/messages

# Test room creation with auth
loadtest -c 10 -t 30 -m POST \
  -H "Authorization: Bearer $TOKEN" \
  -T 'application/json' \
  -P '{"name":"Test","category":"family"}' \
  http://localhost:8000/rooms/

# Results show:
# - Requests per second
# - Mean latency
# - Percentiles (50th, 95th, 99th)
# - Error rate
```

**Meedi8 Load Test Scenarios:**
1. Polling stress test (100 users polling every 3 seconds)
2. Coaching response latency (AI token generation)
3. WebSocket connection handling
4. Concurrent room creations

---

### 11. Security

#### pass
**Purpose:** Password manager in terminal

**Installation:**
```bash
brew install pass
```

**Usage:**
```bash
# Initialize password store
pass init your-gpg-id

# Store API keys
pass insert meedi8/anthropic-api-key
pass insert meedi8/sendgrid-api-key
pass insert meedi8/railway-db-url

# Retrieve keys
export ANTHROPIC_API_KEY=$(pass show meedi8/anthropic-api-key)

# Generate random password
pass generate meedi8/jwt-secret 32
```

**Why Better Than .env:**
- Encrypted with GPG
- Version controlled (can use git)
- Sync across machines
- Audit trail of access

#### gopass (Alternative)
**Purpose:** pass with team features

**Installation:**
```bash
brew install gopass
```

**Features:**
- Multiple password stores (personal, team)
- Secret sharing
- JSON/YAML support
- Extensions for browsers

---

### 12. Process Management

#### pm2
**Purpose:** Process manager for Node.js - keep services running

**Installation:**
```bash
npm install -g pm2
```

**Usage:**
```bash
# Start frontend dev server
cd frontend
pm2 start "npm run dev" --name meedi8-frontend

# Start multiple processes
pm2 start ecosystem.config.js

# Monitor all processes
pm2 monit

# View logs
pm2 logs meedi8-frontend

# Restart on file changes
pm2 start npm --name meedi8-frontend --watch -- run dev
```

**ecosystem.config.js example:**
```javascript
module.exports = {
  apps: [
    {
      name: 'meedi8-backend',
      script: 'backend/run.sh',
      watch: ['backend/app'],
      ignore_watch: ['node_modules', 'backend/.venv'],
    },
    {
      name: 'meedi8-frontend',
      script: 'npm',
      args: 'run dev',
      cwd: './frontend',
    },
  ],
};
```

---

## 🚀 Quick Installation

### Install All Essentials (macOS)

```bash
# Homebrew packages
brew install httpie pgcli lazydocker ripgrep fd fzf lazygit glow bat lsd tig glances bandwhich loadtest pass

# Python packages
pip install iredis --break-system-packages

# Node packages
npm install -g alex doctoc loadtest pm2

# Setup fzf shell integration
$(brew --prefix)/opt/fzf/install
```

### Install All Essentials (Linux)

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y httpie ripgrep fd-find fzf tig glances bat

# Rust-based tools (via cargo)
cargo install ripgrep fd-find bat eza

# Python packages
pip install pgcli iredis --break-system-packages

# Node packages
npm install -g alex doctoc loadtest pm2

# lazygit
LAZYGIT_VERSION=$(curl -s "https://api.github.com/repos/jesseduffield/lazygit/releases/latest" | grep -Po '"tag_name": "v\K[^"]*')
curl -Lo lazygit.tar.gz "https://github.com/jesseduffield/lazygit/releases/latest/download/lazygit_${LAZYGIT_VERSION}_Linux_x86_64.tar.gz"
tar xf lazygit.tar.gz lazygit
sudo install lazygit /usr/local/bin
```

---

## 💡 Workflow Examples for Meedi8

### Testing the Coaching Flow

```bash
# Start interactive HTTP session
http-prompt http://localhost:8000

# In the prompt:
> Authorization:Bearer YOUR_TOKEN
> POST /rooms/ name="Test Room" category="family"
> GET /rooms/{{room_id}}
> POST /rooms/{{room_id}}/coach/respond summary="I feel frustrated about dishes"
> GET /rooms/{{room_id}}/coach/turns
```

### Debugging Database Issues

```bash
# Connect to Railway production database
pgcli $DATABASE_URL

# Check recent room phases
SELECT id, phase, user1_summary, user2_summary, created_at 
FROM rooms 
ORDER BY created_at DESC 
LIMIT 10;

# Check turn history for a specific room
SELECT context, kind, summary, created_at 
FROM turns 
WHERE room_id = 'abc123' 
ORDER BY created_at;

# Check for safety events
SELECT session_id, event_type, created_at 
FROM safety_events 
WHERE human_reviewed = false 
ORDER BY created_at DESC;

# Check subscription usage
SELECT u.email, s.tier, s.rooms_used_this_month, s.voice_conversations_used
FROM users u
JOIN subscriptions s ON u.id = s.user_id
WHERE s.rooms_used_this_month > 0
ORDER BY s.rooms_used_this_month DESC;
```

### Finding Code Quickly

```bash
# Where is the turn-taking logic?
rg "current_speaker_id" backend/

# Where do we handle break requests?
rg "break_requested" --type py

# Find all TODO comments
rg "TODO|FIXME" backend/ frontend/

# Where do we use Claude API?
rg "anthropic" backend/

# Find all database migrations
fd "20251" backend/migrations/versions/
```

### Checking for Problematic Language

```bash
# Check AI prompts for bias/insensitive language
alex backend/app/services/pre_mediation_coach.py
alex backend/app/services/main_room_mediator.py
alex backend/app/utils/prompts.py

# Check all Python files
find backend -name "*.py" | xargs alex

# Check documentation
alex README.md CLAUDE.md telegram.md
```

### Monitoring System Resources

```bash
# System overview
glances

# Docker containers
lazydocker

# Network usage by process
sudo bandwhich

# Git changes
lazygit
```

### Load Testing

```bash
# Test polling endpoint (simulate 50 users)
loadtest -c 50 -t 60 \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/rooms/abc123/main-room/messages

# Test room creation
loadtest -c 10 -t 30 \
  -m POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -P '{"name":"Load Test","category":"family"}' \
  http://localhost:8000/rooms/

# Test coaching response (measures AI latency)
loadtest -c 5 -t 60 \
  -m POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -P '{"summary":"I feel frustrated"}' \
  http://localhost:8000/rooms/{room_id}/coach/respond
```

---

## 🎨 Shell Setup Enhancements

### starship
**Purpose:** Beautiful cross-shell prompt

**Installation:**
```bash
brew install starship

# Add to ~/.zshrc or ~/.bashrc
eval "$(starship init zsh)"
```

**Features:**
- Shows git status (branch, dirty state)
- Shows Python version in venv
- Shows Node version
- Shows command duration
- Shows error codes

### zoxide
**Purpose:** Smart `cd` that learns your patterns

**Installation:**
```bash
brew install zoxide

# Add to ~/.zshrc or ~/.bashrc
eval "$(zoxide init zsh)"
```

**Usage:**
```bash
# After visiting directories a few times
z meedi8           # Jumps to ~/projects/meedi8
z front            # Jumps to ~/projects/meedi8/frontend
z back             # Jumps to ~/projects/meedi8/backend

# Interactive selection
zi meedi8
```

---

## 📝 Shell Aliases for Meedi8

Add these to your `~/.zshrc` or `~/.bashrc`:

```bash
# Meedi8 project shortcuts
alias m='cd ~/projects/meedi8'
alias mf='cd ~/projects/meedi8/frontend'
alias mb='cd ~/projects/meedi8/backend'

# Development servers
alias mbe='cd ~/projects/meedi8/backend && ./run.sh'
alias mfe='cd ~/projects/meedi8/frontend && npm run dev'

# Database
alias mdb='pgcli $DATABASE_URL'
alias mlocaldb='sqlite3 ~/projects/meedi8/backend/meedi8.db'

# Docker
alias mdc='cd ~/projects/meedi8 && docker-compose up -d'
alias mdd='cd ~/projects/meedi8 && docker-compose down'
alias mdl='cd ~/projects/meedi8 && docker-compose logs -f'

# Git
alias mg='cd ~/projects/meedi8 && lazygit'
alias gs='git status'
alias gp='git push'
alias gl='git pull'

# Testing
alias mtest='cd ~/projects/meedi8/backend && pytest'
alias mlint='cd ~/projects/meedi8 && alex backend/app/**/*.py'

# Monitoring
alias mmon='glances'
alias mlazy='lazydocker'

# File operations (with eza)
alias ls='eza --icons --git'
alias ll='eza -la --icons --git --header'
alias tree='eza --tree --icons --git-ignore'

# File viewing (with bat)
alias cat='bat --paging=never'
alias less='bat'
```

---

## 🏆 Top 3 Recommendations for Immediate Impact

### 1. lazydocker
**Why:** You use Docker extensively for PostgreSQL, Redis, and backend services
**Impact:** Saves hours per week managing containers, viewing logs, debugging services
**Install:** `brew install lazydocker`

### 2. pgcli
**Why:** Essential for debugging production database on Railway
**Impact:** 10x faster database debugging with autocomplete and syntax highlighting
**Install:** `pip install pgcli --break-system-packages`

### 3. alex
**Why:** CRITICAL for ensuring mediation language is appropriate and inclusive
**Impact:** Prevents bias in AI prompts, maintains professional tone, catches insensitive language
**Install:** `npm install -g alex`

---

## 📚 Additional Resources

### Learn More
- [awesome-cli-apps](https://github.com/agarrharr/awesome-cli-apps) - Full list of CLI tools
- [Modern Unix Tools](https://github.com/ibraheemdev/modern-unix) - Modern alternatives to Unix commands
- [command-line-tools-for-developers](https://github.com/learn-anything/command-line-tools) - Curated list

### Tutorials
- [The Art of Command Line](https://github.com/jlevy/the-art-of-command-line)
- [Awesome Shell](https://github.com/alebcay/awesome-shell)
- [Command Line Interface Guidelines](https://clig.dev/)

---

## 🔄 Keeping Tools Updated

```bash
# Update Homebrew packages
brew update && brew upgrade

# Update Python packages
pip list --outdated
pip install --upgrade pgcli iredis --break-system-packages

# Update Node packages
npm update -g

# Update Rust packages
cargo install-update -a
```

---

## 🛠️ Troubleshooting

### HTTPie not working with JWT tokens
```bash
# Use header format
http GET localhost:8000/rooms/ Authorization:"Bearer YOUR_TOKEN"

# Or use HTTPie sessions
http --session=meedi8 --auth-type=bearer --auth=YOUR_TOKEN localhost:8000/rooms/
```

### pgcli can't connect to Railway
```bash
# Get the full DATABASE_URL from Railway
# Make sure it includes postgresql:// prefix
pgcli "postgresql://user:pass@host:5432/dbname"
```

### lazydocker not showing containers
```bash
# Make sure Docker is running
docker ps

# Run lazydocker with verbose output
lazydocker --verbose
```

### alex showing false positives
```bash
# Create .alexrc to configure rules
# Add to project root:
{
  "allow": ["guys", "simple"]
}
```

---

## 📊 Performance Comparison

### Search Speed (searching for "current_speaker_id" in codebase)
- `grep -r "current_speaker_id" .` - 2.3 seconds
- `rg "current_speaker_id"` - 0.08 seconds
- **28x faster with ripgrep**

### Database Query Time (with autocomplete)
- `psql` - Type full query manually (30 seconds)
- `pgcli` - Autocomplete table/columns (8 seconds)
- **3.75x faster with pgcli**

### Docker Management
- `docker ps && docker logs -f` - Multiple commands (60 seconds)
- `lazydocker` - One interface (10 seconds)
- **6x faster with lazydocker**

---

**Last Updated:** 2025-11-13
**Maintainer:** Adam (Meedi8 founder)
