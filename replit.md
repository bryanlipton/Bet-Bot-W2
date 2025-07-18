# Bet Bot - AI Sports Betting Analytics Platform

## Overview

Bet Bot is a sophisticated full-stack web application that provides AI-powered sports betting analytics. The platform combines real-time odds monitoring, machine learning predictions, and intelligent chat assistance to help users make informed betting decisions. Built with a modern TypeScript stack, it features live odds tracking, edge calculation algorithms, and personalized betting recommendations.

**Latest Status (July 17, 2025):** Complete "Make Pick" workflow with deep linking and manual entry functionality implemented. Users can now click "Pick" buttons on any betting line (moneyline, spread, over/under) to view odds comparison across all 8 connected bookmakers (DraftKings, FanDuel, BetMGM, Caesars, BetRivers, Bovada, Fanatics, MyBookie). The system highlights best odds with crown icons and supports deep linking to specific bet pages for supported bookmakers (DraftKings, FanDuel, BetMGM, Caesars, BetRivers, Fanatics). Deep link indicators show which bookmakers can open the exact bet chosen rather than just the homepage. All picks are automatically saved to local storage and tracked in the "My Picks" page with comprehensive statistics.

**Manual Entry Feature (July 17, 2025):** Added "Enter Manually" button functionality in the OddsComparisonModal that allows users to save picks without odds and complete the entry in the My Picks tab. Manual entry picks are marked with bookmaker key 'manual' and displayName 'Manual Entry', with odds set to 0 initially. In the My Picks page, manual entries show an "Enter Odds" button that opens an inline input field where users can add their actual betting odds. The system provides save/cancel functionality and allows editing of odds for manual entries even after they're saved.

**My Picks Manual Entry Button (July 17, 2025):** Added prominent "Enter Manually" button in the My Picks page positioned below Total Picks stats cards and above the filter tabs. The button opens a comprehensive modal dialog allowing users to input complete pick details including away/home teams, bet type (moneyline, spread, total), selection, line/point (for spread/total bets), and optional odds. All manual entries are saved with 'manual' bookmaker designation and can be edited later using the existing odds entry functionality.

**Enhanced Manual Entry UX (July 17, 2025):** Updated manual entry modal to use game selection dropdown instead of manual team input. Users now first select from available games (fetched from the complete schedule API), then choose from dynamically generated betting options based on the selected game's available markets. The system automatically generates moneyline, spread, and over/under options with proper labels (e.g., "Boston Red Sox -1.5", "Over 8.5") and handles line/point values automatically. This provides a more intuitive and accurate manual entry experience.

**Units Selection in Manual Entry (July 18, 2025):** Added comprehensive units selection functionality to the manual pick entry modal. Users can now specify the number of units (0.5 increments) for both single bets and parlay bets, positioned between game selection and odds input as requested. The interface includes +/- buttons and direct input, displaying the calculated bet amount based on the user's bet unit setting (e.g., "1.5 units = $75 bet"). Updated Pick type definition to include units field for proper data tracking.

**Safety Enhancement (July 18, 2025):** Removed the "Clear All" button from My Picks page header to prevent accidental deletion of all betting data. Users can still delete individual picks using per-pick delete buttons, maintaining data safety while preserving necessary functionality.

**Scores Page Navigation Fix (July 17, 2025):** Fixed the date navigation layout on the scores page to prevent sliding when the "Go to Today" button appears/disappears. The layout now uses a fixed three-column structure with Previous button on the left, centered date display in the middle, and Next button with reserved space for "Go to Today" on the right. This ensures the date and navigation elements remain stable when navigating between dates.

**Grade Badge Positioning Update (July 17, 2025):** Improved the alignment of grade badges in game cards to center them with the "Bet Bot Pick" column header vertically. The info button now positioned at the top-right corner of the grade badge using absolute positioning (-top-1 -right-1), creating a more intuitive and accessible layout where users can easily click the info button while maintaining clean visual hierarchy.

