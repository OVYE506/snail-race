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
          <li>Dodge salt particles (❄️) - they slow you down</li>
          <li>Don't fall off the road edges!</li>
          <li>Speed increases every 10 meters</li>
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
  const [snailPosition, setSnailPosition] = useState(150) // Center of 300px road
  const [obstacles, setObstacles] = useState([])
  const [speed, setSpeed] = useState(2) // Initial speed
  const [gameOver, setGameOver] = useState(false)
  const [distance, setDistance] = useState(0) // Track distance traveled
  const [roadOffset, setRoadOffset] = useState(0) // For curvy road effect
  const [snailY, setSnailY] = useState(600) // Snail's Y position (moving forward)
  const [checkpoints, setCheckpoints] = useState([]) // Road bump checkpoints
  const gameWorldRef = useRef(null)
  const animationFrameRef = useRef(null)
  const lastTimeRef = useRef(null)
  
  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver) return
      
      if (e.key === 'ArrowLeft') {
        setSnailPosition(prev => Math.max(0, prev - 20))
      } else if (e.key === 'ArrowRight') {
        setSnailPosition(prev => Math.min(300, prev + 20))
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameOver])
  
  // Increase speed when passing checkpoints
  useEffect(() => {
    const checkpointInterval = setInterval(() => {
      if (!gameOver) {
        // Move snail forward automatically
        setSnailY(prev => {
          const newY = prev - speed
          // When snail moves up, the distance increases
          if (prev - newY > 0) {
            setDistance(dist => dist + (prev - newY) / 10) // Scale the distance
          }
          return newY
        })
        
        // Reset snail position when it gets too high (top of screen)
        if (snailY < -100) {
          setSnailY(700) // Reset to bottom
        }
      }
    }, 16) // ~60fps
    
    return () => clearInterval(checkpointInterval)
  }, [speed, snailY, gameOver])
  
  // Increase speed every 10 meters
  useEffect(() => {
    const newSpeed = 2 + Math.floor(distance / 10) * 0.5
    setSpeed(newSpeed)
  }, [distance])
  
  // Curvy road effect
  useEffect(() => {
    if (gameOver) return
    
    const curveInterval = setInterval(() => {
      setRoadOffset(prev => {
        // Create a wave-like motion
        return Math.sin(distance / 5) * 30
      })
    }, 100)
    
    return () => clearInterval(curveInterval)
  }, [distance, gameOver])
  
  // Generate obstacles
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
        
        // Create obstacles
        obstacleLanes.forEach(laneIndex => {
          // Randomly select obstacle type (70% salt, 30% sharp)
          const isSharp = Math.random() > 0.7
          
          newObstacles.push({
            id: Date.now() + Math.random(),
            lane: laneIndex,
            type: isSharp ? 'sharp' : 'salt',
            y: Math.random() * 800, // Random Y position
            passed: false
          })
        })
        
        setObstacles(prev => [...prev, ...newObstacles])
      }
    }, 2000) // Spawn obstacles every 2 seconds
    
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
            y: -50, // Start above the screen
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
        // Move checkpoints
        setCheckpoints(prev => {
          return prev.map(cp => ({
            ...cp,
            y: cp.y + speed * (deltaTime / 16) // Adjust for frame rate
          })).filter(cp => cp.y < 800) // Remove off-screen checkpoints
        })
        
        // Move obstacles
        setObstacles(prev => {
          const updatedObstacles = prev.map(obstacle => ({
            ...obstacle,
            y: obstacle.y + speed * (deltaTime / 16) // Adjust for frame rate
          })).filter(obstacle => obstacle.y < 800) // Remove off-screen obstacles
          
          // Check for passed obstacles to increase score
          updatedObstacles.forEach(obstacle => {
            if (!obstacle.passed && obstacle.y > snailY) { // Snail's Y position
              obstacle.passed = true
              // Score is increased in the main component
            }
          })
          
          return updatedObstacles
        })
        
        // Check collisions
        checkCollisions()
        
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
    const snailLane = Math.floor(snailPosition / 100) // Convert position to lane (0, 1, 2)
    
    obstacles.forEach(obstacle => {
      // Check if obstacle is at snail's position
      if (Math.abs(obstacle.y - snailY) < 50) { // Snail's vertical position range (50px tolerance)
        if (obstacle.lane === snailLane) {
          if (obstacle.type === 'sharp') {
            // Game over for sharp obstacles
            setGameOver(true)
            onGameOver(distance)
          } else {
            // Salt slows down the snail temporarily
            // We could implement a slow effect here
          }
        }
      }
    })
    
    // Check if snail fell off the road
    if (snailPosition < 0 || snailPosition > 300) {
      setGameOver(true)
      onGameOver(distance)
    }
  }
  
  const handleSnailDrag = (e) => {
    if (gameWorldRef.current && !gameOver) {
      const rect = gameWorldRef.current.getBoundingClientRect()
      const roadLeft = rect.left + (rect.width - 300) / 2 // Road is 300px wide, centered
      const newPosition = e.clientX - roadLeft
      
      // Keep snail within road bounds
      if (newPosition >= 0 && newPosition <= 300) {
        setSnailPosition(newPosition)
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
            snailY={snailY}
          />
        ))}
      </div>
      <Snail position={snailPosition} snailY={snailY} />
      {obstacles.map(obstacle => (
        <Obstacle 
          key={obstacle.id} 
          obstacle={obstacle} 
        />
      ))}
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
        left: `${position}px`,
        bottom: `${600 - snailY}px` // Position relative to the screen
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
      {obstacle.type === 'sharp' ? '💀' : '❄️'}
    </div>
  )
}

function Checkpoint({ checkpoint, snailY }) {
  return (
    <div 
      className="checkpoint"
      style={{ 
        top: `${checkpoint.y}px`
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