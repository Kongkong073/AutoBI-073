import { StopOutlined } from '@ant-design/icons';
import React, { Component, ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false }; // 初始化 state，表示是否发生错误
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    // 更新 state 以便下次渲染可以显示备用 UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 你可以在这里记录错误信息，例如发送到一个日志服务
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false }); // 重置错误状态
  };

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <StopOutlined /> 无法加载
        </div>
      );
    }

    // 如果没有错误，正常渲染子组件
    return this.props.children;
  }
}

export default ErrorBoundary;
