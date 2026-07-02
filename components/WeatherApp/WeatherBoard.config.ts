export const APP_ID = '86b521835e41cf3a0efc70d5bffba48e';
export const DEFAULT_CITY = 'Washington';
export const WEATHER_LINK = 'https://api.openweathermap.org/data/2.5/weather';
export const FORECAST_LINK = 'https://api.openweathermap.org/data/2.5/forecast';
export const CREDIT_ORG = 'Open Weather';
export const CREDIT_LINK = 'https://openweathermap.org/';

// Cities offered by the picker.
export const CITIES = ['Washington', 'Manila', 'Tokyo', 'London', 'New York'];

// Map OpenWeather condition codes (2xx–8xx) to an emoji + a soft bg tint.
export const iconFor = (id: number): string => {
  if (id >= 200 && id < 300) return '⛈';
  if (id >= 300 && id < 600) return '🌧';
  if (id >= 600 && id < 700) return '🌨';
  if (id >= 700 && id < 800) return '🌫';
  if (id === 800) return '☀️';
  return '⛅';
};

export const bgFor = (id: number): string => {
  if (id === 800) return 'oklch(0.95 0.035 90)';
  if (id >= 200 && id < 600) return 'oklch(0.94 0.02 250)';
  if (id >= 600 && id < 700) return 'oklch(0.95 0.01 230)';
  return 'oklch(0.95 0.03 230)';
};
