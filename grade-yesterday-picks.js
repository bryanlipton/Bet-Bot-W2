// Script to test the pick grading system with yesterday's picks

import { pickGradingService } from "./server/services/pickGradingService.js";

async function gradeYesterdaysPicks() {
  console.log('🔄 Starting pick grading for yesterday...');
  
  try {
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    console.log(`📅 Grading picks for date: ${dateStr}`);
    
    // Grade picks for yesterday
    const gradedCount = await pickGradingService.gradePendingPicks(dateStr);
    
    console.log(`✅ Successfully graded ${gradedCount} picks for ${dateStr}`);
    
    // Also try auto-grade function
    console.log('\n🔄 Testing auto-grade yesterday function...');
    const autoGradedCount = await pickGradingService.autoGradeYesterdaysPicks();
    console.log(`✅ Auto-graded ${autoGradedCount} picks`);
    
  } catch (error) {
    console.error('❌ Error grading picks:', error);
  }
}

// Run the grading
gradeYesterdaysPicks()
  .then(() => {
    console.log('🏁 Pick grading test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Pick grading test failed:', error);
    process.exit(1);
  });