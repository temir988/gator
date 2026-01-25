# Gator

A command-line RSS feed aggregator built with TypeScript. Register users, manage RSS feeds, follow your favorite sources, and browse aggregated posts.

## Features

- **User Management** - Register, login, and manage multiple user accounts
- **Feed Management** - Add, follow, and unfollow RSS feeds
- **Feed Aggregation** - Automatically fetch and parse RSS feeds on a schedule
- **Post Browsing** - Browse posts from your followed feeds sorted by date

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **ORM**: Drizzle ORM

## Prerequisites

- Node.js
- PostgreSQL 16+

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd gator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up PostgreSQL (using Docker):
   ```bash
   docker-compose up -d
   ```

4. Run database migrations:
   ```bash
   npm run generate
   npm run migrate
   ```

## Configuration

Gator uses a config file at `~/.gatorconfig.json`:

```json
{
  "db_url": "postgresql://user:password@localhost:5432/gator",
  "current_user_name": "your_username"
}
```

This file is automatically created when you register or login.

## Usage

### User Commands

```bash
# Register a new user
npm start register <username>

# Login as an existing user
npm start login <username>

# List all users
npm start users

# Reset (delete all users)
npm start reset
```

### Feed Commands

```bash
# Add a new feed (automatically follows it)
npm start addfeed "<feed_name>" "<url>"

# Follow an existing feed
npm start follow "<url>"

# Unfollow a feed
npm start unfollow "<url>"

# List all feeds
npm start feeds

# List feeds you follow
npm start following
```

### Aggregation Commands

```bash
# Start the aggregator (fetches feeds on interval)
npm start agg <duration>

# Duration examples: 30s, 5m, 1h, 500ms
```

### Browsing Posts

```bash
# Browse posts from followed feeds (default: 2 posts)
npm start browse

# Browse with custom limit
npm start browse 10
```

## Commands Reference

| Command | Arguments | Description | Auth Required |
|---------|-----------|-------------|---------------|
| `register` | `<username>` | Create a new user account | No |
| `login` | `<username>` | Log in as an existing user | No |
| `users` | - | List all users | No |
| `reset` | - | Delete all users | No |
| `addfeed` | `<name> <url>` | Add and follow a new RSS feed | Yes |
| `follow` | `<url>` | Follow an existing feed | Yes |
| `unfollow` | `<url>` | Unfollow a feed | Yes |
| `feeds` | - | List all feeds | No |
| `following` | - | List your followed feeds | Yes |
| `browse` | `[limit]` | Browse posts (default: 2) | Yes |
| `agg` | `<duration>` | Start feed aggregator | No |

## Database Schema

- **users** - User accounts
- **feeds** - RSS feed metadata
- **feed_follows** - User-feed subscriptions
- **posts** - Aggregated RSS posts
