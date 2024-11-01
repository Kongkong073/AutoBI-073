import { useEffect, useState } from 'react';
import { genChartByAiUsingPost, listChartByPageUsingPost } from '@/services/AutoBI-073/chartController';
import React from 'react';
import '@/pages/User/CSS/login.css';
import TextArea from 'antd/es/input/TextArea';
import { Button, Form, Input, Select, Space, Upload, Typography, Row, Col, Card } from 'antd';
import { InboxOutlined, UploadOutlined } from '@ant-design/icons';
import { message } from 'antd/lib';
import ReactECharts from 'echarts-for-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coy } from 'react-syntax-highlighter/dist/esm/styles/prism'; // 选择一个
import prettier from 'prettier/standalone';
import parserBabel from 'prettier/parser-babel';
import { Color } from 'antd/es/color-picker';
import { Divider } from 'rc-menu';
import { ProCard } from '@ant-design/pro-components';

/**
 * 添加图表页面
 * @constructor
 */
const AddChart: React.FC = () => {
    // 定义状态，用来接收后端的返回值，让它实时展示在页面上
    const [chart, setChart] = useState<API.BiResponse>();
    // 提交中的状态，默认未提交
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [option, setOption] = useState<any>();
    const { Paragraph, Text } = Typography;
    const code = (chart?.genJsEchartCode || "")
    .replace(/\\n/g, "")          
    .replace(/\s+/g, " ")         
    .replace(/\"/g, "\"");

  // 使用 prettier 格式化 JavaScript 代码
  const formattedCode =code
    ? prettier.format(code, {
        parser: 'babel',
        plugins: [parserBabel],
      })
    : '';

  const handleCopy = () => {
  navigator.clipboard.writeText(formattedCode)
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

    const params = {
      ...values,
      // fileObj : undefined
      dragger : undefined
    }
    console.log(params)
    console.log(values.dragger[0])

    try {
      // 需要取到上传的原始数据file→file→originFileObj(原始数据)
      const res = await genChartByAiUsingPost(params, {}, values.dragger[0].originFileObj);
      // 正常情况下，如果没有返回值就分析失败，有，就分析成功
      if (!res?.data) {
        message.error('分析失败');
      } else {
        message.success('分析成功');  
        // 解析成对象，为空则设为空字符串
        const chartOption = JSON.parse(JSON.parse(res.data.genChart ?? ''));
        // 如果为空，则抛出异常，并提示'图表代码解析错误'
        if (!chartOption) {
          throw new Error('图表代码解析错误')
        // 如果成功
        } else {
          // 从后端得到响应结果之后，把响应结果设置到图表状态里
          setChart(res.data);
          setOption(chartOption);
        }
      }  
    // 异常情况下，提示分析失败+具体失败原因
    } catch (e: any) {
      message.error('分析失败,' + e.message);
    }
    // 当结束提交，把submitting设置为false
    setSubmitting(false);
  };  
  

  return (

    // 把页面内容指定一个类名add-chart
    <div className="add-chart">

    <Row gutter={[24,24]}>
      <Col span={12}>
        <ProCard title="上传文件">
          <Form
            // 表单名称改为addChart
            name="addChart"
            onFinish={onFinish}
            // 初始化数据啥都不填，为空
            initialValues={{  }}
      >
      {/* 前端表单的name，对应后端接口请求参数里的字段，
      此处name对应后端分析目标goal,label是左侧的提示文本，
      rules=....是必填项提示*/}
      <Form.Item name="goal" label="分析目标" rules={[{ required: true, message: '请输入分析目标!' }]}>
          {/* placeholder文本框内的提示语 */}
          <TextArea maxLength={200}
          autoSize={{ minRows: 6, maxRows: 6 }} 
          showCount 
           placeholder="请输入你的分析需求，比如：分析网站用户的增长情况"/>
      </Form.Item>

      {/* 还要输入图表名称 */}
      <Form.Item name="name" label="图表名称">
          <Input placeholder="请输入图表名称" />
      </Form.Item>

      {/* 图表类型是非必填，所以不做校验 */}
      <Form.Item
        name="chartType"
        label="图表类型"
        >
        <Select
        options={[
          { value: '折线图', label: '折线图' },
          { value: '柱状图', label: '柱状图' },
          { value: '堆叠图', label: '堆叠图' },
          { value: '饼图', label: '饼图' },
          { value: '雷达图', label: '雷达图' },
        ]}
        />
      </Form.Item>

      {/* 文件上传 */}
      {/* <Form.Item
          name="fileObj"
          label="原始数据"
          rules={[{ required: true, message: '请上传至少一个文件!' }]}
        > */}
          {/* action:当你把文件上传之后，他会把文件上传至哪个接口。
          这里肯定是调用自己的后端，先不用这个 */}
          {/* <Upload name="file">
            <Button icon={<UploadOutlined />}>上传 CSV 文件</Button>
          </Upload>
        </Form.Item> */}

          <Form.Item
          label="原始数据"
          >
            <Form.Item 
            name="dragger" 
            rules={[{ required: true, message: '请上传至少一个文件!' }]}
            valuePropName="fileList" 
            getValueFromEvent={normFile} noStyle>
              <Upload.Dragger name="files" action="/upload.do">
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽上传文件</p>
                <p className="ant-upload-hint">支持.csv, .xls, .xlsx文件</p>
              </Upload.Dragger>
            </Form.Item>
        </Form.Item>
        
        <Form.Item wrapperCol={{ span: 12, offset: 6 }}>
          <Space>
            <Button type="primary" htmlType="submit" loading={submitting} disabled={submitting}>
              分析
            </Button>
            <Button htmlType="reset">清空</Button>
          </Space>
        </Form.Item>
          </Form>

        </ProCard>
      </Col>

      <Col span={12}
      >
          <ProCard 
              type='default'
              title="分析结论：" 
              style={{ marginBottom: '20px' }}
              >
              <div>
              {chart?.genResult}
              </div>
          </ProCard>
        

            <ProCard
            tabs={{
              type: 'card',
            }}
            style={{ width: '100%', height: '500px'}}
          >
            <ProCard.TabPane key="tab1" tab="可视化图表">
              <div
              style={{
                justifyContent: 'center',
                alignItems: 'center',
              }}
              >
                {/* 如果它存在，才渲染这个组件 */}
                {
                  // 后端返回的代码是字符串，不是对象，用JSON.parse解析成对象
                  option && <ReactECharts option={option} />
                }
              </div>
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
                    height: '400px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', // 半透明背景
                    border: '1px solid #ddd',
                    borderRadius: '8px', // 增加圆角
                    padding: '0px',
                  }}
                  >
                    {formattedCode}
                  </SyntaxHighlighter>

                <Button
                  onClick={handleCopy}
                  type="primary"
                  style={{ marginTop: '16px', marginBottom: '16px' }}
                >
                  复制Echarts代码
                </Button>
              </div>
            </ProCard.TabPane>
          </ProCard>


      
      </Col>
    </Row>

  
    </div>

    
      
  );
};
export default AddChart;