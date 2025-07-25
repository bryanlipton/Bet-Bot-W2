// Script to make Bryan and Julian Pro users for testing enhanced grading system
import { db } from './server/storage.js';
import { users } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function makeProUsers() {
  console.log('🏆 Making Bryan and Julian Pro users for enhanced grading testing');
  console.log('================================================================');

  try {
    // Update Bryan (blipton03@gmail.com) to Pro
    const bryanResult = await db
      .update(users)
      .set({
        subscriptionStatus: 'active',
        subscriptionPlan: 'monthly',
        subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      })
      .where(eq(users.email, 'blipton03@gmail.com'))
      .returning();

    if (bryanResult.length > 0) {
      console.log('✅ Bryan (blipton03@gmail.com) upgraded to Pro');
      console.log(`   User ID: ${bryanResult[0].id}`);
      console.log(`   Plan: ${bryanResult[0].subscriptionPlan}`);
      console.log(`   Status: ${bryanResult[0].subscriptionStatus}`);
      console.log(`   Expires: ${bryanResult[0].subscriptionEndsAt}`);
    } else {
      console.log('⚠️  Bryan not found - will create record when he logs in');
    }

    // Update Julian (find by likely patterns)
    const julianResults = await db
      .select()
      .from(users)
      .where(eq(users.firstName, 'Julian'));

    if (julianResults.length > 0) {
      const julian = julianResults[0];
      const julianUpdateResult = await db
        .update(users)
        .set({
          subscriptionStatus: 'active',
          subscriptionPlan: 'monthly',
          subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        })
        .where(eq(users.id, julian.id))
        .returning();

      console.log('✅ Julian upgraded to Pro');
      console.log(`   Email: ${julian.email}`);
      console.log(`   User ID: ${julian.id}`);
      console.log(`   Plan: ${julianUpdateResult[0].subscriptionPlan}`);
      console.log(`   Status: ${julianUpdateResult[0].subscriptionStatus}`);
      console.log(`   Expires: ${julianUpdateResult[0].subscriptionEndsAt}`);
    } else {
      console.log('⚠️  Julian not found - will create record when he logs in');
    }

    console.log('\n🎯 Pro Access Enabled:');
    console.log('- Can access /api/daily-pick/all-grades endpoint');
    console.log('- See complete grade spectrum (A+ through F)');
    console.log('- View picks to avoid (D+, D, F grades)');
    console.log('- Access full analytical reasoning');
    console.log('- Enhanced market inefficiency analysis');

    console.log('\n📊 Test the Pro functionality:');
    console.log('1. Log in as Bryan or Julian');
    console.log('2. Navigate to enhanced grading dashboard');
    console.log('3. Compare regular vs Pro pick visibility');

  } catch (error) {
    console.error('❌ Error making users Pro:', error);
  }
}

makeProUsers().then(() => {
  console.log('\n✅ Pro user setup complete!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});