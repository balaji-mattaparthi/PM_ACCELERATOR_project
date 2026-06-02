/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

const DB_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Memory DB Interface for fallback
interface LocalDBStructure {
  favorites: Array<{ _id: string; name: string; latitude: number; longitude: number; createdAt: string }>;
  searchHistories: Array<{ _id: string; query: string; latitude?: number; longitude?: number; createdAt: string }>;
  weatherReports: Array<{ _id: string; city: string; date: string; temperature: number; humidity: number; weatherCondition: string; notes: string; windSpeed: number; forecast: string; createdAt: string }>;
  savedReports: Array<{ _id: string; location: string; startDate: string; endDate: string; weatherData: any; notes: string; createdAt: string; updatedAt: string }>;
  weatherRequests: Array<{ _id: string; userInput: string; resolvedLocation?: string; startDate: string; endDate: string; success: boolean; errorDetails?: string; createdAt: string }>;
}

let isMongoConnected = false;
let mongoDbError = '';

// Initialize MongoDB or fallback
export async function initDB() {
  const mongoUri = process.env.MONGODB_URI || 
                   process.env.MANGODB_URI || 
                   process.env.MONGO_URI || 
                   process.env.MONGODB_URL;
                   
  if (mongoUri) {
    try {
      console.log('Connecting to MongoDB Atlas with timeout protection...');
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      } as any);
      isMongoConnected = true;
      mongoDbError = '';
      console.log('Connected to MongoDB Atlas successfully!');
    } catch (err: any) {
      console.error('Failed to connect to MongoDB Atlas. Falling back to Local JSON database...', err);
      mongoDbError = err?.message || String(err);
      setupLocalDB();
    }
  } else {
    console.log('No MONGODB_URI, MANGODB_URI, MONGO_URI, or MONGODB_URL found in environment. Initializing local JSON database...');
    mongoDbError = 'No MongoDB connection string found in environment variables.';
    setupLocalDB();
  }
}

function setupLocalDB() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const defaultData: LocalDBStructure = {
      favorites: [],
      searchHistories: [],
      weatherReports: [],
      savedReports: [],
      weatherRequests: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
  }
  console.log(`Local JSON database initialized at: ${DB_FILE}`);
}

// Low-level Local JSON helpers
function readLocalDB(): LocalDBStructure {
  try {
    if (!fs.existsSync(DB_FILE)) {
      setupLocalDB();
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading local DB, resetting...', err);
    return { favorites: [], searchHistories: [], weatherReports: [], savedReports: [], weatherRequests: [] };
  }
}

function writeLocalDB(data: LocalDBStructure) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to local DB:', err);
  }
}

// Generate unique string ID
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

