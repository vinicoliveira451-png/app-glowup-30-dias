"use client";

// Forçar renderização dinâmica para evitar erros de build
export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect } from "react";
import { Camera, Upload, Sparkles, Droplets, Moon, Clock, TrendingUp, CheckCircle2, Calendar, BarChart3, User, ChevronRight, ShoppingBag, Hand, Droplet, Play, X, Home, LogOut, Award, Lock, Image as ImageIcon, Zap, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { analyzeSkin } from "@/lib/skinAnalysis";
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { soundManager, playAchievementSound, playProgressSound, playNotificationSound, playButtonSound, playAnalysisSound, playCompletionSound } from "@/lib/sounds";

type SkinAnalysis = {
  skinType: string;
  skinTypeDescription?: string;
  score: number;
  concerns: string[];
  concernsDetails?: any[];
  recommendations: {
    products: string[];
    water: string;
    sleep: string;
    routine: string[];
  };
  routines?: {
    morning: any[];
    night: any[];
  };
  progressionImages: string[];
  initialPhoto?: string;
};

type MassageTechnique = {
  id: string;
  title: string;
  description: string;
  steps: string[];
  duration: string;
  video_url: string;
  thumbnail_url?: string;
  category: string;
  difficulty: string;
};

type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  unlocked: boolean;
  unlocked_at?: string;
};

type ProductRecommendation = {
  category: string;
  products: string[];
  tips: string;
};

type DayRoutine = {
  day: number;
  title: string;
  morning: string[];
  night: string[];
  tips: string;
  completed: boolean;
  products: ProductRecommendation[];
  massageTechniques: MassageTechnique[];
  cleansingTips: string[];
};

type ProgressionTimeline = {
  day: number;
  title: string;
  imageUrl: string;
  improvements: {
    label: string;
    value: number;
    description: string;
  }[];
};

type Screen = "home" | "routine" | "progress" | "results" | "profile";
type TabType = "routine" | "products" | "techniques" | "cleansing";

// Técnicas de massagem embutidas (não dependem do banco de dados)
const MASSAGE_TECHNIQUES: MassageTechnique[] = [
  {
    id: 'massage-lymphatic',
    title: 'Drenagem Linfática Facial',
    description: 'Técnica suave que ajuda a reduzir inchaço e melhorar a circulação do rosto',
    steps: [
      'Aplique óleo ou sérum no rosto limpo',
      'Com os dedos, faça movimentos suaves do centro para as laterais',
      'Pressione levemente os pontos de drenagem (têmporas, mandíbula)',
      'Repita cada movimento 5-10 vezes',
      'Finalize com movimentos descendentes no pescoço'
    ],
    duration: '5-10 minutos',
    video_url: 'https://www.youtube.com/embed/QrZDNXYpWzA',
    thumbnail_url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop',
    category: 'massage',
    difficulty: 'beginner'
  },
  {
    id: 'massage-gua-sha',
    title: 'Massagem com Gua Sha',
    description: 'Técnica oriental que esculpe o rosto e melhora a circulação',
    steps: [
      'Aplique óleo facial generosamente',
      'Segure o gua sha em ângulo de 15 graus',
      'Deslize do centro para fora com pressão média',
      'Trabalhe mandíbula, bochechas, testa e pescoço',
      'Faça 5-10 repetições em cada área'
    ],
    duration: '10-15 minutos',
    video_url: 'https://www.youtube.com/embed/v_pQ7KXv0o0',
    thumbnail_url: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&h=300&fit=crop',
    category: 'massage',
    difficulty: 'intermediate'
  },
  {
    id: 'massage-serum',
    title: 'Aplicação de Sérum com Massagem',
    description: 'Técnica que potencializa a absorção de produtos ativos',
    steps: [
      'Aplique 2-3 gotas de sérum nas mãos',
      'Aqueça o produto entre as palmas',
      'Pressione suavemente no rosto (não esfregue)',
      'Faça movimentos circulares ascendentes',
      'Dê leves batidinhas para estimular absorção'
    ],
    duration: '3-5 minutos',
    video_url: 'https://www.youtube.com/embed/8XArQYTJEe0',
    thumbnail_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=300&fit=crop',
    category: 'massage',
    difficulty: 'beginner'
  },
  {
    id: 'massage-eyes',
    title: 'Massagem para Contorno dos Olhos',
    description: 'Reduz olheiras, inchaço e linhas de expressão',
    steps: [
      'Aplique creme para olhos com o dedo anelar',
      'Faça movimentos circulares suaves ao redor dos olhos',
      'Pressione levemente os pontos de acupressão',
      'Deslize do canto interno para externo',
      'Finalize com leves batidinhas'
    ],
    duration: '3-5 minutos',
    video_url: 'https://www.youtube.com/embed/lXi5A4HmNpY',
    thumbnail_url: 'https://images.unsplash.com/photo-1552693673-1bf958298935?w=400&h=300&fit=crop',
    category: 'massage',
    difficulty: 'beginner'
  },
  {
    id: 'massage-illuminating',
    title: 'Massagem Iluminadora',
    description: 'Estimula circulação e traz brilho natural à pele',
    steps: [
      'Aplique óleo facial ou sérum iluminador',
      'Faça movimentos circulares ascendentes',
      'Pressione pontos de acupressão facial',
      'Trabalhe especialmente as maçãs do rosto',
      'Finalize com tapotagem (batidinhas leves)'
    ],
    duration: '5-10 minutos',
    video_url: 'https://www.youtube.com/embed/hJEvDwfPcwU',
    thumbnail_url: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=300&fit=crop',
    category: 'massage',
    difficulty: 'intermediate'
  },
  {
    id: 'massage-jade-roller',
    title: 'Massagem com Jade Roller',
    description: 'Ferramenta que refresca, descongestiona e tonifica a pele',
    steps: [
      'Guarde o jade roller na geladeira antes de usar',
      'Aplique sérum ou óleo no rosto',
      'Role do centro para fora com pressão suave',
      'Use o lado menor para contorno dos olhos',
      'Faça 5-10 passadas em cada área'
    ],
    duration: '5-10 minutos',
    video_url: 'https://www.youtube.com/embed/vXCJZkerqjQ',
    thumbnail_url: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&h=300&fit=crop',
    category: 'massage',
    difficulty: 'beginner'
  }
];

