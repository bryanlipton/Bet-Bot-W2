# Bet Bot - AI Sports Betting Analytics Platform

## Overview

Bet Bot is a sophisticated full-stack web application that provides AI-powered sports betting analytics. The platform combines real-time odds monitoring, machine learning predictions, and intelligent chat assistance to help users make informed betting decisions. Built with a modern TypeScript stack, it features live odds tracking, edge calculation algorithms, and personalized betting recommendations.

**Latest Status (July 16, 2025):** Successfully implemented top-level navigation system replacing existing navigation items with Odds, Scores, My Picks tabs. Created clean header structure with BET BOT branding, main navigation tabs in same row as requested, theme toggle, Get Pro button, and Login button. Moved statistics tiles (This Month, Hit Rate, Active Bets, High Value) to dedicated My Picks page. Updated Pick of the Day section to display "Bet Bot Sports Genie AI Picks" and replaced purple gradient icon with actual BET BOT logo for consistent branding. Enhanced baseball prediction system with umpire data integration and continuous training capabilities remains operational with all test endpoints confirming system functionality.

## User Preferences

Preferred communication style: Simple, everyday language.
Article style: Professional Action Network format with real-time data aggregation, no plagiarism, human-like content quality.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **UI Library**: Radix UI components with Tailwind CSS for consistent, accessible design
- **Styling**: shadcn/ui component system with dark/light mode support
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Updates**: WebSocket integration for live data synchronization

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL (Neon Database)
- **Session Management**: PostgreSQL-based session storage
- **Real-time Communication**: WebSocket server for live updates
- **Historical Data**: Official MLB Stats API for authentic game outcomes
- **Live Odds**: The Odds API integration for current sports betting data

## Key Components

### Data Models
The application uses a comprehensive database schema including:
- **Users**: Authentication and user management
- **Games**: Sports events with team information and timing
- **Odds**: Bookmaker odds data with market types and outcomes
- **Recommendations**: AI-generated betting suggestions with confidence metrics
- **Chat Messages**: Conversational AI interaction history
- **Model Metrics**: Machine learning performance tracking
- **Baseball Games**: Specialized baseball game data with weather and detailed stats
- **Baseball Player Stats**: Historical player performance data for model training
- **Baseball Predictions**: AI-generated game predictions with probability distributions
- **Baseball Model Training**: Training metrics and model performance tracking

### AI Services
- **OpenAI Integration**: GPT-4o powered chat assistant and article generation system
- **Real Historical Backtesting**: Official MLB Stats API integration for authentic game outcomes
- **Professional Article Generation**: Action Network-style content with real-time data aggregation
- **Enhanced Baseball AI System**: TensorFlow.js-powered machine learning model with 27 advanced features
  - **Baseball Savant Integration**: Statcast metrics including xwOBA, barrel percentage, exit velocity
  - **Weather Analytics**: Real-time stadium weather conditions and environmental impact scoring
  - **Ballpark Factors**: Stadium-specific run and home run environment adjustments
  - **Over/Under Prediction**: Specialized total runs prediction with multiple data sources
  - **Team Analytics**: Advanced team-level performance metrics and recent form analysis
  - **Umpire Data Integration**: Real umpire statistics from UmpScores, Umpire Scorecards, EVAnalytics
  - **Continuous Training**: Adaptive learning from actual game results with PostgreSQL storage
  - **Daily Stable Predictions**: Team-based forecasts that remain consistent throughout the day
- **Odds Analysis**: Real-time probability calculations and implied odds conversion
- **Content Intelligence**: Synthesizes multiple data sources for original sports analysis
- **Data Integrity**: 100% authentic data sources - no simulated or synthetic data

### Real-time Features
- **WebSocket Service**: Live odds updates and recommendation notifications
- **Live Game Monitoring**: Real-time game status and odds tracking
- **Chat Interface**: Interactive AI assistant with contextual betting advice

## Data Flow

1. **Historical Analysis**: MLB Stats API provides authentic game outcomes for backtesting
2. **Live Odds Ingestion**: The Odds API service fetches current sports betting data
3. **ML Processing**: The ML engine analyzes real historical data to calculate edges and generate predictions
4. **Recommendation Generation**: AI algorithms identify value betting opportunities using authentic data
5. **Real-time Distribution**: WebSocket service pushes updates to connected clients
6. **User Interaction**: Chat interface allows users to query the AI for personalized advice
7. **Data Persistence**: All interactions and recommendations are stored in PostgreSQL

## External Dependencies

### Core Services
- **MLB Stats API**: Official source for historical game outcomes and authentic data (FREE)
- **The Odds API**: Primary source for live sports betting odds and current game data
- **OpenAI API**: Powers the conversational AI assistant
- **Neon Database**: PostgreSQL hosting for data persistence

### Third-party Libraries
- **Radix UI**: Accessible UI component primitives
- **TanStack Query**: Server state management and caching
- **Drizzle ORM**: Type-safe database operations
- **WebSocket (ws)**: Real-time bidirectional communication

## Deployment Strategy

### Development Environment
- **Vite Development Server**: Fast HMR and TypeScript compilation
- **TSX Runtime**: Direct TypeScript execution for the backend
- **Environment Variables**: Separate configuration for API keys and database URLs

### Production Build
- **Frontend**: Vite builds optimized React bundle to `dist/public`
- **Backend**: esbuild compiles TypeScript server to `dist/index.js`
- **Database**: Drizzle migrations handle schema updates
- **Static Assets**: Frontend served from Express in production

### Key Architectural Decisions

#### Database Strategy
- **Problem**: Need for reliable data persistence and real-time capabilities
- **Solution**: PostgreSQL with Drizzle ORM for type safety and performance
- **Rationale**: Provides ACID compliance, complex querying, and session storage
- **Alternatives**: MongoDB considered but PostgreSQL chosen for relational data integrity

#### Real Data Integration Approach (Updated July 2025)
- **Problem**: Need for authentic historical data validation instead of simulated backtests
- **Solution**: Integration with official MLB Stats API for real game outcomes + The Odds API for live odds
- **Rationale**: Professional-grade backtesting requires authentic market data, not synthetic results
- **Implementation**: Complete removal of simulated data components, 100% real data sources
- **Results**: Demonstrated model overfitting through authentic out-of-sample testing

#### Real-time Architecture
- **Problem**: Users need live odds updates and instant recommendations
- **Solution**: WebSocket-based real-time communication with query invalidation
- **Rationale**: Provides immediate updates without constant polling
- **Alternatives**: Server-sent events considered but WebSocket chosen for bidirectional communication