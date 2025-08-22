import GiftBox from '../models/GiftBox.js';

// Get all gift boxes
export const getGiftBoxes = async (req, res) => {
  try {
    // For admin routes, get all gift boxes; for public routes, get only active ones
    const isAdminRoute = req.originalUrl.includes('/admin') || req.headers['x-admin-request'];
    const query = isAdminRoute ? {} : { isActive: { $ne: false } };
    
    const giftBoxes = await GiftBox.find(query).sort({ createdAt: -1 });
    
    res.json(giftBoxes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get gift box by ID
export const getGiftBoxById = async (req, res) => {
  try {
    const giftBox = await GiftBox.findById(req.params.id);
    if (!giftBox) {
      return res.status(404).json({ message: 'Gift box not found' });
    }
    res.json(giftBox);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new gift box (Admin only)
export const createGiftBox = async (req, res) => {
  try {
    const { name, price, description, crackers, isActive } = req.body;
    
    const giftBox = new GiftBox({
      name,
      price,
      description,
      crackers,
      isActive: isActive !== undefined ? isActive : true
    });

    const savedGiftBox = await giftBox.save();
    
    res.status(201).json(savedGiftBox);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update gift box (Admin only)
export const updateGiftBox = async (req, res) => {
  try {
    const { name, price, description, crackers, isActive } = req.body;
    
    const giftBox = await GiftBox.findByIdAndUpdate(
      req.params.id,
      { name, price, description, crackers, isActive },
      { new: true, runValidators: true }
    );

    if (!giftBox) {
      return res.status(404).json({ message: 'Gift box not found' });
    }

    res.json(giftBox);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete gift box (Admin only)
export const deleteGiftBox = async (req, res) => {
  try {
    const giftBox = await GiftBox.findByIdAndDelete(req.params.id);

    if (!giftBox) {
      return res.status(404).json({ message: 'Gift box not found' });
    }

    res.json({ message: 'Gift box deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};