/**
 * Database Verification Script
 * 
 * Run this after setting up the database schema in Supabase
 * to verify the connection and data from your backend.
 * 
 * Usage: node database/testConnection.js
 */

const { supabase } = require('../supabaseClient');

async function verifyDatabase() {
  console.log('\n🔍 Testing Supabase Database Connection...\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Count process_steps
    console.log('\n📊 Test 1: Checking process_steps table...');
    const { data: processSteps, error: processError } = await supabase
      .from('process_steps')
      .select('*');

    if (processError) {
      console.error('❌ Error fetching process_steps:', processError.message);
      return false;
    }

    console.log(`✅ Found ${processSteps.length} process steps`);
    console.log('\nSample data:');
    processSteps.slice(0, 3).forEach(step => {
      console.log(`   - ${step.name}: ${step.actual_duration}s (expected: ${step.average_duration}s) - ${step.status}`);
    });

    // Test 2: Count insights
    console.log('\n📊 Test 2: Checking insights table...');
    const { data: insights, error: insightsError } = await supabase
      .from('insights')
      .select('*');

    if (insightsError) {
      console.error('❌ Error fetching insights:', insightsError.message);
      return false;
    }

    console.log(`✅ Found ${insights.length} insights`);
    console.log('\nSample data:');
    insights.slice(0, 3).forEach(insight => {
      console.log(`   - Risk Score: ${insight.risk_score} - ${insight.recommendation.substring(0, 50)}...`);
    });

    // Test 3: Query delayed processes
    console.log('\n📊 Test 3: Querying delayed processes...');
    const { data: delayed, error: delayedError } = await supabase
      .from('process_steps')
      .select('*')
      .eq('status', 'delayed');

    if (delayedError) {
      console.error('❌ Error querying delayed processes:', delayedError.message);
      return false;
    }

    console.log(`✅ Found ${delayed.length} delayed processes`);
    delayed.forEach(step => {
      const variance = step.actual_duration - step.average_duration;
      console.log(`   - ${step.name}: ${variance}s over expected time`);
    });

    // Test 4: Query high-risk insights
    console.log('\n📊 Test 4: Querying high-risk insights (score >= 70)...');
    const { data: highRisk, error: highRiskError } = await supabase
      .from('insights')
      .select('*')
      .gte('risk_score', 70)
      .order('risk_score', { ascending: false });

    if (highRiskError) {
      console.error('❌ Error querying high-risk insights:', highRiskError.message);
      return false;
    }

    console.log(`✅ Found ${highRisk.length} high-risk insights`);
    highRisk.forEach(insight => {
      console.log(`   - Risk Score: ${insight.risk_score}`);
    });

    // Test 5: Join query - processes with insights
    console.log('\n📊 Test 5: Testing JOIN query (processes with insights)...');
    const { data: joined, error: joinError } = await supabase
      .from('process_steps')
      .select(`
        name,
        status,
        actual_duration,
        average_duration,
        insights (
          risk_score,
          recommendation
        )
      `)
      .eq('status', 'delayed')
      .limit(3);

    if (joinError) {
      console.error('❌ Error in JOIN query:', joinError.message);
      return false;
    }

    console.log(`✅ JOIN query successful - ${joined.length} results`);
    joined.forEach(item => {
      console.log(`   - ${item.name}: ${item.status}`);
      if (item.insights && item.insights.length > 0) {
        console.log(`     Insight: Risk ${item.insights[0].risk_score}`);
      }
    });

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ ALL TESTS PASSED!');
    console.log('\n📊 Database Summary:');
    console.log(`   - Process Steps: ${processSteps.length} records`);
    console.log(`   - Insights: ${insights.length} records`);
    console.log(`   - Delayed Processes: ${delayed.length} records`);
    console.log(`   - High-Risk Insights: ${highRisk.length} records`);
    console.log('\n✅ Database is ready for API implementation!');
    console.log('\n' + '='.repeat(60) + '\n');

    return true;

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    console.error(error);
    return false;
  }
}

// Run the verification
verifyDatabase()
  .then(success => {
    if (success) {
      console.log('🎉 Database verification completed successfully!\n');
      process.exit(0);
    } else {
      console.log('⚠️  Database verification failed. Please check the errors above.\n');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
