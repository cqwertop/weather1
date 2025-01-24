const apiKey = 'e78f7858582d4cc38fe225627252101';

async function getWeather() {
    try {
        const location = document.getElementById('location').value;
        const apiUrl = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${location}`;

        console.log('Fetching data from:', apiUrl);
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);

        const data = await response.json();
        console.log('Received data:', data);

        const tempC = data.current.temp_c;
        const tempF = data.current.temp_f; // Fetch temperature in Fahrenheit

        document.getElementById('temperature').textContent = `Temperature: ${tempC}°C / ${tempF}°F`;
        document.getElementById('wind-speed').textContent = `Wind Speed: ${data.current.wind_kph} kph`;
        document.getElementById('humidity').textContent = `Humidity: ${data.current.humidity}%`;
        document.getElementById('weather-icon').src = data.current.condition.icon;
    } catch (error) {
        document.getElementById('temperature').textContent = 'Error fetching weather data';
        document.getElementById('wind-speed').textContent = '';
        document.getElementById('humidity').textContent = '';
        document.getElementById('weather-icon').src = 'image.jpg'; // Set to your local image if there's an error
        console.error('There has been a problem with your fetch operation:', error.message);
    }
}
