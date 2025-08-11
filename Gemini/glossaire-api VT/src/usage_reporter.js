export default class UsageReporter {
  constructor(env) {
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    
    if (url.pathname === '/cron/stripe-report') {
      try {
        const report = await this.generateReport();
        return new Response(JSON.stringify(report, null, 2), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(`Error: ${error.message}`, { status: 500 });
      }
    }
    
    return new Response('Not found', { status: 404 });
  }

  async generateReport() {
    const stripeSecretKey = this.env.STRIPE_SECRET;
    
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET not configured');
    }

    try {
      console.log('Starting usage report generation');
      
      // Fetch multiple types of Stripe data
      const [customers, charges, subscriptions, balance, paymentIntents] = await Promise.all([
        this.fetchStripeData('customers', stripeSecretKey),
        this.fetchStripeData('charges', stripeSecretKey),
        this.fetchStripeData('subscriptions', stripeSecretKey),
        this.fetchBalance(stripeSecretKey),
        this.fetchStripeData('payment_intents', stripeSecretKey)
      ]);
      
      // Get AI usage from Durable Object
      let aiUsage = { totalRequests: 0, dailyUsage: {} };
      if (this.env.USAGE_COUNTER) {
        try {
          const id = this.env.USAGE_COUNTER.idFromName("global");
          const counter = this.env.USAGE_COUNTER.get(id);
          const response = await counter.fetch(new Request('https://fake/get'));
          if (response.ok) {
            const data = await response.json();
            aiUsage.totalRequests = data.count || 0;
          }
        } catch (error) {
          console.error('Error fetching AI usage:', error);
        }
      }
      
      // Calculate period (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Filter recent data
      const recentCharges = charges.data?.filter(c => 
        new Date(c.created * 1000) > thirtyDaysAgo
      ) || [];
      
      // Generate comprehensive report
      const report = {
        timestamp: new Date().toISOString(),
        period: {
          start: thirtyDaysAgo.toISOString(),
          end: new Date().toISOString()
        },
        stripe: {
          mode: balance.livemode ? 'live' : 'test',
          customers: {
            total: customers.data?.length || 0,
            hasMore: customers.has_more || false,
            recentCount: customers.data?.filter(c => 
              new Date(c.created * 1000) > thirtyDaysAgo
            ).length || 0
          },
          revenue: {
            last30Days: {
              amount: recentCharges.reduce((sum, charge) => 
                charge.status === 'succeeded' ? sum + charge.amount : sum, 0
              ),
              count: recentCharges.filter(c => c.status === 'succeeded').length,
              currency: 'chf'
            },
            allTime: {
              amount: charges.data?.reduce((sum, charge) => 
                charge.status === 'succeeded' ? sum + charge.amount : sum, 0
              ) || 0,
              count: charges.data?.filter(c => c.status === 'succeeded').length || 0
            }
          },
          subscriptions: {
            total: subscriptions.data?.length || 0,
            active: subscriptions.data?.filter(s => s.status === 'active').length || 0,
            monthly_recurring_revenue: subscriptions.data?.filter(s => s.status === 'active')
              .reduce((sum, sub) => sum + (sub.items?.data?.[0]?.price?.unit_amount || 0), 0) || 0
          },
          balance: {
            available: balance.available?.[0]?.amount || 0,
            pending: balance.pending?.[0]?.amount || 0,
            currency: balance.available?.[0]?.currency || 'chf'
          },
          paymentIntents: {
            total: paymentIntents.data?.length || 0,
            succeeded: paymentIntents.data?.filter(pi => pi.status === 'succeeded').length || 0,
            processing: paymentIntents.data?.filter(pi => pi.status === 'processing').length || 0,
            failed: paymentIntents.data?.filter(pi => pi.status === 'requires_payment_method').length || 0
          }
        },
        cloudflare: {
          ai: {
            totalRequests: aiUsage.totalRequests,
            estimatedCost: {
              amount: Math.round(aiUsage.totalRequests * 0.01 * 100),
              currency: 'usd',
              note: 'Estimated at $0.01 per AI request'
            }
          }
        },
        generated_at: Date.now()
      };
      
      // Store report in KV with meaningful key
      if (this.env.GLOSSAIRE_KV) {
        const date = new Date().toISOString().split('T')[0];
        await this.env.GLOSSAIRE_KV.put(
          `usage-report-${date}`,
          JSON.stringify(report),
          { expirationTtl: 90 * 24 * 60 * 60 } // 90 days
        );
        
        // Also store as 'latest' for easy access
        await this.env.GLOSSAIRE_KV.put(
          'usage-report-latest',
          JSON.stringify(report)
        );
        
        console.log('Report stored in KV');
      }
      
      return report;
      
    } catch (error) {
      console.error('Error in generateReport:', error);
      throw error;
    }
  }

  async fetchStripeData(endpoint, stripeSecretKey) {
    try {
      const response = await fetch(`https://api.stripe.com/v1/${endpoint}?limit=100`, {
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching ${endpoint}:`, errorText);
        return { data: [], has_more: false };
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      return { data: [], has_more: false };
    }
  }

  async fetchBalance(stripeSecretKey) {
    try {
      const response = await fetch('https://api.stripe.com/v1/balance', {
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
        },
      });

      if (!response.ok) {
        return { available: [], pending: [] };
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching balance:', error);
      return { available: [], pending: [] };
    }
  }
}