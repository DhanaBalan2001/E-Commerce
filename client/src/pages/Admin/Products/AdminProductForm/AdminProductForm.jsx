import React, { useState, useEffect } from 'react';
import { Row, Col, Container, Card, Form, Button, Spinner, Image, Modal, ListGroup } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaTrash } from 'react-icons/fa';
import { useToast } from '../../../../context/ToastContext';
import { productService } from '../../../../services/productService';
import { categoryService } from '../../../../services/categoryService';
import { useCreateProduct, useUpdateProduct } from '../../../../hooks/useProducts';
import { getImageUrl } from '../../../../utils/imageUrl';


import './adminproductform.css';

const MobileDropdown = ({ value, onChange, options, placeholder, isInvalid }) => {
  const [showModal, setShowModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const selectedOption = options.find(opt => opt.value === value);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  if (!isMobile) {
    return (
      <Form.Select value={value} onChange={(e) => onChange(e.target.value)} isInvalid={isInvalid}>
        {options.map((option, index) => (
          <option key={index} value={option.value}>{option.label}</option>
        ))}
      </Form.Select>
    );
  }
  
  return (
    <>
      <Form.Control
        type="text"
        value={selectedOption?.label || ''}
        placeholder={placeholder}
        readOnly
        onClick={() => setShowModal(true)}
        isInvalid={isInvalid}
        style={{ cursor: 'pointer' }}
      />
      
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{placeholder}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0 }}>
          <ListGroup variant="flush">
            {options.map((option, index) => (
              <ListGroup.Item
                key={index}
                action
                onClick={() => {
                  onChange(option.value);
                  setShowModal(false);
                }}
                active={option.value === value}
              >
                {option.label}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Modal.Body>
      </Modal>
    </>
  );
};

const AdminProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    subCategories: [],
    weight: '',
    stock: '',
    unit: '',
    discount: '',
    featured: false,
    images: []
  });
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [optimizingImages, setOptimizingImages] = useState(false);
  const [operationLoading, setOperationLoading] = useState(false);
  const [operationType, setOperationType] = useState('default');

  const handleSuccessResponse = (response, isUpdate) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.success(isUpdate ? 'Product updated successfully! Redirecting in 3 seconds...' : 'Product created successfully! Redirecting in 3 seconds...');
    
    // Navigate to products page after 3 seconds
    setTimeout(() => {
      navigate('/admin/products', { replace: true });
    }, 3000);
  };

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await categoryService.getCategories();
        setCategories(response?.categories || []);
      } catch (error) {
        toast.error('Failed to load categories');
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      const fetchProduct = async () => {
        setLoadingProduct(true);
        try {
          const { product } = await productService.getProductById(id);
          setFormData({
            name: product.name || '',
            description: product.description || '',
            price: product.price || '',
            category: product.category?._id || product.category || '',
            subCategories: Array.isArray(product.subCategories) ? product.subCategories : (product.subCategory ? [product.subCategory] : []),
            stock: product.stock || '',
            unit: product.unit || '',
            weight: product.weight || '',
            discount: product.discount || '',
            featured: product.isFeatured || false,
            images: product.images || []
          });
        } catch (error) {
          toast.error('Failed to load product details');
        } finally {
          setLoadingProduct(false);
        }
      };
      fetchProduct();
    }
  }, [id, isEdit]);

  // Update subcategories when category changes
  useEffect(() => {
    if (!categories.length) {
      setSubcategories([]);
      return;
    }
    const selectedCategory = categories.find(cat => cat._id === formData.category);
    if (selectedCategory) {
      setSubcategories(selectedCategory.subCategories || []);
    } else {
      setSubcategories([]);
    }
  }, [formData.category, categories]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));

    // Reset subCategories if category changes
    if (name === 'category') {
      setFormData(prev => ({
        ...prev,
        subCategories: []
      }));
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Simple validation
    const invalidFiles = files.filter(file => {
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      const basicExtensions = ['.jpg', '.jpeg', '.png'];
      return !basicExtensions.includes(fileExtension) || file.size > 10 * 1024 * 1024;
    });
    
    if (invalidFiles.length > 0) {
      toast.error('Please upload JPG, JPEG, or PNG images under 10MB.');
      e.target.value = '';
      return;
    }
    
    setOptimizingImages(true);
    
    try {
      const imagePromises = files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({ data: e.target.result, isNew: true });
          };
          reader.readAsDataURL(file);
        });
      });
      
      const imageData = await Promise.all(imagePromises);
      setImageFiles(prev => [...prev, ...files]);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...imageData]
      }));
    } finally {
      setOptimizingImages(false);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = 'Product name is required';
    if (!formData.description?.trim()) newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.subCategories?.length) newErrors.subCategories = 'At least one subcategory is required';
    if (!formData.stock || Number(formData.stock) <= 0) newErrors.stock = 'Valid stock count is required';
    if (!formData.unit?.trim()) newErrors.unit = 'Unit is required';
    if (!formData.price || Number(formData.price) <= 0) newErrors.price = 'Price is required';
    if (!formData.weight || Number(formData.weight) <= 0) newErrors.weight = 'Weight is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.error('Please fix the form errors');
      return;
    }

    try {
      setOperationLoading(true);
      setOperationType(isEdit ? 'save' : 'upload');
      
      // Check if we have new images to upload
      const hasNewImages = imageFiles.length > 0;
      
      if (hasNewImages) {
        // Use FormData for file uploads
        const submitData = new FormData();
        Object.keys(formData).forEach(key => {
          if (key !== 'images') {
            let value = formData[key];
            if (key === 'stock' || key === 'weight') {
              value = parseInt(value, 10) || 0;
            }
            if (key === 'price' || key === 'discount') {
              value = parseFloat(value) || 0;
            }
            if (key === 'subCategories' && Array.isArray(value)) {
              value = JSON.stringify(value);
            }
            submitData.append(key, value);
          }
        });
        
        const existingImages = formData.images.filter(img => !img.isNew);
        if (existingImages.length > 0) {
          submitData.append('existingImages', JSON.stringify(existingImages));
        }
        
        imageFiles.forEach(file => submitData.append('images', file));
        
        if (isEdit) {
          const response = await productService.updateProduct(id, submitData);
          handleSuccessResponse(response, true);
        } else {
          const response = await productService.createProduct(submitData);
          handleSuccessResponse(response, false);
        }
      } else {
        // Use JSON for text-only updates
        const jsonData = {
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price) || 0,
          category: formData.category,
          subCategories: formData.subCategories,
          stock: parseInt(formData.stock, 10) || 0,
          unit: formData.unit,
          weight: parseInt(formData.weight, 10) || 0,
          discount: parseFloat(formData.discount) || 0,
          isFeatured: formData.featured
        };
        
        // Keep existing images
        const existingImages = formData.images.filter(img => !img.isNew);
        if (existingImages.length > 0) {
          jsonData.images = existingImages;
        }
        
        if (isEdit) {
          const response = await productService.updateProduct(id, jsonData);
          handleSuccessResponse(response, true);
        } else {
          const response = await productService.createProduct(jsonData);
          handleSuccessResponse(response, false);
        }
      }

      
    } catch (error) {
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      

      
      // Clear file input if there was a file validation error
      if (error.message && error.message.includes('Invalid file extension')) {
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
      }
      
      // Handle different types of errors
      let errorMessage = 'Failed to save product';
      
      if (error.isNetworkError) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.isTimeout) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.message) {
        // Handle the specific file extension error from the deployed server
        if (error.message.includes('Invalid file extension')) {
          errorMessage = 'Server validation error. Please try uploading different image files or contact support.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setOperationLoading(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading product...</p>
      </div>
    );
  }

  return (
    <>
      {(optimizingImages || operationLoading) && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
             style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
          <div className="bg-white p-3 rounded text-center">
            <Spinner animation="border" variant="primary" size="sm" className="mb-2" />
            <div><small>{optimizingImages ? 'Processing images...' : (isEdit ? 'Updating...' : 'Creating...')}</small></div>
          </div>
        </div>
      )}
      <Container fluid className="admin-product-form">
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col>
            <Card>
              <Card.Header>Product Information</Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Product Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    isInvalid={!!errors.name}
                    placeholder="Enter product name"
                  />
                  <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    isInvalid={!!errors.description}
                    placeholder="Enter product description"
                  />
                  <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Price *</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    isInvalid={!!errors.price}
                    placeholder="Enter product price"
                    step="0.01"
                    min="0"
                  />
                  <Form.Control.Feedback type="invalid">{errors.price}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  {loadingCategories ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <MobileDropdown
                      value={formData.category}
                      onChange={(value) => handleInputChange({ target: { name: 'category', value } })}
                      options={[{ value: '', label: 'Select category' }, ...categories.map(cat => ({ value: cat._id, label: cat.name }))]}
                      placeholder="Select category"
                      isInvalid={!!errors.category}
                    />
                  )}
                  <Form.Control.Feedback type="invalid">{errors.category}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3 subcategory-group">
                  <Form.Label>Subcategories *</Form.Label>
                  {subcategories.length === 0 ? (
                    <Form.Text className="text-muted d-block">
                      No subcategories available for the selected category. Please add subcategories in the Categories admin panel.
                    </Form.Text>
                  ) : (
                    <div className="subcategory-checkboxes">
                      {subcategories.map(sub => (
                        <Form.Check
                          key={sub._id}
                          type="checkbox"
                          id={`sub-${sub._id}`}
                          label={sub.name}
                          checked={formData.subCategories.includes(sub._id)}
                          onChange={(e) => {
                            const subId = sub._id;
                            setFormData(prev => ({
                              ...prev,
                              subCategories: e.target.checked
                                ? [...prev.subCategories, subId]
                                : prev.subCategories.filter(id => id !== subId)
                            }));
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {errors.subCategories && (
                    <div className="invalid-feedback d-block">{errors.subCategories}</div>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Weight (grams) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    isInvalid={!!errors.weight}
                    placeholder="Enter product weight in grams"
                    min="1"
                  />
                  <Form.Control.Feedback type="invalid">{errors.weight}</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Stock Count *</Form.Label>
                  <Form.Control
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    isInvalid={!!errors.stock}
                    placeholder="Enter stock count"
                  />
                  <Form.Control.Feedback type="invalid">{errors.stock}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Unit *</Form.Label>
                  <MobileDropdown
                    value={formData.unit}
                    onChange={(value) => handleInputChange({ target: { name: 'unit', value } })}
                    options={[
                      { value: '', label: 'Select unit' },
                      { value: 'piece', label: 'Piece' },
                      { value: 'box', label: 'Box' },
                      { value: 'kg', label: 'Kg' },
                      { value: 'g', label: 'Gram' },
                      { value: 'oz', label: 'Ounce' },
                      { value: 'l', label: 'Liter' },
                      { value: 'ml', label: 'Milliliter' },
                      { value: 'dozen', label: 'Dozen' },
                      { value: 'pack', label: 'Pack' }
                    ]}
                    placeholder="Select unit"
                    isInvalid={!!errors.unit}
                  />
                  <Form.Control.Feedback type="invalid">{errors.unit}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Discount (%)</Form.Label>
                  <Form.Control
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleInputChange}
                    placeholder="Enter discount percentage"
                    step="0.01"
                    min="0"
                    max="100"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    label="Featured Product"
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header><h5>🖼️ Product Images</h5></Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Upload Images</Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,image/jpeg,image/jpg,image/png"
                    onChange={handleImageUpload}
                    isInvalid={!!errors.images}
                  />
                  <Form.Text className="text-muted">
                    Allowed formats: JPG, JPEG, PNG, GIF, WEBP, AVIF (Max 10MB each)
                  </Form.Text>
                  <Form.Control.Feedback type="invalid">{errors.images}</Form.Control.Feedback>
                </Form.Group>

                <div className="image-preview-grid">
                  {formData.images.map((img, index) => (
                    <div key={index} className="image-preview-item position-relative">
                      <Image
                        src={img.isNew ? img.data : `${getImageUrl(img.url)}?t=${Date.now()}`}
                        alt={`Product Image ${index + 1}`}
                        thumbnail
                        loading="lazy"
                        onError={(e) => {
                          if (e.target.src !== window.location.origin + '/placeholder-image.jpg') {
                            e.target.src = '/placeholder-image.jpg';
                          }
                        }}

                      />
                      {!img.isNew && (
                        <span className="existing-image-badge position-absolute top-0 start-0 bg-primary text-white px-1 py-0 rounded">
                          Existing
                        </span>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => removeImage(index)}
                      >
                        <FaTrash className="me-1" /> Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>

            <div className="d-grid mt-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-100"
                  disabled={operationLoading}
                >
                  {operationLoading ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      {isEdit ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <FaSave className="me-2" />
                      {isEdit ? 'Update Product' : 'Create Product'}
                    </>
                  )}
                </Button>
            </div>
          </Col>
        </Row>
      </Form>
    </Container>
    </>
  );
};

export default AdminProductForm;
