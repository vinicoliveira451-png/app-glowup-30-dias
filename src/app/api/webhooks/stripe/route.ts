import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error('Erro ao verificar webhook:', error);
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    );
  }

  // Processar evento de pagamento bem-sucedido
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;

    if (userId) {
      try {
        // Registrar pagamento no Supabase
        await supabase
          .from('user_payments')
          .insert({
            user_id: userId,
            stripe_session_id: session.id,
            stripe_payment_intent: session.payment_intent,
            amount: session.amount_total,
            currency: session.currency,
            status: 'completed',
            created_at: new Date().toISOString(),
          });

        console.log(`✅ Pagamento registrado para usuário ${userId}`);
      } catch (error) {
        console.error('Erro ao registrar pagamento:', error);
      }
    }
  }

  return NextResponse.json({ received: true });
}
