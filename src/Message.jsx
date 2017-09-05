import React from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';

// import PropTypes from 'prop-types';

// eslint-disable-next-line react/prefer-stateless-function
export default class Message extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      status: 'init',
      message: null,
      placeholderMessage: 'Type message to FB here...',
      err: null
    };

    this.cancelMessage = this.cancelMessage.bind(this);
    this.confirmMessage = this.confirmMessage.bind(this);
    this.postMessage = this.postMessage.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    this.setState({message: event.target.value});
  }

  postMessage(event) {
    this.setState(
      {
        status: 'post'
      }
    );
    // send message to post on the backend
  }

  cancelMessage() {
    this.setState(
      {
        status: 'init',
        message: null
      }
    );
  }

  confirmMessage(event) {
    this.setState(
      {
        status: 'confirm',
        message: event.target.value // needs to be the message that we're going to post
      }
    );
  }

  render() {
    let content;

    switch (this.state.status) {
      case 'errorThrottling':

        break;

      case 'errorGroups':

        break;

      case 'init':
        content = (
          <form action="" method="post">
            <textarea name="" onChange={this.handleChange} placeholder={this.state.placeholderMessage} id="" cols="30" rows="10"></textarea>
            <button type="button" className="btn btn-primary" onClick={confirmMessage()} >Post</button>
          </form>
        );
        break;

      case 'confirm':
        content = (
          <div>
            <p>
              This message will post to {this.state.groups} groups in your jurisdiction.
              OK to continue, cancel to edit
            </p>
            <button type="button" className="btn btn-secondary" onClick={cancelMessage()} >Cancel</button>
            <button type="button" className="btn btn-primary" onClick={postMessage()} >OK</button>
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

      default:
        throw new Error('Should not reach here');
    }
    return (
      <Message>
        {content}
      </Message>
    );
  }
}