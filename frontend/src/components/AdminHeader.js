import React from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import urlimage from '../seamlessschool-bg.png';
import { Nav } from 'react-bootstrap';
import './css/AdminHeader.css';

// Function a11yProps(index) {
//   Return {
//     Id: `simple-tab-${index}`,
//     'aria-controls': `simple-tabpanel-${index}`,
//   };
// }

// Const useStyles = makeStyles((theme) => ({
//   Root: {
//     FlexGrow: 1,
//     MarginTop: '-10px',
//     BackgroundImage: `url(${urlimage})`,
//   },
//   Tab: {
//     MinWidth: window.screen.width > 1200 && '12vw',
//     Width: window.screen.width > 1200 && '12vw',
//   },
// }));

const AdminHeader = () => {
    // Const location = useLocation();
    // Const classes = useStyles();
    // Const [value, setValue] = useState(0);
    // Let path = location.pathname.toLowerCase();
    // UseEffect(() => {
    //   Let path = location.pathname.toLowerCase();
    //   Console.log(path);
    //   If (path === '/admin/dashboard' && value !== 0) setValue(0);
    //   Else if (path === '/admin/userlist' && value !== 1) setValue(1);
    //   Else if (path === '/admin/productlist' && value !== 2) setValue(2);
    //   Else if (path === '/admin/orderlist' && value !== 3) setValue(3);
    //   Else if (path === '/admin/schoollist' && value !== 4) setValue(4);
    //   Else if (path === '/admin/typelist' && value !== 5) setValue(5);
    //   Else if (path === '/admin/homepage' && value !== 6) setValue(6);
    //   Else if (path === '/admin/extra' && value !== 7) setValue(7);
    // }, [value, location.pathname]);

    // Const handleChange = (event, newValue) => {
    //   SetValue(newValue);
    // };

    return (
        <Nav
            justify
            variant="tabs"
            className="admin-header"
            style={{
                background: `#2c4a77 url(${urlimage})`
            }}
        >
            {/* <AppBar
        position='static'
        style={{
          background: `#2c4a77 url(${urlimage})`,
        }}
      >
        <Tabs
          value={value}
          onChange={handleChange}
          variant={window.screen.width < 900 ? 'scrollable' : 'standard'}
          scrollButtons={window.screen.width < 900 ? 'on' : 'off'}
        >
          <LinkContainer
            to='/admin/dashboard'
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Tab
              icon={<i className='fas fa-chart-bar' />}
              label='Dashboard'
              {...a11yProps(0)}
            />
          </LinkContainer>
          <LinkContainer
            to='/admin/userlist'
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Tab
              icon={<i className='fas fa-users' />}
              label='Users'
              {...a11yProps(1)}
            />
          </LinkContainer>
          <LinkContainer
            to='/admin/productlist'
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Tab
              classes={{ root: classes.tab }}
              icon={<i className='fas fa-tshirt' />}
              label='Products'
              {...a11yProps(2)}
            />
          </LinkContainer>
          <LinkContainer
            to='/admin/orderlist'
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Tab
              classes={{ root: classes.tab }}
              icon={<i className='fas fa-box-open' />}
              label='Orders'
              {...a11yProps(3)}
            />
          </LinkContainer>
          <LinkContainer
            to='/admin/schoollist'
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Tab
              classes={{ root: classes.tab }}
              icon={<i className='fas fa-graduation-cap' />}
              label='Schools'
              {...a11yProps(4)}
            />
          </LinkContainer>
          <LinkContainer
            to='/admin/typelist'
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Tab
              classes={{ root: classes.tab }}
              icon={<i className='fas fa-th' />}
              label='Product Type'
              {...a11yProps(5)}
            />
          </LinkContainer>
          <LinkContainer
            to='/admin/homepage'
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Tab
              classes={{ root: classes.tab }}
              icon={<i className='fas fa-home' />}
              label='Homepage'
              {...a11yProps(6)}
            />
          </LinkContainer>
          <LinkContainer
            to='/admin/extra'
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Tab
              classes={{ root: classes.tab }}
              icon={<i className='fas fa-sliders-h' />}
              label='Extra Activity'
              {...a11yProps(6)}
            />
          </LinkContainer>
        </Tabs>
      </AppBar> */}

            <Nav.Item>
                <LinkContainer to="/admin/dashboard">
                    <Nav.Link eventKey="/admin/dashboard" className="admin-header-nav-item">
                        <i className="fas fa-chart-bar" />
                        <span>DASHBOARD</span>
                    </Nav.Link>
                </LinkContainer>
            </Nav.Item>

            <Nav.Item>
                <LinkContainer to="/admin/userlist">
                    <Nav.Link
                        eventKey="/admin/userlist"
                        // Active={path === '/admin/userlist'}
                        className="admin-header-nav-item"
                    >
                        <i className="fas fa-users" />
                        <span>USERS</span>
                    </Nav.Link>
                </LinkContainer>
            </Nav.Item>

            <Nav.Item>
                <LinkContainer to="/admin/productlist">
                    <Nav.Link
                        eventKey="/admin/productlist"
                        // Active={path === '/admin/productlist'}
                        className="admin-header-nav-item"
                    >
                        <i className="fas fa-tshirt" />
                        <span>PRODUCTS</span>
                    </Nav.Link>
                </LinkContainer>
            </Nav.Item>

            <Nav.Item>
                <LinkContainer to="/admin/orderlist">
                    <Nav.Link
                        eventKey="/admin/orderlist"
                        // Active={path === '/admin/orderlist'}
                        className="admin-header-nav-item"
                    >
                        <i className="fas fa-box-open" />
                        <span>ORDERS</span>
                    </Nav.Link>
                </LinkContainer>
            </Nav.Item>

            <Nav.Item>
                <LinkContainer to="/admin/schoollist">
                    <Nav.Link
                        href="/admin/schoollist"
                        eventKey="/admin/schoollist"
                        // Active={path === '/admin/schoollist'}
                        className="admin-header-nav-item"
                    >
                        <i className="fas fa-graduation-cap" />
                        <span>SCHOOLS</span>
                    </Nav.Link>
                </LinkContainer>
            </Nav.Item>

            <Nav.Item>
                <LinkContainer to="/admin/typelist">
                    <Nav.Link
                        eventKey="/admin/typelist"
                        // Active={path === '/admin/typelist'}
                        className="admin-header-nav-item"
                    >
                        <i className="fas fa-th" />
                        <span>PRODUCT TYPE</span>
                    </Nav.Link>
                </LinkContainer>
            </Nav.Item>
            <Nav.Item>
                <LinkContainer to="/admin/homepage">
                    <Nav.Link
                        eventKey="/admin/homepage"
                        // Active={path === '/admin/homepage'}
                        className="admin-header-nav-item"
                    >
                        <i className="fas fa-home" />
                        <span>HOMEPAGE</span>
                    </Nav.Link>
                </LinkContainer>
            </Nav.Item>
            <Nav.Item>
                <LinkContainer to="/admin/extra">
                    <Nav.Link
                        eventKey="/admin/extra"
                        // Active={path === '/admin/extra'}
                        className="admin-header-nav-item"
                    >
                        <i className="fas fa-sliders-h" />
                        <span>EXTRA ACTIVITY</span>
                    </Nav.Link>
                </LinkContainer>
            </Nav.Item>
        </Nav>
    );
};

export default AdminHeader;
