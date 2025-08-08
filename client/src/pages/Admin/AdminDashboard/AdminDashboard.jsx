import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  FaBoxOpen, FaList, FaShoppingCart, FaUsers, 
  FaChartLine, FaEye, FaPlus 
} from 'react-icons/fa';
import { FiTrendingUp } from 'react-icons/fi';
import { adminService } from '../../../services/adminService';
import './admindashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const dashboardData = await adminService.getDashboardStats(); // Fetch data from backend
        setStats(dashboardData.stats || {});
        setRecentOrders(dashboardData.recentOrders || []);
        setTopProducts(dashboardData.lowStockProducts || []);
      } catch (err) {
        setError(err.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusVariant = (status) => {
    switch (status) {
      case 'delivered': return 'success';
      case 'shipped': return 'primary';
      case 'confirmed': return 'info';
      case 'processing': return 'warning';
      case 'pending': return 'secondary';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  if (loading) {
    return <div className="text-center py-5">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-5 text-danger">{error}</div>;
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">Welcome back! Here's what's happening with your store.</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon products">
              <FaBoxOpen />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalProducts || 0}</div>
              <div className="stat-label">Total Products</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon orders">
              <FaShoppingCart />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalOrders || 0}</div>
              <div className="stat-label">Total Orders</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon users">
              <FaUsers />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalUsers || 0}</div>
              <div className="stat-label">Total Users</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon revenue">
              <FaChartLine />
            </div>
            <div className="stat-content">
              <div className="stat-value">₹{(stats.totalRevenue || 0).toLocaleString()}</div>
              <div className="stat-label">Total Revenue</div>
            </div>
          </div>
        </div>
      </div>

      <Row>
        {/* Recent Orders */}
        <Col lg={8} className="mb-4">
          <Card>
            <Card.Header>
              <div className="recent-orders-header">
                <h5 className="mb-0">🛒 Recent Orders</h5>
                <Link to="/admin/orders" className="view-all-btn">
                  View All
                </Link>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {/* Desktop Table */}
              <Table responsive hover className="mb-0 desktop-orders-table">
                <thead className="table-light">
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order, index) => (
                    <tr key={order._id || index}>
                      <td>
                        <code>{order.orderNumber}</code>
                      </td>
                      <td>{order.user?.name || 'Unknown Customer'}</td>
                      <td>₹{(order.pricing?.total || 0).toLocaleString()}</td>
                      <td>
                        <Badge bg={getStatusVariant(order.status)}>
                          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown'}
                        </Badge>
                      </td>
                      <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Unknown Date'}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          as={Link}
                          to={`/admin/orders/${order._id}`}
                          className="action-btn-small"
                        >
                          <FaEye />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              {/* Mobile Cards */}
              <div className="mobile-orders-list">
                {recentOrders.map((order, index) => (
                  <div key={order._id || index} className="mobile-order-item">
                    <div className="mobile-order-header">
                      <div>
                        <div className="mobile-order-id">
                          <code>{order.orderNumber}</code>
                        </div>
                        <div className="mobile-order-customer">{order.user?.name || 'Unknown Customer'}</div>
                      </div>
                      <Badge bg={getStatusVariant(order.status)}>
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown'}
                      </Badge>
                    </div>
                    
                    <div className="mobile-order-details">
                      <div className="mobile-order-amount">₹{(order.pricing?.total || 0).toLocaleString()}</div>
                      <div className="mobile-order-date">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Unknown Date'}</div>
                    </div>
                    
                    <div className="mobile-order-actions">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        as={Link}
                        to={`/admin/orders/${order._id}`}
                        className="w-100"
                      >
                        <FaEye /> View Order
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Top Products */}
        <Col lg={4} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">⚠️ Low Stock Products</h5>
            </Card.Header>
            <Card.Body>
              {topProducts?.length > 0 ? (
                topProducts.map((product, index) => (
                  <div key={product?._id ?? product?.name + '-' + index} className="top-product-item">
                    <div className="d-flex align-items-center">
                      <div className="top-product-rank">
                        #{index + 1}
                      </div>
                      <div className="ms-3 flex-grow-1">
                        <h6 className="mb-1">{product?.name || 'Unknown Product'}</h6>
                        <small className="text-muted">
                          Stock: {product?.stock || 0} units
                        </small>
                      </div>
                    </div>
                    {index < topProducts.length - 1 && <hr className="my-3" />}
                  </div>
                ))
              ) : (
                <p className="text-muted">No low stock products.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;