/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mongoose from 'mongoose';

const WeatherReportSchema = new mongoose.Schema({
  city: { type: String, required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  temperature: { type: Number, required: true },
  humidity: { type: Number, required: true },
  weatherCondition: { type: String, required: true },
  notes: { type: String, default: '' },
  windSpeed: { type: Number, default: 0 },
  forecast: { type: String, default: 'No forecast trend outlook logged' },
  createdAt: { type: String, required: true }
});

export default mongoose.models.WeatherReport || mongoose.model('WeatherReport', WeatherReportSchema);
