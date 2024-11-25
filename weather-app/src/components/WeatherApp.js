import React, { useState, useEffect, useRef } from 'react';
import { Cloud, Sun, Droplets, Wind, Search, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

const WeatherApp = () => {
  const [city, setCity] = useState('');
  const [cities, setCities] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedCity, setExpandedCity] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchRef = useRef(null);

  // Replace with your actual API keys
  const WEATHER_API_KEY = 'YOUR_API_KEY';
  const GEOCODING_API_KEY = 'YOUR_API_KEY';
  const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
  const GEOCODING_BASE_URL = 'https://api.openweathermap.org/geo/1.0';

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce function for search
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Fetch city suggestions
  const fetchCitySuggestions = async (searchTerm) => {
    if (!searchTerm.trim() || searchTerm.length < 3) {
      setSuggestions([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(
        `${GEOCODING_BASE_URL}/direct?q=${searchTerm}&limit=5&appid=${GEOCODING_API_KEY}`
      );
      const data = await response.json();
      
      // Format suggestions to include country and state
      const formattedSuggestions = data.map(city => ({
        name: city.name,
        country: city.country,
        state: city.state,
        lat: city.lat,
        lon: city.lon,
        fullName: `${city.name}${city.state ? `, ${city.state}` : ''}, ${city.country}`
      }));
      
      setSuggestions(formattedSuggestions);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced version of fetchCitySuggestions
  const debouncedFetchSuggestions = debounce(fetchCitySuggestions, 300);

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setCity(value);
    setShowSuggestions(true);
    debouncedFetchSuggestions(value);
  };

  const fetchWeatherForLocation = async (lat, lon, cityData) => {
    setLoading(true);
    setError('');

    try {
      // Current weather
      const weatherResponse = await fetch(
        `${WEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`
      );
      const weatherData = await weatherResponse.json();

      if (weatherData.cod !== 200) {
        throw new Error(weatherData.message);
      }

      // 5-day forecast
      const forecastResponse = await fetch(
        `${WEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`
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

      // Add new city to the list with full name
      setCities(prev => [...prev, {
        weather: {
          ...weatherData,
          fullName: cityData.fullName // Add full name to weather data
        },
        forecast: Object.values(dailyForecast)
      }]);
      
      setCity('');
      setSuggestions([]);
      setShowSuggestions(false);
    } catch (err) {
      setError('Error fetching weather data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    fetchWeatherForLocation(suggestion.lat, suggestion.lon, suggestion);
  };

  // Rest of your existing functions (removeCity, toggleExpand, getWeatherIcon)...
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
        {/* Search Bar with Suggestions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="relative" ref={searchRef}>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={city}
                  onChange={handleInputChange}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Enter city name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchLoading && (
                  <div className="absolute right-3 top-2">
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  if (suggestions.length > 0) {
                    handleSuggestionClick(suggestions[0]);
                  }
                }}
                disabled={loading || suggestions.length === 0}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {loading ? 'Adding...' : 'Add City'}
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.name}-${index}`}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="font-medium">{suggestion.name}</div>
                    <div className="text-sm text-gray-500">
                      {suggestion.state && `${suggestion.state}, `}{suggestion.country}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                    <h2 className="text-xl font-bold">{cityData.weather.fullName || cityData.weather.name}</h2>
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

              {/* Rest of your existing expanded weather details section... */}
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