const apiKey = "88ad0db7dd93d2771fe58a0cabe2bf4d";

let selectedLat = null;
let selectedLon = null;

const modeBtn = document.getElementById("modeBtn");
const cityInput = document.getElementById("city");
const suggestions = document.getElementById("suggestions");

//  Toggle Mode
modeBtn.onclick = () => {
  document.body.classList.toggle("dark-mode");
  document.body.classList.toggle("light-mode");

  if (document.body.classList.contains("dark-mode")) {
    modeBtn.innerText = "☀️";
    localStorage.setItem("mode", "dark");
  } else {
    modeBtn.innerText = "🌙";
    localStorage.setItem("mode", "light");
  }
};

//  Load Mode
window.onload = () => {
  const mode = localStorage.getItem("mode");
  if (mode === "dark") {
    document.body.classList.add("dark-mode");
    document.body.classList.remove("light-mode");
    modeBtn.innerText = "☀️";
  }
};

//  Real Time Clock
setInterval(() => {
  document.getElementById("clock").innerText =
    new Date().toLocaleTimeString();
}, 1000);

// Enter key
cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") getWeather();
});

// Autocomplete (Lat/Lon accurate)
cityInput.addEventListener("input", async function () {

  selectedLat = null;
  selectedLon = null;

  const query = this.value;

  if (query.length < 2) {
    suggestions.innerHTML = "";
    return;
  }

  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  suggestions.innerHTML = "";

  data.forEach(city => {
    const li = document.createElement("li");

    li.innerHTML = `${city.name}, ${city.state || ""}, ${city.country}`
      .replace(new RegExp(query, "gi"), match => `<b>${match}</b>`);

    li.onclick = () => {
      cityInput.value = city.name;
      selectedLat = city.lat;
      selectedLon = city.lon;
      suggestions.innerHTML = "";
    };

    suggestions.appendChild(li);
  });
});

//  Hide dropdown when clicking outside
document.addEventListener("click", (e) => {
  if (!cityInput.contains(e.target) && !suggestions.contains(e.target)) {
    suggestions.innerHTML = "";
  }
});

//  GPS Weather
function getLocationWeather() {
  navigator.geolocation.getCurrentPosition(pos => {
    fetchWeather(pos.coords.latitude, pos.coords.longitude);
  });
}

// Search
function getWeather() {
  if (selectedLat && selectedLon) {
    fetchWeather(selectedLat, selectedLon);
  } else {
    fetchWeather(cityInput.value);
  }
}

// Fetch Weather
async function fetchWeather(cityOrLat, lon = null) {

  let weatherUrl, forecastUrl;

  if (lon !== null) {
    weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${cityOrLat}&lon=${lon}&appid=${apiKey}&units=metric`;
    forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${cityOrLat}&lon=${lon}&appid=${apiKey}&units=metric`;
  } else {
    weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${cityOrLat}&appid=${apiKey}&units=metric`;
    forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${cityOrLat}&appid=${apiKey}&units=metric`;
  }

  document.getElementById("weatherResult").innerHTML = "Loading... ⏳";

  const [wRes, fRes] = await Promise.all([
    fetch(weatherUrl),
    fetch(forecastUrl)
  ]);

  if (!wRes.ok) {
    document.getElementById("weatherResult").innerHTML = "City not found 😢";
    return;
  }

  const w = await wRes.json();
  const f = await fRes.json();

  displayWeather(w, f);
}

// Display UI
function displayWeather(w, f) {

  document.body.classList.remove("sunny","rainy","cloudy");

  const type = w.weather[0].main.toLowerCase();
  if (type.includes("clear")) document.body.classList.add("sunny");
  else if (type.includes("rain")) document.body.classList.add("rainy");
  else if (type.includes("cloud")) document.body.classList.add("cloudy");

  const sunrise = new Date(w.sys.sunrise * 1000).toLocaleTimeString();
  const sunset = new Date(w.sys.sunset * 1000).toLocaleTimeString();

  let html = `
    <h2>${w.name}</h2>
    <img src="https://openweathermap.org/img/wn/${w.weather[0].icon}@2x.png" class="icon"/>
    <p class="temp">${w.main.temp}°C</p>
    <p>${w.weather[0].main}</p>
    <p>💧 ${w.main.humidity}%</p>
    <p>🌡 Feels Like: ${w.main.feels_like}°C</p>
    <p>🌬 ${w.wind.speed} m/s</p>
    <p>🌅 ${sunrise}</p>
    <p>🌇 ${sunset}</p>
  `;

  html += `<h3>Forecast</h3><div class="forecast">`;

  f.list.slice(0,5).forEach(item => {
    html += `
      <div class="forecast-card">
        <p>${item.dt_txt.split(" ")[1]}</p>
        <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png">
        <p>${item.main.temp}°C</p>
      </div>
    `;
  });

  html += `</div>`;

  document.getElementById("weatherResult").innerHTML = html;
}