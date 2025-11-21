import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { initialPhoto, skinType, concerns } = await request.json();

    // Validar dados recebidos
    if (!initialPhoto || !skinType) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Verificar se há API key da OpenAI
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY não configurada');
      return NextResponse.json(
        { error: 'Configuração de API ausente' },
        { status: 500 }
      );
    }

    // Preparar prompts para geração de imagens
    const concernsText = concerns?.join(', ') || 'melhorias gerais';
    
    const day15Prompt = `Uma foto realista de rosto humano mostrando pele ${skinType} após 15 dias de tratamento facial. 
    Melhorias visíveis: hidratação aumentada, textura mais uniforme, redução de ${concernsText}. 
    Foto frontal, iluminação natural, fundo neutro, alta qualidade, fotorrealista.`;

    const day30Prompt = `Uma foto realista de rosto humano mostrando pele ${skinType} após 30 dias de tratamento facial completo. 
    Transformação completa: pele radiante e saudável, textura refinada, hidratação profunda, redução significativa de ${concernsText}. 
    Foto frontal, iluminação natural, fundo neutro, alta qualidade, fotorrealista.`;

    // Gerar imagens com DALL-E 3
    const [day15Response, day30Response] = await Promise.all([
      fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: day15Prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard'
        })
      }),
      fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: day30Prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard'
        })
      })
    ]);

    if (!day15Response.ok || !day30Response.ok) {
      throw new Error('Erro ao gerar imagens com DALL-E');
    }

    const day15Data = await day15Response.json();
    const day30Data = await day30Response.json();

    return NextResponse.json({
      day15Image: day15Data.data[0]?.url || initialPhoto,
      day30Image: day30Data.data[0]?.url || initialPhoto
    });

  } catch (error) {
    console.error('Erro na API de progressão:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar progressão' },
      { status: 500 }
    );
  }
}
