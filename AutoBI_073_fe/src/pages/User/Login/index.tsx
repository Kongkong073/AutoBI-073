import { Footer } from '@/components';
import { login } from '@/services/ant-design-pro/api';
import { getFakeCaptcha } from '@/services/ant-design-pro/login';
import { useEffect } from 'react';
import { listChartByPageUsingPost } from '@/services/AutoBI-073/chartController';
import { LockOutlined, MobileOutlined, UserOutlined } from '@ant-design/icons';
import {
  LoginForm,
  ProFormCaptcha,
  ProFormCheckbox,
  ProFormText,
} from '@ant-design/pro-components';
import { FormattedMessage, history, SelectLang, useIntl, useModel, Helmet } from '@umijs/max';
import { Alert, message, notification, Tabs } from 'antd';
import Settings from '../../../../config/defaultSettings';
import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import { createStyles } from 'antd-style';
import '@/pages/User/CSS/login.css';
import { Link, useLocation } from 'react-router-dom';
import { getLoginUserUsingGet, userLoginUsingPost } from '@/services/AutoBI-073/userController';
import { ConfigProvider } from 'antd';


const useStyles = createStyles(({ token }) => {
  return {
    action: {
      marginLeft: '8px',
      color: 'rgba(0, 0, 0, 0.2)',
      fontSize: '24px',
      verticalAlign: 'middle',
      cursor: 'pointer',
      transition: 'color 0.3s',
      '&:hover': {
        color: token.colorPrimaryActive,
      },
    },
    lang: {
      width: 42,
      height: 42,
      lineHeight: '42px',
      position: 'fixed',
      right: 16,
      borderRadius: token.borderRadius,
      ':hover': {
        backgroundColor: token.colorBgTextHover,
      },
    },
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'auto',
      backgroundImage:
        "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')",
      backgroundSize: '100% 100%',
    },
  };
});


const Lang = () => {
  const { styles } = useStyles();

  return (
    <div className={styles.lang} data-lang>
      {SelectLang && <SelectLang />}
    </div>
  );
};


