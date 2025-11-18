import React, { useState, useRef, useEffect } from 'react';

interface SoundEffect {
  id: string;
  url: string;
  volume: number;
}

const AudioPlayer: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  
  // Store event handler references
  const eventHandlers = useRef({
    success: () => playSound('success'),
    sparkle: () => playSound('sparkle'),
    notification: () => playSound('notification')
  });
  
  // Define sound effects
  const soundEffects: SoundEffect[] = [
    {
      id: 'hover',
      url: 'https://assets.mixkit.co/sfx/preview/mixkit-single-classic-click-1116.mp3',
      volume: 0.15
    },
    {
      id: 'click',
      url: 'https://assets.mixkit.co/sfx/preview/mixkit-modern-click-box-check-1120.mp3',
      volume: 0.2
    },
    {
      id: 'success',
      url: 'https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3',
      volume: 0.2
    },
    {
      id: 'sparkle',
      url: 'https://assets.mixkit.co/sfx/preview/mixkit-fairy-arcade-sparkle-866.mp3',
      volume: 0.15
    },
    {
      id: 'notification',
      url: 'https://assets.mixkit.co/sfx/preview/mixkit-appointment-notification-melodic-tone-2536.mp3',
      volume: 0.2
    }
  ];
  
  const playSound = (id: string) => {
    if (!isEnabled) return;
    
    const audio = audioRefs.current[id];
    if (audio) {
      // Reset the audio to start
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Handle autoplay restrictions
        console.log('Audio play was prevented by the browser');
      });
    }
  };
  
  useEffect(() => {
    // Create audio elements for each sound
    soundEffects.forEach(sound => {
      const audio = new Audio(sound.url);
      audio.volume = sound.volume;
      audio.preload = 'auto';
      audioRefs.current[sound.id] = audio;
    });
    
    // Set up event listeners
    if (isEnabled) {
      setupEventListeners();
    }
    
    return () => {
      removeEventListeners();
    };
  }, [isEnabled]);
  
  const handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive = 
      target.tagName === 'BUTTON' || 
      target.tagName === 'A' || 
      target.closest('button') || 
      target.closest('a') ||
      target.getAttribute('role') === 'button';
    
    if (isInteractive) {
      playSound('click');
    }
  };
  
  const handleHover = () => {
    playSound('hover');
  };
  
  const setupEventListeners = () => {
    document.addEventListener('click', handleClick);
    
    // Add hover sound to buttons and links
    const interactiveElements = document.querySelectorAll('button, a, [role="button"]');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', handleHover);
    });
    
    // Listen for custom events - using the stored references
    document.addEventListener('sound:success', eventHandlers.current.success);
    document.addEventListener('sound:sparkle', eventHandlers.current.sparkle);
    document.addEventListener('sound:notification', eventHandlers.current.notification);
  };
  
  const removeEventListeners = () => {
    document.removeEventListener('click', handleClick);
    
    const interactiveElements = document.querySelectorAll('button, a, [role="button"]');
    interactiveElements.forEach(el => {
      el.removeEventListener('mouseenter', handleHover);
    });
    
    // Remove custom event listeners - using the same stored references
    document.removeEventListener('sound:success', eventHandlers.current.success);
    document.removeEventListener('sound:sparkle', eventHandlers.current.sparkle);
    document.removeEventListener('sound:notification', eventHandlers.current.notification);
  };
  
  // Toggle sound on/off
  const toggleSound = () => {
    setIsEnabled(prev => {
      const newState = !prev;
      
      if (newState) {
        setupEventListeners();
        // Play a sound to confirm sound is on
        setTimeout(() => playSound('success'), 100);
      } else {
        removeEventListeners();
      }
      
      // Save preference to localStorage
      localStorage.setItem('soundEnabled', String(newState));
      return newState;
    });
  };
  
  // Initialize from localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem('soundEnabled');
    if (savedPreference !== null) {
      setIsEnabled(savedPreference === 'true');
    }
  }, []);
  
  return (
    <button
      onClick={toggleSound}
      className="fixed bottom-4 right-4 z-40 bg-gray-900/70 backdrop-blur-sm border border-gray-700 rounded-full w-10 h-10 flex items-center justify-center"
      aria-label={isEnabled ? 'Disable sound effects' : 'Enable sound effects'}
    >
      {isEnabled ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A4 4 0 0013 10a4 4 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
};

export default AudioPlayer;