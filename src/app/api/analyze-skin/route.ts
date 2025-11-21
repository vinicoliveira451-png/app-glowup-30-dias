import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { imageData } = await request.json();

    if (!imageData) {
      return NextResponse.json(
        { error: 'Imagem não fornecida' },
        { status: 400 }
      );
    }

    // Chama a OpenAI Vision API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Você é um dermatologista especialista em análise de pele. Analise a imagem fornecida e retorne um JSON com:
            - skinType: tipo de pele (Oleosa, Seca, Mista, Normal, ou Sensível)
            - concerns: array com problemas detectados (Acne, Poros Dilatados, Manchas e Hiperpigmentação, Ressecamento, Rugas e Linhas de Expressão, Sensibilidade e Vermelhidão, Olheiras)
            - severity: objeto com severidade de cada problema (Leve, Moderada, Severa)
            - confidence: nível de confiança da análise (0-100)
            
            Seja preciso e profissional. Retorne APENAS o JSON, sem texto adicional.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analise esta foto facial e identifique o tipo de pele e problemas visíveis.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('Erro da OpenAI:', errorData);
      throw new Error('Erro ao processar imagem com IA');
    }

    const data = await openaiResponse.json();
    const content = data.choices[0].message.content;

    // Parse do JSON retornado pela IA
    let analysisResult;
    try {
      // Remove possíveis markdown code blocks
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysisResult = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Erro ao fazer parse da resposta:', content);
      throw new Error('Formato de resposta inválido da IA');
    }

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error('Erro na análise de pele:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao analisar imagem',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
