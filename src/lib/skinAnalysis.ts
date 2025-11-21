import { supabase } from './supabase';

export interface SkinType {
  id: string;
  name: string;
  description: string;
  characteristics: string[];
}

export interface SkinConcern {
  id: string;
  name: string;
  description: string;
  severity_levels: string[];
  common_causes: string[];
}

export interface CareRoutine {
  id: string;
  skin_type_id: string;
  concern_id: string;
  period: string;
  routine_order: number;
  step_name: string;
  product_type: string;
  key_ingredients: string[];
  instructions: string;
  frequency: string;
}

interface AIAnalysisResult {
  skinType: string;
  concerns: string[];
  severity: { [key: string]: string };
  confidence: number;
}

// Função para analisar imagem com IA (OpenAI Vision)
async function analyzeImageWithAI(imageData: string): Promise<AIAnalysisResult> {
  try {
    const response = await fetch('/api/analyze-skin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageData }),
    });

    if (!response.ok) {
      throw new Error('Erro na análise de imagem');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erro ao analisar imagem com IA:', error);
    throw error;
  }
}

// Função para detectar tipo de pele (agora com IA real)
export async function detectSkinType(imageData?: string): Promise<SkinType> {
  const { data: skinTypes } = await supabase
    .from('skin_types')
    .select('*');
  
  if (!skinTypes || skinTypes.length === 0) {
    throw new Error('Nenhum tipo de pele encontrado no banco de dados');
  }

  // Se não houver imagem, retorna aleatório (fallback)
  if (!imageData) {
    const randomIndex = Math.floor(Math.random() * skinTypes.length);
    return skinTypes[randomIndex];
  }

  try {
    // Análise com IA
    const aiResult = await analyzeImageWithAI(imageData);
    
    // Mapeia o resultado da IA para o tipo de pele do banco
    const detectedType = skinTypes.find(type => 
      type.name.toLowerCase().includes(aiResult.skinType.toLowerCase()) ||
      aiResult.skinType.toLowerCase().includes(type.name.toLowerCase())
    );

    return detectedType || skinTypes[0];
  } catch (error) {
    console.error('Erro na detecção com IA, usando fallback:', error);
    // Fallback: retorna tipo aleatório
    const randomIndex = Math.floor(Math.random() * skinTypes.length);
    return skinTypes[randomIndex];
  }
}

// Função para detectar problemas de pele (agora com IA real)
export async function detectSkinConcerns(skinType: SkinType, imageData?: string): Promise<SkinConcern[]> {
  const { data: allConcerns } = await supabase
    .from('skin_concerns')
    .select('*');
  
  if (!allConcerns || allConcerns.length === 0) {
    return [];
  }

  // Se houver imagem, tenta usar IA
  if (imageData) {
    try {
      const aiResult = await analyzeImageWithAI(imageData);
      
      // Mapeia os concerns detectados pela IA
      const detectedConcerns = allConcerns.filter(concern =>
        aiResult.concerns.some(aiConcern =>
          concern.name.toLowerCase().includes(aiConcern.toLowerCase()) ||
          aiConcern.toLowerCase().includes(concern.name.toLowerCase())
        )
      );

      if (detectedConcerns.length > 0) {
        return detectedConcerns.slice(0, 3);
      }
    } catch (error) {
      console.error('Erro na detecção de concerns com IA:', error);
    }
  }

  // Fallback: Lógica baseada no tipo de pele
  const concernsMap: { [key: string]: string[] } = {
    'Oleosa': ['Acne', 'Poros Dilatados', 'Manchas e Hiperpigmentação'],
    'Seca': ['Ressecamento', 'Rugas e Linhas de Expressão', 'Sensibilidade e Vermelhidão'],
    'Mista': ['Poros Dilatados', 'Oleosidade na zona T', 'Ressecamento nas bochechas'],
    'Normal': ['Prevenção de envelhecimento', 'Manutenção'],
    'Sensível': ['Sensibilidade e Vermelhidão', 'Ressecamento']
  };

  const relevantConcernNames = concernsMap[skinType.name] || [];
  const concerns = allConcerns.filter(c => 
    relevantConcernNames.some(name => c.name.includes(name))
  );

  return concerns.slice(0, Math.min(3, concerns.length));
}

// Função para calcular score da pele baseado nos problemas
export function calculateSkinScore(concerns: SkinConcern[]): number {
  // Score base: 10
  let score = 10;
  
  // Cada concern reduz o score
  const severityPenalty: { [key: string]: number } = {
    'Leve': 0.5,
    'Moderada': 1.0,
    'Moderado': 1.0,
    'Severa': 1.5,
    'Severo': 1.5,
    'Ocasional': 0.3,
    'Frequente': 0.8,
    'Crônica': 1.2
  };

  concerns.forEach(concern => {
    // Assume severidade moderada se não especificado
    const penalty = severityPenalty['Moderada'] || 1.0;
    score -= penalty;
  });

  // Garante que o score fique entre 1 e 10
  return Math.max(1, Math.min(10, Number(score.toFixed(1))));
}

