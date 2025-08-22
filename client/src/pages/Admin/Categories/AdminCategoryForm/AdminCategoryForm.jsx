import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Form, 
  Button, 
  Alert, 
  Spinner,
  Badge,
  ListGroup
} from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { FaPlus, FaTrash, FaSave, FaArrowLeft } from 'react-icons/fa';
import { useCategories, useCreateCategory, useUpdateCategory } from '../../../../hooks/useCategories';
import { useToast } from '../../../../context/ToastContext';
import './admincategoryform.css';

const AdminCategoryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isEdit = window.location.pathname.includes('/edit');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    isActive: true,
    subCategories: []
  });
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = React.useRef(null);

  const [newSubCategory, setNewSubCategory] = useState({
    name: '',
    slug: '',
    description: ''
  });

  const [errors, setErrors] = useState({});
  const [showSubcategoryForm, setShowSubcategoryForm] = useState(false);
  const [showMobileSubcategory, setShowMobileSubcategory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categoriesData } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  // Listen for successful operations
  useEffect(() => {
    const handleSuccess = () => {
      // Force refresh the categories list
      window.dispatchEvent(new CustomEvent('forceRefresh'));
    };

    window.addEventListener('categoryUpdated', handleSuccess);
    window.addEventListener('categoryCreated', handleSuccess);

    return () => {
      window.removeEventListener('categoryUpdated', handleSuccess);
      window.removeEventListener('categoryCreated', handleSuccess);
    };
  }, []);

  // Load category data for editing
  useEffect(() => {
    if (isEdit && categoriesData?.categories) {
      const category = categoriesData.categories.find(cat => cat._id === id);
      if (category) {
        setFormData({
          name: category.name || '',
          slug: category.slug || '',
          description: category.description || '',
          image: category.image || '',
          isActive: category.isActive !== false,
          subCategories: category.subCategories || []
        });
        setImagePreview(null);
      }
    } else if (!isEdit) {
      setFormData({
        name: '',
        slug: '',
        description: '',
        image: '',
        isActive: true,
        subCategories: []
      });
      setImagePreview(null);
    }
  }, [isEdit, id, categoriesData]);

  // Force refresh category data when component mounts in edit mode
  useEffect(() => {
    if (isEdit) {
      // Force a fresh fetch of categories to get latest data
      window.dispatchEvent(new CustomEvent('forceRefresh'));
    }
  }, [isEdit, id]);

  // Generate slug from name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Auto-generate slug when name changes
    if (name === 'name') {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(value)
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubCategoryChange = (e) => {
    const { name, value } = e.target;
    setNewSubCategory(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-generate slug for subcategory
    if (name === 'name') {
      setNewSubCategory(prev => ({
        ...prev,
        slug: generateSlug(value)
      }));
    }
  };

  const addSubCategory = () => {
    if (!newSubCategory.name.trim()) {
      toast.error('Subcategory name is required');
      return;
    }

    // Check for duplicate subcategory names
    const isDuplicate = formData.subCategories.some(
      sub => sub.name.toLowerCase() === newSubCategory.name.toLowerCase()
    );

    if (isDuplicate) {
      toast.error('Subcategory with this name already exists');
      return;
    }

    setFormData(prev => ({
      ...prev,
      subCategories: [
        ...prev.subCategories,
        {
          ...newSubCategory
        }
      ]
    }));

    setNewSubCategory({ name: '', slug: '', description: '' });
    toast.success('Subcategory added');
  };

  const removeSubCategory = (index) => {
    setFormData(prev => ({
      ...prev,
      subCategories: prev.subCategories.filter((_, i) => i !== index)
    }));
    toast.success('Subcategory removed');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Category slug is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Category description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    try {
      const categoryData = new FormData();
      categoryData.append('name', formData.name);
      categoryData.append('slug', formData.slug);
      categoryData.append('description', formData.description);
      categoryData.append('isActive', formData.isActive);

      // Remove _id fields from subCategories before sending
      const sanitizedSubCategories = formData.subCategories.map(({ _id, ...rest }) => rest);
      categoryData.append('subCategories', JSON.stringify(sanitizedSubCategories));

      if (formData.imageFile) {
        categoryData.append('image', formData.imageFile);
      }

      setIsSubmitting(true);
      
      if (isEdit) {
        await updateCategory.mutateAsync({ id: id, data: categoryData });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast.success('Category updated successfully!');
        
        // Clear form state
        setFormData(prev => ({ ...prev, imageFile: null }));
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Trigger refresh events
        localStorage.setItem('categoryListNeedsRefresh', 'true');
        window.dispatchEvent(new CustomEvent('categoryUpdated'));
        window.dispatchEvent(new CustomEvent('forceRefresh'));
        
        // Auto redirect after 3 seconds
        setTimeout(() => {
          navigate('/admin/categories');
        }, 3000);
      } else {
        await createCategory.mutateAsync(categoryData);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast.success('Category created successfully!');
        
        // Trigger refresh events
        localStorage.setItem('categoryListNeedsRefresh', 'true');
        window.dispatchEvent(new CustomEvent('categoryCreated'));
        window.dispatchEvent(new CustomEvent('forceRefresh'));
        
        // Auto redirect after 3 seconds
        setTimeout(() => {
          navigate('/admin/categories');
        }, 3000);
      }
      
      setIsSubmitting(false);
    } catch (error) {
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.error(error?.message || 'Failed to save category');
    }
  };

  return (
    <Container fluid>
       <Row>
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Category Information</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Category Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter category name"
                        isInvalid={!!errors.name}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.name}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Category Slug *</Form.Label>
                      <Form.Control
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={handleInputChange}
                        placeholder="category-slug"
                        isInvalid={!!errors.slug}
                      />
                      <Form.Text className="text-muted">
                        URL-friendly version of the name
                      </Form.Text>
                      <Form.Control.Feedback type="invalid">
                        {errors.slug}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Description *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter category description"
                    isInvalid={!!errors.description}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.description}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Category Image</Form.Label>
                  <Form.Control
                    ref={fileInputRef}
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setFormData(prev => ({
                          ...prev,
                          imageFile: file
                        }));
                        
                        // Create preview URL
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          setImagePreview(e.target.result);
                        };
                        reader.readAsDataURL(file);
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          imageFile: null
                        }));
                        setImagePreview(null);
                      }
                    }}
                  />
                  <Form.Text className="text-muted">
                    Upload an image file for the category (JPG, PNG, etc.)
                  </Form.Text>
                  
                  {/* Show selected file name */}
                  {formData.imageFile && (
                    <div className="mt-2">
                      <small className="text-success">Selected: {formData.imageFile.name}</small>
                    </div>
                  )}
                  
                  {/* Show image preview */}
                  {(imagePreview || (isEdit && formData.image && !formData.imageFile)) && (
                    <div className="mt-2">
                      <small className="text-info">
                        {imagePreview ? 'Preview:' : 'Current image:'}
                      </small>
                      <div className="mt-1">
                        <img 
                          src={imagePreview || (formData.image ? `${import.meta.env.VITE_API_BASE_URL}${formData.image}?v=${Date.now()}&cache=${Math.random()}` : '/placeholder-image.jpg')} 
                          alt={imagePreview ? 'Preview' : 'Current category image'} 
                          className="img-thumbnail"
                          style={{ maxWidth: '150px', maxHeight: '150px' }}
                          key={`${formData.image}-${Date.now()}`}
                          onError={(e) => {
                            e.target.src = '/placeholder-image.jpg';
                          }}
                        />
                      </div>
                      {!imagePreview && (
                        <small className="text-muted">Upload a new file to replace this image</small>
                      )}
                    </div>
                  )}
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Check
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    label="Active Category"
                  />
                  <Form.Text className="text-muted">
                    Inactive categories won't be shown to customers
                  </Form.Text>
                </Form.Group>

                {/* Mobile Subcategory Toggle */}
                <button 
                  type="button"
                  className="mobile-subcategory-toggle"
                  onClick={() => {
                    setShowMobileSubcategory(!showMobileSubcategory);
                    if (!showMobileSubcategory) {
                      setTimeout(() => {
                        document.getElementById('subcategory-section')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }
                  }}
                >
                  <FaPlus />
                  <span>{showMobileSubcategory ? 'Hide Subcategory' : 'Add Subcategory'}</span>
                </button>

                <div className="d-flex gap-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={createCategory.loading || updateCategory.loading || isSubmitting}
                  >
                    {(createCategory.loading || updateCategory.loading || isSubmitting) ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        {isEdit ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <FaSave className="me-2" />
                        {isEdit ? 'Update Category' : 'Create Category'}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline-secondary"
                    onClick={() => navigate('/admin/categories')}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Desktop: Always show, Mobile: Show only when toggled */}
        <Col lg={4} className={`subcategory-section ${showMobileSubcategory ? 'show-mobile' : ''}`} id="subcategory-section">
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">Add Subcategory</h6>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-2">
                <Form.Label>Subcategory Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={newSubCategory.name}
                  onChange={handleSubCategoryChange}
                  placeholder="Enter subcategory name"
                />
              </Form.Group>
              
              <Form.Group className="mb-2">
                <Form.Label>Subcategory Slug</Form.Label>
                <Form.Control
                  type="text"
                  name="slug"
                  value={newSubCategory.slug}
                  onChange={handleSubCategoryChange}
                  placeholder="subcategory-slug"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="description"
                  value={newSubCategory.description}
                  onChange={handleSubCategoryChange}
                  placeholder="Enter description"
                />
              </Form.Group>

              <Button
                variant="outline-primary"
                size="sm"
                onClick={addSubCategory}
                className="w-100"
              >
                <FaPlus className="me-2" />
                Add Subcategory
              </Button>
            </Card.Body>
          </Card>

          {formData.subCategories.length > 0 && (
            <Card>
              <Card.Header>
                <h6 className="mb-0">
                  Subcategories ({formData.subCategories.length})
                </h6>
              </Card.Header>
              <Card.Body className="p-0">
                <ListGroup variant="flush">
                  {formData.subCategories.map((subCat, index) => (
                    <ListGroup.Item
                      key={index}
                      className="d-flex justify-content-between align-items-start"
                    >
                      <div className="flex-grow-1">
                        <h6 className="mb-1">{subCat.name}</h6>
                        <Badge bg="secondary" className="mb-1">
                          {subCat.slug}
                        </Badge>
                        {subCat.description && (
                          <p className="mb-0 text-muted small">
                            {subCat.description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeSubCategory(index)}
                      >
                        <FaTrash />
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default AdminCategoryForm;
