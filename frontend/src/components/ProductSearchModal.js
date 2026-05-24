import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Table, Badge, Spinner } from 'react-bootstrap';
import api from '../utils/api';

/**
 * ProductSearchModal — lets admin search for a product and select a size.
 *
 * Props:
 *   show: boolean
 *   onHide: () => void
 *   onSelect: ({ productId, productName, size, price, stock }) => void
 *   userInfo: { token } from Redux store (for auth header)
 *   title: string (optional, defaults to "Select Exchange Product")
 */
const ProductSearchModal = ({ show, onHide, onSelect, userInfo, title = 'Select Exchange Product' }) => {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');

  useEffect(() => {
    if (show) {
      setKeyword('');
      setResults([]);
      setSelectedProduct(null);
      setSelectedSize('');
      setError('');
    }
  }, [show]);

  const searchProducts = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };
      const { data } = await api.get(`/api/products?keyword=${encodeURIComponent(keyword)}&pageSize=20`, config);
      setResults(data.products || []);
      if ((data.products || []).length === 0) setError('No products found');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedProduct || !selectedSize) return;
    const variant = selectedProduct.size.find((s) => s.size === selectedSize);
    onSelect({
      productId: selectedProduct._id,
      productName: selectedProduct.name,
      size: selectedSize,
      price: variant?.price || 0,
      stock: variant?.countInStock || 0,
    });
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="d-flex mb-3">
          <Form.Control
            type="text"
            placeholder="Search by product name or SKU..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchProducts()}
          />
          <Button variant="primary" className="ml-2" onClick={searchProducts} disabled={loading}>
            {loading ? <Spinner size="sm" animation="border" /> : 'Search'}
          </Button>
        </Form.Group>

        {error && <p className="text-danger">{error}</p>}

        {results.length > 0 && (
          <Table bordered hover size="sm" responsive>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Available Sizes</th>
              </tr>
            </thead>
            <tbody>
              {results.map((product) => (
                <tr
                  key={product._id}
                  onClick={() => { setSelectedProduct(product); setSelectedSize(''); }}
                  style={{ cursor: 'pointer', backgroundColor: selectedProduct?._id === product._id ? '#e8f4fd' : '' }}
                >
                  <td>{product.name}</td>
                  <td>{product.SKU || '-'}</td>
                  <td>
                    {(product.size || []).map((s) => (
                      <Badge
                        key={s.size}
                        bg={s.countInStock > 0 ? 'success' : 'secondary'}
                        style={{ cursor: s.countInStock > 0 ? 'pointer' : 'not-allowed', marginRight: '4px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (s.countInStock > 0) {
                            setSelectedProduct(product);
                            setSelectedSize(s.size);
                          }
                        }}
                      >
                        {s.size} ({s.countInStock})
                      </Badge>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {selectedProduct && selectedSize && (
          <div className="mt-3 p-2 bg-light rounded">
            <strong>Selected:</strong> {selectedProduct.name} — Size: {selectedSize}
            {' '}
            (₹{selectedProduct.size.find((s) => s.size === selectedSize)?.price || 0})
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button
          variant="success"
          onClick={handleConfirm}
          disabled={!selectedProduct || !selectedSize}
        >
          Select This Product
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProductSearchModal;
