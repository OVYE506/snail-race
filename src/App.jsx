import { useState, useEffect, useRef } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import './App.css'

function App() {
  const [gameState, setGameState] = useState('menu') // menu, playing, gameOver
  const [score, setScore] = useState(0)

  useEffect(() => {
    // Hide splash screen when app is ready
    sdk.actions.ready()
  }, [])

  const startGame = (newScore = 0) => {
    setGameState('playing')
    setScore(newScore)
  }

  const updateScore = (newScore) => {
    setScore(newScore)
  }

  const endGame = (finalScore) => {
    setScore(finalScore)
    setGameState('gameOver')
  }

  const restartGame = () => {
    setGameState('menu')
    setScore(0)
  }

  return (
    <div className="app">
      {gameState === 'menu' && (
        <MenuScreen onStart={startGame} />
      )}
      
      {gameState === 'playing' && (
        <GameScreen score={score} onGameOver={endGame} />
      )}
      
      {gameState === 'gameOver' && (
        <GameOverScreen score={score} onRestart={restartGame} />
      )}
    </div>
  )
}

function MenuScreen({ onStart }) {
  return (
    <div className="screen menu-screen">
      <h1>🐌 Snail Race 🐌</h1>
      <p>Navigate the snail through obstacles!</p>
      <button onClick={onStart}>Start Game</button>
      <div className="instructions">
        <h2>How to Play</h2>
        <ul>
          <li>Click and drag the snail to move left/right</li>
          <li>Avoid sharp objects (💀) - they end the game!</li>
          <li>Collect nitro boosters (🔵) to increase speed</li>
          <li>Don't fall off the road edges!</li>
          <li>Speed increases every 45 seconds</li>
        </ul>
      </div>
    </div>
  )
}

function GameScreen({ score, onGameOver }) {
  return (
    <div className="screen game-screen">
      <div className="game-header">
        <div className="score">Score: {Math.floor(score)}m</div>
      </div>
      <GameWorld onGameOver={onGameOver} />
    </div>
  )
}

