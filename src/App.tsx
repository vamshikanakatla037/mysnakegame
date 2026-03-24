import React, { useState, useEffect, useRef, useCallback } from 'react';

const TRACKS = [
  {
    id: 1,
    title: "SECTOR_01_NOISE",
    artist: "AI_GEN_ALPHA",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: 2,
    title: "CYBER_PULSE_ERR",
    artist: "AI_GEN_BETA",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    id: 3,
    title: "SYNTH_DREAM_SEQ",
    artist: "AI_GEN_GAMMA",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  }
];

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 100;

type Point = { x: number; y: number };

export default function App() {
  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Snake Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 15, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const directionRef = useRef(direction);

  // --- Music Player Logic ---
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };
  
  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleTrackEnd = () => {
    nextTrack();
  };

  // --- Snake Game Logic ---
  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // eslint-disable-next-line no-loop-func
      const isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setGameOver(false);
    setFood(generateFood(INITIAL_SNAKE));
    setIsGameStarted(true);
    setIsPaused(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' && isGameStarted && !gameOver) {
        setIsPaused(p => !p);
        return;
      }

      if (!isGameStarted || gameOver || isPaused) return;

      const { x, y } = directionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (y !== 1) directionRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (y !== -1) directionRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (x !== 1) directionRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (x !== -1) directionRef.current = { x: 1, y: 0 };
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameStarted, gameOver, isPaused]);

  useEffect(() => {
    if (!isGameStarted || gameOver || isPaused) return;

    const moveSnake = () => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const newHead = {
          x: head.x + directionRef.current.x,
          y: head.y + directionRef.current.y,
        };

        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          return prevSnake;
        }

        if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        if (newHead.x === food.x && newHead.y === food.y) {
          setScore((s) => {
            const newScore = s + 10;
            if (newScore > highScore) setHighScore(newScore);
            return newScore;
          });
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const gameInterval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameInterval);
  }, [isGameStarted, gameOver, isPaused, food, highScore, generateFood]);

  return (
    <div className="min-h-screen bg-black text-[#00ffff] font-mono flex flex-col items-center justify-center p-4 crt-flicker">
      <div className="static-noise" />
      <div className="scanline" />
      
      <header className="mb-8 text-center z-10 w-full max-w-6xl border-b-4 border-[#ff00ff] pb-4">
        <h1 className="text-5xl md:text-7xl font-black glitch-text tracking-widest" data-text="SYS.OVERRIDE">
          SYS.OVERRIDE
        </h1>
        <p className="text-[#ff00ff] mt-2 tracking-widest text-xl">SNAKE_PROTOCOL // AUDIO_SUBROUTINE</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl z-10 items-start justify-center">
        
        {/* Left Panel: Music Player */}
        <div className="w-full lg:w-80 bg-black border-4 border-[#00ffff] p-6 relative group">
          <div className="absolute top-0 left-0 w-full h-full bg-[#00ffff] opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
          
          <h2 className="text-2xl font-bold mb-6 text-[#ff00ff] border-b-2 border-[#ff00ff] pb-2">
            &gt; AUDIO_DECK
          </h2>

          <div className="mb-8 border-2 border-[#00ffff] p-4 bg-[#001111]">
            <div className="text-center">
              <h3 className="text-xl font-bold text-[#00ffff] truncate glitch-text" data-text={TRACKS[currentTrackIndex].title}>
                {TRACKS[currentTrackIndex].title}
              </h3>
              <p className="text-sm text-[#ff00ff] truncate mt-2">AUTHOR: {TRACKS[currentTrackIndex].artist}</p>
              <p className="text-xs text-[#00ffff] mt-4 opacity-70">STATUS: {isPlaying ? 'TRANSMITTING...' : 'IDLE'}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mb-6">
            <button onClick={prevTrack} className="btn-glitch px-4 py-2 text-xl">[&lt;&lt;]</button>
            <button onClick={togglePlay} className="btn-glitch px-6 py-2 text-2xl text-[#ff00ff] border-[#ff00ff]">
              {isPlaying ? '[ || ]' : '[ &gt; ]'}
            </button>
            <button onClick={nextTrack} className="btn-glitch px-4 py-2 text-xl">[&gt;&gt;]</button>
          </div>

          <div className="flex items-center justify-between text-sm border-t-2 border-[#00ffff] pt-4">
            <button onClick={() => setIsMuted(!isMuted)} className="btn-glitch px-2 py-1 text-xs">
              {isMuted ? 'VOL: MUTED' : 'VOL: ACTIVE'}
            </button>
            <span>SEQ {currentTrackIndex + 1}/{TRACKS.length}</span>
          </div>

          <audio ref={audioRef} src={TRACKS[currentTrackIndex].url} onEnded={handleTrackEnd} className="hidden" />
        </div>

        {/* Center Panel: Snake Game */}
        <div className="flex flex-col items-center w-full max-w-2xl">
          <div className="flex justify-between w-full mb-4 px-2 border-b-2 border-[#00ffff] pb-2">
            <div className="flex flex-col">
              <span className="text-[#ff00ff] text-sm">DATA_FRAGMENTS</span>
              <span className="text-3xl">{score.toString().padStart(4, '0')}</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[#ff00ff] text-sm">MAX_CAPACITY</span>
              <span className="text-3xl">{highScore.toString().padStart(4, '0')}</span>
            </div>
          </div>

          <div className="relative p-2 bg-black border-4 border-[#ff00ff]">
            {/* Game Grid */}
            <div 
              className="grid bg-[#001111] border-2 border-[#00ffff] relative"
              style={{ 
                gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                width: 'min(90vw, 500px)',
                height: 'min(90vw, 500px)'
              }}
            >
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
                const x = index % GRID_SIZE;
                const y = Math.floor(index / GRID_SIZE);
                
                const isSnakeHead = snake[0].x === x && snake[0].y === y;
                const isSnakeBody = snake.some((segment, i) => i !== 0 && segment.x === x && segment.y === y);
                const isFood = food.x === x && food.y === y;

                return (
                  <div 
                    key={index} 
                    className={`w-full h-full border-[0.5px] border-[#00ffff]/10 ${
                      isSnakeHead ? 'bg-[#ff00ff]' :
                      isSnakeBody ? 'bg-[#00ffff]' :
                      isFood ? 'bg-[#ff00ff] animate-pulse' :
                      ''
                    }`}
                  />
                );
              })}
            </div>

            {/* Overlays */}
            {(!isGameStarted || gameOver || isPaused) && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/90 m-2 border-2 border-[#00ffff]">
                <div className="text-center p-6 w-full">
                  {!isGameStarted ? (
                    <>
                      <h3 className="text-4xl font-bold mb-4 text-[#ff00ff] glitch-text" data-text="AWAITING_INPUT">AWAITING_INPUT</h3>
                      <p className="text-[#00ffff] text-lg mb-8">INPUT_REQ: [W,A,S,D] OR [ARROWS]<br/>INTERRUPT: [SPACE]</p>
                      <button onClick={resetGame} className="btn-glitch w-full py-4 text-2xl">
                        EXECUTE_START
                      </button>
                    </>
                  ) : gameOver ? (
                    <>
                      <h3 className="text-5xl font-black mb-4 text-[#ff00ff] glitch-text" data-text="FATAL_ERROR">FATAL_ERROR</h3>
                      <p className="text-[#00ffff] text-xl mb-2">SYSTEM_HALTED</p>
                      <p className="text-[#00ffff] mb-8">FRAGMENTS_RECOVERED: {score}</p>
                      <button onClick={resetGame} className="btn-glitch w-full py-4 text-2xl border-[#ff00ff] text-[#ff00ff]">
                        REBOOT_SYSTEM
                      </button>
                    </>
                  ) : isPaused ? (
                    <>
                      <h3 className="text-4xl font-bold mb-8 text-[#00ffff] glitch-text" data-text="EXECUTION_SUSPENDED">EXECUTION_SUSPENDED</h3>
                      <button onClick={() => setIsPaused(false)} className="btn-glitch w-full py-4 text-2xl">
                        RESUME_PROCESS
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6 text-center text-[#ff00ff] text-sm flex gap-8 border-t-2 border-[#ff00ff] pt-2 w-full justify-center">
            <span>&gt; DIR_CTRL: WASD/ARROWS</span>
            <span>&gt; SYS_INTRPT: SPACE</span>
          </div>
        </div>

      </div>
    </div>
  );
}
