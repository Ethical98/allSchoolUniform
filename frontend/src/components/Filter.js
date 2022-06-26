import React, { useRef } from 'react';
import { Form } from 'react-bootstrap';
import { Typeahead } from 'react-bootstrap-typeahead';
import './css/Filter.css';

const Filter = ({ page, setPage, season, category, standard, setStandard, setCategory, setSeason, classes }) => {
    const ref1 = useRef();
    const ref2 = useRef();
    const ref3 = useRef();

    const classList = classes ? classes.map(x => x.class) : [];

    const productCategories = ['Boys', 'Girls'];
    const seasons = ['Winter', 'Summer'];

    const seasonChange = value => {
        setPage('');
        setSeason(value);
    };

    const categoryChange = value => {
        setPage('');
        setCategory(value);
    };

    const standardChange = value => {
        setPage('');
        setStandard(value);
    };

    return (
        <Form className="filter-form">
            <Form.Group className="me-2">
                <Typeahead
                    id="category-typeahead"
                    clearButton
                    size="sm"
                    multiple
                    onChange={value => categoryChange(value)}
                    options={productCategories}
                    placeholder="Categories"
                    selected={category}
                    ref={ref1}
                    onBlur={() => ref1.current.toggleMenu(() => false)}
                />
            </Form.Group>
            <Form.Group className="me-2">
                <Typeahead
                    id="season-typeahead"
                    clearButton
                    size="sm"
                    multiple
                    onChange={value => seasonChange(value)}
                    options={seasons}
                    placeholder="Season"
                    selected={season}
                    ref={ref2}
                    onBlur={() => ref2.current.toggleMenu(() => false)}
                />
            </Form.Group>
            <Form.Group>
                <Typeahead
                    id="standard-typeahead"
                    clearButton
                    size="sm"
                    labelKey="class"
                    multiple
                    onChange={value => standardChange(value)}
                    options={classList}
                    placeholder="Classes"
                    selected={standard}
                    ref={ref3}
                    onBlur={() => ref3.current.toggleMenu(() => false)}
                />
            </Form.Group>
        </Form>
    );
};

export default Filter;
