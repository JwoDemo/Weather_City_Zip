// API key should be stored securely and not exposed in client-side code
// For development purposes, you can use your API key here
const API_KEY = '235a790f84c436789bb93aa5f39b24dd'; // Replace with your actual API key

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const weatherContainer = document.getElementById('weatherInfo');
    const clothingContainer = document.getElementById('clothingInfo');
    const hourlyForecastContainer = document.getElementById('hourlyForecast');
    const zipSearch = document.getElementById('zipSearch');
    const citySearch = document.getElementById('citySearch');
    const zipToggle = document.getElementById('zipToggle');
    const cityToggle = document.getElementById('cityToggle');
    const zipSearchBtn = document.getElementById('zipSearchBtn');
    const citySearchBtn = document.getElementById('citySearchBtn');

    function toggleSearchType(type) {
        const toggleButtons = document.querySelectorAll('.toggle-btn');
        toggleButtons.forEach(btn => btn.classList.remove('active'));
        
        if (type === 'zip') {
            zipSearch.style.display = 'flex';
            citySearch.style.display = 'none';
            zipToggle.classList.add('active');
            console.log('Switched to ZIP search');
        } else {
            zipSearch.style.display = 'none';
            citySearch.style.display = 'flex';
            cityToggle.classList.add('active');
            console.log('Switched to city search');
        }
    }

    // Add event listeners for toggle buttons
    zipToggle.addEventListener('click', () => toggleSearchType('zip'));
    cityToggle.addEventListener('click', () => toggleSearchType('city'));

    // Add event listeners for search buttons
    zipSearchBtn.addEventListener('click', getWeather);
    citySearchBtn.addEventListener('click', getWeather);

    async function getWeather() {
        console.log('getWeather function called');
        let location;
        let searchType = zipSearch.style.display === 'flex' ? 'zip' : 'city';
        console.log('Search type:', searchType);
        console.log('zipSearch display:', zipSearch.style.display);
        console.log('citySearch display:', citySearch.style.display);

        if (searchType === 'zip') {
            const zipCode = document.getElementById('zipCode').value;
            console.log('ZIP code entered:', zipCode);
            
            // Enhanced ZIP code validation
            if (!zipCode) {
                alert('[Input Validation] Please enter a ZIP code');
                return;
            }
            
            if (!/^\d{5}$/.test(zipCode)) {
                alert('[Input Validation] Please enter a valid 5-digit ZIP code');
                return;
            }

            // Check for obviously invalid ZIP codes
            if (zipCode === '00000') {
                alert('[Input Validation] 00000 is not a valid ZIP code');
                return;
            }

            location = zipCode;
        } else {
            const cityInput = document.getElementById('city').value.trim();
            const state = document.getElementById('state').value.trim().toUpperCase();

            // City validation
            if (!cityInput) {
                alert('[Input Validation] Please enter a city name');
                return;
            }

            if (cityInput.length < 2) {
                alert('[Input Validation] City name must be at least 2 characters long');
                return;
            }

            if (cityInput.length > 50) {
                alert('[Input Validation] City name is too long. Please enter a valid city name');
                return;
            }

            // Only allow letters, spaces, and hyphens
            if (!/^[A-Za-z\s-]+$/.test(cityInput)) {
                alert('[Input Validation] City name can only contain letters, spaces, and hyphens');
                return;
            }

            // State validation
            if (!state || state.length !== 2) {
                alert('[Input Validation] Please enter a valid 2-letter state code (e.g., NY)');
                return;
            }

            // Capitalize first letter of each word in city name
            const city = cityInput
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');

            location = `${city},${state},us`;
        }

        try {
            console.log('Making API call for location:', location);
            // Get current weather
            const currentWeatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?${searchType === 'zip' ? 'zip' : 'q'}=${location}&appid=${API_KEY}&units=imperial`);
            
            if (!currentWeatherResponse.ok) {
                if (currentWeatherResponse.status === 401) {
                    alert('[API Error] Invalid API key. Please check your API key configuration.');
                    return;
                }
                if (currentWeatherResponse.status === 404) {
                    alert('[Weather API] Location not found. Please check your input and try again.');
                    return;
                }
                throw new Error(`[API Error] HTTP error! status: ${currentWeatherResponse.status}`);
            }
            
            const currentWeatherData = await currentWeatherResponse.json();

            // Get 5-day forecast
            const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?${searchType === 'zip' ? 'zip' : 'q'}=${location}&appid=${API_KEY}&units=imperial`);
            const forecastData = await forecastResponse.json();

            displayWeather(currentWeatherData);
            displayHourlyForecast(forecastData);
            provideClothingRecommendations(currentWeatherData.main.temp, currentWeatherData.weather[0].main);
        } catch (error) {
            console.error('Error fetching weather:', error);
            alert('[Connection Error] Error fetching weather data. Please check your internet connection and try again.');
        }
    }

    function displayWeather(data) {
        const temp = Math.round(data.main.temp);
        const feelsLike = Math.round(data.main.feels_like);
        const description = data.weather[0].description;
        const humidity = data.main.humidity;
        const windSpeed = data.wind.speed;
        const iconCode = data.weather[0].icon;
        // Use 'n' suffix for night icons
        const isNight = iconCode.endsWith('n');
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

        weatherContainer.innerHTML = `
            <div class="weather-info">
                <div class="temperature-container">
                    <div class="weather-icon ${isNight ? 'night-icon' : ''}">
                        <img src="${iconUrl}" alt="${description}" title="${description}" class="weather-icon-img">
                    </div>
                    <div class="temperature-details">
                        <div class="temperature">${temp}°F</div>
                        <div class="feels-like">Feels like ${feelsLike}°F</div>
                    </div>
                </div>
                <div class="weather-description">${description}</div>
                <div>Humidity: ${humidity}%</div>
                <div>Wind Speed: ${windSpeed} mph</div>
            </div>
        `;
        weatherContainer.style.display = 'block';
    }

    function displayHourlyForecast(data) {
        // Get next 24 hours of forecast (3-hour intervals)
        const hourlyForecasts = data.list.slice(0, 8);
        
        const forecastHTML = hourlyForecasts.map(forecast => {
            const date = new Date(forecast.dt * 1000);
            const time = date.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
            const iconCode = forecast.weather[0].icon;
            const isNight = iconCode.endsWith('n');
            const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;
            
            return `
                <div class="hourly-item">
                    <div class="hourly-time">${time}</div>
                    <div class="hourly-icon ${isNight ? 'night-icon' : ''}">
                        <img src="${iconUrl}" alt="${forecast.weather[0].description}" title="${forecast.weather[0].description}" class="weather-icon-img">
                    </div>
                    <div class="hourly-temp">${Math.round(forecast.main.temp)}°F</div>
                    <div class="hourly-description">${forecast.weather[0].description}</div>
                </div>
            `;
        }).join('');

        hourlyForecastContainer.innerHTML = `
            <h3>24-Hour Forecast</h3>
            <div class="hourly-forecast">
                ${forecastHTML}
            </div>
        `;
        hourlyForecastContainer.style.display = 'block';
    }

    function provideClothingRecommendations(temp, weatherCondition) {
        let recommendations = [];

        // Temperature-based recommendations
        if (temp < 32) {
            recommendations.push('Heavy winter coat');
            recommendations.push('Warm gloves and scarf');
            recommendations.push('Thermal underwear');
        } else if (temp < 50) {
            recommendations.push('Medium-weight jacket');
            recommendations.push('Long-sleeve shirt');
            recommendations.push('Warm pants');
        } else if (temp < 70) {
            recommendations.push('Light jacket or sweater');
            recommendations.push('Long-sleeve shirt');
            recommendations.push('Jeans or casual pants');
        } else {
            recommendations.push('Light clothing');
            recommendations.push('Short-sleeve shirt');
            recommendations.push('Shorts or light pants');
        }

        // Weather condition-based recommendations
        if (weatherCondition === 'Rain') {
            recommendations.push('Umbrella');
            recommendations.push('Waterproof jacket or raincoat');
        } else if (weatherCondition === 'Snow') {
            recommendations.push('Waterproof boots');
            recommendations.push('Winter hat');
        } else if (weatherCondition === 'Clear') {
            recommendations.push('Sunglasses');
            if (temp > 70) {
                recommendations.push('Sunscreen');
            }
        }

        // Display recommendations
        clothingContainer.innerHTML = `
            <h3>Recommended Clothing</h3>
            <div class="clothing-info">
                ${recommendations.map(item => `
                    <div class="clothing-item">
                        <span>✓</span>
                        <span>${item}</span>
                    </div>
                `).join('')}
            </div>
        `;
        clothingContainer.style.display = 'block';
    }

    // Add event listeners for input fields
    document.getElementById('zipCode').addEventListener('keypress', function(e) {
        console.log('ZIP code keypress event:', e.key);
        if (e.key === 'Enter') {
            console.log('Enter key pressed, calling getWeather');
            getWeather();
        }
    });

    document.getElementById('city').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('state').focus();
        }
    });

    document.getElementById('state').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            getWeather();
        }
    });
}); 