import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col, Form, Button, Card, ListGroup, Badge, FloatingLabel } from 'react-bootstrap';
import Message from './Message';
import Loader from './Loader';
import { addOrderComment, deleteOrderComment } from '../actions/orderActions';
import { ORDER_ADD_COMMENT_RESET, ORDER_DELETE_COMMENT_RESET } from '../constants/orderConstants';
import { getOrderDetails } from '../actions/orderActions';

const badgeVariant = {
    Call: 'primary',
    Note: 'secondary',
    'Follow-up': 'warning',
};

const OrderCallComments = ({ orderId, comments, userInfo }) => {
    const dispatch = useDispatch();

    const [text, setText] = useState('');
    const [commentType, setCommentType] = useState('Call');

    const orderAddCommentState = useSelector((state) => state.orderAddComment);
    const { loading: loadingAdd, success: successAdd, error: errorAdd } = orderAddCommentState;

    const orderDeleteCommentState = useSelector((state) => state.orderDeleteComment);
    const { loading: loadingDelete, success: successDelete, error: errorDelete } = orderDeleteCommentState;

    useEffect(() => {
        if (successAdd) {
            setText('');
            setCommentType('Call');
            dispatch({ type: ORDER_ADD_COMMENT_RESET });
            dispatch(getOrderDetails(orderId));
        }
    }, [successAdd, dispatch, orderId]);

    useEffect(() => {
        if (successDelete) {
            dispatch({ type: ORDER_DELETE_COMMENT_RESET });
            dispatch(getOrderDetails(orderId));
        }
    }, [successDelete, dispatch, orderId]);

    const handleSubmit = () => {
        if (text.trim()) {
            dispatch(addOrderComment(orderId, text, commentType));
        }
    };

    const handleDelete = (commentId) => {
        if (window.confirm('Delete this comment?')) {
            dispatch(deleteOrderComment(orderId, commentId));
        }
    };

    const sortedComments = comments
        ? [...comments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : [];

    return (
        <Card className="mt-3">
            <Card.Header>
                <h5 className="mb-0">Call Notes & Comments</h5>
            </Card.Header>
            <Card.Body>
                {errorAdd && <Message variant="danger">{errorAdd}</Message>}
                {errorDelete && <Message variant="danger">{errorDelete}</Message>}

                <div>
                    <Row className="align-items-end">
                        <Col md={3} className="mb-2">
                            <FloatingLabel label="Type" controlId="commentType">
                                <Form.Select
                                    value={commentType}
                                    onChange={(e) => setCommentType(e.target.value)}
                                >
                                    <option value="Call">Call</option>
                                    <option value="Note">Note</option>
                                    <option value="Follow-up">Follow-up</option>
                                </Form.Select>
                            </FloatingLabel>
                        </Col>
                        <Col md={7} className="mb-2">
                            <FloatingLabel label="Add a comment..." controlId="commentText">
                                <Form.Control
                                    as="textarea"
                                    style={{ height: '58px' }}
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Add a comment..."
                                />
                            </FloatingLabel>
                        </Col>
                        <Col md={2} className="mb-2">
                            <Button
                                type="button"
                                variant="dark"
                                className="col-12"
                                disabled={loadingAdd || !text.trim()}
                                onClick={handleSubmit}
                            >
                                {loadingAdd ? 'Adding...' : 'Add'}
                            </Button>
                        </Col>
                    </Row>
                </div>

                {loadingDelete && <Loader />}

                {sortedComments.length === 0 ? (
                    <Message variant="info">No comments yet. Add the first note about this order.</Message>
                ) : (
                    <ListGroup variant="flush" className="mt-3">
                        {sortedComments.map((comment) => (
                            <ListGroup.Item key={comment._id} className="px-0">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <Badge bg={badgeVariant[comment.commentType] || 'secondary'}>
                                            {comment.commentType}
                                        </Badge>
                                        <strong className="ms-2">{comment.adminName}</strong>
                                        <small className="text-muted ms-2">
                                            {new Date(comment.createdAt).toLocaleString()}
                                        </small>
                                    </div>
                                    {comment.admin === userInfo._id && (
                                        <Button
                                            size="sm"
                                            variant="link"
                                            className="text-danger p-0"
                                            onClick={() => handleDelete(comment._id)}
                                        >
                                            <i className="fas fa-trash" />
                                        </Button>
                                    )}
                                </div>
                                <p className="mt-1 mb-0">{comment.text}</p>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                )}
            </Card.Body>
        </Card>
    );
};

export default OrderCallComments;
