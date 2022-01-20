import React from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import urlimage from '../seamlessschool-bg.png';
import { Nav } from 'react-bootstrap';
import './css/AdminHeader.css';

// function a11yProps(index) {
//   return {
//     id: `simple-tab-${index}`,
//     'aria-controls': `simple-tabpanel-${index}`,
//   };
// }

// const useStyles = makeStyles((theme) => ({
//   root: {
//     flexGrow: 1,
//     marginTop: '-10px',
//     backgroundImage: `url(${urlimage})`,
//   },
//   tab: {
//     minWidth: window.screen.width > 1200 && '12vw',
//     width: window.screen.width > 1200 && '12vw',
//   },
// }));

const AdminHeader = () => {
  // const location = useLocation();
  // const classes = useStyles();
  // const [value, setValue] = useState(0);
  // let path = location.pathname.toLowerCase();
  // useEffect(() => {
  //   let path = location.pathname.toLowerCase();
  //   console.log(path);
  //   if (path === '/admin/dashboard' && value !== 0) setValue(0);
  //   else if (path === '/admin/userlist' && value !== 1) setValue(1);
  //   else if (path === '/admin/productlist' && value !== 2) setValue(2);
  //   else if (path === '/admin/orderlist' && value !== 3) setValue(3);
  //   else if (path === '/admin/schoollist' && value !== 4) setValue(4);
  //   else if (path === '/admin/typelist' && value !== 5) setValue(5);
  //   else if (path === '/admin/homepage' && value !== 6) setValue(6);
  //   else if (path === '/admin/extra' && value !== 7) setValue(7);
  // }, [value, location.pathname]);

  // const handleChange = (event, newValue) => {
  //   setValue(newValue);
  // };

  return (
    <Nav
      justify
      variant='tabs'
      className='admin-header'
      style={{
        background: `#2c4a77 url(${urlimage})`,
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
        <LinkContainer to='/admin/dashboard'>
          <Nav.Link
            eventKey='/admin/dashboard'
            className='admin-header-nav-item'
          >
            <i className='fas fa-chart-bar' />
            <span>DASHBOARD</span>
          </Nav.Link>
        </LinkContainer>
      </Nav.Item>

      <Nav.Item>
        <LinkContainer to='/admin/userlist'>
          <Nav.Link
            eventKey='/admin/userlist'
            // active={path === '/admin/userlist'}
            className='admin-header-nav-item'
          >
            <i className='fas fa-users' />
            <span>USERS</span>
          </Nav.Link>
        </LinkContainer>
      </Nav.Item>

      <Nav.Item>
        <LinkContainer to='/admin/productlist'>
          <Nav.Link
            eventKey='/admin/productlist'
            // active={path === '/admin/productlist'}
            className='admin-header-nav-item'
          >
            <i className='fas fa-tshirt' />
            <span>PRODUCTS</span>
          </Nav.Link>
        </LinkContainer>
      </Nav.Item>

      <Nav.Item>
        <LinkContainer to='/admin/orderlist'>
          <Nav.Link
            eventKey='/admin/orderlist'
            // active={path === '/admin/orderlist'}
            className='admin-header-nav-item'
          >
            <i className='fas fa-box-open' />
            <span>ORDERS</span>
          </Nav.Link>
        </LinkContainer>
      </Nav.Item>

      <Nav.Item>
        <LinkContainer to='/admin/schoollist'>
          <Nav.Link
            href='/admin/schoollist'
            eventKey='/admin/schoollist'
            // active={path === '/admin/schoollist'}
            className='admin-header-nav-item'
          >
            <i className='fas fa-graduation-cap' />
            <span>SCHOOLS</span>
          </Nav.Link>
        </LinkContainer>
      </Nav.Item>

      <Nav.Item>
        <LinkContainer to='/admin/typelist'>
          <Nav.Link
            eventKey='/admin/typelist'
            // active={path === '/admin/typelist'}
            className='admin-header-nav-item'
          >
            <i className='fas fa-th' />
            <span>PRODUCT TYPE</span>
          </Nav.Link>
        </LinkContainer>
      </Nav.Item>
      <Nav.Item>
        <LinkContainer to='/admin/homepage'>
          <Nav.Link
            eventKey='/admin/homepage'
            // active={path === '/admin/homepage'}
            className='admin-header-nav-item'
          >
            <i className='fas fa-home' />
            <span>HOMEPAGE</span>
          </Nav.Link>
        </LinkContainer>
      </Nav.Item>
      <Nav.Item>
        <LinkContainer to='/admin/extra'>
          <Nav.Link
            eventKey='/admin/extra'
            // active={path === '/admin/extra'}
            className='admin-header-nav-item'
          >
            <i className='fas fa-sliders-h' />
            <span>EXTRA ACTIVITY</span>
          </Nav.Link>
        </LinkContainer>
      </Nav.Item>
    </Nav>
  );
};

export default AdminHeader;
