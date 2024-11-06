import { Button, Drawer, Input, message, Space } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { listMyChartByPageUsingPost } from '@/services/AutoBI-073/chartController';
import { ProFormRadio, ProList } from '@ant-design/pro-components';
import { Tag } from 'antd/lib';
import { ControlOutlined, EllipsisOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import Typography from 'antd/es/typography/Typography';
import prettier from 'prettier/standalone';
import parserBabel from 'prettier/parser-babel';
import Modal from 'antd/es/modal/Modal';
import moment from 'moment';

const MyCharts: React.FC = () => {
    const [chartList, setChartList] = useState<API.Chart[]>();
    const [total, setTotal] = useState<number>(0);

    const initialSearchParam = {
        pageSize: 20,
    }
    const [searchParam, setSearchParam] = useState<API.ChartQueryRequest>({...initialSearchParam});
    

    const loadData = async() => {
        try {
        const res = await listMyChartByPageUsingPost(searchParam); 
        if (res.data){
            setChartList(res.data.records ?? []);
            setTotal(res.data.total ?? 0);
        }else {
            message.error ("获取历史记录失败!")
        }
        } catch (e: any) {
        message.error("获取历史记录失败: " + e.message)
        }
        
  }
  
    useEffect(() =>{
        loadData();
    }, [searchParam]);


    const filteredChartList = (chartList || []).filter((row) => {
        try {
          // 尝试解析 genChart
          const chartOption = row.genChart ? JSON.parse(JSON.parse(row.genChart)) : null;
          return !!chartOption; // 只有当 chartOption 存在时才保留此项
        } catch (error) {
        //   console.error("JSON 解析错误:", error);
          return false; // 如果解析错误则排除该项
        }
      });
    
    const formatCode = (code: string) => {
        if (code && typeof code === 'string') {
        try {
            return prettier.format(code, {
            parser: 'babel',
            plugins: [parserBabel],
            });
        } catch (error) {
            console.error('Prettier format failed:', error);
            // message.error('代码格式化失败');
            return code; // 如果格式化失败，返回空字符串
        }
        } else {
        //console.warn('Code is empty or not a valid string');
        return ''; // 如果code为空或非字符串，返回空字符串
        }
    };

      const handleCopy = async (code: string | undefined) => {
        if (code) {
          try {
            const clearCode = (code || "")
                    .replace(/\\n/g, "")          
                    .replace(/\s+/g, " ")         
                    .replace(/\"/g, "\"");
            // 格式化代码
            const formattedCode = formatCode(clearCode);
      
            if (formattedCode.length === 0) {
              console.warn("无有效代码可复制");
              return;
            }
      
            // 复制格式化后的代码到剪切板
            await navigator.clipboard.writeText(formattedCode);
            message.success("图表Echarts代码复制到剪切板")
            console.log("复制成功:", formattedCode);
            // 可选：添加用户提示，显示“复制成功”
          } catch (error) {
            console.error("复制失败:", error);
            message.info("复制失败:"+ error)
          }
        } else {
            message.info("无有效代码可复制")
            console.warn("无有效代码可复制");
        }
      };

      const [isModalVisible, setIsModalVisible] = useState(false);
      const [modalChartOption, setModalChartOption] = useState<any>(null); // 初始化为 null
      const [modalKey, setModalKey] = useState(0);
      
      // 打开 Modal
      const showModal = (genChart: string | undefined) => {
        setModalKey((prevKey) => prevKey + 1); // 每次点击时增加 key 值
        let chartOption2 = null;
      
        try {
          chartOption2 = genChart ? JSON.parse(JSON.parse(genChart ?? '')) : null;
          if (chartOption2) {
            chartOption2.grid = chartOption2.grid || { left: '15%', right: '15%', top: '10%', bottom: '10%' };
          }
        } catch (error) {
          console.error("JSON 解析错误:", error);
          chartOption2 = null;
        }
        setIsModalVisible(true); // 打开 Modal    
        // 使用 setTimeout 延迟设置图表数据
        setTimeout(() => {
          setModalChartOption(chartOption2);
        }, 0);
      };
      

        // 关闭 Modal
        const handleCancel = () => {
            setIsModalVisible(false);
        };

        // 定义 Modal 控制的状态
        const [isDetailVisible, setIsDetailVisible] = useState(false);
        const [detailInfo, setDetailInfo] = useState({ goal: '', genResult: '', createTime: '' });

        // 定义 showDetail 函数，接收详细信息作为参数
        const showDetail = (goal: string, genResult: string, createTime: string) => {
            const formattedDate = moment(createTime).format('YYYY-MM-DD HH:mm:ss');
            setDetailInfo({ goal, genResult, createTime: formattedDate});
            setIsDetailVisible(true);
        };

        // 定义 handleClose 函数，用于关闭 Modal
        const handleClose = () => {
            setIsDetailVisible(false);
            setDetailInfo({ goal: '', genResult: '', createTime: '' }); // 清空内容
        };
  

    return (

    <div
        style={{
            // backgroundColor: '#eee',
            // backgroundColor: 'transparent',
            margin: -24,
            padding: 24,
        }}
    >
      <ProList<API.Chart>
        pagination={{
          defaultPageSize: 6,
          showSizeChanger: false,
        }}
        showActions="hover"
        rowSelection={{}}
        grid={{ gutter: 24, xs: 1,
            sm: 1,
            md: 1,
            lg: 2,
            xl: 2,
            xxl: 3, }}
        onItem={(record: any) => {
          return {
            onClick: () => {
              console.log(record);
            },
          };
        }}
        metas={{
          title: {
            dataIndex: 'name',
            render: (_, row) => {
                return (
                    <Typography.Title level={4} style={{ margin: 0, wordWrap: 'break-word', 
                        whiteSpace: 'normal'}}>
            {row.name}
            </Typography.Title>
                );
            }
          },
          subTitle: {
            dataIndex: 'chartType',
            render: (_,row) => {
                const colorMap = {
                    line: "blue", '折线图': "blue",
                    bar: "green", '柱状图': "green",
                    pie: "volcano", '饼图': "volcano",
                    scatter: "purple", '散点图': "purple",
                    radar: "gold", '雷达图': "gold",
                    area: "geekblue", '面积图': "geekblue",
                    heatmap: "orange", '热力图': "orange",
                    boxplot: "cyan", '箱线图': "cyan",
                    funnel: "magenta", '漏斗图': "magenta",
                    sankey: "lime", '桑基图': "lime",
                    gauge: "red", '仪表盘': "red",
                    graph: "gray", '关系图': "gray",
                    "其他": "default", // 用于“其他”或自定义类型
                  };
                  const color = row.chartType ? colorMap[row.chartType] || "default" : "default";
                  return (
                    <Space size={0}>
                      <Tag color={color}>{row.chartType || "未知类型"}</Tag>
                    </Space>
                  );
              },
          },
          type: {
            dataIndex: 'chartType'
          },
        //   avatar: {
        //   },
          content: {
            dataIndex: 'genChart', 
            render: (_, row) => {
                let chartOption;
                try {
                chartOption = row.genChart ? JSON.parse(JSON.parse(row.genChart ?? '')) : null;
                if (chartOption){
                    chartOption.title = undefined;
                    chartOption.grid = chartOption.grid || { left: '15%', right: '15%', top: '10%', bottom: '10%' };
                }
                } catch (error) {
                console.error("JSON 解析错误:", error);
                chartOption = null;
                }

                return (
                <div
                style={{  display: 'flex', justifyContent: 'center', alignItems: 'center', height: '280px', width:'100%' }}
                >
                    {chartOption && (
                    <ReactECharts
                        option={chartOption}
                        style={{  width: '100%', height: '250px' }}/>
                    )},
                </div>
                );
              },
          },
          extra: {
          },
          actions: {
            render: (text, row) => {
                return (
                    <div>
                        <img src="imgs/edit.svg" onClick={() => handleCopy(row.echartsJsCode)} style={{width: '20px',  height: '20px', marginRight: '10px'}} alt="编辑图表" title='编辑图表'/> 
                        <img src="imgs/copy-one.svg" onClick={() => handleCopy(row.echartsJsCode)} style={{width: '20px',  height: '20px', marginRight: '10px'}} alt="复制代码" title='复制代码'/> 
                        <img src="imgs/zoom-in.svg" onClick={() => showModal(row.genChart)} style={{width: '20px',  height: '20px', marginRight: '10px'}} alt="放大" title='放大'/> 
                        <img src="imgs/preview-open.svg" onClick={() => showDetail(row.goal, row.genResult, row.createTime)} style={{width: '20px',  height: '20px', marginRight: '10px'}} alt="查看" title='查看详细信息'/>
                    </div>

                );
            },
            }
        }}
        headerTitle="我的图表"
        dataSource={filteredChartList}
        rowKey="id"
      />
      <div>
      <Modal
        visible={isModalVisible}
        key={modalKey} // 使用 key 强制重新渲染
        onCancel={handleCancel}
        afterClose={() => setModalChartOption(null)}
        footer={null}
        width={800}
        height={600}
        centered
        bodyStyle={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        }}
        >
        {modalChartOption && (
            <ReactECharts option={modalChartOption} style={{ width: '100%', minHeight: '500px', margin: 20,}}/>
        )}
        </Modal>

        <Modal
        visible={isDetailVisible}
        onCancel={handleClose}
        footer={null}
        centered
        title={
            <Typography.Title level={4} style={{ marginBottom: 20 }}>
            详细信息
            </Typography.Title>}
      >
        <Typography.Paragraph>
          <strong>分析目标:</strong> {detailInfo.goal}
        </Typography.Paragraph>
        <Typography.Paragraph>
          <strong>分析结论:</strong> {detailInfo.genResult}
        </Typography.Paragraph>
        <Typography.Paragraph>
          <strong>创建时间:</strong> {detailInfo.createTime}
        </Typography.Paragraph>
      </Modal>
      </div>

    </div>
    );

};


export default MyCharts;