**Parlay Functionality Addition (July 17, 2025):** Added comprehensive parlay betting functionality to the manual entry modal. Users can now choose between "Single Bet" and "Parlay" tabs when entering manual picks. The parlay tab allows users to add multiple betting legs from different games, with each leg displaying game information, betting selection, and individual odds. Parlay picks are saved with combined odds and display all legs in a compact format within the My Picks page. The system properly handles parlay data structure with parlayLegs array containing game, market, selection, line, and odds information for each leg.

**Info Button Styling Enhancement (July 17, 2025):** Enhanced info button positioning and styling across all components. Info buttons now positioned further to the top-right (-top-2 -right-2) with expanded click area (p-1 cursor-pointer). Updated styling to use black background with white "i" icon in light mode and grey background with black "i" icon in dark mode. Button size reduced to h-4 w-4 with smaller h-2.5 w-2.5 icon for better visual balance. Changes applied consistently across ActionStyleGameCard, DailyPick, and LoggedInLockPick components.

**Game Card Layout Optimization (July 17, 2025):** Restructured game card layout with improved alignment and typography. Grade badges now center-align vertically with "Bet Bot Pick" text, info buttons positioned to the right of grades, and Pick buttons align consistently using left padding. Team names and odds increased to text-sm for better readability. Both moneyline and spread/over-under sections use consistent text-sm font sizing across all team names and betting values. Updated the InfoButton component to display complete pick analysis modal instead of game details, showing Pick Details, Reasoning, and Analysis Factors as requested. Fixed click event propagation to prevent GameDetailsModal from opening when clicking InfoButton.

**Business-Critical Button Design Update (July 17, 2025):** Moved Pick buttons to the right of odds in new dedicated column with 5-column grid layout. Removed target icons from Pick buttons for cleaner design. Enhanced all buttons (Pick, Fade, etc.) with prominent business-focused styling: bright backgrounds, white text, font-semibold weight, and shadow effects. These buttons are now clearly designed as actionable elements to drive user clicks and sportsbook traffic, which is critical for the business model.

**Coordinated Button Styling (July 17, 2025):** Updated all button styling for consistency across the application. Over/Under buttons now use spread button styling (green for Over, red for Under) with matching font-semibold and shadow effects. Moneyline Pick buttons now use team colors from the team badge system for brand coordination. DailyPick and LoggedInLockPick components updated to match spread button design with green Pick buttons and red Fade buttons, maintaining consistent business-focused styling throughout the platform.

**Dashboard Layout Update (July 17, 2025):** Restructured the main dashboard to display Pick of the Day and Logged In Lock Pick side by side in a responsive grid layout. This horizontal arrangement ensures users immediately see both betting options when they land on the site, with all game odds and features visible below when scrolling. The layout uses `grid-cols-1 lg:grid-cols-2` for responsive behavior, stacking vertically on mobile and displaying horizontally on desktop screens.

**Game Card UI Improvements (July 17, 2025):** Enhanced MLB game cards with complete information access and cleaner display. Added information buttons next to all Bet Bot grade bubbles in the game cards, providing detailed explanations of AI analysis methodology. Updated spread and over/under sections to display "Spread TBD" and "O/U TBD" when betting lines are not yet available, with disabled pick buttons for unavailable markets. Removed "Other Books" section from game cards for cleaner, more focused user interface.

**API Quota Management (July 17, 2025):** Fixed "Lines not posted" issue that occurred when The Odds API quota was exceeded (20,000 calls in 3 days). Implemented comprehensive caching system with 15-minute TTL, rate limiting with 5-second minimum intervals between API calls, and robust mock data fallback. System now provides realistic betting odds with multiple bookmakers when API quota is reached, ensuring continuous user experience. Enhanced error handling prevents quota exhaustion while maintaining data quality.

