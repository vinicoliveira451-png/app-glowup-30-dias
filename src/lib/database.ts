import { supabase } from './supabase'

// Tipos
export type UserProfile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type Challenge = {
  id: string
  title: string
  description: string | null
  category: string
  difficulty: string
  day_number: number
  created_at: string
}

export type UserProgress = {
  id: string
  user_id: string
  challenge_id: string
  completed: boolean
  completed_at: string | null
  notes: string | null
  created_at: string
}

export type SkinAnalysis = {
  id: string
  user_id: string
  skin_type: string
  score: number
  concerns: string[]
  image_url: string | null
  created_at: string
}

// Funções de Perfil
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao buscar perfil:', error)
    return null
  }
}

export async function createOrUpdateProfile(userId: string, email: string, fullName?: string): Promise<UserProfile | null> {
  try {
    // Usa upsert para criar ou atualizar em uma única operação
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          email: email,
          full_name: fullName || null,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'id',
          ignoreDuplicates: false
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Erro detalhado ao criar/atualizar perfil:', error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Erro ao criar/atualizar perfil:', error)
    return null
  }
}

// Funções de Desafios
export async function getAllChallenges(): Promise<Challenge[]> {
  try {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .order('day_number', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar desafios:', error)
    return []
  }
}

export async function getChallengeByDay(dayNumber: number): Promise<Challenge | null> {
  try {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('day_number', dayNumber)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao buscar desafio:', error)
    return null
  }
}

// Funções de Progresso
export async function getUserProgress(userId: string): Promise<UserProgress[]> {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar progresso:', error)
    return []
  }
}

export async function markChallengeComplete(
  userId: string, 
  challengeId: string, 
  notes?: string
): Promise<UserProgress | null> {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        challenge_id: challengeId,
        completed: true,
        completed_at: new Date().toISOString(),
        notes: notes || null
      }, {
        onConflict: 'user_id,challenge_id'
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao marcar desafio como completo:', error)
    return null
  }
}

export async function markChallengeIncomplete(
  userId: string, 
  challengeId: string
): Promise<UserProgress | null> {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        challenge_id: challengeId,
        completed: false,
        completed_at: null
      }, {
        onConflict: 'user_id,challenge_id'
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao desmarcar desafio:', error)
    return null
  }
}

export async function getCompletedDaysCount(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('completed', true)

    if (error) throw error
    return data?.length || 0
  } catch (error) {
    console.error('Erro ao contar dias completos:', error)
    return 0
  }
}

export async function getCurrentStreak(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('completed', true)
      .order('completed_at', { ascending: false })

    if (error || !data || data.length === 0) {
      return 0
    }

    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    for (const progress of data) {
      if (!progress.completed_at) continue

      const completedDate = new Date(progress.completed_at)
      completedDate.setHours(0, 0, 0, 0)

      const diffDays = Math.floor((currentDate.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === streak) {
        streak++
        currentDate = completedDate
      } else if (diffDays > streak) {
        break
      }
    }

    return streak
  } catch (error) {
    console.error('Erro ao calcular streak:', error)
    return 0
  }
}

// Funções de Análise de Pele
export async function saveSkinAnalysis(
  userId: string,
  skinType: string,
  score: number,
  concerns: string[],
  imageUrl?: string
): Promise<SkinAnalysis | null> {
  try {
    const { data, error } = await supabase
      .from('skin_analyses')
      .insert({
        user_id: userId,
        skin_type: skinType,
        score: score,
        concerns: concerns,
        image_url: imageUrl || null
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao salvar análise de pele:', error)
    return null
  }
}

export async function getUserSkinAnalysis(userId: string): Promise<SkinAnalysis | null> {
  try {
    const { data, error } = await supabase
      .from('skin_analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao buscar análise de pele:', error)
    return null
  }
}
