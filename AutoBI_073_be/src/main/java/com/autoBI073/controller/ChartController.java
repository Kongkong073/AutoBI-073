package com.autoBI073.controller;

import cn.hutool.Hutool;
import cn.hutool.core.io.FileUtil;
import com.autoBI073.config.ThreadPoolExecutorConfig;
import com.autoBI073.constant.Constants;

import com.autoBI073.common.BaseResponse;
import com.autoBI073.common.DeleteRequest;
import com.autoBI073.common.ErrorCode;
import com.autoBI073.common.ResultUtils;
import com.autoBI073.constant.CommonConstant;
import com.autoBI073.constant.UserConstant;
import com.autoBI073.manager.RedisLimiterManager;
import com.autoBI073.model.dto.chart.*;
import com.autoBI073.model.enums.ChartStatusEnum;
import com.autoBI073.model.vo.BiResponse;
import com.autoBI073.service.ChartService;
import com.autoBI073.service.impl.ChartServiceImpl;
import com.autoBI073.utils.CsvUtils;
import com.autoBI073.utils.ExcelUtils;
import com.autoBI073.utils.MyStringUtils;
import com.autoBI073.utils.SqlUtils;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.google.gson.Gson;
import com.autoBI073.annotation.AuthCheck;
import com.autoBI073.exception.BusinessException;
import com.autoBI073.exception.ThrowUtils;
import com.autoBI073.model.entity.Chart;
import com.autoBI073.model.entity.User;
import com.autoBI073.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.concurrent.*;

/**
 * 帖子接口
 *
 * @author <a href="https://github.com/liyupi">程序员鱼皮</a>
 * @from <a href="https://yupi.icu">编程导航知识星球</a>
 */
@RestController
@RequestMapping("/chart")
@Slf4j
public class ChartController {

    @Resource
    private ChartService chartService;

    @Resource
    private UserService userService;

    @Qualifier("openaiRestTemplate")
    @Autowired
    private RestTemplate restTemplate;

    @Value("${openai.model}")
    private String model;

    @Value("${openai.api.url}")
    private String apiUrl;
    @Resource
    private RedisLimiterManager redisLimiterManager;

    @Resource
    private ThreadPoolExecutor threadPoolExecutor;

    @Resource
    private ChartServiceImpl chartServiceImpl;

    // region 增删改查

