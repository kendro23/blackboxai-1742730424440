const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection (commented out until we have a MongoDB URI)
/*
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));
*/

// Models
const listingSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    location: { type: String, required: true },
    category: { type: String, required: true },
    images: [String],
    featured: { type: Boolean, default: false },
    contact: {
        phone: String,
        email: String,
        whatsapp: String
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Listing = mongoose.model('Listing', listingSchema);

// API Routes
app.get('/api/listings', async (req, res) => {
    try {
        const { category, location, search } = req.query;
        let query = {};

        if (category) query.category = category;
        if (location) query.location = location;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const listings = await Listing.find(query).sort({ featured: -1, createdAt: -1 });
        res.json(listings);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching listings' });
    }
});

app.get('/api/listings/:id', async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }
        res.json(listing);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching listing' });
    }
});

app.post('/api/listings', async (req, res) => {
    try {
        const listing = new Listing(req.body);
        await listing.save();
        res.status(201).json(listing);
    } catch (error) {
        res.status(400).json({ error: 'Error creating listing' });
    }
});

// Serve static files
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});