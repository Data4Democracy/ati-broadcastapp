import React from 'react';
import { Link } from 'react-router-dom';

// import PropTypes from 'prop-types';

// eslint-disable-next-line react/prefer-stateless-function

export default class PostMessage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      status: 'editing',
      message: null,
      err: null,
    };

    this.placeholderMessage = 'Type message to FB here...';
    this.cancelMessage = this.cancelMessage.bind(this);
    this.confirmMessage = this.confirmMessage.bind(this);
    this.postMessage = this.postMessage.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    this.setState({ message: event.target.value });
  }

  postMessage(event) {
    event.preventDefault();

    this.setState(
      {
        status: 'post',
      },
    );
    // send message to post on the backend
  }

  cancelMessage(event) {
    event.preventDefault();
    this.setState(
      {
        status: 'editing',
        message: null,
      },
    );
  }

  confirmMessage(event) {
    event.preventDefault();
    this.setState(
      {
        status: 'confirm',
        message: document.getElementById('edit-message').value,
      },
    );
  }

  render() {
    let content;

    const confirmationMessage = this.state.status === 'editing' ? null :
    (<div>
      <p
        style={{ marginTop: '0.5em' }}
      >
        This message will post to all
        groups in your jurisdiction.
        OK to continue, cancel to continue
        editing.
      </p>
    </div>);

    const confirmationButton =
    (<div>
      <button
        type="button"
        className="btn btn-primary"
        onClick={this.confirmMessage}
        disabled={this.state.status !== 'editing'}
      >Post
      </button>
    </div>);

    const editMessage =
    (<div>
      <textarea
        name=""
        placeholder={this.placeholderMessage}
        id="edit-message"
        cols="30"
        rows="10"
        disabled={this.state.status !== 'editing'}
      />
    </div>);

    switch (this.state.status) {
      case 'errorThrottling':

        break;

      case 'errorGroups':

        break;

      case 'editing':
        content = (
          <div>
            <form action="" method="post">
              {editMessage}
            </form>
            {confirmationButton}
          </div>
        );
        break;

      case 'confirm':

        content = (
          <div>
            <form action="" method="post">
              {editMessage}
            </form>
            {confirmationButton}
            {confirmationMessage}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={this.cancelMessage}
            >Cancel
            </button>
            <span
              style={{ margin: '0.5em' }}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={this.postMessage}
            >OK
            </button>
          </div>
        );
        break;

      case 'post':
        // content = (
        // content for posting a message? Maybe a loading/wait animation?
        // );
        break;

      case 'success':
        content = (
          <div>
            <p>Your message has been successfully posted!</p>
            <Link to="/">Return to main screen</Link>
          </div>
        );
        break;

      default:
        throw new Error('Should not reach here');
    }

    return (
      <div>
        {content}
        <Link to="/">Back to home</Link>
      </div>
    );
  }
}
