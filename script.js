document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('start-btn');
  const contentElem = document.getElementById('content');
  const gameSection = document.getElementById('game');
  const tutorialSection = document.getElementById('tutorial');
  const tutorialBtn = document.getElementById('tutorial-btn');
  const gameOverSection = document.getElementById('game-over');
  const giftSection = document.getElementById('gift');
  const heartsContainer = document.getElementById('hearts-container');
  const heartsScore = document.getElementById('hearts-score');
  const numericScore = document.getElementById('numeric-score');
  const highScoreDisplay = document.getElementById('high-score');
  const livesDisplay = document.getElementById('lives-display');
  const roundMessage = document.getElementById('round-message');
  const player = document.getElementById('player');
  const projectilesContainer = document.getElementById('projectiles');
  const powerUpsContainer = document.getElementById('power-ups');
  const background = document.getElementById('background');
  
  // Audio setup
  const bgMusic = new Audio('Sounds/bg-Soundtrack.mp3');
  bgMusic.loop = true;
  const fireSound = new Audio('Sounds/fire blast sound.mp3');
  const heartHitSound = new Audio('Sounds/sound for when you hit the heart.mp3');
  const successSound = new Audio('Sounds/short-success-sound-glockenspiel-treasure-video-game-6346.mp3');
  
  let score = 0;
  let lives = 3;
  let baseSpeed = 1.5;
  let difficultyMultiplier = 1;
  let gameActive = false;
  let messageIndex = 0;
  let highScore = localStorage.getItem('valentineDragoHighScore') || 0;
  let playerX = window.innerWidth / 2;
  let playerY = window.innerHeight - 100;
  let powerUpActive = false;
  let projectiles = [];
  let hearts = [];
  let powerUps = [];
  let keys = {};
  let heartSpawnInterval;
  let powerUpSpawnInterval;
  let gameLoop;
  let lastFireTime = 0;
  let autoFireInterval;
  const normalFireRate = 250; // 250ms between shots
  const powerUpFireRate = 100; // 100ms between shots with power-up

  const romanticMessages = [
    "12 years ago in gym class, I had the biggest crush on you... 💕",
    "Remember that back massage you gave me? That's when I knew... 💝",
    "Your singing and love for sports made me fall even harder! 🎵",
    "I told myself one day I'd be with you... and here we are! ❤️",
    "All those years reaching out on social media, hoping you'd notice... 💌",
    "That first walk together was everything I dreamed of! 🌟",
    "Every time I see you, I see my whole life ahead... 💫",
    "Your bright expressions and cute mannerisms make my heart melt! 🥰",
    "Having you stay with me was the best decision ever! 🏠",
    "Remember when I said I 'beyond like' you? (I meant love!) 💘",
    "That day the L-word slipped out... twice! 💖",
    "You're teaching me so much about love and relationships... 🌹",
    "You're the first person I've ever wanted to hold doors for! 🚪",
    "Meeting my parents? That was a big deal - you're special! 👨‍👩‍👦",
    "Buying you flowers for your show was just the beginning... 💐",
    "No matter what, even if Italy calls, my heart is yours... 🌍",
    "I'm trying my best to be better, all because of you... ❤️",
    "You're worth every effort, every moment, every smile... ✨"
  ];

  function updateScore() {
    heartsScore.innerHTML = '';
    numericScore.textContent = score;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('valentineDragoHighScore', highScore);
    }
    highScoreDisplay.textContent = highScore;
    const hearts = Math.min(score, 10);
    for (let i = 0; i < hearts; i++) {
      const heart = document.createElement('span');
      heart.className = 'score-heart';
      heart.textContent = '❤️';
      heartsScore.appendChild(heart);
    }
  }

  function showMessage(text) {
    if (text) {
      roundMessage.textContent = text;
      roundMessage.style.animation = 'none';
      roundMessage.offsetHeight;
      roundMessage.style.animation = 'messageFloat 4s ease-in-out';
    } else {
      roundMessage.textContent = romanticMessages[messageIndex];
      messageIndex = (messageIndex + 1) % romanticMessages.length;
      roundMessage.style.animation = 'none';
      roundMessage.offsetHeight;
      roundMessage.style.animation = 'messageFloat 4s ease-in-out';
    }
  }

  function updateLives() {
    livesDisplay.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const lifeImg = document.createElement('img');
      lifeImg.src = 'icon images/heart icon for lives.jpg';
      lifeImg.alt = 'life';
      lifeImg.className = 'life-icon' + (i >= lives ? ' lost' : '');
      livesDisplay.appendChild(lifeImg);
    }
  }

  function spawnLifePowerUp() {
    if (!gameActive || lives >= 3) return;
    
    const powerUp = document.createElement('div');
    powerUp.classList.add('life-powerup');
    
    const img = document.createElement('img');
    img.src = 'icon images/cracker life power up.png';
    img.alt = 'life power up';
    powerUp.appendChild(img);
    
    const maxX = window.innerWidth - 40;
    const x = Math.random() * maxX;
    powerUp.style.left = x + 'px';
    powerUp.style.top = '-40px';
    
    const powerUpObj = {
      element: powerUp,
      x: x,
      y: -40,
      speed: 2,
      isLifePowerUp: true
    };
    
    powerUps.push(powerUpObj);
    powerUpsContainer.appendChild(powerUp);
  }

  function spawnHeart() {
    if (!gameActive) return;
    
    // Increase difficulty based on score
    difficultyMultiplier = 1 + (score * 0.1);
    
    const target = document.createElement('div');
    target.classList.add('heart');
    
    const img = document.createElement('img');
    img.src = 'icon images/dragon target.png';
    img.alt = 'dragon target';
    img.classList.add('heart-icon');
    target.appendChild(img);
    
    const maxX = window.innerWidth - 60;
    const x = Math.random() * maxX;
    target.style.left = x + 'px';
    target.style.top = '-60px';
    
    const targetObj = {
      element: target,
      x: x,
      y: -60,
      speed: baseSpeed * difficultyMultiplier
    };
    
    hearts.push(targetObj);
    heartsContainer.appendChild(target);
  }

  function spawnPowerUp() {
    if (!gameActive || powerUpActive) return;
    
    const powerUp = document.createElement('div');
    powerUp.classList.add('power-up');
    
    const img = document.createElement('img');
    img.src = 'icon images/blue fire power up.jpg';
    img.alt = 'power up';
    powerUp.appendChild(img);
    
    const maxX = window.innerWidth - 40;
    const x = Math.random() * maxX;
    powerUp.style.left = x + 'px';
    powerUp.style.top = '-40px';
    
    const powerUpObj = {
      element: powerUp,
      x: x,
      y: -40,
      speed: 2
    };
    
    powerUps.push(powerUpObj);
    powerUpsContainer.appendChild(powerUp);
  }

  function shootFireball(isBlue = false) {
    const currentTime = Date.now();
    const minFireInterval = powerUpActive ? powerUpFireRate : normalFireRate;
    
    if (currentTime - lastFireTime < minFireInterval) {
      return; // Too soon to fire again
    }
    lastFireTime = currentTime;

    const fireball = document.createElement('div');
    fireball.classList.add('fireball');
    
    const img = document.createElement('img');
    // Use blue fire image when power-up is active
    img.src = powerUpActive ? 'icon images/blue fire power up.jpg' : 'icon images/standard red fire.jpg';
    img.alt = 'fireball';
    fireball.appendChild(img);
    if (powerUpActive) fireball.classList.add('blue-fire');
    
    // Fire from dragon's mouth position
    const x = playerX + (player.classList.contains('facing-left') ? 0 : 60);
    const y = playerY + 20;
    fireball.style.left = x + 'px';
    fireball.style.top = y + 'px';
    
    // Calculate direction based on facing
    const direction = player.classList.contains('facing-left') ? -1 : 1;
    
    const projectileObj = {
      element: fireball,
      x: x,
      y: y,
      speedX: (powerUpActive ? 20 : 15) * direction,
 // Faster projectiles with power-up
      speedY: 0,
      isBlue
    };
    
    projectiles.push(projectileObj);
    projectilesContainer.appendChild(fireball);
    fireSound.currentTime = 0;
    fireSound.play();
  }

  function updateGame() {
    if (!gameActive) return;

    // Update player position with increased speed
    const moveSpeed = 12;
    if (keys.ArrowLeft) {
      playerX = Math.max(0, playerX - moveSpeed);
      player.classList.add('facing-left');
    }
    if (keys.ArrowRight) {
      playerX = Math.min(window.innerWidth - 60, playerX + moveSpeed);
      player.classList.remove('facing-left');
    }
    if (keys.ArrowUp) playerY = Math.max(0, playerY - moveSpeed);
    if (keys.ArrowDown) playerY = Math.min(window.innerHeight - 60, playerY + moveSpeed);
    
    player.style.left = playerX + 'px';
    player.style.top = playerY + 'px';

    // Update projectiles
    projectiles.forEach((projectile, index) => {
      projectile.x += projectile.speedX;
      projectile.y += projectile.speedY;
      projectile.element.style.left = projectile.x + 'px';
      projectile.element.style.top = projectile.y + 'px';
      
      if (projectile.x < -30 || projectile.x > window.innerWidth + 30) {
        projectile.element.remove();
        projectiles.splice(index, 1);
      }
    });

    // Update hearts
    hearts.forEach((heart, index) => {
      heart.y += heart.speed;
      heart.element.style.top = heart.y + 'px';
      
      // Check collision with projectiles
      projectiles.forEach((projectile, pIndex) => {
        if (checkCollision(heart, projectile)) {
          score++;
          updateScore();
          showMessage();
          heartHitSound.currentTime = 0;
          heartHitSound.play();
          
          heart.element.remove();
          hearts.splice(index, 1);
          projectile.element.remove();
          projectiles.splice(pIndex, 1);
          
          if (score >= 20) {
            endGame(true);
            return;
          }
        }
      });
      
      if (heart.y > window.innerHeight) {
        heart.element.remove();
        hearts.splice(index, 1);
        lives--;
        updateLives();
        if (lives <= 0) {
          endGame(false);
          return;
        }
      }
    });

    // Update power-ups
    powerUps.forEach((powerUp, index) => {
      powerUp.y += powerUp.speed;
      powerUp.element.style.top = powerUp.y + 'px';
      
      // Check collision with projectiles
      projectiles.forEach((projectile, pIndex) => {
        if (checkCollision(powerUp, projectile)) {
          if (powerUp.isLifePowerUp) {
            if (lives < 3) {
              lives++;
              updateLives();
              showMessage("Extra life gained! ❤️");
              successSound.play();
            }
          } else {
            activatePowerUp();
          }
          powerUp.element.remove();
          powerUps.splice(index, 1);
          projectile.element.remove();
          projectiles.splice(pIndex, 1);
        }
      });
      
      if (powerUp.y > window.innerHeight) {
        powerUp.element.remove();
        powerUps.splice(index, 1);
      }
    });

    gameLoop = requestAnimationFrame(updateGame);
  }

  function checkCollision(obj1, obj2) {
    const rect1 = {
      x: obj1.x,
      y: obj1.y,
      width: 60,
      height: 60
    };
    
    const rect2 = {
      x: obj2.x,
      y: obj2.y,
      width: 30,
      height: 30
    };
    
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  function activatePowerUp() {
    powerUpActive = true;
    successSound.play();
    showMessage("Blue Fire Power-Up! Auto-fire activated! 💙🔥");
    
    // Start auto-firing
    autoFireInterval = setInterval(() => {
      if (gameActive && powerUpActive) {
        shootFireball(true);
      }
    }, powerUpFireRate);
    
    setTimeout(() => {
      powerUpActive = false;
      clearInterval(autoFireInterval);
      showMessage("Power-up ended! Back to regular fire! ❤️🔥");
    }, 2000);
  }

  // Event Listeners
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' && gameActive) {
      shootFireball(powerUpActive);
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
  });

  startBtn.addEventListener('click', startGame);
  
