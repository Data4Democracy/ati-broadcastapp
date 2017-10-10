import React from 'react';
import { Navbar, Nav, NavItem, NavDropdown, MenuItem } from 'react-bootstrap';
import propTypes from 'prop-types';
import { LinkContainer } from 'react-router-bootstrap';

const Header = props => (
  <Navbar fluid>
    <Navbar.Header>
      <Navbar.Brand>ATI Broadcast App</Navbar.Brand>
    </Navbar.Header>
    <Nav>
      <LinkContainer to="/some-path">
        <NavItem>Go somewhere</NavItem>
      </LinkContainer>
    </Nav>
    <Nav pullRight>
      <NavDropdown
        id="user-dropdown"
        title={`${props.user.firstName} ${props.user.lastName}`}
        noCaret
      >
        <LinkContainer to="/logout">
          <MenuItem>Logout</MenuItem>
        </LinkContainer>
      </NavDropdown>
    </Nav>
  </Navbar>
);

Header.propTypes = {
  user: propTypes.shape({
    states: propTypes.arrayOf(propTypes.string),
    firstName: propTypes.string,
    lastName: propTypes.string,
    isAdmin: propTypes.bool,
  }).isRequired,
};

export default Header;
