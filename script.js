const apiKey = window.WEATHER_API_KEY || "";
const form = document.getElementById("search-form");
const locationInput = document.getElementById("location");
const statusEl = document.getElementById("status");
const geoBtn = document.getElementById("geo-btn");
const unitButtons = document.querySelectorAll(".unit-btn");
const chips = document.querySelectorAll(".chip");

const currentSection = document.getElementById("current");
const forecastSection = document.getElementById("forecast");
const forecastGrid = document.getElementById("forecast-grid");
const alertsBox = document.getElementById("alerts");

const elements = {
    locationName: document.getElementById("location-name"),
    localTime: document.getElementById("local-time"),
    temperature: document.getElementById("temperature"),
    conditionText: document.getElementById("condition-text"),
    feelsLike: document.getElementById("feels-like"),
    windSpeed: document.getElementById("wind-speed"),
    humidity: document.getElementById("humidity"),
    uvIndex: document.getElementById("uv-index"),
    visibility: document.getElementById("visibility"),
    pressure: document.getElementById("pressure"),
    precip: document.getElementById("precip"),
    gusts: document.getElementById("gusts"),
    icon: document.getElementById("condition-icon"),
    updated: document.getElementById("last-updated")
};

let activeUnit = "metric";
let lastQuery = "";

const setStatus = (message, type = "") => {
    statusEl.textContent = message;
    statusEl.className = `status ${type}`.trim();
};

const formatTemp = (c, f) => {
    const value = activeUnit === "metric" ? Math.round(c) : Math.round(f);
    const unit = activeUnit === "metric" ? "C" : "F";
    return `${value}\u00B0${unit}`;
};

const formatSpeed = (kph, mph) => {
    const value = activeUnit === "metric" ? Math.round(kph) : Math.round(mph);
    const unit = activeUnit === "metric" ? "km/h" : "mph";
    return `${value} ${unit}`;
};

const formatDistance = (km, miles) => {
    const value = activeUnit === "metric" ? Math.round(km * 10) / 10 : Math.round(miles * 10) / 10;
    const unit = activeUnit === "metric" ? "km" : "mi";
    return `${value} ${unit}`;
};

const formatPrecip = (mm, inch) => {
    const value = activeUnit === "metric" ? mm : inch;
    const unit = activeUnit === "metric" ? "mm" : "in";
    return `${value} ${unit}`;
};

const formatPressure = (mb, inHg) => {
    const value = activeUnit === "metric" ? mb : inHg;
    const unit = activeUnit === "metric" ? "mb" : "inHg";
    return `${value} ${unit}`;
};

const normalizeIcon = (iconUrl) => {
    if (!iconUrl) return "";
    if (iconUrl.startsWith("//")) return `https:${iconUrl}`;
    return iconUrl;
};

const showResults = () => {
    currentSection.classList.remove("hidden");
    forecastSection.classList.remove("hidden");
};

const hideResults = () => {
    currentSection.classList.add("hidden");
    forecastSection.classList.add("hidden");
};

const renderAlerts = (alerts) => {
    if (!alerts || alerts.length === 0) {
        alertsBox.classList.add("hidden");
        alertsBox.innerHTML = "";
        return;
    }

    alertsBox.classList.remove("hidden");
    alertsBox.innerHTML = `
        <h4>Alerts</h4>
        ${alerts.map(alert => `<div>${alert.headline}</div>`).join("")}
    `;
};

const renderForecast = (forecastDays) => {
    forecastGrid.innerHTML = forecastDays.map(day => {
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
        const high = formatTemp(day.day.maxtemp_c, day.day.maxtemp_f);
        const low = formatTemp(day.day.mintemp_c, day.day.mintemp_f);
        const wind = formatSpeed(day.day.maxwind_kph, day.day.maxwind_mph);
        const chance = `${day.day.daily_chance_of_rain}% rain`;
        const icon = normalizeIcon(day.day.condition.icon);

        return `
            <article class="forecast-card">
                <h4>${dayName}</h4>
                <div class="forecast-meta">
                    <img src="${icon}" alt="${day.day.condition.text}">
                    <span>${day.day.condition.text}</span>
                </div>
                <div>High ${high} / Low ${low}</div>
                <div>${chance}</div>
                <div>Wind ${wind}</div>
            </article>
        `;
    }).join("");
};

