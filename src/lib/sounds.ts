// Sistema de sons de interação do aplicativo

export type SoundCategory = 'achievement' | 'progress' | 'notification' | 'button' | 'analysis' | 'completion';

export interface InteractionSound {
  id: string;
  name: string;
  description: string;
  sound_url: string;
  category: SoundCategory;
}

// Sons de interação disponíveis (URLs públicas de sons gratuitos)
export const interactionSounds: InteractionSound[] = [
  {
    id: '1',
    name: 'Conquista Desbloqueada',
    description: 'Som de conquista desbloqueada',
    sound_url: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
    category: 'achievement'
  },
  {
    id: '2',
    name: 'Progresso Atualizado',
    description: 'Som de progresso atualizado',
    sound_url: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
    category: 'progress'
  },
  {
    id: '3',
    name: 'Notificação Sucesso',
    description: 'Som de notificação de sucesso',
    sound_url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
    category: 'notification'
  },
  {
    id: '4',
    name: 'Botão Clique',
    description: 'Som de clique em botão',
    sound_url: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
    category: 'button'
  },
  {
    id: '5',
    name: 'Análise Completa',
    description: 'Som de análise completa',
    sound_url: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
    category: 'analysis'
  },
  {
    id: '6',
    name: 'Dia Completado',
    description: 'Som de dia completado',
    sound_url: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
    category: 'completion'
  }
];

// Classe para gerenciar reprodução de sons
class SoundManager {
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;

  constructor() {
    // Verificar preferência do usuário no localStorage
    if (typeof window !== 'undefined') {
      const savedPreference = localStorage.getItem('soundsEnabled');
      this.enabled = savedPreference !== 'false';
    }
  }

  // Pré-carregar sons
  preloadSounds() {
    if (typeof window === 'undefined') return;

    interactionSounds.forEach(sound => {
      const audio = new Audio(sound.sound_url);
      audio.preload = 'auto';
      this.audioCache.set(sound.category, audio);
    });
  }

  // Reproduzir som por categoria
  play(category: SoundCategory, volume: number = 0.5) {
    if (!this.enabled || typeof window === 'undefined') return;

    try {
      let audio = this.audioCache.get(category);
      
      if (!audio) {
        const sound = interactionSounds.find(s => s.category === category);
        if (!sound) return;

        audio = new Audio(sound.sound_url);
        this.audioCache.set(category, audio);
      }

      audio.volume = Math.max(0, Math.min(1, volume));
      audio.currentTime = 0;
      
      // Reproduzir com tratamento de erro
      audio.play().catch(error => {
        console.log('Erro ao reproduzir som:', error);
      });
    } catch (error) {
      console.log('Erro no sistema de som:', error);
    }
  }

  // Ativar/desativar sons
  toggle() {
    this.enabled = !this.enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundsEnabled', String(this.enabled));
    }
    return this.enabled;
  }

  // Definir estado dos sons
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundsEnabled', String(enabled));
    }
  }

  // Verificar se sons estão ativados
  isEnabled() {
    return this.enabled;
  }

  // Definir volume global
  setVolume(volume: number) {
    this.audioCache.forEach(audio => {
      audio.volume = Math.max(0, Math.min(1, volume));
    });
  }
}

// Instância global do gerenciador de sons
export const soundManager = new SoundManager();

// Funções auxiliares para reproduzir sons específicos
export const playAchievementSound = () => soundManager.play('achievement', 0.6);
export const playProgressSound = () => soundManager.play('progress', 0.5);
export const playNotificationSound = () => soundManager.play('notification', 0.4);
export const playButtonSound = () => soundManager.play('button', 0.3);
export const playAnalysisSound = () => soundManager.play('analysis', 0.5);
export const playCompletionSound = () => soundManager.play('completion', 0.6);
