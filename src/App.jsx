import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [gameState, setGameState] = useState('menu') // 'menu', 'playing', 'gameOver'
  const [score, setScore] = useState(0)
  
  const endGame = (finalScore) => {
    setScore(finalScore)
    setGameState('gameOver')
  }

  const restartGame = () => {
    setGameState('menu')
    setScore(0)
  }

  const startGame = (newScore = 0) => {
    setGameState('playing')
    setScore(newScore)
  }

  const updateScore = (newScore) => {
    setScore(newScore)
  }

  return (
    <div className="app">
      {gameState === 'menu' && (
        <MenuScreen onStart={() => startGame()} />
      )}
      {gameState === 'playing' && (
        <GameWorld 
          score={score} 
          onGameOver={(finalScore) => endGame(finalScore)}
        />
      )}
      {gameState === 'gameOver' && (
        <GameOverScreen 
          score={score} 
          onRestart={() => restartGame()} 
        />
      )}
    </div>
  )
}

function MenuScreen({ onStart }) {
  return (
    <div className="screen menu-screen">
      <h1>🐌 Snail Race 🐌</h1>
      <p>Watch the snail accelerate forward!</p>
      <button onClick={onStart}>Start Game</button>
      <div className="instructions">
        <h2>How to Play</h2>
        <ul>
          <li>Click and drag the snail to move left/right</li>
          <li>Just watch the snail accelerate forward</li>
          <li>Speed increases over time</li>
        </ul>
      </div>
    </div>
  )
}

function GameOverScreen({ score, onRestart }) {
  return (
    <div className="screen game-over-screen">
      <h1>Game Over!</h1>
      <p>Your score: {Math.floor(score)} meters</p>
      <button onClick={onRestart}>Play Again</button>
    </div>
  )
}