tutorialBtn.addEventListener('click', () => {
    tutorialSection.classList.add('hidden');
    startActualGame();
  });
  
  function startGame() {
    contentElem.classList.add('hidden');
    tutorialSection.classList.remove('hidden');
  }
  
  function startActualGame() {
    if (gameActive) return;
    
    // Reset game state
    lives = 3;
    baseSpeed = 1.5;
    difficultyMultiplier = 1;
    updateLives();
    
    // Load high score
    highScore = localStorage.getItem('valentineDragoHighScore') || 0;
    highScoreDisplay.textContent = highScore;
    
    // Clear any existing elements
    heartsContainer.innerHTML = '';
    powerUpsContainer.innerHTML = '';
    projectilesContainer.innerHTML = '';
    hearts = [];
    powerUps = [];
    projectiles = [];
    
    gameActive = true;
    score = 0;
    messageIndex = 0;
    numericScore.textContent = '0';
    updateScore();
    
    // Reset player position
    playerX = window.innerWidth / 2;
    playerY = window.innerHeight - 100;
    player.style.left = playerX + 'px';
    player.style.top = playerY + 'px';
    
    gameSection.classList.remove('hidden');
    background.style.backgroundImage = "url('gifs/sky-background.gif')";
    bgMusic.play();
    
    // Start spawning hearts immediately and regularly
    spawnHeart();
    heartSpawnInterval = setInterval(() => {
      if (gameActive) spawnHeart();
    }, 1500);
 // Spawn targets more frequently
    
    // Start spawning power-ups
    spawnPowerUp(); // Spawn first power-up immediately
    powerUpSpawnInterval = setInterval(() => {
      if (gameActive) {
        if (!powerUpActive) spawnPowerUp();
        if (Math.random() < 0.3 && lives < 3) spawnLifePowerUp();
      }
    }, 3000);
 // Spawn every 3 seconds when not active
    
    showMessage();
    gameLoop = requestAnimationFrame(updateGame);
  }

  function endGame(won) {
    gameActive = false;
    if (autoFireInterval) {
      clearInterval(autoFireInterval);
    }
    clearInterval(heartSpawnInterval);
    clearInterval(powerUpSpawnInterval);
    cancelAnimationFrame(gameLoop);
    
    if (won) {
      gameSection.classList.add('hidden');
      giftSection.classList.remove('hidden');
      background.style.backgroundImage = "url('gifs/love-dragons.gif')";
      successSound.play();
    } else {
      gameSection.classList.add('hidden');
      gameOverSection.classList.remove('hidden');
      background.style.backgroundImage = "url('gifs/love-dragons.gif')";
      
      gameOverSection.innerHTML = `
        <h2>Even though you lost...</h2>
        <p>You'll never lose me! I've waited 12 years for you ❤️</p>
        <button id="continue-btn">Continue</button>
      `;
      
      document.getElementById('continue-btn').addEventListener('click', () => {
        gameOverSection.classList.add('hidden');
        giftSection.classList.remove('hidden');
        background.style.backgroundImage = "url('gifs/love-dragons.gif')";
        successSound.play();
      });
    }
    
    // Clear game elements
    heartsContainer.innerHTML = '';
    powerUpsContainer.innerHTML = '';
    projectilesContainer.innerHTML = '';
    hearts = [];
    powerUps = [];
    projectiles = [];
  }
});
