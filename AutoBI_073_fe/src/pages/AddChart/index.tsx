import { useState, useRef, useEffect } from 'react';
import { genChartByAiUsingPost } from '@/services/AutoBI-073/chartController';
import React from 'react';
import '@/pages/User/CSS/login.css';
import TextArea from 'antd/es/input/TextArea';
import { Button, Form, Input, Select, Space, Upload, Row, Col, Modal, Spin, Typography, Alert, Switch } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { message } from 'antd/lib';
import ReactECharts from 'echarts-for-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coy } from 'react-syntax-highlighter/dist/esm/styles/prism'; // 选择一个
import prettier from 'prettier/standalone';
import parserBabel from 'prettier/parser-babel';
import { Color } from 'antd/es/color-picker';
import { Divider } from 'rc-menu';
import { ProCard } from '@ant-design/pro-components';
import ErrorBoundary from '@/components/ErrorBoundary';
import { showAvailableRequestsUsingGet } from '@/services/AutoBI-073/userRateLimitController';

/**
 * 添加图表页面
 * @constructor
 */
const AddChart: React.FC = () => {
    // 定义状态，用来接收后端的返回值，让它实时展示在页面上
    const [chart, setChart] = useState<API.BiResponse>();
    // 提交中的状态，默认未提交
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [option, setOption] = useState<any>("");
    const [code,setCode] = useState<string|undefined>("");
    const [isCustom, setIsCustom] = useState(false);
    const [customValue, setCustomValue] = useState("");
    const [selectedValue, setSelectedValue] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const chartRef = useRef(null);
    const [totalLimit, setTotalLimit] = useState<number>(0);
    const [dailyLimit, setDailyLimit] = useState<number>(0);

    const loadUserRateLimit = async() => {
      try {
      const res = await showAvailableRequestsUsingGet(); 
      if (res.data){
        setDailyLimit(res.data.remainingRequestsPerDay?? 0);
        setTotalLimit(res.data.totalRemainingRequests?? 0);
      }else {
        console.error("获取限流信息失败")
      }
      } catch (e: any) {
        message.error("获取限流信息失败: " + e.message)
      }
      
    }

      useEffect(() =>{
        loadUserRateLimit();
      }, [chart]);

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

      // 打开 Modal
    const showModal = () => {
      setIsModalVisible(true);
    };

    // 关闭 Modal
    const handleCancel = () => {
      setIsModalVisible(false);
    };
  
    const handleSelectChange = (value) => {
      setSelectedValue(value);
      if (value === '其他') {
        setIsCustom(true);
      } else {
        setIsCustom(false);
        setCustomValue('');
      }
    };
  
    const handleCustomInputChange = (e) => {
      const value = e.target.value;
      if (value.length <= 30) {
        setCustomValue(value);
      }
    };

    const formatCode = (code: string|undefined) => {
      if (code && typeof code === 'string') {
        try {
          return prettier.format(code, {
            parser: 'babel',
            plugins: [parserBabel],
          });
        } catch (error) {
          console.error('Prettier format failed:', error);
          message.error('代码格式化失败');
          return code; // 如果格式化失败，返回空字符串
        }
      } else {
        console.warn('Code is empty or not a valid string');
        return ''; // 如果code为空或非字符串，返回空字符串
      }
    };
    

      // 处理复制操作
    const handleCopy = () => {
      if (formatCode(code).length === 0) {
        message.error('无有效代码可复制');
        return;
      }

      navigator.clipboard.writeText(formatCode(code))
        .then(() => {
          message.success('代码已复制到剪贴板');
        })
        .catch((error) => {
          message.error('复制失败，请重试');
          console.error('Copy failed:', error);
        });
    };

  const normFile = (e: any) => {
    console.log('Upload event:', e);
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const onFinish =async (values: any) => {

    if (submitting) {
      return;
    }
    // 当开始提交，把submitting设置为true
    setSubmitting(true);
    setChart(undefined);
    setOption(undefined);
    setCode(undefined);
    
    if (selectedValue === '其他') {
      values.chartType = customValue;  // 将 customValue 动态赋值为 chartType
    } else {
      values.chartType = selectedValue;
    }

    const params = {
      ...values,
      // fileObj : undefined
      dragger : undefined
    }
    console.log(params)
    console.log(values.dragger[0])

    // try {
    //   // 需要取到上传的原始数据file→file→originFileObj(原始数据)
    //   const res = await genChartByAiUsingPost(params, {}, values.dragger[0].originFileObj);
    //   // 正常情况下，如果没有返回值就分析失败，有，就分析成功
    //   if (!res?.data) {
    //     message.error('分析失败');
    //   } else {
    //     message.success('分析成功');  
    //     setChart(res.data);
    //     setCode((res.data.genJsEchartCode?.toString() || '')
    //     .replace(/\\n/g, "")          
    //     .replace(/\s+/g, " ")         
    //     .replace(/\"/g, "\""));
    //     // 解析成对象，为空则设为空字符串
    //     // const chartOption = JSON.parse(JSON.parse(res.data.genChart ?? ''));
    //     console.info(code);
    //     const formattedCode2 = formatCode(code);
    //     console.info(formattedCode2);
    //     const chartOption = new Function('return ' + formattedCode2)();
    //     console.log("chartOption: ", chartOption);
    //     if (typeof chartOption !== 'object' && chartOption === null) {
    //       message.error('图表代码解析错误')
    //     } else {
    //       // 从后端得到响应结果之后，把响应结果设置到图表状态里
    //       chartOption.grid = chartOption.grid || { left: '15%', right: '15%', top: '10%', bottom: '10%' };
    //       setOption(chartOption);
          
    //     }
    //   }  
    // // 异常情况下，提示分析失败+具体失败原因
    // } catch (e: any) {
    //   message.error('分析失败,' + e.message);
    // }
    // 当结束提交，把submitting设置为false
    
    try {
      // 获取上传的文件对象
      const res = await genChartByAiUsingPost(params, {}, values.dragger[0].originFileObj);
  
      if (res?.code === 40100){
        message.error(res.message);
        return;
      }else if (res?.code === 42900){
        message.error(res.message);
        return;
      }

      // 检查返回的数据
      if (!res?.data) {
        message.error('分析失败');
      } else {
        message.success('分析成功');  
        setChart(res.data);
  
        // 处理返回的代码字符串
        const rawCode = (res.data.genJsEchartCode?.toString() || '')
          .replace(/\\n/g, "")
          .replace(/\s+/g, " ")
          .replace(/\"/g, "\"");
  
        setCode(rawCode);
  
        // 格式化代码
        const formattedCode = formatCode(rawCode);
        console.info(formattedCode);
  
        try {
          // 将字符串解析为对象
          const chartOption = new Function('return ' + formattedCode)();
          console.log("chartOption: ", chartOption);
  
          if (typeof chartOption !== 'object' || chartOption === null) {
            message.error('图表代码解析错误');
          } else {
            // 设置图表的 grid 属性并更新 option
            chartOption.grid = chartOption.grid || { left: '15%', right: '15%', top: '10%', bottom: '10%' };
            setOption(chartOption);
          }
        } catch (parseError) {
          console.error("解析 chartOption 出错:", parseError);
          message.error("图表代码解析错误");
        }
      }
    } catch (e: any) {
      message.error('分析失败,' + e.message);
    }
    setSubmitting(false);
  };  

  const [visible, setVisible] = useState(true);

  const handleClose = () => {
    setVisible(false);
  };
  

  return (

    // 把页面内容指定一个类名add-chart
    <div className="add-chart">

    <Row gutter={[24,24]}>
      <Col span={12}
      xs={24} sm={24} md={12} lg={12} xl={12}
      >

        <ProCard title={
            <Typography.Title level={4} style={{ margin: 0 }}>
            用户输入
            </Typography.Title>}
        >
          <Form
            // 表单名称改为addChart
            name="addChart"
            onFinish={onFinish}
            // 初始化数据啥都不填，为空
            initialValues={{  }}
            labelAlign='left'
            labelCol={{span:4}}
            wrapperCol={{span:20}}
            style={{ paddingTop : '20px'}}
      >
      {/* 前端表单的name，对应后端接口请求参数里的字段，
      此处name对应后端分析目标goal,label是左侧的提示文本，
      rules=....是必填项提示*/}
      <Form.Item name="goal" label="分析输入" rules={[{ required: true, message: '请输入分析目标!' }]}>
          {/* placeholder文本框内的提示语 */}
          <TextArea maxLength={1000}
          autoSize={{ minRows: 6, maxRows: 6 }} 
          showCount 
           placeholder="请输入你的数据说明、分析需求、生成的图表细节。"/>
      </Form.Item>

      {/* 还要输入图表名称 */}
      <Form.Item name="name" label="图表名称">
          <Input placeholder="请输入图表名称" />
      </Form.Item>

      <Form.Item label="图表类型" name="chartType">
        <Select
          placeholder="请选择图表类型"
          onChange={handleSelectChange}
          value={selectedValue || ''}
          allowClear
          options={[
            { value: '折线图', label: '折线图 (Line Chart)' },
            { value: '柱状图', label: '柱状图 (Bar Chart)' },
            { value: '饼图', label: '饼图 (Pie Chart)' },
            { value: '散点图', label: '散点图 (Scatter Chart)' },
            { value: '雷达图', label: '雷达图 (Radar Chart)' },
            { value: '面积图', label: '面积图 (Area Chart)' },
            { value: '热力图', label: '热力图 (Heatmap)' },
            { value: '箱线图', label: '箱线图 (Boxplot)' },
            { value: '漏斗图', label: '漏斗图 (Funnel Chart)' },
            { value: '桑基图', label: '桑基图 (Sankey Diagram)' },
            { value: '仪表盘', label: '仪表盘 (Gauge)' },
            { value: '关系图', label: '关系图 (Graph)' },
            { value: '其他', label: '其他 (Other)' } // 允许用户自定义
          ]}
        />
        {isCustom && (
          <Input
            placeholder="请输入自定义图表类型"
            value={customValue}
            onChange={handleCustomInputChange}
            maxLength={30}
            style={{ marginTop: '8px' }}
          />
        )}
      </Form.Item>

          <Form.Item
          label="原始数据"
          >
          <Form.Item 
            name="dragger" 
            rules={[{ required: true, message: '请上传至少一个文件!' }]}
            valuePropName="fileList" 
            getValueFromEvent={normFile} noStyle>
              <Upload.Dragger name="files" action="/upload.do" maxCount={1} accept=".csv,.xls,.xlsx">
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽上传文件</p>
                <p className="ant-upload-hint">支持.csv, .xls, .xlsx文件</p>
              </Upload.Dragger>
            </Form.Item>
        </Form.Item>
        
        <Form.Item wrapperCol={{ span: 12, offset: 4 }}>
          <Space
            style={{justifyContent: 'center' }}
          >
            <Button type="primary" htmlType="submit" loading={submitting} disabled={submitting}
              style={{paddingLeft: '30px', paddingRight:'30px' }}
              >
              开始分析
            </Button>
            <Button htmlType="reset"
              style={{paddingLeft: '45px', paddingRight:'45px' }}
              >清空</Button>
            
          </Space>
        </Form.Item>
          </Form>
        </ProCard>

        <div>
  {/* <div style={{ color: 'gray', marginTop: '5px' }}>一共剩余{totalLimit} 次</div> */}
  <div style={{ color: 'gray', marginTop: '5px', marginLeft: '5px' }}>今日剩余 {dailyLimit} 次</div>
</div>
      </Col>

      <Col span={12}
      xs={24} sm={24} md={12} lg={12} xl={12}
      >
          <ProCard 
              type='default'
              title="分析结论：" 
              style={{ marginBottom: '20px' }}
              >
            <div
              dangerouslySetInnerHTML={{
                __html: chart?.genResult.replace(/\\n/g, '<br />'),
              }}
              />
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Spin spinning={submitting} size="default" tip="分析生成中..." />
            </div>

          </ProCard>
        

            <ProCard
              tabs={{
                type: 'card',
              }}
              style={{ width: '100%', height: '570px', overflow: 'visible'}}
            >
            <ProCard.TabPane key="tab1" tab="可视化图表"
              style={{ width: '100%', height: '100%'}}
            >
              <div>

                {option && (
                  <img
                    src="imgs/expand2.svg"
                    onClick={showModal}
                    style={{
                      width: '20px',
                      height: '20px',
                      marginLeft: '16px',
                      marginTop: '16px',
                    }}
                    alt="窗口显示"
                    title="窗口显示"
                  />
                )}

                {option && (
                  <img
                    src="imgs/download.svg"
                    onClick={downloadImage}
                    style={{
                      width: '20px',
                      height: '20px',
                      marginLeft: '26px',
                      marginTop: '16px',
                    }}
                    alt="下载图表"
                    title="下载图表"
                  />
                )}
              </div>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  minHeight: '450px',
                  marginTop: '16px',
                }}
                
              >
                {/* 检查option对象是否存在，如果存在，则渲染图表 */}
                {option && 
                (
                  <ErrorBoundary>
                    <ReactECharts 
                      ref={chartRef}
                      option={option} 
                      style={{ width: '100%', height: '100%', minheight: '400px',
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                    }}/>
                  </ErrorBoundary>
                )}
              
              </div>
               {/* 按钮触发 Modal */}
            
              
            </ProCard.TabPane>

            <ProCard.TabPane key="tab2" tab="EchartsJS代码">
                  <div>
                {/* <Input.TextArea
                  value={formattedCode}
                  onChange={(e) => setCode(e.target.value)}
                  autoSize={{ minRows: 10, maxRows: 20 }}
                  style={{ fontFamily: 'monospace', marginBottom: '16px' }}
                /> */}

                <SyntaxHighlighter language="javascript" 
                  style={coy}
                  customStyle={{
                    width: '100%',
                    height: '450px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', // 半透明背景
                    border: '1px solid #ddd',
                    borderRadius: '8px', // 增加圆角
                    padding: '0px',
                  }}
                  >
                    {formatCode(code)}
                  </SyntaxHighlighter>

                <Button
                  onClick={handleCopy}
                  type="primary"
                  style={{ marginTop: '16px', marginBottom: '16px' }}
                >
                  复制代码
                </Button>
              </div>
            </ProCard.TabPane>
          </ProCard>


      
      </Col>
    </Row>

    {/* 悬浮窗口 Modal */}
    <Modal
        title=""
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={800}
        height={600}
        centered
        bodyStyle={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 'auto', // Modal内容高度自适应
          padding: 0,
        }}
      >
        {/* ECharts 图表 */}
        <ReactECharts
          option={option}
          style={{ 
            width: '100%', height: '100%px', minHeight: '500px'
          }} 
        />
      </Modal>

  
    </div>

    
      
  );
};
export default AddChart;