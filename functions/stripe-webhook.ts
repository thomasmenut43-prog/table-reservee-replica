import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  
  if (!signature || !webhookSecret) {
    console.error('Missing signature or webhook secret');
    return Response.json({ error: 'Webhook configuration error' }, { status: 400 });
  }

  try {
    const body = await req.text();
    const base44 = createClientFromRequest(req);
    
    // Verify webhook signature
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    console.log('Webhook event received:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        console.log('Checkout session completed:', {
          mode: session.mode,
          customer_email: session.customer_email,
          metadata: session.metadata,
          subscription: session.subscription
        });
        
        if (session.mode === 'subscription') {
          const userEmail = session.metadata?.user_email || session.customer_email;
          
          if (!userEmail) {
            console.error('No user email found in session', session);
            break;
          }

          console.log(`Processing subscription for: ${userEmail}`);

          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          const endDate = new Date(subscription.current_period_end * 1000);

          console.log(`Subscription retrieved:`, {
            id: subscription.id,
            status: subscription.status,
            endDate: endDate.toISOString()
          });

          // Update user subscription status
          const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
          
          console.log(`Found ${users.length} users with email ${userEmail}`);
          
          if (users.length > 0) {
            const user = users[0];
            console.log(`Updating user ${user.id} with subscription data`);
            
            await base44.asServiceRole.entities.User.update(user.id, {
              subscriptionStatus: 'active',
              subscriptionEndDate: endDate.toISOString(),
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription
            });
            console.log(`✓ Subscription activated for user: ${userEmail}`);
          } else {
            console.error(`User not found with email: ${userEmail}`);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const endDate = new Date(subscription.current_period_end * 1000);
        
        // Find user by stripe subscription ID
        const users = await base44.asServiceRole.entities.User.filter({ 
          stripeSubscriptionId: subscription.id 
        });
        
        if (users.length > 0) {
          await base44.asServiceRole.entities.User.update(users[0].id, {
            subscriptionStatus: subscription.status === 'active' ? 'active' : 'inactive',
            subscriptionEndDate: endDate.toISOString()
          });
          console.log(`Subscription updated for user: ${users[0].email}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        // Find user by stripe subscription ID
        const users = await base44.asServiceRole.entities.User.filter({ 
          stripeSubscriptionId: subscription.id 
        });
        
        if (users.length > 0) {
          await base44.asServiceRole.entities.User.update(users[0].id, {
            subscriptionStatus: 'inactive',
            subscriptionEndDate: null
          });
          console.log(`Subscription cancelled for user: ${users[0].email}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        
        // Find user by stripe customer ID
        const users = await base44.asServiceRole.entities.User.filter({ 
          stripeCustomerId: invoice.customer 
        });
        
        if (users.length > 0) {
          console.log(`Payment failed for user: ${users[0].email}`);
          // Optionally send notification
        }
        break;
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return Response.json({ error: error.message }, { status: 400 });
  }
});