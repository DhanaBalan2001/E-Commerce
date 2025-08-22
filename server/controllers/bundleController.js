import Bundle from '../models/Bundle.js';

// Get all bundles
export const getBundles = async (req, res) => {
  try {
    // For admin routes, get all bundles; for public routes, get only active ones
    const isAdminRoute = req.originalUrl.includes('/admin') || req.headers['x-admin-request'];
    const query = isAdminRoute ? {} : { isActive: { $ne: false } };
    
    const bundles = await Bundle.find(query).sort({ createdAt: -1 });
    
    res.json(bundles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get bundle by ID
export const getBundleById = async (req, res) => {
  try {
    const bundle = await Bundle.findById(req.params.id);
    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }
    res.json(bundle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new bundle (Admin only)
export const createBundle = async (req, res) => {
  try {
    const { name, price, description, crackers, isActive } = req.body;
    
    const bundle = new Bundle({
      name,
      price,
      description,
      crackers,
      isActive: isActive !== undefined ? isActive : true
    });

    const savedBundle = await bundle.save();
    
    res.status(201).json(savedBundle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update bundle (Admin only)
export const updateBundle = async (req, res) => {
  try {
    const { name, price, description, crackers, isActive } = req.body;
    
    const bundle = await Bundle.findByIdAndUpdate(
      req.params.id,
      { name, price, description, crackers, isActive },
      { new: true, runValidators: true }
    );

    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    res.json(bundle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete bundle (Admin only)
export const deleteBundle = async (req, res) => {
  try {
    const bundle = await Bundle.findByIdAndDelete(req.params.id);

    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    res.json({ message: 'Bundle deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};