# PM Accelerator Weather AI

A full-stack AI-powered weather application built as part of the PM Accelerator AI Engineer Intern Technical Assessment.

PM Accelerator Weather AI provides real-time weather information, 5-day forecasts, location-based weather search, weather history management, data export capabilities, interactive weather maps, and AI-powered weather recommendations.

---

# Live Demo

**Deployed Application**

https://nimbus-live-weather-352334862059.asia-southeast1.run.app

---

# Features

## Frontend Features

* Search weather by:

  * City name
  * ZIP/Postal code
  * GPS coordinates
  * Current browser location
* Real-time weather information
* 5-day weather forecast
* Responsive UI for desktop, tablet, and mobile
* Weather condition icons and summaries
* Interactive weather maps
* Loading and error handling states
* Search history visualization

---

## Backend Features

* REST API built using Node.js and Express
* MongoDB database integration
* Weather data persistence
* CRUD operations for weather records
* Input validation and error handling
* Export weather data in:

  * JSON
  * CSV
  * XML
  * Markdown
  * PDF
* AI-powered weather recommendations using Google Gemini

---

# Tech Stack

## Frontend

* React
* TypeScript
* Tailwind CSS
* Vite
* React Query
* Leaflet Maps

## Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* TypeScript

## APIs Used

* Open-Meteo Geocoding API
* Open-Meteo Forecast API
* Google Gemini API

---

# Architecture

```text
React + TypeScript Frontend
            │
            ▼
     Express REST API
            │
            ▼
       MongoDB Atlas
            │
            ├── Open-Meteo API
            ├── Geocoding API
            └── Gemini AI API
```

---

# Project Structure

```bash
nimbus-weather-ai/
│
├── client/          # React Frontend
├── server/          # Express Backend
├── shared/          # Shared Types & Utilities
├── public/
└── README.md
```

---

# Installation

## Clone Repository

```bash
git clone <repository-url>
cd nimbus-weather-ai
```

---

## Install Dependencies

### Frontend

```bash
cd client
npm install
```

### Backend

```bash
cd ../server
npm install
```

---

# Environment Variables

Create a `.env` file inside the server directory.

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
```

---

# Running the Application

## Start Backend

```bash
cd server
npm run dev
```

Backend runs on:

```bash
http://localhost:5000
```

---

## Start Frontend

```bash
cd client
npm run dev
```

Frontend runs on:

```bash
http://localhost:5173
```

---

# API Functionality

## Weather APIs

* Retrieve current weather
* Retrieve forecast data
* Search locations using geocoding
* Detect current user location

## CRUD Operations

### Create

* Save weather reports
* Store weather searches

### Read

* View weather history
* Retrieve saved weather reports

### Update

* Modify stored weather entries

### Delete

* Remove weather records

---

# Export Functionality

Users can export weather data in:

* JSON
* CSV
* XML
* Markdown
* PDF

---

# Error Handling

The application gracefully handles:

* Invalid locations
* Invalid coordinates
* Empty search inputs
* API failures
* Network issues
* Database connection failures
* Invalid requests

---

# AI Integration

Google Gemini is used to generate intelligent weather insights such as:

* Clothing recommendations
* Travel suggestions
* Outdoor activity recommendations
* Weather impact analysis
* Safety recommendations

---

# Responsive Design

PM Accelerator AI is optimized for:

* Desktop devices
* Tablets
* Mobile devices

Responsive layouts are implemented using:

* Tailwind CSS
* CSS Grid
* Flexbox
* Mobile-first design principles

---

## Location Accuracy Notes

The application supports automatic weather retrieval using the browser's Geolocation API. However, location accuracy depends on the device, browser permissions, network conditions, and GPS signal availability.

In some situations, such as:

* Being indoors
* Weak GPS signal
* VPN usage
* Disabled location services
* Desktop devices without GPS hardware

the detected location may be less accurate or may not be available.

To ensure reliable weather results, users can always manually search using:

* City names
* ZIP/Postal codes
* GPS coordinates

The application includes fallback mechanisms and validation to handle location-detection failures gracefully.


# PM Accelerator Requirement Coverage

## Frontend Assessment

✅ Location Search

✅ Current Weather

✅ Current Location Detection

✅ 5-Day Forecast

✅ Weather Icons

✅ Error Handling

✅ Responsive Design

## Backend Assessment

✅ REST APIs

✅ MongoDB Persistence

✅ CRUD Operations

✅ Data Validation

✅ Data Export

✅ API Integrations

✅ Error Handling

## Additional Features

✅ AI-Powered Weather Recommendations

✅ Interactive Maps

✅ Search History

✅ Cloud Deployment

---

# About PM Accelerator

This project was developed for the PM Accelerator AI Engineer Intern Technical Assessment.

PM Accelerator helps aspiring engineers, product managers, and AI professionals gain hands-on experience by building real-world products and collaborating on innovative technology solutions.

LinkedIn: Product Manager Accelerator

---

# Author

**Balaji Mattaparthi**

Full-Stack Developer | AI Enthusiast | Computer Science Engineer

---

# License

This project was created for educational and technical assessment purposes.
