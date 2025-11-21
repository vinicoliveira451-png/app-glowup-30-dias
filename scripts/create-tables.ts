import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://swvasrotykxadhcxwtbu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dmFzcm90eWt4YWRoY3h3dGJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNjM5MzYsImV4cCI6MjA3ODczOTkzNn0.unY1HsmTaFE8GmvqIOLtATezbUO8WPOc6_vT6eGe-OA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createTables() {
  console.log('🔧 Criando tabelas no Supabase...')

  // Criar tabela de perfis
  const { error: profilesError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT,
        full_name TEXT,
        avatar_url TEXT,
        start_date DATE DEFAULT CURRENT_DATE,
        current_day INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  })

  if (profilesError) {
    console.error('❌ Erro ao criar tabela profiles:', profilesError)
  } else {
    console.log('✅ Tabela profiles criada')
  }

  // Criar tabela de rotinas
  const { error: routinesError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS routines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        color TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  })

  if (routinesError) {
    console.error('❌ Erro ao criar tabela routines:', routinesError)
  } else {
    console.log('✅ Tabela routines criada')
  }

  // Criar tabela de tarefas
  const { error: tasksError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS routine_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        routine_id UUID REFERENCES routines(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        duration_minutes INTEGER,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  })

  if (tasksError) {
    console.error('❌ Erro ao criar tabela routine_tasks:', tasksError)
  } else {
    console.log('✅ Tabela routine_tasks criada')
  }

  // Criar tabela de progresso diário
  const { error: progressError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS daily_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        routine_id UUID REFERENCES routines(id) ON DELETE CASCADE,
        day_number INTEGER NOT NULL,
        completed BOOLEAN DEFAULT false,
        completed_at TIMESTAMP WITH TIME ZONE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, routine_id, day_number)
      );
    `
  })

  if (progressError) {
    console.error('❌ Erro ao criar tabela daily_progress:', progressError)
  } else {
    console.log('✅ Tabela daily_progress criada')
  }

  // Criar tabela de conquistas
  const { error: achievementsError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS achievements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        day_unlocked INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  })

  if (achievementsError) {
    console.error('❌ Erro ao criar tabela achievements:', achievementsError)
  } else {
    console.log('✅ Tabela achievements criada')
  }

  // Criar tabela de metas
  const { error: goalsError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS goals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        target_date DATE,
        is_completed BOOLEAN DEFAULT false,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  })

  if (goalsError) {
    console.error('❌ Erro ao criar tabela goals:', goalsError)
  } else {
    console.log('✅ Tabela goals criada')
  }

  console.log('🎉 Processo de criação de tabelas concluído!')
}

createTables()
