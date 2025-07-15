# Bet Bot - AI Sports Betting Analytics Platform

## Overview

Bet Bot is a sophisticated full-stack web application that provides AI-powered sports betting analytics. The platform combines real-time odds monitoring, machine learning predictions, and intelligent chat assistance to help users make informed betting decisions. Built with a modern TypeScript stack, it features live odds tracking, edge calculation algorithms, and personalized betting recommendations.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- **External APIs**: The Odds API integration for sports betting data

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
- **OpenAI Integration**: GPT-4o powered chat assistant for betting advice
- **ML Engine**: Custom edge calculation algorithms for identifying value bets
- **Baseball AI System**: TensorFlow.js-powered machine learning model specifically trained on baseball data
- **Odds Analysis**: Real-time probability calculations and implied odds conversion

### Real-time Features
- **WebSocket Service**: Live odds updates and recommendation notifications
- **Live Game Monitoring**: Real-time game status and odds tracking
- **Chat Interface**: Interactive AI assistant with contextual betting advice

## Data Flow

1. **Odds Ingestion**: The Odds API service fetches live and historical sports betting data
2. **ML Processing**: The ML engine analyzes odds to calculate edges and generate predictions
3. **Recommendation Generation**: AI algorithms identify value betting opportunities
4. **Real-time Distribution**: WebSocket service pushes updates to connected clients
5. **User Interaction**: Chat interface allows users to query the AI for personalized advice
6. **Data Persistence**: All interactions and recommendations are stored in PostgreSQL

## External Dependencies

### Core Services
- **The Odds API**: Primary source for sports betting odds and game data
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

#### AI Integration Approach
- **Problem**: Need for contextual betting advice and edge detection
- **Solution**: Dual AI system with OpenAI for chat and custom ML for odds analysis
- **Rationale**: Combines conversational AI with specialized betting algorithms
- **Trade-offs**: Higher complexity but more accurate and specialized insights

#### Real-time Architecture
- **Problem**: Users need live odds updates and instant recommendations
- **Solution**: WebSocket-based real-time communication with query invalidation
- **Rationale**: Provides immediate updates without constant polling
- **Alternatives**: Server-sent events considered but WebSocket chosen for bidirectional communication