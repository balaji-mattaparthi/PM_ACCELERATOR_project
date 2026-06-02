/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mongoose from 'mongoose';

const SavedReportSchema = new mongoose.Schema({
  location: { type: String, required: true },
  startDate: { type: String, required: true }, // Format: YYYY-MM-DD
  endDate: { type: String, required: true },   // Format: YYYY-MM-DD
  weatherData: { type: mongoose.Schema.Types.Mixed, required: true },
  notes: { type: String, default: '' },
}, {
  timestamps: true // This automatically adds and maintains createdAt and updatedAt fields
});

export default mongoose.models.SavedReport || mongoose.model('SavedReport', SavedReportSchema);
