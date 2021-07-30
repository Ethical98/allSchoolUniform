import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { LinkContainer } from 'react-router-bootstrap';
import urlimage from '../seamlessschool-bg.png';

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,

    backgroundImage: `url(${urlimage})`,
  },
  tab: {
    minWidth: window.screen.width > 1200 && '12vw',
    width: window.screen.width > 1200 && '12vw',
  },
}));

const AdminHeader = () => {
  const classes = useStyles();

  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <div className={classes.root}>
      <AppBar
        position='static'
        style={{
          background: `#2c4a77 url(${urlimage})`,
          height: '10vh',
          marginTop: '-5vh',
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
            to='/admin/schoollist'
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
            to='/admin/homepage'
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
      </AppBar>
    </div>
  );
};

export default AdminHeader;
