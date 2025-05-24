window.onload = function () {
  // Impostazioni Canvas e contesto
  var canvas = document.getElementById("gameCanvas");
  var ctx = canvas.getContext("2d");

  // Impostazioni delle racchette
  var paddleWidth = 10;
  var paddleHeight = 80;
  var leftPaddle = { x: 10, y: canvas.height / 2 - paddleHeight / 2 };
  var rightPaddle = { x: canvas.width - 20, y: canvas.height / 2 - paddleHeight / 2 };

  // Impostazioni della palla
  var ball = { 
    x: canvas.width / 2, 
    y: canvas.height / 2, 
    radius: 8, 
    dx: 4, 
    dy: 3 
  };

  // Punteggi e condizione di vittoria
  var leftScore = 0;
  var rightScore = 0;
  var winningScore = 5;

  function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    // Invertiamo la direzione della palla
    ball.dx = -ball.dx;
    // Piccola variazione casuale
    ball.dy = 3 * (Math.random() > 0.5 ? 1 : -1);
  }

  function draw() {
    // Puliamo il canvas
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Disegniamo le racchette
    ctx.fillStyle = "#fff";
    ctx.fillRect(leftPaddle.x, leftPaddle.y, paddleWidth, paddleHeight);
    ctx.fillRect(rightPaddle.x, rightPaddle.y, paddleWidth, paddleHeight);

    // Disegniamo la palla
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    // Visualizziamo i punteggi
    ctx.font = "20px Arial";
    ctx.fillText(leftScore, canvas.width / 4, 30);
    ctx.fillText(rightScore, canvas.width * 3 / 4, 30);
  }

  function update() {
    // Aggiorniamo la posizione della palla
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Rimbalzo sulle pareti superiore e inferiore
    if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
      ball.dy = -ball.dy;
    }

    // Collisione con la racchetta sinistra
    if (ball.x - ball.radius < leftPaddle.x + paddleWidth) {
      if (ball.y > leftPaddle.y && ball.y < leftPaddle.y + paddleHeight) {
        ball.dx = -ball.dx;
        ball.dy = 3 * ((ball.y - (leftPaddle.y + paddleHeight / 2)) / (paddleHeight / 2));
      }
    }

    // Collisione con la racchetta destra
    if (ball.x + ball.radius > rightPaddle.x) {
      if (ball.y > rightPaddle.y && ball.y < rightPaddle.y + paddleHeight) {
        ball.dx = -ball.dx;
        ball.dy = 3 * ((ball.y - (rightPaddle.y + paddleHeight / 2)) / (paddleHeight / 2));
      }
    }

    // Controllo dei margini per assegnare il punto
    if (ball.x < 0) {
      // Punto per il giocatore destro
      rightScore++;
      if (rightScore >= winningScore) {
        gameOver("Player2");
      }
      resetBall();
    }

    if (ball.x > canvas.width) {
      // Punto per il giocatore sinistro
      leftScore++;
      if (leftScore >= winningScore) {
        gameOver("Player1");
      }
      resetBall();
    }
  }

  function gameOver(winner) {
    alert(winner + " ha vinto la partita!");
    // Registra il vincitore chiamando lo script PHP per aggiornare record.json
    updateRecord(winner);
    // Resettiamo i punteggi
    leftScore = 0;
    rightScore = 0;
  }

  function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }

  // Gestione dei controlli touch (smartphone) e mouse (desktop)
  canvas.addEventListener("touchmove", function (e) {
    e.preventDefault();
    var touches = e.touches;
    for (var i = 0; i < touches.length; i++) {
      var touch = touches[i];
      var rect = canvas.getBoundingClientRect();
      var x = touch.clientX - rect.left;
      var y = touch.clientY - rect.top;
      if (x < canvas.width / 2) {
        leftPaddle.y = y - paddleHeight / 2;
        leftPaddle.y = Math.max(leftPaddle.y, 0);
        leftPaddle.y = Math.min(leftPaddle.y, canvas.height - paddleHeight);
      } else {
        rightPaddle.y = y - paddleHeight / 2;
        rightPaddle.y = Math.max(rightPaddle.y, 0);
        rightPaddle.y = Math.min(rightPaddle.y, canvas.height - paddleHeight);
      }
    }
  }, { passive: false });

  canvas.addEventListener("mousemove", function (e) {
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    if (x < canvas.width / 2) {
      leftPaddle.y = y - paddleHeight / 2;
      leftPaddle.y = Math.max(leftPaddle.y, 0);
      leftPaddle.y = Math.min(leftPaddle.y, canvas.height - paddleHeight);
    } else {
      rightPaddle.y = y - paddleHeight / 2;
      rightPaddle.y = Math.max(rightPaddle.y, 0);
      rightPaddle.y = Math.min(rightPaddle.y, canvas.height - paddleHeight);
    }
  });

  // Funzione per aggiornare il record tramite chiamata AJAX (fetch) a save.php
  function updateRecord(winner) {
    fetch("save.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ winner: winner, date: new Date().toISOString() })
    })
      .then(response => response.json())
      .then(data => {
        console.log("Record aggiornato:", data);
      })
      .catch(error => {
        console.error("Errore:", error);
      });
  }

  // Carica e mostra i record quando si preme il pulsante Record
  document.getElementById("recordButton").addEventListener("click", loadRecords);

  function loadRecords() {
    fetch("record.json")
      .then(response => response.json())
      .then(data => {
        var content = "";
        if (data.length === 0) {
          content = "<p>Nessun record disponibile.</p>";
        } else {
          content = "<ul class='list-group'>";
          data.forEach(item => {
            content += "<li class='list-group-item bg-dark text-white'>" + new Date(item.date).toLocaleString() + " - " + item.winner + "</li>";
          });
          content += "</ul>";
        }
        document.getElementById("recordContent").innerHTML = content;
        $("#recordModal").modal("show");
      })
      .catch(error => {
        console.error("Errore nel caricamento dei record:", error);
        document.getElementById("recordContent").innerHTML = "<p>Errore nel caricamento dei record.</p>";
        $("#recordModal").modal("show");
      });
  }

  // Avvio del ciclo di gioco
  gameLoop();
};