const Login: React.FC = () => {
  const [userLoginState, setUserLoginState] = useState<API.LoginResult>({});
  const [type, setType] = useState<string>('account');
  const { initialState, setInitialState } = useModel('@@initialState');
  const { styles } = useStyles();
  const intl = useIntl();
  const location = useLocation();
  
  useEffect(() => {
    return () => {
      notification.destroy();
    };
  }, [location.pathname]);
  
  useEffect(() => {
    notification.open({
      message: '游客账号',
      description: (
        <div>
          <p style={{ display: 'flex', alignItems: 'center', margin: 0 }}>
            <UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            <strong>用户名:</strong> <span style={{ marginLeft: 4 }}>client</span>
          </p>
          <p style={{ display: 'flex', alignItems: 'center', margin: 0, marginTop: 8 }}>
            <LockOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            <strong>密码:</strong> <span style={{ marginLeft: 4 }}>12345678</span>
          </p>
        </div>
      ),
      placement: 'topRight',
      duration: 0,
      style: {
        width: 300,
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
    });
  }, []);

  useEffect(()=>{
    listChartByPageUsingPost({}).then(res => {
      console.error('res',res)
    })
  })
  
  const fetchUserInfo = async () => {
    const userInfo = await getLoginUserUsingGet();
    console.log('userInfo');
    console.log(userInfo);
    if (userInfo) {
      flushSync(() => {
        setInitialState((s) => ({
          ...s,
          currentUser: userInfo.data,
        }));
      });
    }
  };

  const handleSubmit = async (values: API.UserLoginRequest) => {
    try {
      // 登录
      const res = await userLoginUsingPost(values);
      if (res.code === 0) {
        const defaultLoginSuccessMessage = intl.formatMessage({
          id: 'pages.login.success',
          defaultMessage: '登录成功！',
        });
        message.success(defaultLoginSuccessMessage);
        await fetchUserInfo();
        console.log(initialState);
        const urlParams = new URL(window.location.href).searchParams;
        history.push(urlParams.get('redirect') || '/');
        return;
      }else{
        message.error(res.message);
      }
    } catch (error) {
      const defaultLoginFailureMessage = intl.formatMessage({
        id: 'pages.login.failure',
        defaultMessage: '登录失败，请重试！',
      });
      console.log(error);
      message.error(defaultLoginFailureMessage);
    }
  };
  const { status, type: loginType } = userLoginState;

  // return (
  //   <div className={styles.container}>
  //     <Helmet>
  //       <title>
  //         {intl.formatMessage({
  //           id: 'menu.login',
  //           defaultMessage: '登录页',
  //         })}
  //         - {Settings.title}
  //       </title>
  //     </Helmet>
  //     <Lang />
  //     <div
  //       style={{
  //         flex: '1',
  //         padding: '10vh 0',
  //       }}
  //     >
  //       {/* 在页面右边添加图片 */}


  //     {/* 右边登录表单 */}
  //     <LoginForm
  //           contentStyle={{
  //             minWidth: 280,
  //             maxWidth: '75vw',
  //           }}
  //           logo={<img alt="logo" src="/logo.svg" />}
  //           title="AutoBI-073"
  //           subTitle={intl.formatMessage({ id: 'AIGC 数据分析平台' })}
            
            
  //           // initialValues={{
  //           //   autoLogin: true,
  //           // }}
  //           // actions={[
  //           //   <FormattedMessage
  //           //     key="loginWith"
  //           //     id="pages.login.loginWith"
  //           //     defaultMessage="其他登录方式"
  //           //   />,
  //           //   <ActionIcons key="icons" />,
  //           // ]}
  //           onFinish={async (values) => {
  //             await handleSubmit(values as API.UserLoginRequest);
  //           }}
  //         >
  //           <Tabs
  //             activeKey={type}
  //             onChange={setType}
  //             centered
  //             items={[
  //               {
  //                 key: 'account',
  //                 label: intl.formatMessage({
  //                   id: 'pages.login.accountLogin.tab',
  //                   defaultMessage: '账户密码登录',
  //                 }),
  //               },
  //               {
  //                 key: 'email',
  //                 label: intl.formatMessage({
  //                   id: 'pages.login.phoneLogin.tab',
  //                   defaultMessage: '邮箱登录',
  //                 }),
  //               },
  //             ]}
  //           />

  //           {/* {status === 'error' && loginType === 'account' && (
  //             <LoginMessage
  //               content={intl.formatMessage({
  //                 id: 'pages.login.accountLogin.errorMessage',
  //                 defaultMessage: '账户或密码错误',
  //               })}
  //             />
  //           )} */}
  //           {type === 'account' && (
  //             <>
  //               <ProFormText
  //                 name="userAccount"
  //                 fieldProps={{
  //                   size: 'large',
  //                   prefix: <UserOutlined />,
  //                 }}
  //                 placeholder={intl.formatMessage({
  //                   id: 'pages.login.username.placeholder',
  //                   defaultMessage: '用户名',
  //                 })}
  //                 rules={[
  //                   {
  //                     required: true,
  //                     message: (
  //                       <FormattedMessage
  //                         id="pages.login.username.required"
  //                         defaultMessage="请输入用户名!"
  //                       />
  //                     ),
  //                   },
  //                 ]}
  //               />
  //               <ProFormText.Password
  //                 name="userPassword"
  //                 fieldProps={{
  //                   size: 'large',
  //                   prefix: <LockOutlined />,
  //                 }}
  //                 placeholder={intl.formatMessage({
  //                   id: 'pages.login.password.placeholder',
  //                   defaultMessage: '请输入密码',
  //                 })}
  //                 rules={[
  //                   {
  //                     required: true,
  //                     message: (
  //                       <FormattedMessage
  //                         id="pages.login.password.required"
  //                         defaultMessage="请输入密码！"
  //                       />
  //                     ),
  //                   },
  //                 ]}
  //               />
  //             </>
  //           )}

  //         {/* {status === 'error' && loginType === 'email' && <LoginMessage content="验证码错误" />} */}
  //         {type === 'email' && (
  //           <>
  //             <ProFormText
  //               fieldProps={{
  //                 size: 'large',
  //                 prefix: <MobileOutlined />,
  //               }}
  //               name="mobile"
  //               placeholder={intl.formatMessage({
  //                 id: 'pages.login.phoneNumber.placeholder',
  //                 defaultMessage: '邮箱',
  //               })}
  //               rules={[
  //                 {
  //                   required: true,
  //                   message: (
  //                     <FormattedMessage
  //                       id="pages.login.phoneNumber.required"
  //                       defaultMessage="请输入邮箱！"
  //                     />
  //                   ),
  //                 },
  //                 {
  //                   pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
  //                   message: (
  //                     <FormattedMessage
  //                       id="pages.login.phoneNumber.invalid"
  //                       defaultMessage="邮箱格式错误！"
  //                     />
  //                   ),
  //                 },
  //               ]}
  //             />
  //             <ProFormCaptcha
  //               fieldProps={{
  //                 size: 'large',
  //                 prefix: <LockOutlined />,
  //               }}
  //               captchaProps={{
  //                 size: 'large',
  //               }}
  //               placeholder={intl.formatMessage({
  //                 id: 'pages.login.captcha.placeholder',
  //                 defaultMessage: '请输入验证码',
  //               })}
  //               captchaTextRender={(timing, count) => {
  //                 if (timing) {
  //                   return `${count} ${intl.formatMessage({
  //                     id: 'pages.getCaptchaSecondText',
  //                     defaultMessage: '获取验证码',
  //                   })}`;
  //                 }
  //                 return intl.formatMessage({
  //                   id: 'pages.login.phoneLogin.getVerificationCode',
  //                   defaultMessage: '获取验证码',
  //                 });
  //               }}
  //               name="captcha"
  //               rules={[
  //                 {
  //                   required: true,
  //                   message: (
  //                     <FormattedMessage
  //                       id="pages.login.captcha.required"
  //                       defaultMessage="请输入验证码！"
  //                     />
  //                   ),
  //                 },
  //               ]}
  //               onGetCaptcha={async (phone) => {
  //                 const result = await getFakeCaptcha({
  //                   phone,
  //                 });
  //                 if (!result) {
  //                   return;
  //                 }
  //                 message.success('获取验证码成功！验证码为：1234');
  //               }}
  //             />
  //           </>
  //         )}

  //           <div
  //             style={{
  //               marginBottom: 30,
  //             }}
  //           >
  //             <ProFormCheckbox noStyle name="autoLogin">
  //               <FormattedMessage id="pages.login.rememberMe" defaultMessage="自动登录" />
  //             </ProFormCheckbox>

  //             <Link
  //               to='/user/register'
  //               style={{
  //               float: 'right',
  //               }}
  //             >
  //             <FormattedMessage id="pages.login.forgotPassword" defaultMessage="新用户注册" />
  //             </Link>
  //           </div>
  //         </LoginForm>


      

  //     </div>
  //     <Footer />
  //   </div>
  // );
  
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#52C41A', // 设置登录页面的主色
        },
      }}
    >
      <div className={styles.container}>
        <Helmet>
          <title>
            {intl.formatMessage({
              id: 'menu.login',
              defaultMessage: '登录页',
            })}
            - {Settings.title}
          </title>
        </Helmet>
        <Lang />
        <div
          style={{
            flex: '1',
            padding: '10vh 0',
          }}
        >
          <LoginForm
            contentStyle={{
              minWidth: 280,
              maxWidth: '75vw',
            }}
            logo={<img alt="logo" src="/logo.svg" />}
            title="AutoBI-073"
            subTitle={intl.formatMessage({ id: 'AIGC 数据分析平台' })}
            onFinish={async (values) => {
              await handleSubmit(values as API.UserLoginRequest);
            }}
          >
            <Tabs
              activeKey={type}
              onChange={setType}
              centered
              items={[
                {
                  key: 'account',
                  label: intl.formatMessage({
                    id: 'pages.login.accountLogin.tab',
                    defaultMessage: '账户密码登录',
                  }),
                },
                {
                  key: 'email',
                  label: intl.formatMessage({
                    id: 'pages.login.phoneLogin.tab',
                    defaultMessage: '邮箱登录',
                  }),
                },
              ]}
            />
            {type === 'account' && (
              <>
                <ProFormText
                  name="userAccount"
                  fieldProps={{
                    size: 'large',
                    prefix: <UserOutlined />,
                  }}
                  placeholder={intl.formatMessage({
                    id: 'pages.login.username.placeholder',
                    defaultMessage: '用户名',
                  })}
                  rules={[
                    {
                      required: true,
                      message: (
                        <FormattedMessage
                          id="pages.login.username.required"
                          defaultMessage="请输入用户名!"
                        />
                      ),
                    },
                  ]}
                />
                <ProFormText.Password
                  name="userPassword"
                  fieldProps={{
                    size: 'large',
                    prefix: <LockOutlined />,
                  }}
                  placeholder={intl.formatMessage({
                    id: 'pages.login.password.placeholder',
                    defaultMessage: '请输入密码',
                  })}
                  rules={[
                    {
                      required: true,
                      message: (
                        <FormattedMessage
                          id="pages.login.password.required"
                          defaultMessage="请输入密码！"
                        />
                      ),
                    },
                  ]}
                />
              </>
            )}
            {type === 'email' && (
              <>
                <ProFormText
                  fieldProps={{
                    size: 'large',
                    prefix: <MobileOutlined />,
                  }}
                  name="mobile"
                  placeholder={intl.formatMessage({
                    id: 'pages.login.phoneNumber.placeholder',
                    defaultMessage: '邮箱',
                  })}
                  rules={[
                    {
                      required: true,
                      message: (
                        <FormattedMessage
                          id="pages.login.phoneNumber.required"
                          defaultMessage="请输入邮箱！"
                        />
                      ),
                    },
                    {
                      pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
                      message: (
                        <FormattedMessage
                          id="pages.login.phoneNumber.invalid"
                          defaultMessage="邮箱格式错误！"
                        />
                      ),
                    },
                  ]}
                />
                <ProFormCaptcha
                  fieldProps={{
                    size: 'large',
                    prefix: <LockOutlined />,
                  }}
                  captchaProps={{
                    size: 'large',
                  }}
                  placeholder={intl.formatMessage({
                    id: 'pages.login.captcha.placeholder',
                    defaultMessage: '请输入验证码',
                  })}
                  name="captcha"
                  rules={[
                    {
                      required: true,
                      message: (
                        <FormattedMessage
                          id="pages.login.captcha.required"
                          defaultMessage="请输入验证码！"
                        />
                      ),
                    },
                  ]}
                  onGetCaptcha={async (phone) => {
                    const result = await getFakeCaptcha({
                      phone,
                    });
                    if (!result) {
                      return;
                    }
                    message.success('获取验证码成功！验证码为：1234');
                  }}
                />
              </>
            )}
            <div
              style={{
                marginBottom: 30,
              }}
            >
              <ProFormCheckbox noStyle name="autoLogin">
                <FormattedMessage id="pages.login.rememberMe" defaultMessage="自动登录" />
              </ProFormCheckbox>

              <Link
                to="/user/register"
                style={{
                  float: 'right',
                }}
              >
                <FormattedMessage id="pages.login.forgotPassword" defaultMessage="新用户注册" />
              </Link>
            </div>
          </LoginForm>
        </div>
        <Footer />
      </div>
    </ConfigProvider>
  );
};

export default Login;
