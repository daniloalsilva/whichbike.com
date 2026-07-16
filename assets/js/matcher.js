document.addEventListener("DOMContentLoaded", function () {
  // --- UI Elements ---
  const heightSlider = document.getElementById("rider-height");
  const inseamSlider = document.getElementById("rider-inseam");
  const valHeight = document.getElementById("val-height");
  const valInseam = document.getElementById("val-inseam");

  const step1 = document.getElementById("quiz-step-1");
  const step2 = document.getElementById("quiz-step-2");
  const step3 = document.getElementById("quiz-step-3");
  const resultsWrapper = document.getElementById("results-wrapper");

  const btnNext1 = document.getElementById("btn-next-1");
  const btnNext2 = document.getElementById("btn-next-2");
  const btnBack2 = document.getElementById("btn-back-2");
  const btnBack3 = document.getElementById("btn-back-3");
  const btnSubmit = document.getElementById("btn-submit");
  const btnReset = document.getElementById("btn-reset");

  const badge1 = document.getElementById("badge-step-1");
  const badge2 = document.getElementById("badge-step-2");
  const badge3 = document.getElementById("badge-step-3");
  const stepTitle = document.getElementById("step-title");

  // --- Dynamic Slider Updates ---
  heightSlider.addEventListener("input", function () {
    valHeight.textContent = heightSlider.value;
  });

  inseamSlider.addEventListener("input", function () {
    valInseam.textContent = inseamSlider.value;
  });

  const budgetSlider = document.getElementById("max-budget");
  const valBudget = document.getElementById("val-budget");

  budgetSlider.addEventListener("input", function () {
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(budgetSlider.value);
    valBudget.textContent = formatted;
  });

  // --- Interactive Radio Cards ---
  const radioLabels = document.querySelectorAll(".radio-card");
  radioLabels.forEach(label => {
    label.addEventListener("click", function () {
      // Find parent container or siblings of same name
      const radioInput = label.querySelector("input[type='radio']");
      if (radioInput) {
        const groupName = radioInput.getAttribute("name");
        // Deselect others in the same radio group
        const groupLabels = document.querySelectorAll(`input[name='${groupName}']`);
        groupLabels.forEach(input => {
          input.closest(".radio-card").classList.remove("selected");
        });
        // Select this one
        radioInput.checked = true;
        label.classList.add("selected");
      }
    });
  });

  // --- Form Navigation ---
  btnNext1.addEventListener("click", function () {
    step1.classList.add("hidden");
    step2.classList.remove("hidden");
    badge1.classList.remove("active");
    badge2.classList.add("active");
    stepTitle.textContent = "Passo 2: Experiência & Pilotagem (Segurança)";
  });

  btnBack2.addEventListener("click", function () {
    step2.classList.add("hidden");
    step1.classList.remove("hidden");
    badge2.classList.remove("active");
    badge1.classList.add("active");
    stepTitle.textContent = "Passo 1: Suas Dimensões Físicas (Ergonomia)";
  });

  btnNext2.addEventListener("click", function () {
    step2.classList.add("hidden");
    step3.classList.remove("hidden");
    badge2.classList.remove("active");
    badge3.classList.add("active");
    stepTitle.textContent = "Passo 3: Uso & Terreno (Rodagem)";
  });

  btnBack3.addEventListener("click", function () {
    step3.classList.add("hidden");
    step2.classList.remove("hidden");
    badge3.classList.remove("active");
    badge2.classList.add("active");
    stepTitle.textContent = "Passo 2: Experiência & Pilotagem (Segurança)";
  });

  btnSubmit.addEventListener("click", function () {
    calculateMatches();
  });

  btnReset.addEventListener("click", function () {
    resultsWrapper.classList.add("hidden");
    document.querySelector(".quiz-card").classList.remove("hidden");
    step3.classList.add("hidden");
    step1.classList.remove("hidden");
    badge3.classList.remove("active");
    badge1.classList.add("active");
    stepTitle.textContent = "Passo 1: Suas Dimensões Físicas (Ergonomia)";
  });

  // --- Matching Engine Algorithm ---
  function calculateMatches() {
    const height = parseFloat(heightSlider.value);
    const inseam = parseFloat(inseamSlider.value);
    const experience = document.querySelector("input[name='experience']:checked").value;
    const requireAbs = document.getElementById("require-abs").checked;
    const preferLightweight = document.getElementById("prefer-lightweight").checked;
    const roadType = document.querySelector("input[name='road-type']:checked").value;
    const location = document.querySelector("input[name='location']:checked").value;
    const maxBudget = parseFloat(document.getElementById("max-budget").value);
    const strictBudget = document.getElementById("strict-budget").checked;
    const condition = document.querySelector("input[name='bike-condition']:checked").value;

    // Load static database seeded from Jekyll
    const dataElement = document.getElementById("motorcycles-json");
    if (!dataElement) return;
    let motorcycles = JSON.parse(dataElement.textContent);

    // Filter by conservation state
    if (condition === "new") {
      motorcycles = motorcycles.filter(b => b.is_used !== true);
    } else if (condition === "used") {
      motorcycles = motorcycles.filter(b => b.is_used === true);
    }

    let scoredBikes = motorcycles.map(bike => {
      let scores = {
        ergonomics: 100,
        safety: 100,
        weight: 100,
        environment: 100
      };
      let warnings = [];
      let details = [];

      // 1. PHYSICAL FIT (ERGONOMICS)
      // Seat width profile modifier
      let seatWidthMultiplier = 1.0;
      if (bike.seat_width_profile === "medium-narrow") seatWidthMultiplier = 1.01;
      else if (bike.seat_width_profile === "medium") seatWidthMultiplier = 1.02;
      else if (bike.seat_width_profile === "medium-wide") seatWidthMultiplier = 1.04;
      else if (bike.seat_width_profile === "wide") seatWidthMultiplier = 1.06;

      const effectiveSeatHeightCm = (bike.seat_height_mm * seatWidthMultiplier) / 10;
      const reachDelta = inseam - effectiveSeatHeightCm;

      if (reachDelta >= 2.0) {
        scores.ergonomics = 100;
        details.push("Alcance perfeito: Você apoia os dois pés planos no chão com facilidade.");
      } else if (reachDelta >= -3.0) {
        scores.ergonomics = 85;
        details.push("Alcance adequado: Você apoia as pontas dos pés ou um pé plano.");
      } else if (reachDelta >= -7.0) {
        scores.ergonomics = 55;
        if (experience === "beginner") {
          scores.ergonomics -= 15; // Beginner penalty for tall seats
          warnings.push("Altura desafiadora para iniciantes: Exige atenção em paradas.");
        } else {
          details.push("Alcance desafiador: Requer apoio lateral em semáforos.");
        }
      } else {
        scores.ergonomics = 20;
        warnings.push("Muito alta: Risco elevado de quedas por falta de apoio no solo.");
      }

      // 2. WEIGHT / LIFTING PILLAR
      if (preferLightweight || experience === "beginner") {
        if (bike.wet_weight_kg <= 125) {
          scores.weight = 100;
          details.push("Muito leve: Fácil de manobrar e levantar em caso de queda.");
        } else if (bike.wet_weight_kg <= 155) {
          scores.weight = 80;
          details.push("Peso moderado: Controle confortável em manobras paradas.");
        } else if (bike.wet_weight_kg <= 180) {
          scores.weight = 50;
          warnings.push("Moto pesada: Exige força extra para segurar parada.");
        } else {
          scores.weight = 20;
          warnings.push("Muito pesada: Difícil de levantar sem ajuda.");
        }
      } else {
        // Experience reduces weight concern
        if (bike.wet_weight_kg <= 160) scores.weight = 100;
        else if (bike.wet_weight_kg <= 195) scores.weight = 85;
        else scores.weight = 60;
      }

      // 3. EXPERIENCE & SAFETY PILLAR
      if (requireAbs && !bike.has_abs) {
        scores.safety -= 40;
        warnings.push("Sem Freio ABS: Apenas CBS ou freios simples (desaconselhado sob chuva).");
      }

      if (experience === "beginner") {
        if (bike.power_hp > 35) {
          scores.safety -= 50;
          warnings.push("Aceleração excessiva: Potência acima de 35cv é arriscada para novatos.");
        } else if (bike.power_hp > 22) {
          scores.safety -= 15;
          details.push("Potência intermediária: Exige controle cuidadoso do acelerador.");
        } else {
          details.push("Potência ideal: Curva de entrega linear e segura.");
        }
      } else if (experience === "intermediate") {
        if (bike.power_hp > 45) {
          scores.safety -= 20;
          warnings.push("Aceleração forte: Requer experiência secundária.");
        }
      }

      // 4. ENVIRONMENT & LOCAL CONSTRAINTS
      // Road Quality
      if (roadType === "rough") {
        if (bike.category === "Trail" || bike.category === "Adventure") {
          scores.environment = 100;
          details.push("Suspensão perfeita: Curso longo absorve lombadas e buracos.");
        } else if (bike.category === "Scooter" || bike.category === "CUB") {
          scores.environment = 50;
          warnings.push("Vias ruins: Rodas menores e suspensão curta transmitem muitos impactos.");
        } else {
          scores.environment = 70;
          details.push("Vias ruins: Suspensão convencional de rua sofrerá desgaste acelerado.");
        }
      } else {
        // Smooth asphalt
        scores.environment = 100;
      }

      // Location & Theft/Parts Network
      if (location === "capital") {
        if (bike.theft_risk_index === "critical") {
          scores.environment -= 20;
          warnings.push("Risco Crítico de Roubo: Seguro Suhai ou similar essencial, valor elevado.");
        } else if (bike.theft_risk_index === "high") {
          scores.environment -= 10;
          warnings.push("Risco Alto de Roubo: Recomendável cotação prévia de rastreador.");
        }
      } else {
        // Interior (Rural/Cities) -> Focus on parts
        if (bike.parts_network_index <= 4) {
          scores.environment -= 30;
          warnings.push("Rede escassa no interior: Dificuldade em achar peças e mecânico credenciado.");
        } else if (bike.parts_network_index <= 7) {
          scores.environment -= 10;
          details.push("Rede moderada: Algumas peças requerem envio online.");
        } else {
          details.push("Suporte total: Peças e oficinas disponíveis em qualquer cidade.");
        }
      }

      // Calculate composite weighted compatibility score
      let compositeScore = Math.round(
        scores.ergonomics * 0.35 +
        scores.safety * 0.25 +
        scores.weight * 0.20 +
        scores.environment * 0.20
      );

      // Budget logic
      let isOverBudget = false;
      if (bike.fipe_price_brl > maxBudget) {
        isOverBudget = true;
        if (!strictBudget) {
          compositeScore = Math.max(0, compositeScore - 25);
          const formattedFipe = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(bike.fipe_price_brl);
          warnings.push(`Excede o orçamento máximo (FIPE: ${formattedFipe}).`);
        }
      }

      // Clamp score
      compositeScore = Math.max(0, Math.min(100, compositeScore));

      return {
        bike,
        score: compositeScore,
        warnings,
        details,
        isOverBudget
      };
    });

    // Filter out strictly over budget if selected
    if (strictBudget) {
      scoredBikes = scoredBikes.filter(item => !item.isOverBudget);
    }

    // Sort by compatibility descending
    scoredBikes.sort((a, b) => b.score - a.score);

    // Render results list
    renderResults(scoredBikes);
  }

  function renderResults(scoredBikes) {
    const resultsList = document.getElementById("results-list");
    resultsList.innerHTML = "";

    scoredBikes.forEach(item => {
      const bike = item.bike;
      const score = item.score;
      
      const card = document.createElement("div");
      card.className = "result-card";
      
      // Determine badge color
      let badgeStyle = "color: var(--accent-success);";
      if (score < 50) {
        badgeStyle = "color: #ff4a86; border-color: rgba(254, 0, 114, 0.3);";
      } else if (score < 80) {
        badgeStyle = "color: #ffb700; border-color: rgba(255, 183, 0, 0.3);";
      }

      // Format currency
      const formattedPrice = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0
      }).format(bike.fipe_price_brl);

      // Card Header
      let headerHTML = `
        <div class="result-card-header">
          <div>
            <div class="bike-brand">${bike.brand}</div>
            <div class="bike-model">
              ${bike.model}
              <small style="font-size: 0.85rem; color: #a1a9bb; font-weight: normal; margin-left: 5px;">
                (${bike.is_used ? bike.year : 'Zero Km'})
              </small>
            </div>
          </div>
          <span class="match-percentage-badge" style="${badgeStyle}">${score}% Match</span>
        </div>
      `;

      // Specs Row
      let specsHTML = `
        <div class="specs-row">
          <div class="spec-block">
            <div class="spec-block-val">${bike.seat_height_mm} mm</div>
            <div class="spec-block-lbl">Banco</div>
          </div>
          <div class="spec-block">
            <div class="spec-block-val">${bike.wet_weight_kg} kg</div>
            <div class="spec-block-lbl">Peso</div>
          </div>
          <div class="spec-block">
            <div class="spec-block-val">${bike.power_hp} cv</div>
            <div class="spec-block-lbl">Potência</div>
          </div>
        </div>
      `;

      // Warnings & Details
      let alertsHTML = "";
      if (item.warnings.length > 0) {
        alertsHTML = `
          <div class="card-verdict-alert warning">
            <strong>Pontos de Atenção:</strong><br>
            ${item.warnings.map(w => `• ${w}`).join("<br>")}
          </div>
        `;
      } else {
        alertsHTML = `
          <div class="card-verdict-alert perfect">
            ✓ Encaixe excelente com o seu perfil de pilotagem!
          </div>
        `;
      }

      let detailsHTML = `
        <ul class="suitability-details">
          ${item.details.map(d => `<li><span class="bullet-ok">✓</span> ${d}</li>`).join("")}
        </ul>
      `;

      // Body assembly
      let bodyHTML = `
        <div class="result-card-body">
          ${specsHTML}
          ${alertsHTML}
          ${detailsHTML}
          <div class="price-box">
            <span class="price-label">Média FIPE:</span>
            <span class="price-value">${formattedPrice}</span>
          </div>
        </div>
      `;

      card.innerHTML = headerHTML + bodyHTML;
      resultsList.appendChild(card);
    });

    // Toggle Visibility
    document.querySelector(".quiz-card").classList.add("hidden");
    resultsWrapper.classList.remove("hidden");
    resultsWrapper.scrollIntoView({ behavior: "smooth" });
  }
});