function GameWorld({ onGameOver }) {
  const [snailPosition, setSnailPosition] = useState(150) // Center of 300px road (lane 1)
  const [obstacles, setObstacles] = useState([])
  const [speed, setSpeed] = useState(2) // Initial speed
  const [snailY, setSnailY] = useState(100) // Snail's Y position (moving forward - starting at bottom)
  const [gameOver, setGameOver] = useState(false)
  const [distance, setDistance] = useState(0) // Track distance traveled
  const [roadOffset, setRoadOffset] = useState(0) // For curvy road effect
  // Snail's Y position is fixed at 600 (bottom of screen)
  const [checkpoints, setCheckpoints] = useState([]) // Road bump checkpoints
  const gameWorldRef = useRef(null)
  const animationFrameRef = useRef(null)
  const lastTimeRef = useRef(null)
  
  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver) return
      
      if (e.key === 'ArrowLeft') {
        setSnailPosition(prev => Math.max(0, Math.floor(prev / 100) - 1) * 100 + 50)
      } else if (e.key === 'ArrowRight') {
        setSnailPosition(prev => Math.min(200, Math.floor(prev / 100) + 1) * 100 + 50)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameOver])
  
  // Initialize snail position
  useEffect(() => {
    // Initialize snail at the bottom of the screen
    setSnailY(100) // Start at the bottom
  }, [])
  
  // Increase speed every 45 seconds
  useEffect(() => {
    const speedInterval = setInterval(() => {
      if (!gameOver) {
        // Increase speed every 45 seconds
        setSpeed(prev => prev + 0.5)
      }
    }, 45000) // 45 seconds
    
    return () => clearInterval(speedInterval)
  }, [gameOver])
  
  // Curvy road effect - affects entire pathway
  useEffect(() => {
    if (gameOver) return
    
    const curveInterval = setInterval(() => {
      setRoadOffset(prev => {
        // Create a wave-like motion that affects the entire pathway
        return Math.sin(distance / 10) * 20
      })
    }, 100)
    
    return () => clearInterval(curveInterval)
  }, [distance, gameOver])
  
  // Generate obstacles in the unified pathway
  useEffect(() => {
    const obstacleInterval = setInterval(() => {
      if (!gameOver) {
        // Randomly decide how many obstacles to spawn (1-2)
        const obstacleCount = Math.random() > 0.7 ? 2 : 1
        const newObstacles = []
        
        // Create an array of available lanes (0, 1, 2)
        const availableLanes = [0, 1, 2]
        
        // Shuffle the lanes
        for (let i = availableLanes.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[availableLanes[i], availableLanes[j]] = [availableLanes[j], availableLanes[i]]
        }
        
        // Select lanes for obstacles (ensure at least one lane is free)
        const obstacleLanes = obstacleCount === 1 ? [availableLanes[0]] : [availableLanes[0], availableLanes[1]]
        
        // Create obstacles in the unified pathway
        obstacleLanes.forEach(laneIndex => {
          // Randomly select obstacle type (70% sharp, 30% nitro) - no salt
          const rand = Math.random()
          let obstacleType
          if (rand < 0.30) {
            obstacleType = 'nitro'
          } else {
            obstacleType = 'sharp'
          }
          
          newObstacles.push({
            id: Date.now() + Math.random(),
            lane: laneIndex,
            type: obstacleType,
            y: snailY + 400 + Math.random() * 400, // Position well ahead of the snail (downward on screen)
            passed: false
          })
        })
        
        setObstacles(prev => [...prev, ...newObstacles])
      }
    }, 1500) // Spawn obstacles every 1.5 seconds
    
    return () => clearInterval(obstacleInterval)
  }, [gameOver])
  
  // Generate checkpoints
  useEffect(() => {
    const checkpointInterval = setInterval(() => {
      if (!gameOver) {
        // Add checkpoints periodically
        setCheckpoints(prev => {
          const newCheckpoint = {
            id: Date.now() + Math.random(),
            y: snailY + 600, // Position further ahead of the snail (downward on screen)
          }
          // Keep only recent checkpoints
          return [...prev.filter(cp => cp.y < 800), newCheckpoint]
        })
      }
    }, 3000) // Add checkpoint every 3 seconds
    
    return () => clearInterval(checkpointInterval)
  }, [gameOver])
  
  // Game loop
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
            setDistance(dist => dist + (newY - prev) / 10) // Scale the distance
          }
          return newY
        })
        
        // Clean up obstacles that are too far behind
        setObstacles(prev => prev.filter(obstacle => obstacle.y > snailY - 800))
        
        // Check collisions
        checkCollisions()
        
        // Log current game state for debugging (only occasionally to avoid spam)
        if (Math.floor(distance) % 50 === 0) {
          console.log(`Snail position: ${snailPosition}, Lane: ${Math.floor(snailPosition / 100)}, Current speed: ${speed}, Distance: ${Math.round(distance)}`)
        }
        
        animationFrameRef.current = requestAnimationFrame(updateGame)
      }
    }
    
    animationFrameRef.current = requestAnimationFrame(updateGame)
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [speed, snailPosition, snailY, gameOver])
  
  const checkCollisions = () => {
    if (gameOver) return; // Don't process collisions if game is over
    
    const snailLane = Math.floor(snailPosition / 100) // Convert position to lane (0, 1, 2)
    
    // Process each obstacle for collision
    obstacles.forEach(obstacle => {
      // Immediate and sensitive collision detection
      const snailHeight = 80; // Further increased height for maximum sensitivity
      const obstacleHeight = 80; // Further increased height for maximum sensitivity
      
      // Check vertical overlap with maximum sensitivity using actual snail Y position
      const verticalOverlap = (obstacle.y < snailY + snailHeight) && (obstacle.y + obstacleHeight > snailY);
      
      // Check if collision occurred at the current frame
      if (verticalOverlap && obstacle.lane === snailLane) {
        console.log(`Collision detected with ${obstacle.type} at lane ${obstacle.lane}`) // Debug log
        
        if (obstacle.type === 'sharp') {
          // Game over for sharp obstacles
          setGameOver(true);
          onGameOver(distance);
        } else if (obstacle.type === 'nitro') {
          // Nitro booster - increase speed
          setSpeed(prev => prev + 2); // Boost speed
          console.log('Nitro boost activated!');
          
          // Remove the nitro obstacle after collection
          setObstacles(prev => prev.filter(obs => obs.id !== obstacle.id));
        }
      }
    });
    
    // Removed lane edge crossing game over condition
  }
  
  const handleSnailDrag = (e) => {
    if (gameWorldRef.current && !gameOver) {
      const rect = gameWorldRef.current.getBoundingClientRect()
      const roadLeft = rect.left + (rect.width - 300) / 2 // Road is 300px wide, centered
      const rawPosition = e.clientX - roadLeft
      
      // Calculate which lane the user clicked on (0, 1, or 2)
      const lane = Math.min(2, Math.max(0, Math.floor(rawPosition / 100)))
      
      // Keep snail within road bounds and snap to lane center
      if (rawPosition >= 0 && rawPosition <= 300) {
        const lanePositions = [50, 150, 250] // Center positions of each lane
        setSnailPosition(lanePositions[lane])
      }
    }
  }
  
  return (
    <div 
      className="game-world" 
      ref={gameWorldRef}
      onMouseMove={(e) => handleSnailDrag(e)}
      onTouchMove={(e) => {
        e.preventDefault()
        handleSnailDrag(e.touches[0])
      }}
    >
      <div className="road-container" style={{ transform: `translateX(${roadOffset}px)` }}>
        <Road />
        {checkpoints.map(checkpoint => (
          <Checkpoint 
            key={checkpoint.id} 
            checkpoint={checkpoint} 
          />
        ))}
        <Snail position={snailPosition} snailY={snailY} />
        {obstacles.map(obstacle => (
          <Obstacle 
            key={obstacle.id} 
            obstacle={obstacle} 
          />
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
  // Calculate lane position (0, 1, 2) from pixel position
  const lane = Math.floor(position / 100)
  const lanePositions = [50, 150, 250] // Center positions of each lane
  
  return (
    <div 
      className="snail" 
      style={{ 
        left: `${lanePositions[lane]}px`, // Position in the center of the lane
        top: `${snailY}px` // Position based on snail's Y position (moving upward)
      }}
    >
      🐌
    </div>
  )
}

function Obstacle({ obstacle }) {
  const lanePositions = [50, 150, 250] // Center positions of each lane
  
  return (
    <div 
      className={`obstacle ${obstacle.type}`}
      style={{ 
        left: `${lanePositions[obstacle.lane]}px`,
        top: `${obstacle.y}px`
      }}
    >
      {obstacle.type === 'sharp' ? '💀' : '🔵'}
    </div>
  )
}

function Checkpoint({ checkpoint }) {
  return (
    <div 
      className="checkpoint"
      style={{ 
        top: `${checkpoint.y}px`,
      }}
    >
      ≈≈≈
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

export default App