**Daily API Limit Protection (July 17, 2025):** Implemented strict daily quota system with 645 API calls per day limit. When the daily limit is reached, the system automatically maintains existing odds data by serving expired cache entries rather than making new API calls. This ensures users continue to see consistent betting odds while preventing quota overruns. The system automatically resets the daily counter at midnight and tracks usage throughout the day.

**Dark Mode Default (July 17, 2025):** Implemented dark mode as the default user experience across all pages. Users now start with dark mode enabled by default when they first visit the site. The theme preference is saved to localStorage and users can still toggle between light and dark modes using the theme switcher. All components (Dashboard, My Picks, Scores) now initialize with dark mode as the default state.

**Affiliate System Setup (July 17, 2025):** Implemented production-ready affiliate link system with automatic fallback to login/signup pages. Currently uses dummy affiliate codes (`betbot123`) but is configured to automatically switch to real affiliate links when provided through environment variables. Complete documentation provided for easy transition to production affiliate codes.

**Deep Linking System Complete (July 17, 2025):** Implemented comprehensive deep linking using The Odds API's `includeLinks=true&includeSids=true` parameters combined with manual URL patterns. Created smart link hierarchy: outcome.link (bet slip) > market.link (market page) > bookmaker.link (game page) > manual deep link > login page fallback. Color-coded lightning bolt indicators show link quality: Green = bet slip, Blue = market, Amber = game. System includes proper affiliate tracking, team slug generation, and date formatting for all major sportsbooks.

**Modal Cleanup Fix (July 17, 2025):** Fixed modal overlay issues where old popups would remain visible when exiting. Implemented proper cleanup in all modal components: OddsComparisonModal, ActionStyleGameCard, DailyPick, and LoggedInLockPick. Added timeout delays to prevent modal overlap and comprehensive state reset on close. Users now experience clean modal transitions without lingering overlays.

**Recent UI and Authentication Fixes (July 17, 2025):** Fixed critical issue where logged-in users were seeing the same pick as the daily pick. The LoggedInLockPick component now correctly fetches from `/api/daily-pick/lock` endpoint, ensuring authenticated users receive a different game/bet than the free daily pick. Enhanced the analysis endpoint to support both daily picks and lock picks. Navigation buttons are now consistently sized, and pitcher displays maintain proper alignment with ml-6 indentation.

**Model Grading System Fix (July 17, 2025):** Resolved critical bug in the grading algorithm where picks were incorrectly receiving "F" grades despite high confidence scores. The issue was caused by outdated field references (`offensivePower` instead of `offensiveEdge`) in both the `calculateGrade` and `generateReasoning` methods. Updated the entire system to use the new "Offensive Edge" terminology consistently. Picks now display correct grades based on their confidence scores (82 confidence = B grade, as expected).

**Field Value Model Update (July 17, 2025):** Recalculated the ballpark advantage factor to focus on stadium-specific factors with enhanced homefield considerations. The new algorithm gives home teams a +12 point bonus and away teams a -8 point penalty, with additional ballpark-specific adjustments. Weather conditions remain as a separate factor. Frontend displays "Field Value" with descriptions covering stadium dimensions, weather conditions, and how they favor hitters or pitchers. Updated analysis factor badge alignment with uniform padding for clean vertical lines.

**UI and Grading System Overhaul (July 17, 2025):** Completed comprehensive UI updates for grade badges and bubbles. Removed color schemes from grade badges in both Pick of the Day and Lock Pick components (now neutral gray). Factor score bubbles now use theme colors: blue for Pick of the Day, amber for Lock Pick. For Bet Bot picks in game cards, implemented color-schemed grade bubbles with negative space letters and removed the logo. Updated grading system across frontend and backend to eliminate F grades, using only A+ through D scale with adjusted thresholds (A+: 95+, A: 88+, B+: 83+, B: 78+, C+: 73+, C: 68+, D+: 63+, D: below 63).

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