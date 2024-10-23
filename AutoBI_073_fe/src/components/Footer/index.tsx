import { GithubOutlined } from '@ant-design/icons';
import { DefaultFooter } from '@ant-design/pro-components';
import React from 'react';

const Footer: React.FC = () => {
  return (
    <DefaultFooter
      style={{
        background: 'none',
      }}
      links={[
        // {
        //   key: 'AutoBI-073',
        //   title: 'AutoBI-073',
        //   href: 'https://pro.ant.design',
        //   blankTarget: true,
        // },
        {
          key: 'github',
          title: <GithubOutlined />,
          // href: 'https://github.com/ant-design/ant-design-pro',
          href:'https://github.com/Kongkong073/AutoBI_073/tree/main',
          blankTarget: true,
        },
        {
          key: 'AutoBI-073',
          title: 'AutoBI-073',
          // href: 'https://ant.design',
          href:'https://github.com/Kongkong073/AutoBI_073/tree/main',
          blankTarget: true,
        },
      ]}
    />
  );
};

export default Footer;
