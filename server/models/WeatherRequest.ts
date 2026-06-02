/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mongoose from 'mongoose';

const WeatherRequestSchema = new mongoose.Schema({
  userInput: { type: String, required: true },
  resolvedLocation: { type: String },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  success: { type: Boolean, default: true },
  errorDetails: { type: String },
}, {
  timestamps: true
});

export default mongoose.models.WeatherRequest || mongoose.model('WeatherRequest', WeatherRequestSchema);
