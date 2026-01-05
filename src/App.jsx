import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [gameState, setGameState] = useState('menu') // 'menu', 'playing', 'gameOver'
  const [score, setScore] = useState(0)
  
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
    const [speed, setSpeed] = useState(2) // Initial speed
    const [snailY, setSnailY] = useState(100) // Snail's Y position (moving forward - starting at bottom)
    const [gameOver, setGameOver] = useState(false)
    const [distance, setDistance] = useState(0) // Track distance traveled
    const [roadOffset, setRoadOffset] = useState(0) // For curvy road effect
    const [obstacles, setObstacles] = useState([]) // Store obstacles
    const [nitroBoosters, setNitroBoosters] = useState([]) // Store nitro boosters
    const gameWorldRef = useRef(null)
    const roadRef = useRef(null)
    const animationFrameRef = useRef(null)
    const lastTimeRef = useRef(null)
    const isDraggingRef = useRef(false)
    
    // Increase speed over time
    useEffect(() => {
      const speedInterval = setInterval(() => {
        if (!gameOver) {
          // Increase speed gradually
          setSpeed(prev => prev + 0.1)
        }
      }, 1000) // Increase speed every second
      
      return () => clearInterval(speedInterval)
    }, [gameOver])
    
    // Curvy road effect - affects entire pathway
    useEffect(() => {
      const roadInterval = setInterval(() => {
        if (!gameOver) {
          // Create a gentle curve in the road
          setRoadOffset(prev => prev + (Math.random() - 0.5) * 2) // Small random movement
          
          // Keep road offset within bounds
          if (roadOffset > 20 || roadOffset < -20) {
            setRoadOffset(prev => prev * 0.9) // Gradually return to center
          }
        }
      }, 100) // Update frequently for smooth curves
      
      return () => clearInterval(roadInterval)
    }, [gameOver, roadOffset])
    
    // Generate obstacles
    useEffect(() => {
      if (gameOver) return;
      
      const obstacleInterval = setInterval(() => {
        if (!gameOver) {
          // Randomly decide to generate an obstacle (30% chance)
          if (Math.random() < 0.3) {
            const lane = Math.floor(Math.random() * 3); // 0, 1, or 2
            const lanePositions = [50, 150, 250];
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
    }, [gameOver])
    
    // Generate nitro boosters
    useEffect(() => {
      if (gameOver) return;
      
      const nitroInterval = setInterval(() => {
        if (!gameOver) {
          // Randomly decide to generate a nitro booster (20% chance)
          if (Math.random() < 0.2) {
            const lane = Math.floor(Math.random() * 3); // 0, 1, or 2
            const lanePositions = [50, 150, 250];
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
    }, [gameOver])
    
    // Game loop - just move the snail forward
    useEffect(() => {
      const updateGame = (timestamp) => {
        if (!lastTimeRef.current) lastTimeRef.current = timestamp
        
        const deltaTime = timestamp - lastTimeRef.current
        lastTimeRef.current = timestamp
        
        if (!gameOver) {
          // Move the snail forward
          setSnailY(prev => {
            const newY = prev + speed * (deltaTime / 16)
            // When snail moves forward, the distance increases
            if (newY - prev > 0) {
              const distanceIncrease = (newY - prev) / 10
              setDistance(prevDist => {
                const newDist = prevDist + distanceIncrease;
                // Check if distance threshold is reached
                if (newDist > 1000) { // After traveling 1000 meters
                  setGameOver(true);
                  onGameOver(newDist);
                }
                return newDist;
              });
              // Update score to match distance
              setScore(prevDist => prevDist + distanceIncrease);
            }
            return newY;
          });
          
          // Move obstacles and nitro boosters
          setObstacles(prev => {
            return prev
              .map(obstacle => ({
                ...obstacle,
                y: obstacle.y + speed * (deltaTime / 16) // Move with same speed as snail
              }))
              .filter(obstacle => obstacle.y < 800); // Remove if off screen
          });
          
          setNitroBoosters(prev => {
            return prev
              .map(nitro => ({
                ...nitro,
                y: nitro.y + speed * (deltaTime / 16) // Move with same speed as snail
              }))
              .filter(nitro => nitro.y < 800); // Remove if off screen
          });
          
          // Check for collisions with obstacles
          const snailLane = Math.floor(snailPosition / 100);
          const snailLanePositions = [50, 150, 250];
          const snailLanePos = snailPosition; // Use actual snail position, not lane center
          
          // Check for collision with sharp obstacles
          const obstacleCollision = obstacles.some(obstacle => {
            // Check if in same lane and close vertically
            if (obstacle.lane === snailLane && 
                Math.abs(obstacle.y - snailY) < 50 &&
                Math.abs(obstacle.position - snailLanePos) < 40) {
              return true;
            }
            return false;
          });
          
          if (obstacleCollision && !gameOver) {
            setGameOver(true);
            onGameOver(distance);
          }
          
          // Check for collision with nitro boosters
          const nitroCollision = nitroBoosters.some(nitro => {
            // Check if in same lane and close vertically
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
            setSpeed(prevSpeed => prevSpeed + 1.0);
          }
          
          animationFrameRef.current = requestAnimationFrame(updateGame);
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(updateGame);
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [speed, snailY, snailPosition, gameOver, onGameOver, obstacles, nitroBoosters])
    
    const handleSnailDrag = (clientX) => {
      if (!roadRef.current || gameOver) return
      
      const rect = roadRef.current.getBoundingClientRect()
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
}

export default App