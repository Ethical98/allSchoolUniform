import React, { useEffect, useState } from 'react';
import { Form, ListGroup, Modal, Button, Row, Col } from 'react-bootstrap';
import api from '../../utils/api';
import { useSelector } from 'react-redux';

const CompanySelector = ({ companyType, onSelect, selected, label }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');
    const [newCompany, setNewCompany] = useState({
        name: '',
        gstin: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        email: '',
    });

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    useEffect(() => {
        if (selected && selected.name) {
            setQuery(selected.name);
        }
    }, [selected]);

    useEffect(() => {
        const search = async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }
            try {
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                const { data } = await api.get(
                    `/api/billing/companies/search?q=${query}&type=${companyType}`,
                    config
                );
                setResults(data);
                setShowDropdown(true);
            } catch (err) {
                // Silently handle search errors — user sees empty results
            }
        };

        const debounce = setTimeout(search, 300);
        return () => clearTimeout(debounce);
    }, [query, companyType, userInfo]);

    const handleSelect = (company) => {
        setQuery(company.name);
        setShowDropdown(false);
        onSelect(company);
    };

    const openCreateModal = () => {
        setShowDropdown(false);
        setNewCompany({
            name: query || '',
            gstin: '',
            address: '',
            city: '',
            state: '',
            pincode: '',
            phone: '',
            email: '',
        });
        setCreateError('');
        setShowModal(true);
    };

    const handleCreateCompany = async (e) => {
        e.preventDefault();
        if (!newCompany.name.trim()) {
            setCreateError('Company name is required');
            return;
        }
        setCreating(true);
        setCreateError('');
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const { data } = await api.post(
                '/api/billing/companies',
                { ...newCompany, companyType },
                config
            );
            setShowModal(false);
            handleSelect(data);
        } catch (err) {
            setCreateError(
                err.response?.data?.message || 'Failed to create company'
            );
        } finally {
            setCreating(false);
        }
    };

    const handleFieldChange = (field, value) => {
        setNewCompany((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <>
            <Form.Group className="mb-3" style={{ position: 'relative' }}>
                <Form.Label>{label || `Select ${companyType}`}</Form.Label>
                <Form.Control
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (!e.target.value) onSelect(null);
                    }}
                    onFocus={() => results.length > 0 && setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    placeholder={`Search ${companyType.toLowerCase()} company...`}
                />
                {showDropdown && (
                    <ListGroup
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            zIndex: 1000,
                            maxHeight: '250px',
                            overflowY: 'auto',
                        }}
                    >
                        {results.map((company) => (
                            <ListGroup.Item
                                key={company._id}
                                action
                                onClick={() => handleSelect(company)}
                            >
                                <strong>{company.name}</strong>
                                {company.gstin && <span className="text-muted ms-2">GSTIN: {company.gstin}</span>}
                                {company.city && <span className="text-muted ms-2">({company.city})</span>}
                                {company.isDefault && <span className="badge bg-primary ms-2">Default</span>}
                            </ListGroup.Item>
                        ))}
                        <ListGroup.Item
                            action
                            className="text-primary fw-bold"
                            onClick={openCreateModal}
                        >
                            <i className="fas fa-plus me-2"></i>
                            Create New {companyType === 'SENDER' ? 'Sender' : 'Buyer'} Company
                        </ListGroup.Item>
                    </ListGroup>
                )}
            </Form.Group>

            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        Create New {companyType === 'SENDER' ? 'Sender' : 'Buyer'} Company
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreateCompany}>
                    <Modal.Body>
                        {createError && (
                            <div className="alert alert-danger">{createError}</div>
                        )}
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Company Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newCompany.name}
                                        onChange={(e) => handleFieldChange('name', e.target.value)}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>GSTIN</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newCompany.gstin}
                                        onChange={(e) => handleFieldChange('gstin', e.target.value)}
                                        placeholder="e.g. 29ABCDE1234F1Z5"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Address</Form.Label>
                            <Form.Control
                                type="text"
                                value={newCompany.address}
                                onChange={(e) => handleFieldChange('address', e.target.value)}
                            />
                        </Form.Group>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>City</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newCompany.city}
                                        onChange={(e) => handleFieldChange('city', e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>State</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newCompany.state}
                                        onChange={(e) => handleFieldChange('state', e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Pincode</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newCompany.pincode}
                                        onChange={(e) => handleFieldChange('pincode', e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Phone</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newCompany.phone}
                                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={newCompany.email}
                                        onChange={(e) => handleFieldChange('email', e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={creating}>
                            {creating ? 'Creating...' : 'Create Company'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
};

export default CompanySelector;