export default function GlowUpApp() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [step, setStep] = useState<"upload" | "analyzing" | "results">("upload");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentDay, setCurrentDay] = useState(1);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<MassageTechnique | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("routine");
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progressionTimeline, setProgressionTimeline] = useState<ProgressionTimeline[]>([]);
  const [generatingProgression, setGeneratingProgression] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressPhotoInputRef = useRef<HTMLInputElement>(null);

  // Verificar autenticação
  useEffect(() => {
    // Pré-carregar sons e verificar estado
    if (typeof window !== 'undefined') {
      soundManager.preloadSounds();
      setSoundEnabled(soundManager.isEnabled());
    }

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Erro ao obter sessão:', error);
        toast.error('Erro ao verificar autenticação', {
          description: error.message
        });
      }
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        loadUserData(session.user.id);
        loadAchievements(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      // Tratamento específico para eventos de autenticação
      if (event === 'SIGNED_IN') {
        toast.success('Login realizado com sucesso! 🎉');
      } else if (event === 'SIGNED_UP') {
        toast.success('Conta criada com sucesso! 🎉', {
          description: 'Verifique seu email para confirmar a conta'
        });
      } else if (event === 'SIGNED_OUT') {
        toast.info('Você saiu da conta');
      } else if (event === 'USER_UPDATED') {
        toast.info('Perfil atualizado');
      }
      
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user.id);
        loadAchievements(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Gerar imagens de progressão com IA a partir da foto inicial
  const generateProgressionImages = async (initialPhoto: string, skinAnalysis: SkinAnalysis) => {
    setGeneratingProgression(true);
    
    // Som de início de análise
    if (soundEnabled) playAnalysisSound();
    
    // Notificação de início
    toast.loading("Gerando imagens de progressão com IA...", {
      id: "generating-progression",
      duration: Infinity
    });

    try {
      // Chamar API para gerar imagens com IA
      const response = await fetch('/api/generate-progression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initialPhoto,
          skinType: skinAnalysis.skinType,
          concerns: skinAnalysis.concerns
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro da API:', errorData);
        throw new Error(errorData.error || 'Erro ao gerar progressão');
      }

      const data = await response.json();

      // Criar timeline de progressão com as imagens geradas pela IA
      const timeline: ProgressionTimeline[] = [
        {
          day: 1,
          title: "Foto Inicial",
          imageUrl: initialPhoto,
          improvements: [
            { label: "Hidratação", value: 0, description: "Ponto de partida" },
            { label: "Textura", value: 0, description: "Estado inicial" },
            { label: "Luminosidade", value: 0, description: "Antes do tratamento" }
          ]
        },
        {
          day: 15,
          title: "15 Dias de Evolução",
          imageUrl: data.day15Image || initialPhoto,
          improvements: [
            { label: "Hidratação", value: 50, description: "Barreira cutânea fortalecida" },
            { label: "Textura", value: 40, description: "Pele mais uniforme" },
            { label: "Luminosidade", value: 35, description: "Tom mais uniforme" },
            { label: "Poros", value: 30, description: "Poros menos visíveis" }
          ]
        },
        {
          day: 30,
          title: "Transformação Completa - 30 Dias",
          imageUrl: data.day30Image || initialPhoto,
          improvements: [
            { label: "Hidratação", value: 70, description: "Pele profundamente hidratada" },
            { label: "Textura", value: 60, description: "Textura refinada" },
            { label: "Luminosidade", value: 55, description: "Pele radiante e saudável" },
            { label: "Poros", value: 50, description: "Poros minimizados" },
            { label: "Manchas", value: 45, description: "Redução visível de manchas" }
          ]
        }
      ];

      setProgressionTimeline(timeline);

      // Salvar no banco de dados
      if (user) {
        await supabase
          .from('skin_analysis')
          .update({
            progression_timeline: timeline
          })
          .eq('user_id', user.id);
      }

      // Som de conclusão
      if (soundEnabled) playCompletionSound();

      // Notificação de sucesso com animação
      toast.dismiss("generating-progression");
      toast.success("✨ Imagens de progressão geradas com sucesso!", {
        description: "Veja sua transformação esperada em 30 dias",
        duration: 5000,
        className: "animate-in slide-in-from-top-5"
      });

    } catch (error) {
      console.error('Erro ao gerar imagens de progressão:', error);
      
      // Som de notificação
      if (soundEnabled) playNotificationSound();
      
      toast.dismiss("generating-progression");
      toast.error("Erro ao gerar progressão", {
        description: "Usando foto inicial como referência",
        duration: 4000
      });

      // Em caso de erro, criar timeline apenas com a foto inicial
      const fallbackTimeline: ProgressionTimeline[] = [
        {
          day: 1,
          title: "Foto Inicial",
          imageUrl: initialPhoto,
          improvements: [
            { label: "Hidratação", value: 0, description: "Ponto de partida" },
            { label: "Textura", value: 0, description: "Estado inicial" },
            { label: "Luminosidade", value: 0, description: "Antes do tratamento" }
          ]
        },
        {
          day: 15,
          title: "15 Dias de Evolução",
          imageUrl: initialPhoto,
          improvements: [
            { label: "Hidratação", value: 50, description: "Barreira cutânea fortalecida" },
            { label: "Textura", value: 40, description: "Pele mais uniforme" },
            { label: "Luminosidade", value: 35, description: "Tom mais uniforme" },
            { label: "Poros", value: 30, description: "Poros menos visíveis" }
          ]
        },
        {
          day: 30,
          title: "Transformação Completa - 30 Dias",
          imageUrl: initialPhoto,
          improvements: [
            { label: "Hidratação", value: 70, description: "Pele profundamente hidratada" },
            { label: "Textura", value: 60, description: "Textura refinada" },
            { label: "Luminosidade", value: 55, description: "Pele radiante e saudável" },
            { label: "Poros", value: 50, description: "Poros minimizados" },
            { label: "Manchas", value: 45, description: "Redução visível de manchas" }
          ]
        }
      ];
      setProgressionTimeline(fallbackTimeline);
    } finally {
      setGeneratingProgression(false);
    }
  };

  // Carregar conquistas do usuário
  const loadAchievements = async (userId: string) => {
    try {
      // Buscar todas as conquistas
      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('requirement_value', { ascending: true });

      if (achievementsError) throw achievementsError;

      // Buscar conquistas desbloqueadas pelo usuário
      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', userId);

      if (userAchievementsError) throw userAchievementsError;

      // Combinar dados e remover duplicatas usando Map
      const achievementsMap = new Map();
      
      allAchievements?.forEach(achievement => {
        const unlocked = userAchievements?.find(ua => ua.achievement_id === achievement.id);
        achievementsMap.set(achievement.id, {
          ...achievement,
          unlocked: !!unlocked,
          unlocked_at: unlocked?.unlocked_at
        });
      });

      // Converter Map para array
      const uniqueAchievements = Array.from(achievementsMap.values());
      setAchievements(uniqueAchievements);

      // Verificar conquistas automaticamente após carregar
      await checkAndUnlockAchievements(userId);
    } catch (error) {
      console.error('Erro ao carregar conquistas:', error);
    }
  };

  // Verificar e desbloquear conquistas baseado em progresso real
  const checkAndUnlockAchievements = async (userId: string) => {
    try {
      // Buscar progresso do usuário
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('current_day, streak_days, routines_completed, created_at')
        .eq('user_id', userId)
        .single();

      if (!progressData) return;

      // Calcular dias reais desde o início
      const startDate = new Date(progressData.created_at);
      const today = new Date();
      const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const actualCurrentDay = Math.min(daysPassed + 1, 30); // Máximo 30 dias

      // Atualizar current_day se necessário
      if (actualCurrentDay > progressData.current_day) {
        await supabase
          .from('user_progress')
          .update({ 
            current_day: actualCurrentDay,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        
        setCurrentDay(actualCurrentDay);
        
        // Notificação de progresso
        toast.info(`🎯 Dia ${actualCurrentDay} de 30`, {
          description: "Continue assim! Você está progredindo bem.",
          duration: 4000
        });
      }

      // Buscar conquistas já desbloqueadas
      const { data: unlockedAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', userId);

      const unlockedIds = new Set(unlockedAchievements?.map(ua => ua.achievement_id) || []);

      // Verificar cada conquista
      for (const achievement of achievements) {
        if (unlockedIds.has(achievement.id)) continue;

        let shouldUnlock = false;

        switch (achievement.requirement_type) {
          case 'days_completed':
            shouldUnlock = actualCurrentDay >= achievement.requirement_value;
            break;
          case 'streak':
            shouldUnlock = (progressData.streak_days || 0) >= achievement.requirement_value;
            break;
          case 'routine_completed':
            shouldUnlock = (progressData.routines_completed || 0) >= achievement.requirement_value;
            break;
        }

        if (shouldUnlock) {
          // Desbloquear conquista
          await supabase
            .from('user_achievements')
            .insert({
              user_id: userId,
              achievement_id: achievement.id
            });

          // Som de conquista
          if (soundEnabled) playAchievementSound();

          // Notificação animada de conquista desbloqueada
          toast.success(`🏆 Conquista Desbloqueada!`, {
            description: `${achievement.icon} ${achievement.name} - ${achievement.description}`,
            duration: 6000,
            className: "animate-in zoom-in-95 slide-in-from-top-5"
          });

          console.log(`🎉 Conquista desbloqueada: ${achievement.name}`);
        }
      }

      // Recarregar conquistas
      await loadAchievements(userId);
    } catch (error) {
      console.error('Erro ao verificar conquistas:', error);
    }
  };

  // Carregar dados do usuário
  const loadUserData = async (userId: string) => {
    try {
      // Carregar análise
      const { data: analysisData } = await supabase
        .from('skin_analysis')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (analysisData) {
        setAnalysis(analysisData.analysis_data);
        
        // Carregar timeline de progressão se existir
        if (analysisData.progression_timeline) {
          setProgressionTimeline(analysisData.progression_timeline);
        } else if (analysisData.analysis_data?.initialPhoto) {
          // Se não tem timeline mas tem foto inicial, gerar agora
          await generateProgressionImages(analysisData.analysis_data.initialPhoto, analysisData.analysis_data);
        }
        
        setStep("results");
      }

      // Carregar progresso
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (progressData) {
        // Calcular dias reais desde o início
        const startDate = new Date(progressData.created_at);
        const today = new Date();
        const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const actualCurrentDay = Math.min(daysPassed + 1, 30);
        
        setCurrentDay(actualCurrentDay);

        // Atualizar no banco se necessário
        if (actualCurrentDay > progressData.current_day) {
          await supabase
            .from('user_progress')
            .update({ 
              current_day: actualCurrentDay,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
        }
      }

      // Verificar conquistas após carregar dados
      await checkAndUnlockAchievements(userId);
    } catch (error) {
      console.log("Erro ao carregar dados:", error);
    }
  };

  // Salvar análise no Supabase
  const saveAnalysis = async (analysisData: SkinAnalysis) => {
    if (!user) return;

    try {
      await supabase
        .from('skin_analysis')
        .upsert({
          user_id: user.id,
          analysis_data: analysisData,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error("Erro ao salvar análise:", error);
    }
  };

  // Salvar progresso no Supabase
  const saveProgress = async (day: number) => {
    if (!user) return;

    try {
      // Buscar progresso atual
      const { data: currentProgress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const streakDays = currentProgress?.streak_days || 0;
      const routinesCompleted = currentProgress?.routines_completed || 0;

      await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          current_day: day,
          streak_days: day > (currentProgress?.current_day || 0) ? streakDays + 1 : streakDays,
          routines_completed: day > (currentProgress?.current_day || 0) ? routinesCompleted + 1 : routinesCompleted,
          updated_at: new Date().toISOString()
        });

      // Verificar conquistas
      await checkAndUnlockAchievements(user.id);
    } catch (error) {
      console.error("Erro ao salvar progresso:", error);
    }
  };

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAnalysis(null);
    setCurrentDay(1);
    setStep("upload");
    toast.info("Até logo! 👋", {
      description: "Você saiu da sua conta",
      duration: 3000
    });
  };

  // Rotina de 30 dias com informações detalhadas
  const routines: DayRoutine[] = [
    // Semana 1
    { 
      day: 1, 
      title: "Início da Jornada", 
      morning: analysis?.routines?.morning.map(r => r.step_name) || ["Limpeza facial suave", "Hidratante leve", "Protetor solar FPS 50+"], 
      night: analysis?.routines?.night.map(r => r.step_name) || ["Limpeza facial", "Hidratante noturno"], 
      tips: "Comece devagar! Deixe sua pele se adaptar aos novos produtos.", 
      completed: false,
      products: [
        {
          category: "Limpeza",
          products: ["CeraVe Hydrating Cleanser", "Neutrogena Deep Clean", "La Roche-Posay Toleriane"],
          tips: "Escolha um limpador suave que não resseque a pele. Evite sabonetes comuns."
        },
        {
          category: "Hidratação",
          products: ["Neutrogena Hydro Boost", "CeraVe Moisturizing Cream", "The Ordinary Natural Moisturizing Factors"],
          tips: "Hidratantes com ácido hialurônico são ideais para todos os tipos de pele."
        },
        {
          category: "Proteção Solar",
          products: ["La Roche-Posay Anthelios", "Neutrogena Sun Fresh", "Isdin Fusion Water"],
          tips: "Use protetor solar TODOS os dias, mesmo em dias nublados ou dentro de casa."
        }
      ],
      massageTechniques: MASSAGE_TECHNIQUES.filter(t => t.category === 'massage' && t.difficulty === 'beginner').slice(0, 1),
      cleansingTips: [
        "Lave o rosto com água morna, nunca quente",
        "Use movimentos circulares suaves por 60 segundos",
        "Enxágue completamente, sem deixar resíduos",
        "Seque com toalha limpa, sem esfregar (apenas pressione levemente)"
      ]
    },
    { 
      day: 2, 
      title: "Construindo o Hábito", 
      morning: ["Limpeza facial", "Tônico facial", "Hidratante", "Protetor solar"], 
      night: ["Limpeza dupla", "Hidratante noturno"], 
      tips: "Beba pelo menos 2 litros de água hoje.", 
      completed: false,
      products: [
        {
          category: "Tônico",
          products: ["Thayers Witch Hazel", "Paula's Choice Pore Refining", "Simple Soothing Toner"],
          tips: "Tônicos equilibram o pH da pele após a limpeza. Aplique com algodão ou mãos."
        }
      ],
      massageTechniques: MASSAGE_TECHNIQUES.filter(t => t.title.includes('Linfática')),
      cleansingTips: [
        "Limpeza dupla: primeiro óleo/balm, depois limpador à base de água",
        "O primeiro passo remove maquiagem e protetor solar",
        "O segundo passo limpa a pele profundamente"
      ]
    },
    { 
      day: 3, 
      title: "Esfoliação Suave", 
      morning: ["Limpeza facial", "Hidratante", "Protetor solar"], 
      night: ["Limpeza", "Esfoliante suave", "Hidratante"], 
      tips: "Esfolie com movimentos circulares suaves por 1 minuto.", 
      completed: false,
      products: [
        {
          category: "Esfoliantes",
          products: ["Paula's Choice 2% BHA", "The Ordinary AHA 30% + BHA 2%", "CeraVe SA Smoothing Cleanser"],
          tips: "Comece com esfoliação 1-2x por semana. Aumente gradualmente se a pele tolerar."
        }
      ],
      massageTechniques: [],
      cleansingTips: [
        "Após esfoliar, a pele fica mais sensível",
        "Use produtos calmantes e hidratantes",
        "Evite sol direto no dia seguinte",
        "Não esfolie se a pele estiver irritada"
      ]
    },
    { 
      day: 4, 
      title: "Hidratação Profunda", 
      morning: ["Limpeza", "Sérum de ácido hialurônico", "Hidratante", "Protetor solar"], 
      night: ["Limpeza", "Sérum", "Hidratante rico"], 
      tips: "Aplique o sérum na pele ainda úmida para melhor absorção.", 
      completed: false,
      products: [
        {
          category: "Séruns Hidratantes",
          products: ["The Ordinary Hyaluronic Acid 2%", "Vichy Minéral 89", "Neutrogena Hydro Boost Serum"],
          tips: "Ácido hialurônico atrai água para a pele. Aplique sempre na pele úmida!"
        }
      ],
      massageTechniques: MASSAGE_TECHNIQUES.filter(t => t.title.includes('Sérum')),
      cleansingTips: [
        "Não seque completamente o rosto antes do sérum",
        "Deixe a pele levemente úmida",
        "Isso potencializa a hidratação"
      ]
    },
    { 
      day: 5, 
      title: "Vitamina C", 
      morning: ["Limpeza", "Vitamina C", "Hidratante", "Protetor solar"], 
      night: ["Limpeza", "Hidratante"], 
      tips: "A vitamina C ajuda a clarear manchas e proteger contra radicais livres.", 
      completed: false,
      products: [
        {
          category: "Vitamina C",
          products: ["Timeless Vitamin C + E", "The Ordinary Ascorbic Acid 8%", "Skinceuticals C E Ferulic"],
          tips: "Use vitamina C pela manhã para proteção antioxidante. Guarde na geladeira!"
        }
      ],
      massageTechniques: MASSAGE_TECHNIQUES.filter(t => t.title.includes('Iluminadora')),
      cleansingTips: [
        "Vitamina C pode oxidar - use produtos frescos",
        "Se o produto escurecer, descarte",
        "Sempre use protetor solar após vitamina C"
      ]
    },
    { 
      day: 6, 
      title: "Máscara Facial", 
      morning: ["Limpeza", "Hidratante", "Protetor solar"], 
      night: ["Limpeza", "Máscara de argila (15 min)", "Hidratante"], 
      tips: "Relaxe enquanto a máscara age. Aproveite para meditar!", 
      completed: false,
      products: [
        {
          category: "Máscaras",
          products: ["Aztec Secret Indian Healing Clay", "Innisfree Super Volcanic Pore Clay", "Origins Clear Improvement"],
          tips: "Máscaras de argila absorvem oleosidade. Não deixe secar completamente!"
        }
      ],
      massageTechniques: [],
      cleansingTips: [
        "Remova a máscara com água morna",
        "Use movimentos circulares suaves",
        "Finalize com água fria para fechar poros",
        "Aplique hidratante imediatamente após"
      ]
    },
    { 
      day: 7, 
      title: "Revisão Semanal", 
      morning: ["Limpeza", "Hidratante", "Protetor solar"], 
      night: ["Limpeza", "Hidratante"], 
      tips: "Dia de descanso! Apenas hidratação básica. Tire fotos para comparar.", 
      completed: false,
      products: [
        {
          category: "Hidratação Intensiva",
          products: ["CeraVe Healing Ointment", "Aquaphor", "La Roche-Posay Cicaplast Baume"],
          tips: "Dia de recuperação - use produtos calmantes e reparadores."
        }
      ],
      massageTechniques: [],
      cleansingTips: [
        "Tire fotos no mesmo local e iluminação",
        "Compare com a foto do dia 1",
        "Observe mudanças na textura e tom"
      ]
    },
    
    // Semana 2
    { 
      day: 8, 
      title: "Proteção Intensiva", 
      morning: ["Limpeza", "Antioxidante", "Hidratante", "Protetor solar"], 
      night: ["Limpeza", "Retinol (baixa concentração)", "Hidratante"], 
      tips: "Comece com retinol 2x por semana. Use protetor solar religiosamente!", 
      completed: false,
      products: [
        {
          category: "Retinol",
          products: ["The Ordinary Retinol 0.2%", "CeraVe Resurfacing Retinol", "Neutrogena Rapid Wrinkle Repair"],
          tips: "Comece com baixa concentração. Pode causar descamação inicial - é normal!"
        }
      ],
      massageTechniques: [],
      cleansingTips: [
        "Retinol aumenta sensibilidade ao sol",
        "Use protetor solar FPS 50+ todos os dias",
        "Evite outros ativos fortes na mesma noite"
      ]
    },
    { 
      day: 9, 
      title: "Área dos Olhos", 
      morning: ["Limpeza", "Creme para olhos", "Hidratante", "Protetor solar"], 
      night: ["Limpeza", "Creme para olhos", "Hidratante"], 
      tips: "Aplique o creme com leves batidinhas, nunca esfregue.", 
      completed: false,
      products: [
        {
          category: "Contorno dos Olhos",
          products: ["CeraVe Eye Repair Cream", "The Ordinary Caffeine Solution", "Neutrogena Hydro Boost Eye"],
          tips: "A pele ao redor dos olhos é delicada. Use produtos específicos para essa área."
        }
      ],
      massageTechniques: MASSAGE_TECHNIQUES.filter(t => t.title.includes('Olhos')),
      cleansingTips: [
        "Remova maquiagem dos olhos primeiro",
        "Use removedor bifásico ou óleo",
        "Seja extremamente gentil nessa área"
      ]
    },
    { 
      day: 10, 
      title: "Checkpoint 10 Dias", 
      morning: ["Limpeza", "Hidratante", "Protetor solar"], 
      night: ["Limpeza", "Tônico com AHA/BHA", "Hidratante"], 
      tips: "Tire uma foto! Compare com o dia 1 - você já deve notar melhorias na hidratação.", 
      completed: false,
      products: [
        {
          category: "Ácidos Esfoliantes",
          products: ["Paula's Choice 2% BHA Liquid", "The Ordinary Glycolic Acid 7%", "COSRX AHA/BHA Toner"],
          tips: "AHA para superfície, BHA para poros. Não use junto com retinol!"
        }
      ],
      massageTechniques: [],
      cleansingTips: [
        "Aplique com algodão ou mãos limpas",
        "Não enxágue - deixe absorver",
        "Aguarde 10 minutos antes do próximo produto",
        "Pode causar leve formigamento - normal"
      ]
    },
    { 
      day: 11, 
      title: "Niacinamida", 
      morning: ["Limpeza", "Niacinamida 10%", "Hidratante", "Protetor solar"], 
      night: ["Limpeza", "Hidratante"], 
      tips: "Niacinamida ajuda a controlar oleosidade e minimizar poros.", 
      completed: false,
      products: [
        {
          category: "Niacinamida",
          products: ["The Ordinary Niacinamide 10% + Zinc 1%", "Paula's Choice 10% Niacinamide Booster", "CeraVe PM Facial Moisturizing Lotion"],
          tips: "Niacinamida é versátil - controla oleosidade, clareia e fortalece a barreira cutânea."
        }
      ],
      massageTechniques: [],
      cleansingTips: [
        "Niacinamida pode ser usada de manhã e à noite",
        "Compatível com quase todos os ativos",
        "Resultados aparecem após 4-6 semanas"
      ]
    },
    { 
      day: 12, 
      title: "Hidratação Extra", 
      morning: ["Limpeza", "Sérum", "Hidratante", "Protetor solar"], 
      night: ["Limpeza", "Óleo facial", "Hidratante"], 
      tips: "Óleos faciais selam a hidratação. Use 2-3 gotas apenas.", 
      completed: false,
      products: [
        {
          category: "Óleos Faciais",
          products: ["The Ordinary 100% Organic Cold-Pressed Rose Hip Seed Oil", "Squalane Oil", "Jojoba Oil"],
          tips: "Óleos são o último passo da rotina noturna. Selam todos os produtos anteriores."
        }
      ],
      massageTechniques: [],
      cleansingTips: [
        "Óleos não entopem poros se usados corretamente",
        "Use quantidade mínima",
        "Pele oleosa também precisa de óleo!"
      ]
    },
    { 
      day: 13, 
      title: "Máscara Hidratante", 
      morning: ["Limpeza", "Hidratante", "Protetor solar"], 
      night: ["Limpeza", "Máscara hidratante (20 min)", "Hidratante"], 
      tips: "Escolha uma máscara sheet ou gel para hidratação profunda.", 
      completed: false,
      products: [
        {
          category: "Máscaras Hidratantes",
          products: ["Neutrogena Hydro Boost Hydrating Sheet Mask", "Garnier SkinActive Moisture Bomb", "Mediheal N.M.F Aquaring Ampoule Mask"],
          tips: "Máscaras sheet são práticas e eficazes. Use 1-2x por semana."
        }
      ],
      massageTechniques: [],
      cleansingTips: [
        "Após remover a máscara, massageie o excesso",
        "Não enxágue - deixe absorver",
        "Finalize com hidratante para selar"
      ]
    },
    { 
      day: 14, 
      title: "Checkpoint Semana 2", 
      morning: ["Limpeza", "Hidratante", "Protetor solar"], 
      night: ["Limpeza", "Hidratante"], 
      tips: "Compare fotos! Você já deve notar a pele mais hidratada.", 
      completed: false,
      products: [],
      massageTechniques: [],
      cleansingTips: [
        "Tire nova foto para comparação",
        "Observe melhorias na textura",
        "Celebre seu progresso!"
      ]
    },
    
    // Semana 3
    { 
      day: 15, 
      title: "Checkpoint 15 Dias", 
      morning: ["Limpeza", "Vitamina C", "Hidratante", "Protetor solar"], 
      night: ["Limpeza", "Retinol", "Hidratante"], 
      tips: "Meio caminho! Tire uma foto - você deve notar pele mais uniforme e radiante.", 
      completed: false,
      products: [],
      massageTechniques: [],
      cleansingTips: []
    },
    { 
      day: 16, 
      title: "Clareamento", 
      morning: ["Limpeza", "Sérum clareador", "Hidratante", "Protetor solar"], 
      night: ["Limpeza", "Hidratante"], 
      tips: "Ingredientes como niacinamida e vitamina C ajudam a uniformizar o tom.", 
      completed: false,
      products: [],
      massageTechniques: [],
      cleansingTips: []
    },
    { 
      day: 17, 
      title: "Esfoliação Profunda", 
      morning: ["Limpeza", "Hidratante", "Protetor solar"], 
      night: ["Limpeza", "Esfoliante enzimático", "Hidratante"], 
      tips: "Esfoliantes enzimáticos são perfeitos para peles sensíveis.", 
      completed: false,
      products: [],
      massageTechniques: [],
      cleansingTips: []
    },
    { 
      day: 18, 
      title: "Peptídeos", 
      morning: ["Limpeza", "Sérum de peptídeos", "Hidratante", "Protetor solar"], 
      night: ["Limpeza", "Retinol", "Hidratante"], 
      tips: "Peptídeos estimulam a produção de colágeno.", 
      completed: false,
      products: [],
      massageTechniques: [],
      cleansingTips: []
    },
    { 
      day: 19, 
      title: "Antioxidantes", 
      morning: ["Limpeza", "Vitamina C + E", "Hidratante", "Protetor solar"], 
      night: ["Limpeza", "Hidratante"], 
      tips: "Combine vitaminas C e E para proteção antioxidante máxima.", 
      completed: false,
      products: [],
      massageTechniques: [],
      cleansingTips: []
    },
    { 
      day: 20, 
      title: "Máscara de Argila", 
      morning: ["Limpeza", "Hidratante", "Protetor solar"], 
      night: ["Limpeza", "Máscara de argila (15 min)", "Hidratante"], 
      tips: "Argila absorve excesso de oleosidade e limpa poros profundamente.", 
      completed: false,
      products: [],
      massageTechniques: [],
      cleansingTips: []
    },
    { 
      day: 21, 
      title: "Revisão Semana 3", 
      morning: ["Limpeza", "Hidratante", "Protetor solar"], 
      night: ["Limpeza", "Hidratante"], 
      tips: "Sua pele deve estar mais uniforme e radiante agora!", 
      completed: false,
      products: [],
      massageTechniques: [],
      cleansingTips: []
    },
    
    // Semana 4
    { 
      day: 22, 
      title: "Rotina Completa", 
      morning: ["Limpeza", "Tônico", "Vitamina C", "Hidratante", "Protetor solar"], 
      night: ["Limpeza", "Tônico", "Retinol", "Creme para olhos", "Hidratante"], 
      tips: "Você dominou a rotina! Mantenha a consistência.", 
      completed: false,
      products: [],
      massageTechniques: [],
      cleansingTips: []
    },
    { 
      day: 23, 
      title: "Tratamento Localizado", 
      morning: ["Limpeza", "Sérum", "Hidratante", "Protetor solar"], 
      night: ["Limpeza", "Tratamento para manchas", "Hidratante"], 
      tips: "Use tratamentos localizados apenas nas áreas necessárias.", 
      completed: false,
      products: [],
      massageTechniques: [],
      cleansingTips: []
    },
    { 
      day: 24, 
      title: "Esfoliação Balanceada", 
      morning: ["Limpeza", "Hidratante", "Protetor solar"], 
      night: ["Limpeza", "AHA/BHA", "Hidratante"], 
      tips: "Sua pele já está adaptada. Mantenha 2-3x por semana.", 
      completed: false,
      products: [],
      massageTechniques: [],
      cleansingTips: []
    },
    { 
      day: 25, 
      title: "Hidratação Máxima", 
      morning: ["Limpeza", "Sérum HA", "Hidratante", "Protetor solar"], 
      night: ["Limpeza", "Sérum HA", "Óleo facial", "Hidratante"], 
      tips: "Camadas de hidratação garantem pele macia e saudável.", 
      completed: false,
      products: [],
      massageTechniques: [],
      cleansingTips: []
    },
    { 
      day: 26, 
      title: "Proteção Total", 
      morning: ["Limpeza", "Antioxidante", "Hidratante", "Protetor solar"], 
      night: ["Limpeza", "Retinol", "Hidratante"], 
      tips: "Proteção diária é essencial para manter os resultados.", 
      completed: false,
      products: [],
      massageTechniques: [],
      cleansingTips: []
    },
    { 
      day: 27, 
      title: "Máscara Premium", 
      morning: ["Limpeza", "Hidratante", "Protetor solar"], 
      night: ["Limpeza", "Máscara iluminadora (20 min)", "Hidratante"], 
      tips: "Escolha uma máscara com ingredientes premium para o gran finale.", 
      completed: false,
      products: [],
      massageTechniques: [],
      cleansingTips: []
    },
    { 
      day: 28, 
      title: "Preparação Final", 
      morning: ["Limpeza", "Vitamina C", "Hidratante", "Protetor solar"], 
      night: ["Limpeza", "Retinol", "Hidratante"], 
      tips: "Faltam só 2 dias! Mantenha o foco.", 
      completed: false,
      products: [],
      massageTechniques: [],
      cleansingTips: []
    },
    { 
      day: 29, 
      title: "Quase Lá!", 
      morning: ["Limpeza", "Sérum", "Hidratante", "Protetor solar"], 
      night: ["Limpeza", "Tratamento completo", "Hidratante"], 
      tips: "Amanhã é o grande dia! Prepare-se para a foto final.", 
      completed: false,
      products: [],
      massageTechniques: [],
      cleansingTips: []
    },
    { 
      day: 30, 
      title: "Transformação Completa!", 
      morning: ["Limpeza", "Rotina completa", "Protetor solar"], 
      night: ["Limpeza", "Celebração", "Hidratante"], 
      tips: "Parabéns! Tire a foto final e compare com o dia 1. Você conseguiu!", 
      completed: false,
      products: [],
      massageTechniques: [],
      cleansingTips: []
    },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        analyzeImageWithAI();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProgressPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && analysis) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newPhoto = reader.result as string;
        // Gerar nova progressão com a foto atualizada
        await generateProgressionImages(newPhoto, analysis);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImageWithAI = async () => {
    setStep("analyzing");
    setProgress(0);

    const intervals = [20, 40, 60, 80, 100];
    for (const target of intervals) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setProgress(target);
    }

    try {
      // Usa a função de análise real do banco de dados
      const analysisData = await analyzeSkin(selectedImage || undefined);
      
      // Adiciona a foto inicial à análise
      analysisData.initialPhoto = selectedImage || undefined;
      
      setAnalysis(analysisData);
      setStep("results");

      // Salvar no Supabase
      await saveAnalysis(analysisData);

      // Notificação de sucesso
      toast.success("✨ Análise concluída!", {
        description: `Tipo de pele: ${analysisData.skinType}`,
        duration: 5000,
        className: "animate-in slide-in-from-top-5"
      });

      // Gerar imagens de progressão com IA a partir da foto inicial
      if (selectedImage) {
        await generateProgressionImages(selectedImage, analysisData);
      }
    } catch (error) {
      console.error("Erro na análise:", error);
      
      toast.error("Erro na análise", {
        description: "Usando dados padrão. Tente novamente mais tarde.",
        duration: 4000
      });

      // Fallback para dados mockados em caso de erro
      const fallbackData: SkinAnalysis = {
        skinType: "Mista com tendência oleosa",
        score: 7.2,
        concerns: ["Poros dilatados", "Oleosidade na zona T", "Leve desidratação"],
        recommendations: {
          products: [
            "Sabonete facial com ácido salicílico",
            "Tônico adstringente com niacinamida",
            "Sérum de vitamina C pela manhã",
            "Hidratante oil-free com ácido hialurônico",
            "Protetor solar FPS 50+ toque seco"
          ],
          water: "2.5 litros por dia (8-10 copos)",
          sleep: "7-8 horas por noite (antes das 23h)",
          routine: [
            "Manhã: Lavar rosto → Vitamina C → Hidratante → Protetor solar",
            "Noite: Lavar rosto → Tônico → Sérum → Hidratante",
            "2x/semana: Esfoliação suave",
            "1x/semana: Máscara de argila"
          ]
        },
        progressionImages: [],
        initialPhoto: selectedImage || undefined
      };
      setAnalysis(fallbackData);
      setStep("results");
      await saveAnalysis(fallbackData);
      
      if (selectedImage) {
        await generateProgressionImages(selectedImage, fallbackData);
      }
    }
  };

  const handleCameraClick = () => {
    if (soundEnabled) playButtonSound();
    fileInputRef.current?.click();
  };

  const handleProgressCameraClick = () => {
    if (soundEnabled) playButtonSound();
    progressPhotoInputRef.current?.click();
  };

  const getCurrentWeek = () => Math.ceil(currentDay / 7);

  const openVideoModal = (technique: MassageTechnique) => {
    if (soundEnabled) playButtonSound();
    setSelectedVideo(technique);
    setShowVideoModal(true);
  };

  // Atualizar dia e salvar no Supabase
  const updateCurrentDay = async (newDay: number) => {
    setCurrentDay(newDay);
    await saveProgress(newDay);
    
    // Som de progresso
    if (soundEnabled) playProgressSound();
    
    // Notificação de progresso
    toast.success(`📅 Dia ${newDay} de 30`, {
      description: "Rotina atualizada com sucesso!",
      duration: 3000,
      className: "animate-in slide-in-from-right-5"
    });
  };

  // Tela de login
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center animate-pulse mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Verificar se Supabase está configurado
    const supabaseConfigured = !!supabase;

    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent mb-2">
              GlowUp 30 Dias
            </h1>
            <p className="text-gray-600">Transforme sua pele com IA</p>
          </div>
          
          {!supabaseConfigured && (
            <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                ⚠️ Supabase não configurado. Configure as variáveis de ambiente para habilitar autenticação.
              </p>
            </div>
          )}
          
          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#9333ea',
                    brandAccent: '#7c3aed'
                  }
                }
              }
            }}
            providers={[]}
            view="sign_up"
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email',
                  password_label: 'Senha',
                  button_label: 'Entrar',
                  loading_button_label: 'Entrando...',
                  link_text: 'Já tem uma conta? Entre aqui'
                },
                sign_up: {
                  email_label: 'Email',
                  password_label: 'Senha',
                  button_label: 'Criar conta',
                  loading_button_label: 'Criando conta...',
                  link_text: 'Não tem uma conta? Crie aqui',
                  confirmation_text: 'Verifique seu email para confirmar'
                },
                forgotten_password: {
                  link_text: 'Esqueceu a senha?',
                  button_label: 'Enviar instruções',
                  loading_button_label: 'Enviando...'
                }
              }
            }}
            onlyThirdPartyProviders={false}
            redirectTo={typeof window !== 'undefined' ? window.location.origin : undefined}
          />
        </Card>
      </div>
    );
  }

  // Renderizar tela Home
  const renderHomeScreen = () => {
    if (step === "upload") {
      return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center mb-6 animate-pulse">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
            Sua Jornada Começa Aqui
          </h1>
          <p className="text-gray-600 text-center mb-8 max-w-md">
            Tire uma foto do seu rosto e descubra sua rotina personalizada de 30 dias
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Button
              onClick={handleCameraClick}
              className="flex-1 h-14 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white transition-all duration-300 hover:scale-105"
            >
              <Camera className="w-5 h-5 mr-2" />
              Tirar Foto
            </Button>
            <Button
              onClick={() => {
                if (soundEnabled) playButtonSound();
                fileInputRef.current?.click();
              }}
              variant="outline"
              className="flex-1 h-14 border-2 border-purple-300 hover:border-purple-500 transition-all duration-300"
            >
              <Upload className="w-5 h-5 mr-2" />
              Enviar Foto
            </Button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      );
    }

    if (step === "analyzing") {
      return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
          <div className="w-32 h-32 rounded-2xl overflow-hidden mb-6 shadow-2xl">
            {selectedImage && (
              <img src={selectedImage} alt="Sua foto" className="w-full h-full object-cover" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-center mb-4">Analisando sua pele...</h2>
          <div className="w-full max-w-md mb-4">
            <Progress value={progress} className="h-2" />
          </div>
          <p className="text-gray-600 text-center">
            {progress < 40 && "Detectando tipo de pele..."}
            {progress >= 40 && progress < 70 && "Identificando preocupações..."}
            {progress >= 70 && "Criando rotina personalizada..."}
          </p>
        </div>
      );
    }

    if (step === "results" && analysis) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          {/* Resultado da Análise */}
          <Card className="p-6 bg-gradient-to-br from-rose-50 to-purple-50 border-2 border-purple-200 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Análise Completa</h2>
                <p className="text-gray-600">Tipo de pele: {analysis.skinType}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 shadow-md">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-rose-500" />
                  Score de Saúde
                </h3>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold text-purple-600">{analysis.score}</div>
                  <Progress value={analysis.score * 10} className="flex-1" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-md">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-blue-500" />
                  Preocupações
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.concerns.map((concern, idx) => (
                    <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      {concern}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={() => {
                if (soundEnabled) playButtonSound();
                setCurrentScreen("routine");
              }}
              className="w-full h-12 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white transition-all duration-300 hover:scale-105"
            >
              Ver Rotina de 30 Dias
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </Card>

          {/* Recomendações Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <Droplet className="w-8 h-8 text-blue-500 mb-2" />
              <h3 className="font-semibold mb-1">Hidratação</h3>
              <p className="text-sm text-gray-600">{analysis.recommendations.water}</p>
            </Card>
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <Moon className="w-8 h-8 text-purple-500 mb-2" />
              <h3 className="font-semibold mb-1">Sono</h3>
              <p className="text-sm text-gray-600">{analysis.recommendations.sleep}</p>
            </Card>
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <Clock className="w-8 h-8 text-rose-500 mb-2" />
              <h3 className="font-semibold mb-1">Rotina</h3>
              <p className="text-sm text-gray-600">Siga os passos diários</p>
            </Card>
          </div>
        </div>
      );
    }

    return null;
  };

  // Componente de conteúdo da rotina com abas
  const RoutineContent = ({ routine }: { routine: DayRoutine }) => {
    return (
      <div className="space-y-4">
        {/* Abas */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={activeTab === "routine" ? "default" : "outline"}
            onClick={() => {
              if (soundEnabled) playButtonSound();
              setActiveTab("routine");
            }}
            className="flex-shrink-0"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Rotina
          </Button>
          <Button
            variant={activeTab === "products" ? "default" : "outline"}
            onClick={() => {
              if (soundEnabled) playButtonSound();
              setActiveTab("products");
            }}
            className="flex-shrink-0"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Produtos
          </Button>
          <Button
            variant={activeTab === "techniques" ? "default" : "outline"}
            onClick={() => {
              if (soundEnabled) playButtonSound();
              setActiveTab("techniques");
            }}
            className="flex-shrink-0"
          >
            <Hand className="w-4 h-4 mr-2" />
            Massagens
          </Button>
          <Button
            variant={activeTab === "cleansing" ? "default" : "outline"}
            onClick={() => {
              if (soundEnabled) playButtonSound();
              setActiveTab("cleansing");
            }}
            className="flex-shrink-0"
          >
            <Droplet className="w-4 h-4 mr-2" />
            Limpeza
          </Button>
        </div>

        {/* Conteúdo das Abas */}
        {activeTab === "routine" && (
          <div className="space-y-4">
            <Card className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50">
              <h3 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Rotina da Manhã
              </h3>
              <ul className="space-y-2">
                {routine.morning.map((step, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50">
              <h3 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                <Moon className="w-5 h-5" />
                Rotina da Noite
              </h3>
              <ul className="space-y-2">
                {routine.night.map((step, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
              <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Dica do Dia
              </h3>
              <p className="text-gray-700">{routine.tips}</p>
            </Card>
          </div>
        )}

        {activeTab === "products" && (
          <div className="space-y-4">
            {routine.products.length > 0 ? (
              routine.products.map((productRec, idx) => (
                <Card key={idx} className="p-4 hover:shadow-lg transition-shadow">
                  <h3 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    {productRec.category}
                  </h3>
                  <ul className="space-y-2 mb-3">
                    {productRec.products.map((product, pidx) => (
                      <li key={pidx} className="flex items-center gap-2 text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        <span>{product}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <p className="text-sm text-purple-800">
                      <strong>Dica:</strong> {productRec.tips}
                    </p>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-6 text-center">
                <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Nenhuma recomendação de produto específica para hoje.</p>
                <p className="text-sm text-gray-500 mt-2">Continue usando seus produtos básicos da rotina.</p>
              </Card>
            )}
          </div>
        )}

        {activeTab === "techniques" && (
          <div className="space-y-4">
            {routine.massageTechniques && routine.massageTechniques.length > 0 ? (
              routine.massageTechniques.map((technique) => (
                <Card key={technique.id} className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    {technique.thumbnail_url && (
                      <img 
                        src={technique.thumbnail_url} 
                        alt={technique.title}
                        className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-purple-800 mb-1">{technique.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{technique.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {technique.duration}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                          {technique.difficulty}
                        </span>
                      </div>
                      <Button
                        onClick={() => openVideoModal(technique)}
                        size="sm"
                        className="bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Assistir Vídeo
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-6 text-center">
                <Hand className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Nenhuma técnica de massagem específica para hoje.</p>
                <p className="text-sm text-gray-500 mt-2">Aproveite para descansar ou revisar técnicas anteriores.</p>
              </Card>
            )}
          </div>
        )}

        {activeTab === "cleansing" && (
          <div className="space-y-4">
            {routine.cleansingTips && routine.cleansingTips.length > 0 ? (
              <Card className="p-4">
                <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <Droplet className="w-5 h-5" />
                  Dicas de Limpeza
                </h3>
                <ul className="space-y-3">
                  {routine.cleansingTips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{tip}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : (
              <Card className="p-6 text-center">
                <Droplet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Nenhuma dica de limpeza específica para hoje.</p>
                <p className="text-sm text-gray-500 mt-2">Mantenha sua rotina de limpeza habitual.</p>
              </Card>
            )}
          </div>
        )}
      </div>
    );
  };

  // Renderizar tela de Rotina
  const renderRoutineScreen = () => {
    const currentRoutine = routines[currentDay - 1];
    const currentWeek = getCurrentWeek();

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header com Progresso */}
        <Card className="p-6 bg-gradient-to-br from-rose-50 to-purple-50 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Dia {currentDay} de 30</h2>
              <p className="text-gray-600">Semana {currentWeek} • {currentRoutine.title}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-600">{Math.round((currentDay / 30) * 100)}%</div>
              <p className="text-sm text-gray-600">Completo</p>
            </div>
          </div>
          <Progress value={(currentDay / 30) * 100} className="h-3" />
        </Card>

        {/* Conteúdo da Rotina com Abas */}
        <RoutineContent routine={currentRoutine} />

        {/* Navegação entre Dias */}
        <div className="flex gap-4">
          <Button
            onClick={() => {
              if (soundEnabled) playButtonSound();
              updateCurrentDay(Math.max(1, currentDay - 1));
            }}
            disabled={currentDay === 1}
            variant="outline"
            className="flex-1"
          >
            Dia Anterior
          </Button>
          <Button
            onClick={() => {
              if (soundEnabled) playButtonSound();
              updateCurrentDay(Math.min(30, currentDay + 1));
            }}
            disabled={currentDay === 30}
            className="flex-1 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700"
          >
            Próximo Dia
          </Button>
        </div>
      </div>
    );
  };

  // Renderizar tela de Progresso
  const renderProgressScreen = () => {
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const totalCount = achievements.length;

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header de Progresso */}
        <Card className="p-6 bg-gradient-to-br from-rose-50 to-purple-50 border-2 border-purple-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Seu Progresso</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 text-center shadow-md">
              <Calendar className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">{currentDay}</div>
              <div className="text-sm text-gray-600">Dias Completos</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-md">
              <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">{Math.round((currentDay / 30) * 100)}%</div>
              <div className="text-sm text-gray-600">Progresso</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-md">
              <Award className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">{unlockedCount}</div>
              <div className="text-sm text-gray-600">Conquistas</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-md">
              <Sparkles className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">{30 - currentDay}</div>
              <div className="text-sm text-gray-600">Dias Restantes</div>
            </div>
          </div>
        </Card>

        {/* Timeline de Progressão com Imagens */}
        {progressionTimeline.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ImageIcon className="w-6 h-6 text-purple-500" />
                Evolução Visual
              </h3>
              {generatingProgression && (
                <div className="flex items-center gap-2 text-purple-600">
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Gerando...</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {progressionTimeline.map((timeline) => (
                <div key={timeline.day} className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden shadow-lg group">
                    <img 
                      src={timeline.imageUrl} 
                      alt={timeline.title}
                      className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                      <div className="text-white">
                        <div className="text-sm font-semibold">Dia {timeline.day}</div>
                        <div className="text-xs opacity-90">{timeline.title}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {timeline.improvements.map((improvement, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{improvement.label}</span>
                          <span className="text-sm font-bold text-purple-600">{improvement.value}%</span>
                        </div>
                        <Progress value={improvement.value} className="h-2 mb-1" />
                        <p className="text-xs text-gray-500">{improvement.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Botão para atualizar foto de progresso */}
            <div className="mt-6 text-center">
              <Button
                onClick={handleProgressCameraClick}
                variant="outline"
                className="border-2 border-purple-300 hover:border-purple-500"
              >
                <Camera className="w-4 h-4 mr-2" />
                Atualizar Foto de Progresso
              </Button>
              <input
                ref={progressPhotoInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleProgressPhotoUpload}
                className="hidden"
              />
            </div>
          </Card>
        )}

        {/* Conquistas */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-500" />
              Conquistas ({unlockedCount}/{totalCount})
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  achievement.unlocked
                    ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 shadow-lg hover:shadow-xl'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`text-4xl ${achievement.unlocked ? 'animate-bounce' : 'grayscale'}`}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold mb-1 ${achievement.unlocked ? 'text-gray-800' : 'text-gray-500'}`}>
                      {achievement.name}
                    </h4>
                    <p className={`text-sm mb-2 ${achievement.unlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                      {achievement.description}
                    </p>
                    {achievement.unlocked ? (
                      <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Desbloqueada!
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Lock className="w-4 h-4" />
                        {achievement.requirement_type === 'days_completed' && `Complete ${achievement.requirement_value} dias`}
                        {achievement.requirement_type === 'streak' && `${achievement.requirement_value} dias seguidos`}
                        {achievement.requirement_type === 'routine_completed' && `${achievement.requirement_value} rotinas`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  // Renderizar tela de Resultados
  const renderResultsScreen = () => {
    if (!analysis) return null;

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Análise Detalhada</h2>
          
          {/* Tipo de Pele */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Tipo de Pele
            </h3>
            <p className="text-gray-700 bg-purple-50 p-4 rounded-lg">{analysis.skinType}</p>
          </div>

          {/* Preocupações */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-rose-500" />
              Preocupações Identificadas
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.concerns.map((concern, idx) => (
                <span key={idx} className="px-4 py-2 bg-rose-100 text-rose-700 rounded-full">
                  {concern}
                </span>
              ))}
            </div>
          </div>

          {/* Recomendações de Produtos */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-500" />
              Produtos Recomendados
            </h3>
            <ul className="space-y-2">
              {analysis.recommendations.products.map((product, idx) => (
                <li key={idx} className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span className="text-gray-700">{product}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Rotina Recomendada */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-500" />
              Rotina Recomendada
            </h3>
            <ul className="space-y-2">
              {analysis.recommendations.routine.map((step, idx) => (
                <li key={idx} className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    );
  };

  // Renderizar tela de Perfil
  const renderProfileScreen = () => {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Meu Perfil</h2>
              <p className="text-gray-600">{user?.email}</p>
            </div>
          </div>

          {/* Controle de Som */}
          <div className="mb-6 p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {soundEnabled ? (
                  <Volume2 className="w-6 h-6 text-purple-600" />
                ) : (
                  <VolumeX className="w-6 h-6 text-gray-400" />
                )}
                <div>
                  <h3 className="font-semibold text-gray-800">Sons do Aplicativo</h3>
                  <p className="text-sm text-gray-600">
                    {soundEnabled ? 'Sons ativados' : 'Sons desativados'}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  const newState = !soundEnabled;
                  setSoundEnabled(newState);
                  soundManager.setEnabled(newState);
                  if (newState) {
                    playButtonSound();
                    toast.success("Sons ativados! 🔊");
                  } else {
                    toast.info("Sons desativados 🔇");
                  }
                }}
                variant={soundEnabled ? "default" : "outline"}
                className={soundEnabled ? "bg-purple-600 hover:bg-purple-700" : ""}
              >
                {soundEnabled ? 'Desativar' : 'Ativar'}
              </Button>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-rose-50 to-purple-50 p-4 rounded-lg">
              <Calendar className="w-8 h-8 text-purple-500 mb-2" />
              <div className="text-2xl font-bold text-gray-800">{currentDay}</div>
              <div className="text-sm text-gray-600">Dias Completos</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg">
              <Award className="w-8 h-8 text-blue-500 mb-2" />
              <div className="text-2xl font-bold text-gray-800">
                {achievements.filter(a => a.unlocked).length}
              </div>
              <div className="text-sm text-gray-600">Conquistas</div>
            </div>
          </div>

          {/* Botão de Logout */}
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-2 border-red-300 hover:border-red-500 hover:bg-red-50 text-red-600"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sair da Conta
          </Button>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 pb-20">
      {/* Toaster para notificações */}
      <Toaster position="top-center" richColors closeButton />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
              GlowUp 30 Dias
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newState = !soundEnabled;
                setSoundEnabled(newState);
                soundManager.setEnabled(newState);
                if (newState) playButtonSound();
              }}
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-purple-600" />
              ) : (
                <VolumeX className="w-5 h-5 text-gray-400" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        {currentScreen === "home" && renderHomeScreen()}
        {currentScreen === "routine" && renderRoutineScreen()}
        {currentScreen === "progress" && renderProgressScreen()}
        {currentScreen === "results" && renderResultsScreen()}
        {currentScreen === "profile" && renderProfileScreen()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-around">
          <Button
            variant="ghost"
            onClick={() => {
              if (soundEnabled) playButtonSound();
              setCurrentScreen("home");
            }}
            className={`flex flex-col items-center gap-1 ${currentScreen === "home" ? "text-purple-600" : "text-gray-600"}`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs">Início</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (soundEnabled) playButtonSound();
              setCurrentScreen("routine");
            }}
            className={`flex flex-col items-center gap-1 ${currentScreen === "routine" ? "text-purple-600" : "text-gray-600"}`}
          >
            <Calendar className="w-6 h-6" />
            <span className="text-xs">Rotina</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (soundEnabled) playButtonSound();
              setCurrentScreen("progress");
            }}
            className={`flex flex-col items-center gap-1 ${currentScreen === "progress" ? "text-purple-600" : "text-gray-600"}`}
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-xs">Progresso</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (soundEnabled) playButtonSound();
              setCurrentScreen("results");
            }}
            className={`flex flex-col items-center gap-1 ${currentScreen === "results" ? "text-purple-600" : "text-gray-600"}`}
          >
            <Sparkles className="w-6 h-6" />
            <span className="text-xs">Análise</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (soundEnabled) playButtonSound();
              setCurrentScreen("profile");
            }}
            className={`flex flex-col items-center gap-1 ${currentScreen === "profile" ? "text-purple-600" : "text-gray-600"}`}
          >
            <User className="w-6 h-6" />
            <span className="text-xs">Perfil</span>
          </Button>
        </div>
      </nav>

      {/* Modal de Vídeo */}
      {showVideoModal && selectedVideo && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-800">{selectedVideo.title}</h3>
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (soundEnabled) playButtonSound();
                    setShowVideoModal(false);
                  }}
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>
              
              <div className="aspect-video bg-gray-900 rounded-lg mb-4 overflow-hidden">
                <iframe
                  src={selectedVideo.video_url}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              <p className="text-gray-600 mb-4">{selectedVideo.description}</p>

              <div className="bg-purple-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-purple-800 mb-2">Passos:</h4>
                <ol className="space-y-2">
                  {selectedVideo.steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-semibold text-purple-600">{idx + 1}.</span>
                      <span className="text-gray-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {selectedVideo.duration}
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                  {selectedVideo.difficulty}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
