import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Admin from '../models/Admin.js';

export const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalAdmins = await Admin.countDocuments();
        
        // Order status counts
        const [pendingOrders, confirmedOrders, shippedOrders, deliveredOrders] = await Promise.all([
            Order.countDocuments({ status: 'pending' }),
            Order.countDocuments({ status: 'confirmed' }),
            Order.countDocuments({ status: 'shipped' }),
            Order.countDocuments({ status: 'delivered' })
        ]);
        
        const revenueResult = await Order.aggregate([
            { $match: { 'paymentInfo.status': 'completed' } },
            { $group: { _id: null, total: { $sum: '$pricing.total' } } }
        ]);
        const totalRevenue = revenueResult[0]?.total || 0;

        // Recent orders
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'name phoneNumber')
            .select('orderNumber status pricing.total createdAt');

        // Low stock products
        const lowStockProducts = await Product.find({ stock: { $lt: 10 } })
            .limit(10)
            .select('name stock');

        // Monthly revenue chart data
        const monthlyRevenue = await Order.aggregate([
            {
                $match: {
                    'paymentInfo.status': 'completed',
                    createdAt: { $gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000) }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    revenue: { $sum: '$pricing.total' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        res.status(200).json({
            stats: {
                totalUsers,
                totalProducts,
                totalOrders,
                totalAdmins,
                totalRevenue,
                ordersByStatus: {
                    pending: pendingOrders,
                    confirmed: confirmedOrders,
                    shipped: shippedOrders,
                    delivered: deliveredOrders
                }
            },
            recentOrders,
            lowStockProducts,
            monthlyRevenue
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status } = req.query;
        
        // Get all admin emails to exclude from user list
        const adminEmails = await Admin.find({}).select('email').lean();
        const adminEmailList = adminEmails.map(admin => admin.email);
        
        const query = {
            email: { $nin: adminEmailList } // Exclude admin emails
        };
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (status) {
            query.isActive = status === 'active';
        }

        const users = await User.find(query)
            .select('name email phoneNumber addresses createdAt')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        // Add order count to each user
        for (let user of users) {
            const orderCount = await Order.countDocuments({ user: user._id });
            user.orderCount = orderCount;
        }

        const total = await User.countDocuments(query);

        res.status(200).json({
            users,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const createAdmin = async (req, res) => {
    try {
        const { email, password, name, role, permissions, phone } = req.body;

        // Validate required fields
        if (!email || !password || !name) {
            return res.status(400).json({ 
                message: 'Email, password, and name are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                message: 'Please provide a valid email address'
            });
        }

        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({ 
                message: 'Password must be at least 6 characters long'
            });
        }

        // Validate role
        const validRoles = ['super_admin', 'admin'];
        const adminRole = role || 'admin';
        if (!validRoles.includes(adminRole)) {
            return res.status(400).json({ 
                message: 'Invalid role. Valid roles are: ' + validRoles.join(', ')
            });
        }

        // Only super_admin can create other super_admins
        if (adminRole === 'super_admin' && req.admin.role !== 'super_admin') {
            return res.status(403).json({ 
                message: 'Only super admin can create other super admins'
            });
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: email.toLowerCase().trim() });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin with this email already exists' });
        }

        // Both super_admin and admin have same permissions
        let adminPermissions = [];

        const admin = new Admin({
            email: email.toLowerCase().trim(),
            password,
            name: name.trim(),
            phone: phone?.trim() || '',
            role: adminRole,
            permissions: adminPermissions,
            createdBy: req.admin.id,
            isActive: true
        });

        await admin.save();
        res.status(201).json({
            message: 'Admin created successfully',
            admin: {
                id: admin._id,
                email: admin.email,
                name: admin.name,
                role: admin.role,
                permissions: admin.permissions,
                isActive: admin.isActive,
                createdAt: admin.createdAt,
                createdBy: {
                    id: req.admin.id,
                    name: req.admin.name,
                    email: req.admin.email
                }
            }
        });

    } catch (error) {

        if (error.code === 11000) {
            return res.status(400).json({ 
                message: 'Admin with this email already exists'
            });
        }

        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getAllAdmins = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, role } = req.query;

        const query = {};

        // Search filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Role filter
        if (role) {
            query.role = role;
        }

        const admins = await Admin.find(query)
            .select('-password')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Admin.countDocuments(query);

        res.status(200).json({
            admins,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total,
            stats: {
                totalAdmins: await Admin.countDocuments(),
                activeAdmins: await Admin.countDocuments({ isActive: true }),
                superAdmins: await Admin.countDocuments({ role: 'super_admin' }),
                regularAdmins: await Admin.countDocuments({ role: 'admin' })
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getAdminById = async (req, res) => {
    try {
        const { id } = req.params;

        const admin = await Admin.findById(id)
            .select('-password')
            .populate('createdBy', 'name email');

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.status(200).json({ admin });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, role, permissions, isActive } = req.body;

        // Find the admin to update
        const adminToUpdate = await Admin.findById(id);
        if (!adminToUpdate) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Prevent self-deactivation
        if (req.admin.id === id && isActive === false) {
            return res.status(400).json({ message: 'Cannot deactivate your own account' });
        }

        // Only super_admin can update other super_admins
        if (adminToUpdate.role === 'super_admin' && req.admin.role !== 'super_admin') {
            return res.status(403).json({ 
                message: 'Only super admin can update other super admins'
            });
        }

        // Only super_admin can promote to super_admin
        if (role === 'super_admin' && req.admin.role !== 'super_admin') {
            return res.status(403).json({ 
                message: 'Only super admin can promote others to super admin'
            });
        }

        // Validate role if provided
        if (role) {
            const validRoles = ['super_admin', 'admin'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ 
                    message: 'Invalid role. Valid roles are: ' + validRoles.join(', ')
                });
            }
        }

        const updateData = {};
        if (name) updateData.name = name.trim();
        if (role) updateData.role = role;
        if (permissions) updateData.permissions = permissions;
        if (isActive !== undefined) updateData.isActive = isActive;

        const admin = await Admin.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password').populate('createdBy', 'name email');

        res.status(200).json({
            message: 'Admin updated successfully',
            admin
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent self-deletion
        if (req.admin.id === id) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        // Find the admin to delete
        const adminToDelete = await Admin.findById(id);
        if (!adminToDelete) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Only super_admin can delete other super_admins
        if (adminToDelete.role === 'super_admin' && req.admin.role !== 'super_admin') {
            return res.status(403).json({ 
                message: 'Only super admin can delete other super admins'
            });
        }

        // Prevent deletion of the last super admin
        if (adminToDelete.role === 'super_admin') {
            const superAdminCount = await Admin.countDocuments({ role: 'super_admin' });
            if (superAdminCount <= 1) {
                return res.status(400).json({ 
                    message: 'Cannot delete the last super admin'
                });
            }
        }

        await Admin.findByIdAndDelete(id);

        res.status(200).json({
            message: 'Admin deleted successfully',
            deletedAdmin: {
                id: adminToDelete._id,
                name: adminToDelete.name,
                email: adminToDelete.email,
                role: adminToDelete.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getAdminStats = async (req, res) => {
    try {
        const stats = {
            totalAdmins: await Admin.countDocuments(),
            activeAdmins: await Admin.countDocuments({ isActive: true }),
            inactiveAdmins: await Admin.countDocuments({ isActive: false }),
            roleDistribution: {
                super_admin: await Admin.countDocuments({ role: 'super_admin' }),
                admin: await Admin.countDocuments({ role: 'admin' })
            },
            recentAdmins: await Admin.find()
                .select('-password')
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 })
                .limit(5)
        };

        res.status(200).json({ stats });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      dateFrom = '',
      dateTo = ''
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('customer', 'name email')
        .populate('items.product', 'name price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findById(id)
      .populate('customer', 'name email phone')
      .populate('items.product', 'name price images')
      .populate('shippingAddress');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { 
        status,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('customer', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get all admin emails to exclude from user stats
    const adminEmails = await Admin.find({}).select('email').lean();
    const adminEmailList = adminEmails.map(admin => admin.email);
    
    const excludeAdminsQuery = { email: { $nin: adminEmailList } };
    
    const [
      totalUsers,
      activeUsers,
      newThisMonth,
      usersWithOrders
    ] = await Promise.all([
      User.countDocuments(excludeAdminsQuery),
      User.countDocuments({ ...excludeAdminsQuery, isActive: true }),
      User.countDocuments({ ...excludeAdminsQuery, createdAt: { $gte: startOfMonth } }),
      User.aggregate([
        {
          $match: excludeAdminsQuery
        },
        {
          $lookup: {
            from: 'orders',
            localField: '_id',
            foreignField: 'user',
            as: 'orders'
          }
        },
        {
          $match: {
            'orders.0': { $exists: true }
          }
        },
        {
          $count: 'count'
        }
      ])
    ]);

    res.json({
      total: totalUsers,
      active: activeUsers,
      newThisMonth,
      withOrders: usersWithOrders[0]?.count || 0
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      message: 'Failed to fetch user stats',
      error: error.message
    });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select('-otp -cart');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
};
export const exportOrdersCSV = async (req, res) => {
  try {
    const { status, dateFrom, dateTo } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'user.name': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } }
      ];
    }
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const orders = await Order.find(query)
      .populate('user', 'name email phoneNumber')
      .sort({ createdAt: -1 });

    const csvHeader = 'Order Number,Customer Name,Email,Phone,Date,Status,Payment Method,Payment Status,Total Amount,Items Count\n';
    
    const csvData = orders.map(order => {
      return [
        order.orderNumber || 'N/A',
        (order.user?.name || 'N/A').replace(/,/g, ';'),
        order.user?.email || 'N/A', 
        order.user?.phoneNumber || 'N/A',
        new Date(order.createdAt).toLocaleDateString(),
        order.status || 'N/A',
        order.paymentInfo?.method || 'N/A',
        order.paymentInfo?.status || 'N/A',
        order.pricing?.total || 0,
        order.items?.length || 0
      ].join(',');
    }).join('\n');

    const csv = csvHeader + csvData;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
    res.send('Order Number,Customer Name,Status,Total\nORD001,John Doe,delivered,1000\nORD002,Jane Smith,pending,500');
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export orders',
      error: error.message
    });
  }
};