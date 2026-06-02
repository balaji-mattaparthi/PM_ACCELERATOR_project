/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mongoose from 'mongoose';

const FavoriteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  createdAt: { type: String, required: true }
});

// Avoid Overwriting Model error on recompiles
export default mongoose.models.Favorite || mongoose.model('Favorite', FavoriteSchema);
