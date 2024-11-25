import React, { useState, useEffect } from 'react';
import { Cloud, Sun, Droplets, Wind, Search, X, ChevronDown, ChevronUp } from 'lucide-react';

const WeatherApp = () => {
  const [city, setCity] = useState('');
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedCity, setExpandedCity] = useState(null);

  // Replace with your actual API key
  const API_KEY = '30fd01887347631e7a963ae3db59adca';
  const BASE_URL = 'https://api.openweathermap.org/data/2.5';

  const fetchWeather = async () => {
    if (!city.trim()) return;

    setLoading(true);
    setError('');

    try {
      // Current weather
      const weatherResponse = await fetch(
        `${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`
      );
      const weatherData = await weatherResponse.json();

      if (weatherData.cod !== 200) {
        throw new Error(weatherData.message);
      }

      // 5-day forecast
      const forecastResponse = await fetch(
        `${BASE_URL}/forecast?q=${city}&units=metric&appid=${API_KEY}`
      );
      const forecastData = await forecastResponse.json();

      // Group forecast by day
      const dailyForecast = forecastData.list.reduce((acc, item) => {
        const date = new Date(item.dt * 1000).toLocaleDateString();
        if (!acc[date] && Object.keys(acc).length < 5) {
          acc[date] = item;
        }
        return acc;
      }, {});

      // Check if city already exists
      if (cities.some(c => c.weather.id === weatherData.id)) {
        setError('City already added to the list');
        setLoading(false);
        return;
      }

      // Add new city to the list
      setCities(prev => [...prev, {
        weather: weatherData,
        forecast: Object.values(dailyForecast)
      }]);
      
      setCity('');
    } catch (err) {
      setError('City not found or API error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeCity = (cityId) => {
    setCities(prev => prev.filter(city => city.weather.id !== cityId));
    if (expandedCity === cityId) {
      setExpandedCity(null);
    }
  };

  const toggleExpand = (cityId) => {
    setExpandedCity(expandedCity === cityId ? null : cityId);
  };

  const getWeatherIcon = (condition) => {
    switch (true) {
      case condition.includes('cloud'):
        return <Cloud className="w-8 h-8 text-gray-600" />;
      case condition.includes('rain'):
        return <Droplets className="w-8 h-8 text-blue-500" />;
      default:
        return <Sun className="w-8 h-8 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter city name"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && fetchWeather()}
            />
            <button
              onClick={fetchWeather}
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              {loading ? 'Adding...' : 'Add City'}
            </button>
          </div>
          
          {error && (
            <div className="text-red-500 mt-4">{error}</div>
          )}
        </div>

        {/* City List */}
        <div className="space-y-4">
          {cities.map(cityData => (
            <div
              key={cityData.weather.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300"
            >
              {/* City Header */}
              <div className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                   onClick={() => toggleExpand(cityData.weather.id)}>
                <div className="flex items-center gap-4">
                  {getWeatherIcon(cityData.weather.weather[0].description)}
                  <div>
                    <h2 className="text-xl font-bold">{cityData.weather.name}</h2>
                    <p className="text-gray-600 capitalize">{cityData.weather.weather[0].description}</p>
                  </div>
                  <span className="text-3xl font-bold">
                    {Math.round(cityData.weather.main.temp)}°C
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {expandedCity === cityData.weather.id ? 
                    <ChevronUp className="w-6 h-6 text-gray-400" /> : 
                    <ChevronDown className="w-6 h-6 text-gray-400" />
                  }
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCity(cityData.weather.id);
                    }}
                    className="p-2 hover:bg-red-100 rounded-full transition-colors duration-200"
                  >
                    <X className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              </div>

              {/* Expanded Weather Details */}
              {expandedCity === cityData.weather.id && (
                <div className="border-t border-gray-100 p-6 animate-fadeIn">
                  <div className="flex justify-center gap-6 mb-6">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-blue-500" />
                      <span>{cityData.weather.main.humidity}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wind className="w-4 h-4 text-gray-500" />
                      <span>{Math.round(cityData.weather.wind.speed)} m/s</span>
                    </div>
                  </div>

                  {/* 5-Day Forecast */}
                  <div className="grid grid-cols-5 gap-4">
                    {cityData.forecast.map((day) => (
                      <div
                        key={day.dt}
                        className="bg-gray-50 rounded-lg p-4 text-center"
                      >
                        <p className="font-semibold">
                          {new Date(day.dt * 1000).toLocaleDateString('en-US', {
                            weekday: 'short',
                          })}
                        </p>
                        {getWeatherIcon(day.weather[0].description)}
                        <p className="text-lg font-bold mt-2">
                          {Math.round(day.main.temp)}°C
                        </p>
                        <p className="text-sm text-gray-600 capitalize">
                          {day.weather[0].description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {cities.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            No cities added yet. Start by searching for a city above.
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherApp;