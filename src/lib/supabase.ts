import { createClient } from '@supabase/supabase-js';

// No Next.js, variáveis NEXT_PUBLIC_ são injetadas em tempo de build
// e ficam disponíveis via process.env tanto no servidor quanto no cliente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Verificar se as variáveis estão definidas
const isConfigured = supabaseUrl && supabaseAnonKey;

// Log para debug
if (typeof window !== 'undefined') {
  console.log('🔍 Verificando configuração do Supabase (Cliente):');
  console.log('URL:', supabaseUrl || '❌ Não configurada');
  console.log('Key:', supabaseAnonKey ? '✅ Configurada' : '❌ Não configurada');
}

// Criar cliente Supabase
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    })
  : null;

// Helper para verificar se o Supabase está configurado
export const isSupabaseConfigured = () => {
  if (!isConfigured) {
    console.error('❌ Supabase não configurado');
    console.error('💡 Verifique se as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão no .env.local');
    console.error('💡 Reinicie o servidor de desenvolvimento (npm run dev)');
    return false;
  }
  return true;
};

// Log de sucesso
if (isConfigured && typeof window !== 'undefined') {
  console.log('✅ Cliente Supabase criado com sucesso');
}
