import React from 'react';
import PropTypes from 'prop-types';

import { deleteParseJson, printBackendError } from './common-client';
import googleLogOut from './googleLogOut';

class LogOutMain extends React.Component {
  constructor(props) {
    super(props);
    this._isMounted = true;
    this.state = {
      //  an error message. null if we are waiting
      message: null,
    };

    //  note that we take a little care not to call setState after
    //  component has unmounted
    deleteParseJson('/api/login')
      .then(
        async (response) => {
          if (!this._isMounted) return;
          if (response.error) {
            this.setState(
              { message: printBackendError(response, true) });
          } else {
            let isError = false;
            try {
              await googleLogOut();
              if (!this._isMounted) return;
            } catch (e) {
              if (!this._isMounted) return;
              isError = true;
              this.setState(
                { message: `Error logging out of Google:\n${e.message}` });
            }
            if (!isError) window.location.href = '/';
          }
        },
        (e) => {
          if (!this._isMounted) return;
          this.setState({ message: e.message });
        });
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    if (this.state.message) {
      return (
        <h4 style={{ color: 'red' }}>{this.state.message}</h4>
      );
    } else {
      return (
        <h1>Waiting on server response</h1>
      );
    }
  }
}

//  this wrapper just takes care of recreating LogOutMain when component is
//  reloaded
// eslint-disable-next-line react/no-multi-comp
class LogOut extends React.Component {
  constructor(props) {
    super(props);
    this.state = { key: 0 };
    this.props.history.listen((location, action) => {
      this.setState({ key: this.state.key + 1 });
    });
  }

  render() {
    return (
      <LogOutMain
        key={this.state.key.toString()}
      />);
  }
}

LogOut.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  history: PropTypes.object.isRequired,
};

export default LogOut;
