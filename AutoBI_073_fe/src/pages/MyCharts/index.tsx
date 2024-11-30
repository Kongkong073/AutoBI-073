import { Affix, App, Button, Divider, Drawer, Input, message, Result, Space, Spin, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { deleteSelectedChartUsingPost, listMyChartByPageUsingPost } from '@/services/AutoBI-073/chartController';
import { ProFormRadio, ProList, QueryFilter, ProFormText, ProFormSelect, ProFormDatePicker, ProCard} from '@ant-design/pro-components';
import { Tag } from 'antd/lib';
import { ControlOutlined, DeleteFilled, DeleteOutlined, DeleteTwoTone, EllipsisOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import prettier from 'prettier/standalone';
import parserBabel from 'prettier/parser-babel';
import Modal from 'antd/es/modal/Modal';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';
import * as Stomp from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const MyCharts: React.FC = () => {

    const [chartList, setChartList] = useState<API.Chart[]>([]);
    const [total, setTotal] = useState<number>(0);

    const initialSearchParam = {
        pageSize: -1,
        sortField: 'createTime'
    }
    const [searchParam, setSearchParam] = useState<API.ChartQueryRequest>({...initialSearchParam});
    const [filteredChartList, setFilteredChartList] = useState<API.Chart[]>([]);

    // useEffect(() => {
    //     // 创建 WebSocket 客户端
    //     const socket = new SockJS('http://localhost:8101/chart-websocket');
    //     const stompClient = Stomp.Stomp.over(socket);
      
    //     stompClient.connect({}, () => {
    //       console.log('Connected to WebSocket');
      
    //       // 订阅图表状态更新的主题
    //       stompClient.subscribe('/topic/chartStatus', (message) => {
    //         try {
    //           // 解析收到的更新数据
    //           const updateChart = JSON.parse(message.body);
    //           console.log('Received update:', updateChart);
      
    //           // 更新 chartList
    //           setChartList((prevList) =>
    //             prevList.map((chart) =>
    //               chart.id === updateChart.id
    //                 ? { ...chart, ...updateChart } // 用更新数据覆盖对应 chart
    //                 : chart
    //             )
    //           );
      
    //           console.log('Updated chart list with new chart status:', updateChart);
    //         } catch (error) {
    //           console.error('Error while updating chartList:', error);
    //         }
    //       });
    //     });
      
    //     return () => {
    //       // 在组件卸载时断开连接
    //       if (stompClient) {
    //         stompClient.disconnect(() => {
    //           console.log('WebSocket disconnected');
    //         });
    //       }
    //     };
    //   }, []); // 只在组件挂载时执行
      

    //加载chart数据
    const loadData = async() => {
        try {
        const res = await listMyChartByPageUsingPost(searchParam); 
        if (res.data){
            setChartList(res.data.records ?? []);
            setTotal(res.data.total ?? 0);
            console.log(searchParam);
        }else {
            if(res.code){
                message.error (res.message)
            }else{
                message.error ("获取历史记录失败!")
            }
        }
        } catch (e: any) {
        message.error("获取历史记录失败: " + e.message)
        }
        
  }
  
    useEffect(() =>{
        loadData();
    }, [searchParam]);

    //格式化JS code
    const formatCode = (code: string) => {
        if (code && typeof code === 'string') {
        try {
            return prettier.format(code, {
            parser: 'babel',
            plugins: [parserBabel],
            });
        } catch (error) {
            // console.error('Prettier format failed:', error);
            return code; // 如果格式化失败，返回空字符串
        }
        } else {
        //console.warn('Code is empty or not a valid string');
        return ''; // 如果code为空或非字符串，返回空字符串
        }
    };

      
    // 当 chartList 更新时，重新计算 filteredChartList 
    useEffect(() => {
        const newFilteredChartList = (chartList || []).filter((row) => {
          try {
            const clearCode = (row.echartsJsCode || "")
              .replace(/\\n/g, "")
              .replace(/\s+/g, " ")
              .replace(/\\"/g, "\\\"");
            const formattedCode3 = formatCode(clearCode);
            const chartOption = new Function('return ' + formattedCode3)() ?? null;
            return !!chartOption;
          } catch (error) {
            // console.error("图表代码解析错误:", error);
            return false;
          }
        });
        setFilteredChartList(newFilteredChartList);
      }, [chartList]); // 当 chartList 更新时，重新计算 filteredChartList 


    //复制JS代码
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
      const showModal = (echartsJsCode: string | undefined) => {
        setModalKey((prevKey) => prevKey + 1); // 每次点击时增加 key 值
        let chartOption2 = null;
      
        try {
            //   chartOption2 = genChart ? JSON.parse(JSON.parse(genChart ?? '')) : null;
            const clearCode = (echartsJsCode || "")
                        .replace(/\\n/g, "")          
                        .replace(/\s+/g, " ")         
                        .replace(/\"/g, "\"");
            chartOption2 = new Function('return ' + formatCode(clearCode))();
          if (chartOption2) {
            chartOption2.grid = chartOption2.grid || { left: '15%', right: '15%', top: '10%', bottom: '10%' };
          }
        } catch (error) {
          console.error("解析错误:", error);
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

    // 跳转到编辑图表页面
    const navigate = useNavigate();
    let formattedCode2: string;
    const handleEdit = (echartsJsCode: string | undefined) => {
        if (echartsJsCode) {
            try {
                const clearCode = (echartsJsCode || "")
                        .replace(/\\n/g, "")          
                        .replace(/\s+/g, " ")         
                        .replace(/\"/g, "\"");
                // 格式化代码
                formattedCode2 = formatCode(clearCode);
                navigate('/editchart', { state: { code: formattedCode2 } });
        
                if (formattedCode2.length === 0) {
                console.warn("无有效代码");
                return;
                }
        
            } catch (error) {
                message.info("无法编辑:"+ error)
            }
            } else {
                message.info("无有效代码")
                console.warn("无有效代码");
            }
    };

    // 多选删除
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);

    const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
    };

    const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    };
    
    const handleDelete = () => {
    console.log(selectedRowKeys);
    Modal.confirm({
        centered: true,
        title: '确认删除',
        content: '确定从数据库中永久删除图表？',
        okText: '删除',
        cancelText: '取消',
        okButtonProps: {
            style: { backgroundColor: 'red', borderColor: 'red', color: 'white' }, // 自定义确认按钮样式
            },
        // onOk: () => {
        // const newDataSource = filteredChartList.filter(
        //     (item) => !selectedRowKeys.includes(item.id)
        // );
        // setFilteredChartList(newDataSource);
        // setSelectedRowKeys([]); // 重置选中项
        // },
        onOk: async () => {
            try {
                const requestBody = {
                id: selectedRowKeys,
                };
                const response = await deleteSelectedChartUsingPost(requestBody);
        
                if (response) {
                if (response.data){
                    message.success('删除成功');
                }
                if (response.code !== 0){
                    message.error(response.message);
                }
                // 更新本地数据源
                const newDataSource = filteredChartList.filter(
                    (item) => !selectedRowKeys.includes(item.id)
                );
                setFilteredChartList(newDataSource);
                setSelectedRowKeys([]); // 重置选中项
                } else {
                message.error('删除失败');
                }
            } catch (error) {
                console.error('删除时发生错误:', error);
                message.error('删除失败，请检查网络或稍后重试');
            }
            },
        });
    };

  
    return (

        
    <div
        style={{
            // backgroundColor: '#eee',
            marginTop: -34,
            marginBottom: -24,
            marginLeft: 24,
            marginRight: 24,
            padding: 24,
        }}
    >

      <Button
        onClick={handleDelete}
        type="primary" danger
        disabled={selectedRowKeys.length === 0}
        style={{
          position: 'fixed',
          top: '93%',
          right: '2%',
          transform: 'translateY(-95%)', // 调整垂直位置
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          zIndex: 1000, // 确保按钮位于页面最上层
        }}
      >
        <DeleteOutlined style={{ fontSize: '20px' }} />
      </Button>
        <ProCard style={{marginBottom: 16}}>
            <QueryFilter
            defaultCollapsed={true}
            onFinish={async (values) => {
                // 将表单的值合并到 searchParam 中，并触发查询
                setSearchParam({ ...searchParam, ...values });
            }}
            onReset={() => {
                // 重置查询条件
                setSearchParam(initialSearchParam);
            }}
            onValuesChange={(changedValues, allValues) => {
                if (changedValues.hasOwnProperty('name') && changedValues.name === '') {
                    allValues.name = undefined;
                }
                // 当值变化时，手动更新 searchParam
                setSearchParam({...searchParam, ...allValues});
            }}
            >
            <ProFormSelect
                name="chartType"
                label="图表类型"
                placeholder="请选择图表类型"
                allowClear
                fieldProps={{
                    labelInValue: false,
                    style: {
                      minWidth: 140,
                    },
                  }}
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
                    { value: '自动', label: '自动（Auto）' },
                    // { value: otherChartType, label: '其他 (Other)' },
                ]}
                
            />
            <ProFormText
                name="name"
                label="图表名称"
                placeholder="请输入名称"
                allowClear
            />

            <ProFormDatePicker
                name="createTime"
                label="创建时间"
                placeholder="请选择日期"
                allowClear
                fieldProps={{
                    format: 'YYYY-MM-DD',
                }}
            />
            </QueryFilter>
        </ProCard>

      <ProList<API.Chart> 
      
        pagination={{
          defaultPageSize: 12,
          showSizeChanger: false,
        }}
        showActions="hover"
        rowSelection={rowSelection}
        // rowSelection={{}}
        grid={{gutter: 0, xs: 1,
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
            style: {
               boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                width: 'calc(98%)',
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
                    funnel: "gray", '漏斗图': "gray",
                    sankey: "lime", '桑基图': "lime",
                    gauge: "red", '仪表盘': "red",
                    graph: "magenta", '关系图': "magenta",
                    "其他": "default", // 用于“其他”或自定义类型
                  };
                  const color = row.chartType ? colorMap[row.chartType] || "default" : "default";
                  return (
                    <Space size={0}>
                      <Tag color={color}>{row.chartType || "自动"}</Tag>
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
            dataIndex: 'echartsJsCode', 
            render: (_, row) => {
                let chartOption = null;
                if (row.status === 'SUCCEED'){
                    try {
                        const clearCode = (row.echartsJsCode || "")
                                .replace(/\\n/g, "")          
                                .replace(/\s+/g, " ")         
                                .replace(/\"/g, "\"");
                        formattedCode2 = formatCode(clearCode);
                        // chartOption = row.genChart ? JSON.parse(JSON.parse(row.genChart ?? '')) : null;
                        chartOption = new Function('return ' + formattedCode2)();
                        if (chartOption){
                            chartOption.title = undefined;
                            chartOption.grid = chartOption.grid || { left: '15%', right: '15%', top: '10%', bottom: '10%' };
                        }
                    } catch (error) {
                        // console.error("解析错误:", error);
                        chartOption = null;
                    }
                }
                return (
                <div
                style={{  display: 'flex', justifyContent: 'center', alignItems: 'center', height: '280px', width:'100%' }}
                >
                    {chartOption && (
                        <ErrorBoundary>
                            <ReactECharts
                        option={chartOption}
                        style={{  width: '100%', height: '280px' }}/>
                        </ErrorBoundary>
                    )}
                    {!chartOption && (row.status === "WAITING") &&(
                      <Spin tip="排队中，请耐心等待" size="large">{"... queueing ..."}</Spin>
                    )}
                    {!chartOption && (row.status === "RUNNING") &&(
                              <Spin tip="结果生成中" size="large">{"... running ..."}</Spin>
                      
                    )}
                    {!chartOption && (row.status === "FAILED") && (
                        <Result
                            status="error"
                            title="图表生成失败"
                      />
                    )}
                    {!chartOption && (row.status === "SUCCEED") && (
                        <Result
                            status="error"
                            title="代码解析失败"
                      />
                    )}
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
                        <img src="imgs/edit.svg" onClick={() => handleEdit(row.echartsJsCode)} style={{width: '20px',  height: '20px', marginRight: '10px'}} alt="编辑图表" title='编辑图表'/> 
                        <img src="imgs/copy-one.svg" onClick={() => handleCopy(row.echartsJsCode)} style={{width: '20px',  height: '20px', marginRight: '10px'}} alt="复制代码" title='复制代码'/> 
                        <img src="imgs/zoom-in.svg" onClick={() => showModal(row.echartsJsCode)} style={{width: '20px',  height: '20px', marginRight: '10px'}} alt="放大" title='放大'/> 
                        <img src="imgs/preview-open.svg" onClick={() => showDetail(row.goal, row.genResult, row.createTime)} style={{width: '20px',  height: '20px', marginRight: '10px'}} alt="查看" title='查看详细信息'/>
                    </div>

                );
            },
            }
        }}
        headerTitle="我的图表"
        dataSource={chartList}
        rowKey='id'
      />

      <Modal
        visible={isModalVisible}
        getContainer={false}
        key={modalKey} // 使用 key 强制重新渲染
        onCancel={handleCancel}
        afterClose={() => setModalChartOption(null)}
        footer={null}
        width={800}
        height={600}
        centered
        // bodyStyle={{
        //     display: 'flex',
        //     justifyContent: 'center',
        //     alignItems: 'center',
        //     padding: 20,
        // }}
        >
        {modalChartOption && (
            <ErrorBoundary>
                <ReactECharts option={modalChartOption} style={{ width: '100%', minHeight: '500px', margin: 20,}}/>
            </ErrorBoundary>

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
          <strong>分析结论:</strong> 
          <div
              dangerouslySetInnerHTML={{
                __html:detailInfo.genResult?.replace(/\\n/g, '<br />'),
              }}
              />
        </Typography.Paragraph>
        <Typography.Paragraph>
          <strong>创建时间:</strong> {detailInfo.createTime}
        </Typography.Paragraph>
      </Modal>

    </div>
    );

};


export default MyCharts;