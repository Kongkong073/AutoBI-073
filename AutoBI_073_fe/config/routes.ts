export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        name: '登录注册',
        path: '/user/login',
        component: './User/Login',
      },
    ],
  },
  
  {
    path: '/mycharts',
    name: '我的图表',
    icon: 'home',
    component: './MyCharts',
  },
  {
    path: '/addchart',
    name: '新建分析',
    icon: 'PlayCircle',
    component: './AddChart',
  },
  {
    path: '/admin',
    name: 'admin',
    icon: 'crown',
    access: 'canAdmin',
    routes: [
      {
        path: '/admin',
        redirect: '/admin/sub-page',
      },
      {
        path: '/admin/sub-page',
        name: 'sub-page',
        component: './Admin',
      },
    ],
  },
  {
    name: '编辑图表',
    icon: 'edit',
    path: '/editchart',
    component: './EditChart',
  },
  {
    path: '/',
    redirect: '/mycharts',
  },
  {
    path: '*',
    layout: false,
    component: './404',
  },
];