function GameWorld({ score, onGameOver }) {
  const [snailPosition, setSnailPosition] = useState(150) // Center of 300px road (lane 1)
  const [snailY, setSnailY] = useState(100)
  const [gameOver, setGameOver] = useState(false)
  const [roadOffset, setRoadOffset] = useState(0) // For curvy road effect
  const [obstacles, setObstacles] = useState([]) // Store obstacles
  const [nitroBoosters, setNitroBoosters] = useState([]) // Store nitro boosters
  
  const speedRef = useRef(2)
  const snailYRef = useRef(100)
  const distanceRef = useRef(0)
  const gameWorldRef = useRef(null)
  const roadRef = useRef(null)
  const animationFrameRef = useRef(null)
  const lastTimeRef = useRef(null)
  const isDraggingRef = useRef(false)
  
  // Reset game state when component mounts (new game starts)
  useEffect(() => {
    // Reset all game state
    setGameOver(false)
    setObstacles([])
    setNitroBoosters([])
    setSnailPosition(150)
    setSnailY(100)
    setRoadOffset(0)
    
    // Reset all refs
    speedRef.current = 2
    snailYRef.current = 100
    distanceRef.current = 0
    lastTimeRef.current = null
    isDraggingRef.current = false
  }, [])
  
  // Increase speed over time
  useEffect(() => {
    const speedInterval = setInterval(() => {
      if (!gameOver) {
        // Increase speed gradually
        speedRef.current += 0.1
      }
    }, 1000) // Increase speed every second
    
    return () => clearInterval(speedInterval)
  }, [])
  
  // Curvy road effect - affects entire pathway
  useEffect(() => {
    const roadInterval = setInterval(() => {
      if (!gameOver) {
        // Create a gentle curve in the road
        setRoadOffset(prev => {
          const newValue = prev + (Math.random() - 0.5) * 2; // Small random movement
          
          // Keep road offset within bounds
          if (newValue > 20 || newValue < -20) {
            return newValue * 0.9; // Gradually return to center
          }
          return newValue;
        });
      }
    }, 100) // Update frequently for smooth curves
    
    return () => clearInterval(roadInterval)
  }, [])
  
  // Generate obstacles
  useEffect(() => {
    const obstacleInterval = setInterval(() => {
      if (!gameOver) {
        // Randomly decide to generate an obstacle (30% chance)
        if (Math.random() < 0.3) {
          const lane = Math.floor(Math.random() * 3); // 0, 1, or 2
          // Calculate lane position based on actual road width
          const rect = roadRef.current?.getBoundingClientRect();
          const actualLaneWidth = rect ? rect.width / 3 : 100; // Use actual road width if available, fallback to 100
          const lanePositions = [
            actualLaneWidth / 2,           // Left lane center
            actualLaneWidth * 1.5,       // Middle lane center
            actualLaneWidth * 2.5        // Right lane center
          ];
          const newObstacle = {
            id: Date.now() + Math.random(),
            lane,
            position: lanePositions[lane],
            y: -50, // Start above the screen
            type: 'sharp' // sharp obstacle
          };
          setObstacles(prev => [...prev, newObstacle]);
        }
      }
    }, 2000); // Generate every 2 seconds
    
    return () => clearInterval(obstacleInterval);
  }, [])
  
  // Generate nitro boosters
  useEffect(() => {
    const nitroInterval = setInterval(() => {
      if (!gameOver) {
        // Randomly decide to generate a nitro booster (20% chance)
        if (Math.random() < 0.2) {
          const lane = Math.floor(Math.random() * 3); // 0, 1, or 2
          // Calculate lane position based on actual road width
          const rect = roadRef.current?.getBoundingClientRect();
          const actualLaneWidth = rect ? rect.width / 3 : 100; // Use actual road width if available, fallback to 100
          const lanePositions = [
            actualLaneWidth / 2,           // Left lane center
            actualLaneWidth * 1.5,       // Middle lane center
            actualLaneWidth * 2.5        // Right lane center
          ];
          const newNitro = {
            id: Date.now() + Math.random(),
            lane,
            position: lanePositions[lane],
            y: -50, // Start above the screen
            type: 'nitro' // nitro booster
          };
          setNitroBoosters(prev => [...prev, newNitro]);
        }
      }
    }, 3000); // Generate every 3 seconds
    
    return () => clearInterval(nitroInterval);
  }, [])
  
  // Game loop - just move the snail forward
  useEffect(() => {
    let lastTime = 0
    let isActive = true; // Flag to track if the game loop should continue
    
    const loop = (time) => {
      if (!isActive || gameOver) {
        return;
      }
      
      const delta = time - lastTime
      lastTime = time
      
      // Update game state
      updateGameState(delta);
      
      // Check immediately if game is over after state update
      if (gameOver) {
        return;
      }
      
      // Update UI
      setSnailY(snailYRef.current)
      setScore(distanceRef.current)
      
      animationFrameRef.current = requestAnimationFrame(loop)
    }
    
    animationFrameRef.current = requestAnimationFrame(loop)
    
    return () => {
      isActive = false; // Set flag to stop the loop
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [])
  
  // Helper function to update game state
  const updateGameState = (delta) => {
    // Don't update state if game is over
    if (gameOver) return;
    
    // forward movement
    snailYRef.current += speedRef.current * (delta / 16)
    distanceRef.current += speedRef.current * 0.1
    
    // gradual speed increase
    speedRef.current += 0.002
    
    // end game
    if (distanceRef.current >= 1000) {
      setGameOver(true);
      onGameOver(distanceRef.current);
      return;
    }
    
    // Move obstacles and nitro boosters
    setObstacles(prev => {
      return prev
        .map(obstacle => ({
          ...obstacle,
          y: obstacle.y + speedRef.current * (delta / 16) // Move with same speed as snail
        }))
        .filter(obstacle => obstacle.y < 800); // Remove if off screen
    });
    
    setNitroBoosters(prev => {
      return prev
        .map(nitro => ({
          ...nitro,
          y: nitro.y + speedRef.current * (delta / 16) // Move with same speed as snail
        }))
        .filter(nitro => nitro.y < 800); // Remove if off screen
    });
    
    // Check for collisions with obstacles
    // Calculate which lane the snail is in based on its position
    // Use the same calculation as in handleSnailDrag for consistency
    const rect = roadRef.current?.getBoundingClientRect();
    const actualLaneWidth = rect ? rect.width / 3 : 100; // Use actual road width if available, fallback to 100
    let snailLane = rect ? Math.floor(snailPosition / actualLaneWidth) : Math.floor(snailPosition / 100);
    
    // Ensure lane is within bounds
    snailLane = Math.min(2, Math.max(0, snailLane));
    
    const snailLanePos = snailPosition; // Use actual snail position, not lane center
    
    // Check for collision with sharp obstacles
    const obstacleCollision = obstacles.some(obstacle => {
      // Check if close vertically and horizontally (using actual positions)
      // Check if the snail and obstacle are in the same lane and close vertically
      // Since obstacle.position is calculated based on the same method as lane centers,
      // we can use the original lane assignment
      if (obstacle.lane === snailLane &&
          Math.abs(obstacle.y - snailY) < 50 &&
          Math.abs(obstacle.position - snailLanePos) < 40) {
        return true;
      }
      return false;
    });
    
    if (obstacleCollision && !gameOver) {
      setGameOver(true);
      onGameOver(distanceRef.current);
      return;
    }
    
    // Check for collision with nitro boosters
    // Only continue if game is not over
    if (!gameOver) {
      const nitroCollision = nitroBoosters.some(nitro => {
        // Check if close vertically and horizontally (using actual positions)
        // Check if the snail and nitro are in the same lane and close vertically
        // Since nitro.position is calculated based on the same method as lane centers,
        // we can use the original lane assignment
        if (nitro.lane === snailLane &&
            Math.abs(nitro.y - snailY) < 50 &&
            Math.abs(nitro.position - snailLanePos) < 40) {
          return true;
        }
        return false;
      });
      
      if (nitroCollision && !gameOver) {
        // Remove the collected nitro booster
        setNitroBoosters(prev => prev.filter(nitro => {
          return !(nitro.lane === snailLane && 
                  Math.abs(nitro.y - snailY) < 50 &&
                  Math.abs(nitro.position - snailLanePos) < 40);
        }));
                  
        // Boost the speed
        speedRef.current += 1.0;
      }
    }
  }
  
  const handleSnailDrag = (clientX) => {
    if (!roadRef.current || gameOver) return
    
    const rect = roadRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = clientX - rect.left
    
    if (x < 0 || x > rect.width) return
    
    const laneWidth = rect.width / 3
    let lane = Math.floor(x / laneWidth)
    
    // Ensure lane is within bounds
    lane = Math.min(2, Math.max(0, lane))
    
    const laneCenters = [
      laneWidth / 2,
      laneWidth * 1.5,
      laneWidth * 2.5
    ]
    
    setSnailPosition(laneCenters[lane])
  }
  
  return (
    <div
      className="game-world"
      ref={gameWorldRef}
      onMouseDown={() => (isDraggingRef.current = true)}
      onMouseUp={() => (isDraggingRef.current = false)}
      onMouseLeave={() => (isDraggingRef.current = false)}
      onMouseMove={(e) => {
        if (isDraggingRef.current) {
          handleSnailDrag(e.clientX)
        }
      }}
      onTouchStart={() => (isDraggingRef.current = true)}
      onTouchEnd={() => (isDraggingRef.current = false)}
      onTouchMove={(e) => {
        if (e.touches[0]) {
          handleSnailDrag(e.touches[0].clientX)
        }
      }}
    >
      <div className="road-container" ref={roadRef} style={{ transform: `translateX(${roadOffset}px)` }}>
        <Road />
        <Snail position={snailPosition} snailY={snailY} />
        {obstacles.map(obstacle => (
          <div 
            key={`obstacle-${obstacle.id}`}
            className="obstacle sharp"
            style={{ 
              left: `${obstacle.position}px`, 
              top: `${obstacle.y}px`
            }}
          >
            ⚰️
          </div>
        ))}
        {nitroBoosters.map(nitro => (
          <div 
            key={`nitro-${nitro.id}`}
            className="nitro"
            style={{ 
              left: `${nitro.position}px`, 
              top: `${nitro.y}px`
            }}
          >
            🚗💨
          </div>
        ))}
      </div>
    </div>
  )
}

function Road() {
  return (
    <div className="road">
      <div className="road-lines"></div>
      <div className="lane lane-1"></div>
      <div className="lane lane-2"></div>
      <div className="lane lane-3"></div>
    </div>
  )
}

function Snail({ position, snailY }) {
  return (
    <div 
      className="snail" 
      style={{ 
        left: `${position}px`, // Position based on passed position
        top: `${snailY}px` // Position based on snail's Y position (moving upward)
      }}
    >
      🐌
    </div>
  )
}

export default App