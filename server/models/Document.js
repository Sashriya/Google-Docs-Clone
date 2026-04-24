import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    startIndex: Number,
    length: Number,
    replies: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String,
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

const documentSchema = new mongoose.Schema({
    title: { type: String, default: 'Untitled Document' },
    content: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    collaborators: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['editor', 'viewer'], default: 'viewer' }
    }],
    history: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content: String,
        createdAt: { type: Date, default: Date.now }
    }],
    versions: [{
        content: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now }
    }],
    isStarred: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: false },
    isOfflineAvailable: { type: Boolean, default: false },
    comments: [commentSchema]
}, { timestamps: true });

documentSchema.index({ title: 'text', content: 'text' });

const Document = mongoose.model('Document', documentSchema);
export default Document;