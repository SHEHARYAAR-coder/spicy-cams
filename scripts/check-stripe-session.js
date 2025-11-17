const Stripe = require("stripe");
require("dotenv").config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function checkStripeSession(sessionId) {
  try {
    console.log(`🔍 Checking Stripe session: ${sessionId}\n`);

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log("Session Details:");
    console.log("================");
    console.log(`Status: ${session.status}`);
    console.log(`Payment Status: ${session.payment_status}`);
    console.log(`Amount: $${(session.amount_total / 100).toFixed(2)}`);
    console.log(`Currency: ${session.currency}`);
    console.log(`Customer Email: ${session.customer_email}`);
    console.log(
      `Created: ${new Date(session.created * 1000).toLocaleString()}`
    );

    console.log("\nMetadata:");
    console.log(JSON.stringify(session.metadata, null, 2));

    if (session.payment_intent) {
      console.log(`\nPayment Intent: ${session.payment_intent}`);

      const paymentIntent = await stripe.paymentIntents.retrieve(
        session.payment_intent
      );
      console.log(`Payment Intent Status: ${paymentIntent.status}`);
    }

    console.log("\n📊 Summary:");
    if (session.payment_status === "paid") {
      console.log("✅ Payment was successful in Stripe");
      console.log("⚠️  But webhook may not have been processed");
      console.log("\nNext steps:");
      console.log("1. Check if webhook is configured in Stripe Dashboard");
      console.log("2. Look for this session ID in your payment records:");
      console.log(`   node scripts/check-payment.js | grep ${sessionId}`);
      console.log("3. If not found, manually add tokens:");
      if (session.metadata?.tokens && session.customer_email) {
        console.log(
          `   node scripts/add-tokens.js ${session.customer_email} ${session.metadata.tokens} "Payment reconciliation - session ${sessionId}"`
        );
      }
    } else {
      console.log(`❌ Payment status: ${session.payment_status}`);
    }
  } catch (error) {
    console.error("❌ Error checking session:", error.message);
  }
}

const sessionId = process.argv[2];

if (!sessionId) {
  console.log("Usage: node scripts/check-stripe-session.js <session_id>");
  console.log(
    "Example: node scripts/check-stripe-session.js cs_test_a1b2c3d4..."
  );
  process.exit(1);
}

checkStripeSession(sessionId);
