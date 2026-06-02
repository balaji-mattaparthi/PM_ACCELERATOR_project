/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mongoose from 'mongoose';

const SearchHistorySchema = new mongoose.Schema({
  query: { type: String, required: true },
  latitude: { type: Number },
  longitude: { type: Number },
  createdAt: { type: String, required: true }
});

export default mongoose.models.SearchHistory || mongoose.model('SearchHistory', SearchHistorySchema);
