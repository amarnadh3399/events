import mongoose from 'mongoose';

const recurrenceSchema = new mongoose.Schema({
  type: { type: String, enum: ['none', 'daily', 'weekly', 'monthly'], default: 'none' },
  interval: { type: Number, default: 1 },
  days: [{ type: Number }], // For weekly recurrence: 0=Sun, 1=Mon,...
  endDate: Date
});

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  recurrence: recurrenceSchema,
  color: { type: String, default: '#2196f3' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

// Virtual id for React (returns _id as string)
eventSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

const Event = mongoose.model('Event', eventSchema);

export default Event;
