import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    // Criar sessão de checkout do Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'GlowUp 30 Dias - Acesso Vitalício',
              description: 'Análise de pele com IA + Rotina personalizada de 30 dias + Progressão gerada por IA',
              images: ['https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'],
            },
            unit_amount: 3000, // R$ 30,00 em centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/?canceled=true`,
      customer_email: email,
      metadata: {
        userId: userId,
      },
    });

    // Retornar a URL do checkout para redirecionamento
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Erro ao criar sessão de checkout:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
