let rawData;
let data = { games: [] };
const app = document.getElementById("app");

// Load the runs.json file
fetch("https://raw.githubusercontent.com/PWebGames/leaderboards/refs/heads/main/runs.json")
  .then(res => res.json())
  .then(json => {
    rawData = json.runs;
    buildHierarchy();
    showGames();
  })
  .catch(err => {
    console.error("Failed to load runs.json:", err);
    app.innerHTML = "<p>Failed to load leaderboard data.</p>";
  });

// Build game → section → category hierarchy from flat runs
function buildHierarchy() {
  rawData.forEach(run => {
    // Find or create game
    let game = data.games.find(g => g.name === run.game);
    if (!game) {
      game = { id: run.game.toLowerCase().replace(/\s+/g, "-"), name: run.game, sections: [] };
      data.games.push(game);
    }

    // Find or create section
    let section = game.sections.find(s => s.name === run.section);
    if (!section) {
      section = { id: run.section.toLowerCase().replace(/\s+/g, "-"), name: run.section, categories: [] };
      game.sections.push(section);
    }

    // Find or create category
    let category = section.categories.find(c => c.name === run.category);
    if (!category) {
      category = { id: run.category.toLowerCase().replace(/\s+/g, "-"), name: run.category, runs: [] };
      section.categories.push(category);
    }

    // Add the run
    category.runs.push({
      runner: run.runner,
      time: run.time,
      video: run.video
    });
  });
}

// --------------------
// UI Functions
// --------------------

function showGames() {
  const slider = document.getElementById("game-slider");
  slider.innerHTML = ""; // clear existing cards

  data.games.forEach(game => {
    const card = document.createElement("div");
    card.className = "card";
    card.textContent = game.name;
    card.onclick = () => showSections(game);
    slider.appendChild(card);
  });
}

function enableSliderScrolling() {
  const slider = document.getElementById("game-slider");
  if (!slider) return;

  let isDown = false;
  let startX;
  let scrollLeft;

  // Mouse drag
  slider.addEventListener("mousedown", (e) => {
    isDown = true;
    slider.classList.add("active");
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
  });

  slider.addEventListener("mouseleave", () => {
    isDown = false;
    slider.classList.remove("active");
  });

  slider.addEventListener("mouseup", () => {
    isDown = false;
    slider.classList.remove("active");
  });

  slider.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 2; // scroll speed
    slider.scrollLeft = scrollLeft - walk;
  });

  // Horizontal scroll with mouse wheel
  slider.addEventListener("wheel", (e) => {
    e.preventDefault();
    slider.scrollLeft += e.deltaY;
  });
}

// Call this after populating the slider
enableSliderScrolling();


// Show sections of a game
function showSections(game) {
  app.innerHTML = `
    <button class="back" onclick="showGames()">← Back</button>
    <h2>${game.name} - Sections</h2>
  `;

  const grid = document.createElement("div");
  grid.className = "grid";

  game.sections.forEach(section => {
    const card = document.createElement("div");
    card.className = "card";
    card.textContent = section.name;
    card.onclick = () => showCategories(game, section);
    grid.appendChild(card);
  });

  app.appendChild(grid);
}

// Show categories of a section
function showCategories(game, section) {
  app.innerHTML = `
    <button class="back" onclick="showSections(data.games.find(g=>g.id==='${game.id}'))">← Back</button>
    <h2>${game.name} → ${section.name} - Categories</h2>
  `;

  const grid = document.createElement("div");
  grid.className = "grid";

  section.categories.forEach(category => {
    const card = document.createElement("div");
    card.className = "card";
    card.textContent = category.name;
    card.onclick = () => showRuns(game, section, category);
    grid.appendChild(card);
  });

  app.appendChild(grid);
}

// Show runs of a category
function showRuns(game, section, category) {
  app.innerHTML = `
    <button class="back" onclick="showCategories(data.games.find(g=>g.id==='${game.id}'), data.games.find(g=>g.id==='${game.id}').sections.find(s=>s.id==='${section.id}'))">← Back</button>
    <h2>${game.name} → ${section.name} → ${category.name} - Runs</h2>
  `;

  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th>Runner</th>
        <th>Time</th>
        <th>Video Link</th>
      </tr>
    </thead>
    <tbody>
      ${category.runs.map(run => `
        <tr>
          <td>${run.runner}</td>
          <td>${run.time}</td>
          <td>${run.video ? `<a href="${run.video}" target="_blank">Run</a>` : ""}</td>
        </tr>
      `).join("")}
    </tbody>
  `;

  app.appendChild(table);
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(reg => console.log("Service Worker registered.", reg))
      .catch(err => console.log("Service Worker failed:", err));
  });
}
