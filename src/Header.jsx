import React from 'react';
import { Navbar, Nav, NavItem, NavDropdown, MenuItem, Glyphicon } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

const Header = () => (
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
        title={<Glyphicon glyph="option-horizontal" />}
        noCaret
      >
        <MenuItem>Logout</MenuItem>
      </NavDropdown>
    </Nav>
  </Navbar>
);

export default Header;