// Dynamic DAO layer to support Mongoose if connected, else file-based fallback
export const DB = {
  isUsingMongo: () => isMongoConnected,
  getMongoError: () => mongoDbError,

  // --- FAVORITES CRUD ---
  async getFavorites() {
    if (isMongoConnected) {
      try {
        const Favorite = mongoose.model('Favorite') as any;
        return await Favorite.find().sort({ createdAt: -1 });
      } catch (e) {
        console.error('Mongo Favorite.find error, fallback to local', e);
      }
    }
    return readLocalDB().favorites;
  },

  async addFavorite(name: string, latitude: number, longitude: number) {
    const createdAt = new Date().toISOString();
    if (isMongoConnected) {
      try {
        const Favorite = mongoose.model('Favorite') as any;
        const fav = new Favorite({ name, latitude, longitude, createdAt });
        return await fav.save();
      } catch (e) {
        console.error('Mongo Favorite.save error, fallback to local', e);
      }
    }
    const dbData = readLocalDB();
    const newFav = { _id: generateId(), name, latitude, longitude, createdAt };
    dbData.favorites.unshift(newFav);
    writeLocalDB(dbData);
    return newFav;
  },

  async removeFavorite(id: string) {
    if (isMongoConnected) {
      try {
        const Favorite = mongoose.model('Favorite') as any;
        await Favorite.findByIdAndDelete(id);
        return true;
      } catch (e) {
        console.error('Mongo Favorite.delete error, fallback to local', e);
      }
    }
    const dbData = readLocalDB();
    dbData.favorites = dbData.favorites.filter((f) => f._id !== id);
    writeLocalDB(dbData);
    return true;
  },

  // --- SEARCH HISTORY CRUD ---
  async getSearchHistory() {
    if (isMongoConnected) {
      try {
        const SearchHistory = mongoose.model('SearchHistory') as any;
        return await SearchHistory.find().sort({ createdAt: -1 }).limit(10);
      } catch (e) {
        console.error('Mongo SearchHistory.find error, fallback to local', e);
      }
    }
    return readLocalDB().searchHistories.slice(0, 10);
  },

  async addSearchHistory(query: string, latitude?: number, longitude?: number) {
    const createdAt = new Date().toISOString();
    if (isMongoConnected) {
      try {
        const SearchHistory = mongoose.model('SearchHistory') as any;
        const item = new SearchHistory({ query, latitude, longitude, createdAt });
        const saved = await item.save();
        // Limit to 10 records and delete older
        const historyCount = await SearchHistory.countDocuments();
        if (historyCount > 10) {
          const oldest = await SearchHistory.find().sort({ createdAt: 1 }).limit(historyCount - 10);
          for (const raw of oldest) {
            await SearchHistory.findByIdAndDelete((raw as any)._id);
          }
        }
        return saved;
      } catch (e) {
        console.error('Mongo SearchHistory.save error, fallback to local', e);
      }
    }
    const dbData = readLocalDB();
    // Prevent duplicate consecutive search searchHistories
    if (dbData.searchHistories[0]?.query?.toLowerCase() === query.toLowerCase()) {
      return dbData.searchHistories[0];
    }
    const newItem = { _id: generateId(), query, latitude, longitude, createdAt };
    dbData.searchHistories.unshift(newItem);
    if (dbData.searchHistories.length > 10) {
      dbData.searchHistories = dbData.searchHistories.slice(0, 10);
    }
    writeLocalDB(dbData);
    return newItem;
  },

  async clearSearchHistory() {
    if (isMongoConnected) {
      try {
        const SearchHistory = mongoose.model('SearchHistory') as any;
        await SearchHistory.deleteMany({});
        return true;
      } catch (e) {
        console.error('Mongo SearchHistory.deleteMany error, fallback to local', e);
      }
    }
    const dbData = readLocalDB();
    dbData.searchHistories = [];
    writeLocalDB(dbData);
    return true;
  },

  // --- CUSTOM WEATHER REPORTS (CRUD HISTORY) ---
  async getWeatherReports() {
    if (isMongoConnected) {
      try {
        const WeatherReport = mongoose.model('WeatherReport') as any;
        return await WeatherReport.find().sort({ date: -1, createdAt: -1 });
      } catch (e) {
        console.error('Mongo WeatherReport.find error, fallback to local', e);
      }
    }
    return readLocalDB().weatherReports;
  },

  async addWeatherReport(city: string, date: string, temperature: number, humidity: number, weatherCondition: string, notes: string, windSpeed: number, forecast: string) {
    const createdAt = new Date().toISOString();
    if (isMongoConnected) {
      try {
        const WeatherReport = mongoose.model('WeatherReport') as any;
        const report = new WeatherReport({ city, date, temperature, humidity, weatherCondition, notes, windSpeed, forecast, createdAt });
        return await report.save();
      } catch (e) {
        console.error('Mongo WeatherReport.save error, fallback to local', e);
      }
    }
    const dbData = readLocalDB();
    const newReport = { _id: generateId(), city, date, temperature, humidity, weatherCondition, notes, windSpeed, forecast, createdAt };
    dbData.weatherReports.unshift(newReport);
    writeLocalDB(dbData);
    return newReport;
  },

  async updateWeatherReport(id: string, city: string, date: string, temperature: number, humidity: number, weatherCondition: string, notes: string, windSpeed: number, forecast: string) {
    if (isMongoConnected) {
      try {
        const WeatherReport = mongoose.model('WeatherReport') as any;
        return await WeatherReport.findByIdAndUpdate(id, { city, date, temperature, humidity, weatherCondition, notes, windSpeed, forecast }, { new: true });
      } catch (e) {
        console.error('Mongo WeatherReport.update error, fallback to local', e);
      }
    }
    const dbData = readLocalDB();
    const idx = dbData.weatherReports.findIndex((r) => r._id === id);
    if (idx !== -1) {
      dbData.weatherReports[idx] = {
        ...dbData.weatherReports[idx],
        city,
        date,
        temperature,
        humidity,
        weatherCondition,
        notes,
        windSpeed,
        forecast
      };
      writeLocalDB(dbData);
      return dbData.weatherReports[idx];
    }
    throw new Error('Report not found');
  },

  async deleteWeatherReport(id: string) {
    if (isMongoConnected) {
      try {
        const WeatherReport = mongoose.model('WeatherReport') as any;
        await WeatherReport.findByIdAndDelete(id);
        return true;
      } catch (e) {
        console.error('Mongo WeatherReport.delete error, fallback to local', e);
      }
    }
    const dbData = readLocalDB();
    dbData.weatherReports = dbData.weatherReports.filter((r) => r._id !== id);
    writeLocalDB(dbData);
    return true;
  },

  // --- SAVED REPORTS CRUD ---
  async getSavedReports() {
    if (isMongoConnected) {
      try {
        const SavedReport = mongoose.model('SavedReport') as any;
        return await SavedReport.find().sort({ createdAt: -1 });
      } catch (e) {
        console.error('Mongo SavedReport.find error, fallback to local', e);
      }
    }
    const db = readLocalDB();
    return db.savedReports || [];
  },

  async addSavedReport(location: string, startDate: string, endDate: string, weatherData: any, notes: string) {
    const now = new Date().toISOString();
    if (isMongoConnected) {
      try {
        const SavedReport = mongoose.model('SavedReport') as any;
        const rep = new SavedReport({ location, startDate, endDate, weatherData, notes });
        return await rep.save();
      } catch (e) {
        console.error('Mongo SavedReport.save error, fallback to local', e);
      }
    }
    const dbData = readLocalDB();
    if (!dbData.savedReports) dbData.savedReports = [];
    const newRep = { _id: generateId(), location, startDate, endDate, weatherData, notes, createdAt: now, updatedAt: now };
    dbData.savedReports.unshift(newRep);
    writeLocalDB(dbData);
    return newRep;
  },

  async updateSavedReport(id: string, location: string, startDate: string, endDate: string, weatherData: any, notes: string) {
    const now = new Date().toISOString();
    if (isMongoConnected) {
      try {
        const SavedReport = mongoose.model('SavedReport') as any;
        return await SavedReport.findByIdAndUpdate(id, { location, startDate, endDate, weatherData, notes }, { new: true });
      } catch (e) {
        console.error('Mongo SavedReport.update error, fallback to local', e);
      }
    }
    const dbData = readLocalDB();
    if (!dbData.savedReports) dbData.savedReports = [];
    const idx = dbData.savedReports.findIndex((r) => r._id === id);
    if (idx !== -1) {
      dbData.savedReports[idx] = {
        ...dbData.savedReports[idx],
        location,
        startDate,
        endDate,
        weatherData,
        notes,
        updatedAt: now
      };
      writeLocalDB(dbData);
      return dbData.savedReports[idx];
    }
    throw new Error('Report not found');
  },

  async deleteSavedReport(id: string) {
    if (isMongoConnected) {
      try {
        const SavedReport = mongoose.model('SavedReport') as any;
        await SavedReport.findByIdAndDelete(id);
        return true;
      } catch (e) {
        console.error('Mongo SavedReport.delete error, fallback to local', e);
      }
    }
    const dbData = readLocalDB();
    if (!dbData.savedReports) dbData.savedReports = [];
    dbData.savedReports = dbData.savedReports.filter((r) => r._id !== id);
    writeLocalDB(dbData);
    return true;
  },

  // --- WEATHER REQUESTS LOGGING ---
  async addWeatherRequest(userInput: string, resolvedLocation: string | undefined, startDate: string, endDate: string, success: boolean, errorDetails?: string) {
    const now = new Date().toISOString();
    if (isMongoConnected) {
      try {
        const WeatherRequest = mongoose.model('WeatherRequest') as any;
        const req = new WeatherRequest({ userInput, resolvedLocation, startDate, endDate, success, errorDetails });
        return await req.save();
      } catch (e) {
        console.error('Mongo WeatherRequest.save error, fallback to local', e);
      }
    }
    const dbData = readLocalDB();
    if (!dbData.weatherRequests) dbData.weatherRequests = [];
    const newReq = { _id: generateId(), userInput, resolvedLocation, startDate, endDate, success, errorDetails, createdAt: now };
    dbData.weatherRequests.unshift(newReq);
    if (dbData.weatherRequests.length > 100) {
      dbData.weatherRequests = dbData.weatherRequests.slice(0, 100);
    }
    writeLocalDB(dbData);
    return newReq;
  }
};
