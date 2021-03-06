import React from 'react';
import { connect } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';
import {
  Button,
  LoginPage as LoginNext,
  LoginForm,
  ListItem,
  LoginFooterItem,
  BackgroundImageSrc
} from '@patternfly/react-core';
import { ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons';
import { KialiAppState, LoginSession, LoginStatus } from '../../store/Store';
import { AuthStrategy } from '../../types/Auth';
import { authenticationConfig, kialiLogo } from '../../config';
import { KialiAppAction } from '../../actions/KialiAppAction';
import LoginThunkActions from '../../actions/LoginThunkActions';

/**
 *
 * Background Images
 *
 * Fix for Firefox browser
 */

const bgFilter = require('../../img/background-filter.svg');
const pfBg576 = require('../../img/pfbg_576.jpg');
const pfBg576R2x = require('../../img/pfbg_576@2x.jpg');
const pfBg768 = require('../../img/pfbg_768.jpg');
const pfBg768R2x = require('../../img/pfbg_768@2x.jpg');
const pfBg1200 = require('../../img/pfbg_1200.jpg');

type LoginProps = {
  status: LoginStatus;
  session?: LoginSession;
  message?: string;
  error?: any;
  authenticate: (username: string, password: string) => void;
  checkCredentials: () => void;
};

type LoginState = {
  username: string;
  password: string;
  isValidUsername: boolean;
  isValidPassword: boolean;
  filledInputs: boolean;
  showHelperText: boolean;
  errorInput?: string;
};

export class LoginPage extends React.Component<LoginProps, LoginState> {
  static contextTypes = {
    store: () => null
  };
  constructor(props: LoginProps) {
    super(props);

    this.state = {
      username: '',
      password: '',
      isValidUsername: true,
      isValidPassword: true,
      filledInputs: false,
      showHelperText: false,
      errorInput: ''
    };
  }

  componentDidMount() {
    // handle initial path from the browser
    this.props.checkCredentials();

    const loginInput = document.getElementById('pf-login-username-id');
    if (loginInput) {
      loginInput.focus();
    }
  }

  handleUsernameChange = value => {
    this.setState({ username: value });
  };

  handlePasswordChange = passwordValue => {
    this.setState({ password: passwordValue });
  };

  handleSubmit = (e: any) => {
    e.preventDefault();

    if (authenticationConfig.strategy === AuthStrategy.openshift) {
      // If we are using OpenShift OAuth, take the user back to the OpenShift OAuth login
      window.location.href = authenticationConfig.authorizationEndpoint!;
    } else {
      this.setState({
        isValidUsername: !!this.state.username,
        isValidPassword: !!this.state.password,
        filledInputs: !!this.state.username && !!this.state.password
      });

      if (!!this.state.username && !!this.state.password && this.props.authenticate) {
        this.props.authenticate(this.state.username, this.state.password);
        this.setState({ showHelperText: false, errorInput: '' });
      } else {
        let message = 'Invalid login credentials.';
        message +=
          !!!this.state.username && !!!this.state.password
            ? 'Username and password are required.'
            : !!this.state.username
            ? 'Password is required.'
            : 'Username is required.';

        this.setState({
          showHelperText: true,
          errorInput: message,
          isValidUsername: false,
          isValidPassword: false
        });
      }
    }
  };
  renderMessage = (message: string | undefined, type?: string) => {
    if (!message) {
      return '';
    }
    const variant = type
      ? type
      : this.props.status === LoginStatus.error || this.state.filledInputs
      ? 'danger'
      : 'warning';
    const icon = variant === 'danger' ? <ExclamationCircleIcon /> : <ExclamationTriangleIcon />;
    return (
      <span
        key={message}
        style={{ color: variant === 'danger' ? '#c00' : '#f0ab00', fontWeight: 'bold', fontSize: 16 }}
      >
        {icon}
        &nbsp; {message}
      </span>
    );
  };

  getHelperMessage = () => {
    const messages: any[] = [];
    if (this.state.showHelperText) {
      messages.push(this.renderMessage(this.state.errorInput));
    }
    if (authenticationConfig.secretMissing) {
      messages.push(
        this.renderMessage(
          'The Kiali secret is missing. Users are prohibited from accessing Kiali until an administrator \
      creates a valid secret. Please refer to the Kiali documentation for more details.',
          'danger'
        )
      );
    }
    if (this.props.status === LoginStatus.expired) {
      messages.push(this.renderMessage('Your session has expired or was terminated in another window.', 'warning'));
    }
    if (!authenticationConfig.secretMissing && this.props.status === LoginStatus.error) {
      messages.push(this.props.message);
    }
    return messages;
  };

  render() {
    let loginLabel = 'Log In';
    if (authenticationConfig.strategy === AuthStrategy.openshift) {
      loginLabel = 'Log In With OpenShift';
    }
    /**
     * Note: When using background-filter.svg, you must also include #image_overlay as the fragment identifier
     */

    const backgroundLoginImg = {
      [BackgroundImageSrc.lg]: pfBg1200,
      [BackgroundImageSrc.sm]: pfBg768,
      [BackgroundImageSrc.sm2x]: pfBg768R2x,
      [BackgroundImageSrc.xs]: pfBg576,
      [BackgroundImageSrc.xs2x]: pfBg576R2x,
      [BackgroundImageSrc.filter]: `${bgFilter}#image_overlay`
    };

    const messages = this.getHelperMessage();

    const loginForm = (
      <LoginForm
        usernameLabel="Username"
        showHelperText={this.state.showHelperText || this.props.message !== '' || messages.length > 0}
        helperText={<>{messages}</>}
        usernameValue={this.state.username}
        onChangeUsername={this.handleUsernameChange}
        isValidUsername={this.state.isValidUsername && this.props.status !== LoginStatus.error}
        passwordLabel="Password"
        passwordValue={this.state.password}
        onChangePassword={this.handlePasswordChange}
        isValidPassword={this.state.isValidPassword && this.props.status !== LoginStatus.error}
        rememberMeAriaLabel="Remember me Checkbox"
        onLoginButtonClick={(e: any) => this.handleSubmit(e)}
        style={{ marginTop: '10px' }}
      />
    );

    const listItem = (
      <>
        <ListItem>
          <LoginFooterItem href="https://www.kiali.io/">Documentation</LoginFooterItem>
        </ListItem>
        <ListItem>
          <LoginFooterItem href="https://github.com/kiali/kiali">Contribute</LoginFooterItem>
        </ListItem>
      </>
    );
    return (
      <LoginNext
        footerListVariants="inline"
        brandImgSrc={kialiLogo}
        brandImgAlt="pf-logo"
        backgroundImgSrc={backgroundLoginImg}
        backgroundImgAlt="Images"
        footerListItems={listItem}
        textContent="Service Mesh Observability."
        loginTitle="Log in Kiali"
      >
        {authenticationConfig.strategy === AuthStrategy.login ? (
          loginForm
        ) : (
          <Button onClick={this.handleSubmit} style={{ width: '100%' }} variant="primary">
            {loginLabel}
          </Button>
        )}
      </LoginNext>
    );
  }
}

const mapStateToProps = (state: KialiAppState) => ({
  status: state.authentication.status,
  message: state.authentication.message
});

const mapDispatchToProps = (dispatch: ThunkDispatch<KialiAppState, void, KialiAppAction>) => ({
  authenticate: (username: string, password: string) => dispatch(LoginThunkActions.authenticate(username, password)),
  checkCredentials: () => dispatch(LoginThunkActions.checkCredentials())
});

const LoginPageContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(LoginPage);
export default LoginPageContainer;
