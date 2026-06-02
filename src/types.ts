/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WeatherData {
  latitude: number;
  longitude: number;
  timezone: string;
  elevation: number;
  current: {
    time: string;
    temperature: number;
    windSpeed: number;
    windDirection: number;
    humidity: number;
    weatherCode: number;
    pressure?: number;
    apparentTemperature?: number;
  };
  daily: DailyForecast[];
}

export interface DailyForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  precipitationSum: number;
  uvIndexMax?: number;
  windSpeedMax?: number;
}

export interface FavoriteLocation {
  _id: string; // works for both mongoose and custom JSON DB
  name: string;
  latitude: number;
  longitude: number;
  createdAt?: string;
}

export interface SearchHistoryItem {
  _id: string;
  query: string;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
}

export interface WeatherReport {
  _id: string;
  city: string;
  date: string; // YYYY-MM-DD
  temperature: number;
  humidity: number;
  weatherCondition: string; // e.g. Sunny, Rainy, Cloudy
  notes: string;
  windSpeed: number; // in km/h
  forecast: string; // forecast description
  createdAt?: string;
}

export interface AIAdviceResponse {
  advice: string;
  clothingSuggestions: string[];
  activitySuitability: string;
  generatedAt: string;
}

export interface SavedWeatherReport {
  _id: string;
  location: string;
  startDate: string;
  endDate: string;
  weatherData: {
    location: string;
    latitude: number;
    longitude: number;
    startDate: string;
    endDate: string;
    isHistorical: boolean;
    dailyData: Array<{
      date: string;
      tempMax: number;
      tempMin: number;
      weatherCode: number;
      precipitationSum: number;
      humidityMean?: number;
      windSpeedMax?: number;
      weatherCondition: string;
    }>;
    summary: {
      avgTempMax: number;
      avgTempMin: number;
      totalPrecipitation: number;
      overallCondition: string;
    };
  };
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}
