import User from '../models/User.js';

export const getUserAddresses = async (req, res) => {
    try {
        
        const user = await User.findById(req.user.id).select('addresses');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ 
            addresses: user.addresses || [],
            count: user.addresses ? user.addresses.length : 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const addAddress = async (req, res) => {
    try {

        const { street, city, state, pincode, landmark, type, isDefault } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!street || !city || !state || !pincode) {
            return res.status(400).json({ 
                message: 'Street, city, state, and pincode are required' 
            });
        }

        // Validate pincode format (Indian pincode)
        const pincodeRegex = /^[1-9][0-9]{5}$/;
        if (!pincodeRegex.test(pincode)) {
            return res.status(400).json({ 
                message: 'Please enter a valid 6-digit pincode' 
            });
        }

        // Validate type
        const validTypes = ['home', 'work', 'other'];
        const addressType = type || 'home';
        if (!validTypes.includes(addressType)) {
            return res.status(400).json({ 
                message: 'Address type must be one of: ' + validTypes.join(', ')
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If this is set as default, make others non-default
        if (isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        // Clean and sanitize input data
        const newAddress = {
            street: street.trim(),
            city: city.trim(),
            state: state.trim(),
            pincode: pincode.trim(),
            landmark: landmark ? landmark.trim() : '',
            type: addressType,
            isDefault: isDefault || user.addresses.length === 0
        };

        user.addresses.push(newAddress);
        await user.save();

        const addedAddress = user.addresses[user.addresses.length - 1];


        res.status(201).json({
            message: 'Address added successfully',
            address: addedAddress,
            totalAddresses: user.addresses.length
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateAddress = async (req, res) => {
    try {

        const { addressId } = req.params;
        const updateData = req.body;
        const userId = req.user.id;

        // Validate addressId
        if (!addressId) {
            return res.status(400).json({ message: 'Address ID is required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const address = user.addresses.id(addressId);
        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        // Validate pincode if provided
        if (updateData.pincode) {
            const pincodeRegex = /^[1-9][0-9]{5}$/;
            if (!pincodeRegex.test(updateData.pincode)) {
                return res.status(400).json({ 
                    message: 'Please enter a valid 6-digit pincode' 
                });
            }
        }

        // Validate type if provided
        if (updateData.type) {
            const validTypes = ['home', 'work', 'other'];
            if (!validTypes.includes(updateData.type)) {
                return res.status(400).json({ 
                    message: 'Address type must be one of: ' + validTypes.join(', ')
                });
            }
        }

        // If setting as default, make others non-default
        if (updateData.isDefault) {
            user.addresses.forEach(addr => {
                if (addr._id.toString() !== addressId) {
                    addr.isDefault = false;
                }
            });
        }

        // Clean and update data
        const cleanUpdateData = {};
        if (updateData.street) cleanUpdateData.street = updateData.street.trim();
        if (updateData.city) cleanUpdateData.city = updateData.city.trim();
        if (updateData.state) cleanUpdateData.state = updateData.state.trim();
        if (updateData.pincode) cleanUpdateData.pincode = updateData.pincode.trim();
        if (updateData.landmark !== undefined) cleanUpdateData.landmark = updateData.landmark ? updateData.landmark.trim() : '';
        if (updateData.type) cleanUpdateData.type = updateData.type;
        if (updateData.isDefault !== undefined) cleanUpdateData.isDefault = updateData.isDefault;

        // Apply updates
        Object.assign(address, cleanUpdateData);
        await user.save();

        res.status(200).json({
            message: 'Address updated successfully',
            address: address.toObject()
        });
    } catch (error) {
        
        // Handle specific JSON parsing errors
        if (error.message.includes('JSON') || error.message.includes('control character')) {
            return res.status(400).json({ 
                message: 'Invalid JSON format. Please check your request data for special characters.',
                error: 'JSON parsing error'
            });
        }
        
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const deleteAddress = async (req, res) => {
    try {

        const { addressId } = req.params;
        const userId = req.user.id;

        if (!addressId) {
            return res.status(400).json({ message: 'Address ID is required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const address = user.addresses.id(addressId);
        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        const wasDefault = address.isDefault;
        user.addresses.pull(addressId);

        // If deleted address was default, make first remaining address default
        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }

        await user.save();

        res.status(200).json({ 
            message: 'Address deleted successfully',
            remainingAddresses: user.addresses.length
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
