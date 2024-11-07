import { useState, useRef, useEffect } from 'react';
import { genChartByAiUsingPost } from '@/services/AutoBI-073/chartController';
import React from 'react';
import '@/pages/User/CSS/login.css';
import TextArea from 'antd/es/input/TextArea';
import { Button, Form, Input, Select, Space, Upload, Row, Col, Modal, Spin, Typography } from 'antd';
import { CaretRightOutlined, DownloadOutlined, InboxOutlined } from '@ant-design/icons';
import { message } from 'antd/lib';
import ReactECharts from 'echarts-for-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coy } from 'react-syntax-highlighter/dist/esm/styles/prism'; // 选择一个
import prettier from 'prettier/standalone';
import parserBabel from 'prettier/parser-babel';
import { Color } from 'antd/es/color-picker';
import { Divider } from 'rc-menu';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import RcResizeObserver from 'rc-resize-observer';
import { Controlled as CodeMirror } from 'react-codemirror2';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/theme/idea.css';
import '@/pages/EditChart/index.css';
import { useLocation } from 'react-router-dom';

const EditChart: React.FC = () => {
  const location = useLocation();

  const [inputCode, setInputCode] = useState('');
  const [chartOption, setChartOption] = useState(null);
  const chartRef = useRef(null);
  useEffect(() => {
    // 如果存在传递的数据，设置为代码框的内容
    if (location.state && location.state.code) {
      setInputCode(location.state.code);
    }
  }, [location.state]);

  const handleRun = () => {
    try {
      // 使用 Function 解析用户输入的代码并生成 chartOption
      const parsedOption = new Function('return ' + inputCode)();
      
      // 判断解析后的配置是否为对象
      if (typeof parsedOption === 'object' && parsedOption !== null) {
        parsedOption.grid = parsedOption.grid || { left: '15%', right: '15%', top: '10%', bottom: '10%' };
        setChartOption(parsedOption);
        // message.success('ECharts 配置生成成功');
      } else {
        message.error("无法返回有效的Echarts图表");
        // throw new Error('输入的代码没有返回有效的 ECharts 配置对象');
      }
    } catch (error) {
      // 捕获错误并显示消息
      console.error('代码执行错误:', error);
      message.error('代码执行失败，请检查输入的代码格式是否正确');
      setChartOption(null); // 重置 chartOption 为空，清空之前的错误显示
    }
  };
  

      // 下载图片方法
      const downloadImage = () => {
        if (chartRef.current) {
          const chartInstance = chartRef.current.getEchartsInstance();
          const img = chartInstance.getDataURL({
            type: 'png',
            pixelRatio: 2,
            backgroundColor: '#fff',
          });
      
          // 创建下载链接并触发下载
          const link = document.createElement('a');
          link.href = img;
          link.download = 'chart.png';
          link.click();
        } else {
          console.error('Chart instance not found');
        }
      };


  return (
    <div style={{ height: '92vh', overflow: 'auto' }} >
        <ProCard
            title="编辑图表"
            // split={responsive ? 'horizontal' : 'vertical'}
            // bordered={false}
            headerBordered
            style={{ height: '100%',  display: 'flex', padding: '0px' }}
            gutter={20}
            bodyStyle={{ padding: '0px' }} 
 
        >
            <ProCard 
             colSpan="46%"
              style={{
                flex: 1,
                height: '100%',
                borderRadius: '8px',
                // boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              bodyStyle={{ padding: '10px' }}
              
            >
                <div>


    <CodeMirror 
        value={inputCode}
        options={{
          mode: 'javascript',
          theme: 'idea',
          lineNumbers: true,
          indentUnit: 4,
          tabSize: 4,
          indentWithTabs: true,
          readOnly: false,
          autoCloseBrackets: true,
          matchBrackets: true,
          foldGutter: true,
          gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
          highlightSelectionMatches: { showToken: /\w/, annotateScrollbar: true },
          styleActiveLine: true,
          scrollbarStyle: 'native',

        }}
        onBeforeChange={(editor, data, value) => {
          setInputCode(value);
        }}
        
      />
                
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
            type="primary"
            onClick={handleRun}
            style={{
                marginTop: '16px',
                marginBottom: '0px',
                width: '12vh',
                height: '4vh',
                fontSize: '1rem', // 调整文字大小
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px', // 控制图标和文字之间的距离
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            }}
            icon={<CaretRightOutlined style={{ fontSize: '1.2rem' }} />} // 调整图标大小
        >
            <strong>Run</strong>
        </Button>
    </div>

                </div>
            </ProCard>

            <ProCard
              style={{
                flex: 1,
                height: '100%',
                borderRadius: '8px',
                // boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              bodyStyle={{paddingLeft: '50px'}}
            >
              <div >
              {chartOption && 
                (<ReactECharts 
                  ref={chartRef}
                  option={chartOption} 
                style={{ width: '90%', height: '80%',minheight: '60vh',
                          position: 'absolute',
                          top: '50%',
                          left: '48%',
                          transform: 'translate(-50%, -50%)',
                }}/>)}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>

                <Button
                  type="primary"
                  onClick={downloadImage}
                  style={{
                      marginTop: '16px',
                      marginBottom: '0px',
                      width: '13vh',
                      height: '3vh',
                      fontSize: '0.8rem', // 调整文字大小
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px', // 控制图标和文字之间的距离
                      // boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                      backgroundColor: 'white',
                      color: 'darkgrey',
                      border: '1px solid #e0e0e0'

                  }}
              >
                <DownloadOutlined />
                  下载图表
              </Button>
            </div>
            </ProCard>
        </ProCard>
</div>

  );
};

export default EditChart;