const updateUnitsUI = () => {
    unitButtons.forEach(btn => {
        const isActive = btn.dataset.unit === activeUnit;
        btn.classList.toggle("is-active", isActive);
        btn.setAttribute("aria-pressed", String(isActive));
    });
};

const updateTheme = (isDay) => {
    document.body.dataset.theme = isDay ? "day" : "night";
};

const updateUI = (data) => {
    const locationLabel = `${data.location.name}, ${data.location.region || data.location.country}`;
    elements.locationName.textContent = locationLabel;
    elements.localTime.textContent = `Local time: ${data.location.localtime}`;
    elements.temperature.textContent = formatTemp(data.current.temp_c, data.current.temp_f);
    elements.conditionText.textContent = data.current.condition.text;
    elements.feelsLike.textContent = formatTemp(data.current.feelslike_c, data.current.feelslike_f);
    elements.windSpeed.textContent = formatSpeed(data.current.wind_kph, data.current.wind_mph);
    elements.humidity.textContent = `${data.current.humidity}%`;
    elements.uvIndex.textContent = data.current.uv;
    elements.visibility.textContent = formatDistance(data.current.vis_km, data.current.vis_miles);
    elements.pressure.textContent = formatPressure(data.current.pressure_mb, data.current.pressure_in);
    elements.precip.textContent = formatPrecip(data.current.precip_mm, data.current.precip_in);
    elements.gusts.textContent = formatSpeed(data.current.gust_kph, data.current.gust_mph);
    elements.icon.src = normalizeIcon(data.current.condition.icon);
    elements.icon.alt = data.current.condition.text;
    elements.updated.textContent = `Last updated: ${data.current.last_updated}`;

    updateTheme(data.current.is_day === 1);
    renderAlerts(data.alerts?.alert || []);
    renderForecast(data.forecast.forecastday);
};

const fetchWeather = async (query) => {
    if (!apiKey) {
        setStatus("Missing API key. Add it to secret.js.", "error");
        return;
    }

    const trimmed = query.trim();
    if (!trimmed) {
        setStatus("Enter a city, ZIP, or place to get the weather.", "error");
        hideResults();
        return;
    }

    setStatus("Loading weather data...", "");
    hideResults();

    const apiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(trimmed)}&days=3&aqi=yes&alerts=yes`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error.message);
        }

        updateUI(data);
        lastQuery = trimmed;
        showResults();
        setStatus(`Showing results for ${data.location.name}.`, "success");
    } catch (error) {
        setStatus(`Unable to load weather data: ${error.message}`, "error");
        hideResults();
    }
};

form.addEventListener("submit", (event) => {
    event.preventDefault();
    fetchWeather(locationInput.value);
});

unitButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        activeUnit = btn.dataset.unit;
        updateUnitsUI();
        if (lastQuery) {
            fetchWeather(lastQuery);
        }
    });
});

chips.forEach(chip => {
    chip.addEventListener("click", () => {
        locationInput.value = chip.dataset.query;
        fetchWeather(chip.dataset.query);
    });
});

geoBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
        setStatus("Geolocation is not supported in this browser.", "error");
        return;
    }

    setStatus("Requesting location access...", "");
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const coords = `${position.coords.latitude},${position.coords.longitude}`;
            fetchWeather(coords);
        },
        (error) => {
            setStatus(`Location access denied: ${error.message}`, "error");
        },
        { timeout: 10000 }
    );
});

updateUnitsUI();