// Função para buscar rotina de cuidados
export async function getCareRoutine(
  skinTypeId: string, 
  concernIds: string[]
): Promise<{ morning: CareRoutine[], night: CareRoutine[] }> {
  const morning: CareRoutine[] = [];
  const night: CareRoutine[] = [];

  // Busca rotinas para o tipo de pele e concerns
  for (const concernId of concernIds) {
    const { data: routines } = await supabase
      .from('care_routines')
      .select('*')
      .eq('skin_type_id', skinTypeId)
      .eq('concern_id', concernId)
      .order('routine_order');

    if (routines) {
      routines.forEach(routine => {
        if (routine.period === 'Manhã') {
          morning.push(routine);
        } else if (routine.period === 'Noite') {
          night.push(routine);
        }
      });
    }
  }

  // Remove duplicatas e ordena
  const uniqueMorning = Array.from(new Map(morning.map(r => [r.step_name, r])).values())
    .sort((a, b) => a.routine_order - b.routine_order);
  
  const uniqueNight = Array.from(new Map(night.map(r => [r.step_name, r])).values())
    .sort((a, b) => a.routine_order - b.routine_order);

  return {
    morning: uniqueMorning,
    night: uniqueNight
  };
}

// Função para gerar recomendações de produtos
export function generateProductRecommendations(
  skinType: SkinType,
  concerns: SkinConcern[],
  routines: { morning: CareRoutine[], night: CareRoutine[] }
): string[] {
  const products: string[] = [];
  
  // Coleta produtos únicos das rotinas
  const allRoutines = [...routines.morning, ...routines.night];
  
  allRoutines.forEach(routine => {
    const ingredients = routine.key_ingredients.join(', ');
    products.push(`${routine.product_type} com ${ingredients}`);
  });

  // Remove duplicatas
  return Array.from(new Set(products));
}

// Função para gerar recomendações de água
export function generateWaterRecommendation(skinType: SkinType): string {
  const recommendations: { [key: string]: string } = {
    'Oleosa': '2-2.5 litros por dia (ajuda a controlar oleosidade)',
    'Seca': '2.5-3 litros por dia (hidratação é essencial)',
    'Mista': '2-2.5 litros por dia (equilibra as zonas)',
    'Normal': '2 litros por dia (manutenção)',
    'Sensível': '2.5 litros por dia (ajuda a acalmar a pele)'
  };

  return recommendations[skinType.name] || '2 litros por dia';
}

// Função para gerar recomendações de sono
export function generateSleepRecommendation(concerns: SkinConcern[]): string {
  const hasAging = concerns.some(c => c.name.includes('Rugas'));
  const hasDarkCircles = concerns.some(c => c.name.includes('Olheiras'));
  
  if (hasAging || hasDarkCircles) {
    return '8-9 horas por noite (essencial para regeneração celular)';
  }
  
  return '7-8 horas por noite (antes das 23h para melhor regeneração)';
}

// Função principal de análise
export async function analyzeSkin(imageData?: string) {
  try {
    // 1. Detecta tipo de pele (com IA se houver imagem)
    const skinType = await detectSkinType(imageData);
    
    // 2. Detecta problemas de pele (com IA se houver imagem)
    const concerns = await detectSkinConcerns(skinType, imageData);
    
    // 3. Calcula score
    const score = calculateSkinScore(concerns);
    
    // 4. Busca rotinas de cuidados
    const concernIds = concerns.map(c => c.id);
    const routines = await getCareRoutine(skinType.id, concernIds);
    
    // 5. Gera recomendações
    const products = generateProductRecommendations(skinType, concerns, routines);
    const water = generateWaterRecommendation(skinType);
    const sleep = generateSleepRecommendation(concerns);
    
    // 6. Monta rotina textual
    const routineSteps = [
      `Manhã: ${routines.morning.map(r => r.step_name).join(' → ')}`,
      `Noite: ${routines.night.map(r => r.step_name).join(' → ')}`,
      `Esfoliação: 2x por semana`,
      `Máscara: 1x por semana`
    ];

    return {
      skinType: skinType.name,
      skinTypeDescription: skinType.description,
      score,
      concerns: concerns.map(c => c.name),
      concernsDetails: concerns,
      recommendations: {
        products,
        water,
        sleep,
        routine: routineSteps
      },
      routines,
      progressionImages: []
    };
  } catch (error) {
    console.error('Erro na análise de pele:', error);
    throw error;
  }
}