    /**
     * 创建
     *
     * @param chartAddRequest
     * @param request
     * @return
     */
    @PostMapping("/add")
    public BaseResponse<Long> addChart(@RequestBody ChartAddRequest chartAddRequest, HttpServletRequest request) {
        if (chartAddRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Chart chart = new Chart();
        BeanUtils.copyProperties(chartAddRequest, chart);
        User loginUser = userService.getLoginUser(request);
        chart.setUserId(loginUser.getId());
        boolean result = chartService.save(chart);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        long newChartId = chart.getId();
        return ResultUtils.success(newChartId);
    }

    /**
     * 删除
     *
     * @param deleteRequest
     * @param request
     * @return
     */
    @PostMapping("/delete")
    public BaseResponse<Boolean> deleteChart(@RequestBody DeleteRequest deleteRequest, HttpServletRequest request) {
        if (deleteRequest == null || deleteRequest.getId() <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User user = userService.getLoginUser(request);
        long id = deleteRequest.getId();
        // 判断是否存在
        Chart oldChart = chartService.getById(id);
        ThrowUtils.throwIf(oldChart == null, ErrorCode.NOT_FOUND_ERROR);
        // 仅本人或管理员可删除
        if (!oldChart.getUserId().equals(user.getId()) && !userService.isAdmin(request)) {
            throw new BusinessException(ErrorCode.NO_AUTH_ERROR);
        }
        boolean b = chartService.removeById(id);
        return ResultUtils.success(b);
    }

    /**
     * 删除(多选）
     *
     * @param chartDeleteRequest
     * @param request
     * @return
     */
    @PostMapping("/deleteSelected")
    public BaseResponse<Boolean> deleteSelectedChart(@RequestBody ChartDeleteRequest chartDeleteRequest, HttpServletRequest request) {
        if (chartDeleteRequest == null || chartDeleteRequest.getId().length <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User user = userService.getLoginUser(request);
        Long[] ids = chartDeleteRequest.getId();
        boolean succ = true;
        for (long id: ids){
            Chart oldChart = chartService.getById(id);
            ThrowUtils.throwIf(oldChart == null, ErrorCode.NOT_FOUND_ERROR);
            // 仅本人或管理员可删除
            if (!oldChart.getUserId().equals(user.getId()) && !userService.isAdmin(request)) {
                throw new BusinessException(ErrorCode.NO_AUTH_ERROR);
            }
            succ = (chartService.removeById(id) && succ);
        }
        return ResultUtils.success(succ);
    }


    /**
     * 更新（仅管理员）
     *
     * @param chartUpdateRequest
     * @return
     */
    @PostMapping("/update")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Boolean> updateChart(@RequestBody ChartUpdateRequest chartUpdateRequest) {
        if (chartUpdateRequest == null || chartUpdateRequest.getId() <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Chart chart = new Chart();
        BeanUtils.copyProperties(chartUpdateRequest, chart);
        long id = chartUpdateRequest.getId();
        // 判断是否存在
        Chart oldChart = chartService.getById(id);
        ThrowUtils.throwIf(oldChart == null, ErrorCode.NOT_FOUND_ERROR);
        boolean result = chartService.updateById(chart);
        return ResultUtils.success(result);
    }

    /**
     * 根据 id 获取
     *
     * @param id
     * @return
     */
    @GetMapping("/get")
    public BaseResponse<Chart> getChartById(long id, HttpServletRequest request) {
        if (id <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Chart chart = chartService.getById(id);
        if (chart == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR);
        }
        return ResultUtils.success(chart);
    }


    /**
     * 分页获取列表
     *
     * @param chartQueryRequest
     * @param request
     * @return
     */
    @PostMapping("/list/page")
    public BaseResponse<Page<Chart>> listChartByPage(@RequestBody ChartQueryRequest chartQueryRequest,
            HttpServletRequest request) {
        long current = chartQueryRequest.getCurrent();
        long size = chartQueryRequest.getPageSize();
        // 限制爬虫
        ThrowUtils.throwIf(size > 20, ErrorCode.PARAMS_ERROR);
        Page<Chart> chartPage = chartService.page(new Page<>(current, size),
                getQueryWrapper(chartQueryRequest));
        return ResultUtils.success(chartPage);
    }

    /**
     * 分页获取当前用户创建的资源列表
     *
     * @param chartQueryRequest
     * @param request
     * @return
     */
    @PostMapping("/my/list/page")
    public BaseResponse<Page<Chart>> listMyChartByPage(@RequestBody ChartQueryRequest chartQueryRequest,
            HttpServletRequest request) {
        if (chartQueryRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User loginUser;
        try{
            loginUser = userService.getLoginUser(request);
        }catch (BusinessException e){
            return ResultUtils.error(e.getCode(), e.getMessage());
        }
        chartQueryRequest.setUserId(loginUser.getId());
        long current = chartQueryRequest.getCurrent();
        long size = chartQueryRequest.getPageSize();
        // 限制爬虫
//        ThrowUtils.throwIf(size > 20, ErrorCode.PARAMS_ERROR);
        Page<Chart> chartPage = chartService.page(new Page<>(current, size),
                getQueryWrapper(chartQueryRequest));
        return ResultUtils.success(chartPage);
    }

    // endregion


    /**
     * 编辑（用户）
     *
     * @param chartEditRequest
     * @param request
     * @return
     */
    @PostMapping("/edit")
    public BaseResponse<Boolean> editChart(@RequestBody ChartEditRequest chartEditRequest, HttpServletRequest request) {
        if (chartEditRequest == null || chartEditRequest.getId() <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Chart chart = new Chart();
        BeanUtils.copyProperties(chartEditRequest, chart);
        User loginUser = userService.getLoginUser(request);
        long id = chartEditRequest.getId();
        // 判断是否存在
        Chart oldChart = chartService.getById(id);
        ThrowUtils.throwIf(oldChart == null, ErrorCode.NOT_FOUND_ERROR);
        // 仅本人或管理员可编辑
        if (!oldChart.getUserId().equals(loginUser.getId()) && !userService.isAdmin(loginUser)) {
            throw new BusinessException(ErrorCode.NO_AUTH_ERROR);
        }
        boolean result = chartService.updateById(chart);
        return ResultUtils.success(result);
    }


    /**
     * 获取查询包装类
     *
     * @param chartQueryRequest
     * @return
     */
    private QueryWrapper<Chart> getQueryWrapper(ChartQueryRequest chartQueryRequest) {
        QueryWrapper<Chart> queryWrapper = new QueryWrapper<>();
        if (chartQueryRequest == null) {
            return queryWrapper;
        }

        Long id = chartQueryRequest.getId();
        String name = chartQueryRequest.getName();
        String goal = chartQueryRequest.getGoal();
        String chartType = chartQueryRequest.getChartType();
        Long userId = chartQueryRequest.getUserId();
        String sortField = chartQueryRequest.getSortField();
        String sortOrder = chartQueryRequest.getSortOrder();
        Date createTime = chartQueryRequest.getCreateTime();

        queryWrapper.eq(id != null && id > 0, "id", id);
        queryWrapper.like(StringUtils.isNotBlank(name), "name", name);
        queryWrapper.eq(StringUtils.isNotBlank(goal), "goal", goal);
        queryWrapper.eq(StringUtils.isNotBlank(chartType), "chartType", chartType);
        queryWrapper.eq(ObjectUtils.isNotEmpty(userId), "userId", userId);
        queryWrapper.eq("isDelete", false);
        if (createTime != null) {
            String formattedDate = new SimpleDateFormat("yyyy-MM-dd").format(createTime);
            queryWrapper.like("DATE_FORMAT(createTime, '%Y-%m-%d')", formattedDate);
        }

        queryWrapper.orderBy(SqlUtils.validSortField(sortField), sortOrder.equals(CommonConstant.SORT_ORDER_ASC),
                sortField);
        return queryWrapper;
    }

    private String processFile(MultipartFile multipartFile) throws IllegalArgumentException, IOException {
        String fileName = multipartFile.getOriginalFilename();
        String result;

        if (fileName == null || fileName.isEmpty()) {
            throw new IllegalArgumentException("文件名为空，无法处理该文件。");
        }

        // 将文件名转换为小写以确保不区分大小写
        fileName = fileName.toLowerCase();

        if (fileName.endsWith(".csv")) {
            // 如果是CSV文件，调用CsvUtils处理
            result = CsvUtils.convertCsvToString(multipartFile);
        } else if (fileName.endsWith(".xls") || fileName.endsWith(".xlsx")) {
            // 如果是Excel文件，调用ExcelUtils处理
            result = ExcelUtils.excelToCsv(multipartFile);
        } else {
            // 如果文件不是CSV或Excel文件，抛出异常
            throw new IllegalArgumentException("文件格式不支持，请上传CSV或Excel文件。");
        }

        return result;
    }

//    /**
//     * 智能分析
//     *
//     * @param multipartFile
//     * @param genChartByAiRequest
//     * @param request
//     * @return
//     */
//    @PostMapping("/gen")
//    public BaseResponse<BiResponse> genChartByAi(@RequestPart("file") MultipartFile multipartFile,
//                                             GenChartByAiRequest genChartByAiRequest, HttpServletRequest request){
//
//        // 登录校验
//        User loginUser;
//        try{
//            loginUser = userService.getLoginUser(request);
//        }catch (BusinessException e){
//            return ResultUtils.error(e.getCode(), e.getMessage());
//        }
//
//        //限流
//        try{
//            redisLimiterManager.checkRateLimit(loginUser.getId());
//        }catch (BusinessException e){
//            return ResultUtils.error(e.getCode(), e.getMessage());
//        }
//
//        String name = genChartByAiRequest.getName();
//        String goal = genChartByAiRequest.getGoal();
//        String chartType = genChartByAiRequest.getChartType();
//
//        // 校验
//        // 如果分析目标为空，就抛出请求参数错误异常，并给出提示
//        ThrowUtils.throwIf(StringUtils.isBlank(goal), ErrorCode.PARAMS_ERROR, "目标为空");
//        // 如果名称不为空，并且名称长度大于100，就抛出异常，并给出提示
//        ThrowUtils.throwIf(StringUtils.isNotBlank(name) && name.length() > 100, ErrorCode.PARAMS_ERROR, "名称过长");
//
//        //校验
//        long size = multipartFile.getSize();
//        String originalFilename = multipartFile.getOriginalFilename();
//        ThrowUtils.throwIf(size > Constants.ONE_MB, ErrorCode.PARAMS_ERROR, "文件超过 1M");
//        String suffix = FileUtil.getSuffix(originalFilename);
//        ThrowUtils.throwIf(!Constants.validFileSuffixList.contains(suffix), ErrorCode.PARAMS_ERROR, "文件后缀非法");
//
//
//        // 用户输入
//        StringBuilder userInput = new StringBuilder();
//        userInput.append("数据说明和分析目标：").append(goal).append("\n");
//        if (StringUtils.isNotBlank(chartType)) {
//            // 就将分析目标拼接上“请使用”+图表类型
//            userInput.append("请使用" + chartType).append("\n");
//        }
//
//        // 压缩后的数据（把multipartFile传进来，其他的东西先注释）
//        String result = null;
//        try {
//            result = processFile(multipartFile);
//        } catch (IOException e) {
//            throw new RuntimeException(e);
//        }
//        userInput.append("原始数据：").append(result).append("\n");
//
//
//        // create a request
//        ChatRequest request1 = new ChatRequest(model, userInput.toString());
//
//        // call the API
//        ChatResponse response = restTemplate.postForObject(apiUrl, request1, ChatResponse.class);
//
//        // 插入Chart表
//        if (response != null && response.getChoices() != null && !response.getChoices().isEmpty()) {
////            String[] responses = MyStringUtils.splitWithDelimiter(response.getChoices().get(0).getMessage().getContent(), "\"JsEChartCode\"", "\"JsonEChartCode\"");
//            String[] responses = MyStringUtils.splitWithDelimiter2(response.getChoices().get(0).getMessage().getContent(), "\"JsEChartCode\"");
//            Chart chart = new Chart();
//            chart.setName(name);
//            chart.setGoal(goal);
//            chart.setChartData(result);
//            chart.setChartType(chartType);
//            if (StringUtils.isNotBlank(chartType)) {
//                chart.setChartType("自动");
//            }
////            chart.setGenChart(MyStringUtils.extractContent(responses[2]));
//            chart.setGenResult(MyStringUtils.extractContent(responses[0]));
//            chart.setEchartsJsCode(MyStringUtils.removeQuoteMark(MyStringUtils.extractContent(responses[1])));
//            chart.setUserId(loginUser.getId());
//            boolean saveResult = chartService.save(chart);
//            ThrowUtils.throwIf(!saveResult, ErrorCode.SYSTEM_ERROR, "图表保存失败");
//
//            // 返回结果
//            BiResponse biResponse = new BiResponse();
////            biResponse.setGenChart(MyStringUtils.extractContent(responses[2]));
//            biResponse.setGenResult(MyStringUtils.extractContent(responses[0]));
//            biResponse.setGenJsEchartCode(MyStringUtils.removeQuoteMark(MyStringUtils.extractContent(responses[1])));
//            biResponse.setChartId(chart.getId());
//            log.info(biResponse.toString());
//            return ResultUtils.success(biResponse);
////            return ResultUtils.success(responses[0] + "\\n" + responses[1] + "\\n" + responses[2]);
//        } else {
//            throw new RuntimeException("No structured response received from OpenAI API.");
//        }
//    }

    @PostMapping("/gen")
    public BaseResponse<BiResponse> genChartByAiSyncOrAsync(
            @RequestPart("file") MultipartFile multipartFile,
            GenChartByAiRequest genChartByAiRequest,
            HttpServletRequest request) {

        // 登录校验
        User loginUser;
        try {
            loginUser = validateLogin(request);
            validateRateLimit(loginUser.getId());
        } catch (BusinessException e) {
            log.error("Validation failed: {}", e.getMessage());
            return ResultUtils.error(e.getCode(), e.getMessage());
        }

        // 参数校验
        try {
            validateRequest(multipartFile, genChartByAiRequest);
        } catch (BusinessException e) {
            log.error("Request validation failed: {}", e.getMessage());
            return ResultUtils.error(e.getCode(), e.getMessage());
        }

        // 数据预处理
        String processedData;
        try {
            processedData = processFile(multipartFile);
        } catch (IOException e) {
            log.error("File processing failed: {}", e.getMessage());
            return ResultUtils.error(ErrorCode.FILE_PROCESSING_ERROR, "文件处理失败");
        }

        // 构造用户输入
        String userInput = buildUserInput(genChartByAiRequest, processedData);

        // 插入初始图表数据
        Chart chart = new Chart();
        chart.setUserId(loginUser.getId());
        chart.setName(genChartByAiRequest.getName());
        chart.setGoal(genChartByAiRequest.getGoal());
        chart.setChartData(processedData);
        chart.setStatus(ChartStatusEnum.WAITING.getCode());
        chart.setChartType(StringUtils.defaultIfBlank(genChartByAiRequest.getChartType(), "自动"));
        boolean saveResult = chartService.save(chart);
        ThrowUtils.throwIf(!saveResult, ErrorCode.SYSTEM_ERROR, "图表保存失败");

        // 优先同步执行，异步回退
        boolean isSyncExecuted = tryExecuteSyncWithFallback(() -> handleAiRequestAndSave(chart, userInput), chart.getId());
        // 如果同步执行成功，调用 buildBiResponse 返回结果
        if (isSyncExecuted) {
            log.info("Synchronous execution completed successfully.");
            return ResultUtils.success(buildBiResponse(chart));
        }

        // 异步任务已提交，返回接受状态
        BiResponse biResponse = new BiResponse();
        biResponse.setChartId(chart.getId());
        return ResultUtils.success(biResponse);
    }

//    /**
//     * 尝试同步执行任务，并在失败时自动回退到异步执行
//     */
//    private boolean tryExecuteSyncWithFallback(Runnable task) {
//        // 检查线程池是否有空闲线程
//        if (threadPoolExecutor.getActiveCount() < threadPoolExecutor.getMaximumPoolSize()) {
//            try {
//                // 同步执行任务
//                threadPoolExecutor.submit(task).get(); // 阻塞直到任务完成
//                log.info("Task executed synchronously.");
//                return true;
//            } catch (InterruptedException | ExecutionException e) {
//                // 捕获同步执行的异常，切换到异步
//                log.warn("Synchronous execution failed, switching to asynchronous execution: {}", e.getMessage());
//                Thread.currentThread().interrupt(); // 恢复中断状态
//            }
//        }
//
//        // 如果同步执行失败或线程池已满，尝试异步提交任务
//        try {
//            threadPoolExecutor.submit(task);
//            log.info("Task submitted for asynchronous execution.");
//            return false; // 异步提交成功但非同步执行
//        } catch (RejectedExecutionException e) {
//            // 异步任务提交失败
//            log.error("Failed to submit task for asynchronous execution: {}", e.getMessage());
//            return false; // 无法执行任务
//        }
//    }

    private boolean tryExecuteSyncWithFallback(Runnable task, Long chartId) {
        // 检查线程池是否有空闲线程
//        if (threadPoolExecutor.getActiveCount() < threadPoolExecutor.getMaximumPoolSize()) {
//            try {
//                // 同步执行任务，设置超时时间为 20 秒
//                Future<?> future = threadPoolExecutor.submit(task);
//                future.get(20, TimeUnit.SECONDS); // 阻塞直到任务完成或超时
//                log.info("Task executed synchronously.");
//                return true;
//            } catch (TimeoutException e) {
//                log.warn("Synchronous execution timed out, marking as FAILED and switching to asynchronous execution.");
//                handleTaskTimeout(chartId); // 处理超时
//            } catch (InterruptedException | ExecutionException e) {
//                log.warn("Synchronous execution failed, switching to asynchronous execution: {}", e.getMessage());
//                Thread.currentThread().interrupt(); // 恢复中断状态
//            }
//        }
        // 如果同步执行失败或线程池已满，尝试异步提交任务
        try {
            threadPoolExecutor.submit(() -> {
                try {
                    // 异步任务的超时监控
                    Future<?> future = threadPoolExecutor.submit(task);
                    future.get(20, TimeUnit.SECONDS); // 异步任务也设置超时
                } catch (TimeoutException e) {
                    log.error("Asynchronous execution timed out, marking as FAILED.");
                    handleTaskTimeout(chartId); // 处理超时
                } catch (InterruptedException | ExecutionException e) {
                    log.error("Asynchronous execution failed: {}", e.getMessage());
                }
            });
            log.info("Task submitted for asynchronous execution.");
            return false; // 异步提交成功但非同步执行
        } catch (RejectedExecutionException e) {
            log.error("Failed to submit task for asynchronous execution: {}", e.getMessage());
            return false; // 无法执行任务
        }
    }

    private void handleTaskTimeout(Long chartId) {
        Chart updateChart = new Chart();
        updateChart.setId(chartId);
        updateChart.setStatus(ChartStatusEnum.FAILED.getCode());
        updateChart.setExecMessage("任务超时，已失败");
        boolean updateResult = chartService.updateById(updateChart);
        if (!updateResult) {
            log.error("Failed to update chart {} status to FAILED after timeout.", chartId);
        }
    }


    /**
     * 校验请求参数
     */
    private void validateRequest(MultipartFile multipartFile, GenChartByAiRequest genChartByAiRequest) {
        ThrowUtils.throwIf(StringUtils.isBlank(genChartByAiRequest.getGoal()), ErrorCode.PARAMS_ERROR, "目标为空");
        ThrowUtils.throwIf(StringUtils.isNotBlank(genChartByAiRequest.getName()) && genChartByAiRequest.getName().length() > 100, ErrorCode.PARAMS_ERROR, "名称过长");
        ThrowUtils.throwIf(multipartFile.getSize() > Constants.ONE_MB, ErrorCode.PARAMS_ERROR, "文件超过1M");
        String suffix = FileUtil.getSuffix(multipartFile.getOriginalFilename());
        ThrowUtils.throwIf(!Constants.validFileSuffixList.contains(suffix), ErrorCode.PARAMS_ERROR, "文件后缀非法");
    }


    /**
     * 校验登录用户
     */
    private User validateLogin(HttpServletRequest request) {
        return userService.getLoginUser(request);
    }

    /**
     * 校验限流
     */
    private void validateRateLimit(Long userId) {
        redisLimiterManager.checkRateLimit(userId);
    }


    /**
     * 调用 AI 接口
     */
    private ChatResponse callAiApi(String userInput) {
        ChatRequest chatRequest = new ChatRequest(model, userInput);
        return restTemplate.postForObject(apiUrl, chatRequest, ChatResponse.class);
    }

    /**
     * 更新图表状态
     */
    private void updateChartStatus(Long chartId, String status) {
        Chart updateChart = new Chart();
        updateChart.setId(chartId);
        updateChart.setStatus(status);
        boolean updateResult = chartService.updateById(updateChart);
        if (!updateResult) {
            handleChartUpdateError(chartId, "更新图表状态失败");
        }
    }


    private void handleChartUpdateError(long chartId, String execMessage) {
        Chart updateChartResult = new Chart();
        updateChartResult.setId(chartId);
        updateChartResult.setStatus(ChartStatusEnum.FAILED.getCode());
        updateChartResult.setExecMessage(execMessage);
        boolean updateResult = chartService.updateById(updateChartResult);
        if (!updateResult) {
            log.error("更新图表失败状态失败" + chartId + "," + execMessage);
        }
    }


    private void handleAiRequestAndSave(Chart chart, String userInput) {
        try {
            // 更新状态为 RUNNING
            updateChartStatus(chart.getId(), ChartStatusEnum.RUNNING.getCode());
            //chartServiceImpl.sendUpdateChart(chart);  // 推送状态变化给前端

            // 调用 AI 接口
            ChatResponse response = callAiApi(userInput);

            // 处理响应数据
            if (response == null || response.getChoices() == null || response.getChoices().isEmpty()) {
                throw new BusinessException(ErrorCode.SYSTEM_ERROR, "AI 响应无效");
            }
            String[] responses = MyStringUtils.splitWithDelimiter2(
                    response.getChoices().get(0).getMessage().getContent(),
                    "\"JsEChartCode\""
            );
            chart.setEchartsJsCode(MyStringUtils.removeQuoteMark(MyStringUtils.extractContent(responses[1])));
            chart.setGenResult(MyStringUtils.extractContent(responses[0]));
            chart.setStatus(ChartStatusEnum.SUCCEED.getCode());

            boolean updateResult = chartService.updateById(chart);
            if (!updateResult) {
                handleChartUpdateError(chart.getId(), "更新图表成功状态失败");
            }
        } catch (Exception e) {
            log.error("Error while processing AI request for chart {}: {}", chart.getId(), e.getMessage());
            handleChartUpdateError(chart.getId(), "任务执行失败: " + e.getMessage());
        }finally {
            //chartServiceImpl.sendUpdateChart(chart);  // 推送变化图表给前端
        }
    }


    /**
     * 构建用户输入
     */
    private String buildUserInput(GenChartByAiRequest genChartByAiRequest, String processedData) {
        StringBuilder userInput = new StringBuilder();
        userInput.append("数据说明和分析目标：").append(genChartByAiRequest.getGoal()).append("\n");
        if (StringUtils.isNotBlank(genChartByAiRequest.getChartType())) {
            userInput.append("请使用").append(genChartByAiRequest.getChartType()).append("\n");
        }
        userInput.append("原始数据：").append(processedData).append("\n");
        return userInput.toString();
    }

    /**
     * 构建响应数据
     */
    private BiResponse buildBiResponse(Chart chart) {
        BiResponse biResponse = new BiResponse();
        biResponse.setChartId(chart.getId());
        biResponse.setGenResult(chart.getGenResult());
        biResponse.setGenJsEchartCode(chart.getEchartsJsCode());
        return biResponse;
    }



}
