/**
 * Data Verification API Routes
 * Provides endpoints for verifying data quality and generating QA reports
 */

import { Router } from 'express';
import { dataVerificationService } from '../services/dataVerificationService';
import { pickStabilityService } from '../services/pickStabilityService';

const router = Router();

/**
 * Verify team L10 record
 */
router.get('/verify/team/:teamName/l10', async (req, res) => {
  try {
    const { teamName } = req.params;
    const result = await dataVerificationService.verifyTeamL10Record(teamName);
    
    res.json({
      team: teamName,
      verification: result,
      displayText: result.source === 'verified' 
        ? `${result.data.wins}-${result.data.losses} in last 10 games`
        : result.data.description || 'Recent performance analysis',
      confidence: `${(result.confidence * 100).toFixed(0)}%`,
      source: result.source
    });
  } catch (error) {
    console.error('Error verifying L10 record:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * Verify pitcher information
 */
router.get('/verify/game/:gameId/pitchers', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { homeTeam, awayTeam } = req.query;
    
    const result = await dataVerificationService.verifyPitcherInfo(
      gameId, 
      homeTeam as string, 
      awayTeam as string
    );
    
    res.json({
      gameId,
      verification: result,
      pitchers: result.data,
      confidence: `${(result.confidence * 100).toFixed(0)}%`,
      source: result.source
    });
  } catch (error) {
    console.error('Error verifying pitcher info:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * Generate comprehensive QA report
 */
router.get('/qa-report', async (req, res) => {
  try {
    const stabilityReport = await pickStabilityService.generateStabilityReport();
    
    const qaReport = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      pickStability: stabilityReport,
      systemHealth: {
        dataVerificationService: 'operational',
        pickStabilityService: 'operational',
        cacheStatus: 'active'
      },
      recommendations: [
        ...stabilityReport.recommendations,
        'Monitor API quota usage',
        'Regular verification cache cleanup'
      ]
    };
    
    res.json(qaReport);
  } catch (error) {
    console.error('Error generating QA report:', error);
    res.status(500).json({ error: 'QA report generation failed' });
  }
});

/**
 * Validate analysis factors for a team
 */
router.get('/validate/analysis/:teamName', async (req, res) => {
  try {
    const { teamName } = req.params;
    const gameContext = req.query.gameContext ? JSON.parse(req.query.gameContext as string) : {};
    
    const validationResults = await dataVerificationService.validateAnalysisFactors(teamName, gameContext);
    
    const response = {
      team: teamName,
      validation: validationResults,
      summary: dataVerificationService.generateQAReport(validationResults),
      recommendations: Object.entries(validationResults)
        .filter(([_, result]) => result.warnings && result.warnings.length > 0)
        .map(([factor, result]) => `${factor}: ${result.warnings?.join(', ')}`)
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error validating analysis factors:', error);
    res.status(500).json({ error: 'Analysis validation failed' });
  }
});

export default router;