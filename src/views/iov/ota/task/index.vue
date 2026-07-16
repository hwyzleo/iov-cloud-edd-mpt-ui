<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="任务名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入任务名称"
          clearable
          style="width: 150px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="任务状态" prop="type">
        <el-select
          v-model="queryParams.state"
          placeholder="任务状态"
          clearable
          style="width: 140px"
        >
          <el-option
            v-for="taskState in this.taskStateList"
            :key="taskState.value"
            :label="taskState.label"
            :value="taskState.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间">
        <el-date-picker
          v-model="dateRange"
          style="width: 240px"
          value-format="yyyy-MM-dd"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        ></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['ota:fota:task:add']"
        >新增
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['ota:fota:task:edit']"
        >修改
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['ota:fota:task:remove']"
        >删除
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['ota:fota:task:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="taskList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="任务名称" prop="name" min-width="150"/>
      <el-table-column label="车辆模式" width="120" align="center">
        <template slot-scope="scope">
          <span v-if="getTargetMode(scope.row.target) === 'LIST'">手动选择</span>
          <span v-else-if="getTargetMode(scope.row.target) === 'IMPORT'">文件导入</span>
          <span v-else-if="getTargetMode(scope.row.target) === 'CONDITION'">条件匹配</span>
          <span v-else>未知</span>
        </template>
      </el-table-column>
      <el-table-column label="任务阶段" prop="phase" width="120" align="center">
        <template slot-scope="scope">
          <span v-if="scope.row.phase === 1">验证</span>
          <span v-else-if="scope.row.phase === 2">灰度</span>
          <span v-else-if="scope.row.phase === 3">发布</span>
          <span v-else>未知</span>
        </template>
      </el-table-column>
      <el-table-column label="任务开始时间" align="center" prop="startTime" width="140">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.startTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="任务结束时间" align="center" prop="endTime" width="140">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.endTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="任务发布时间" align="center" prop="releaseTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.releaseTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="升级模式" prop="upgradeMode" width="100" align="center">
        <template slot-scope="scope">
          <span v-if="scope.row.upgradeMode === 1">普通</span>
          <span v-else-if="scope.row.upgradeMode === 2">强制</span>
          <span v-else-if="scope.row.upgradeMode === 3">预约静默</span>
          <span v-else-if="scope.row.upgradeMode === 4">远程静默</span>
          <span v-else-if="scope.row.upgradeMode === 5">工厂</span>
          <span v-else>未知</span>
        </template>
      </el-table-column>
      <el-table-column label="任务状态" prop="state" width="100" align="center">
        <template slot-scope="scope">
          <span v-if="scope.row.state === 1">草稿</span>
          <span v-else-if="scope.row.state === 2">待审批</span>
          <span v-else-if="scope.row.state === 3">已审批</span>
          <span v-else-if="scope.row.state === 4">已驳回</span>
          <span v-else-if="scope.row.state === 5">已排程</span>
          <span v-else-if="scope.row.state === 6">已发布</span>
          <span v-else-if="scope.row.state === 7">已暂停</span>
          <span v-else-if="scope.row.state === 8">已完成</span>
          <span v-else-if="scope.row.state === 9">已取消</span>
          <span v-else-if="scope.row.state === 10">已取代</span>
          <span v-else-if="scope.row.state === 11">执行中</span>
          <span v-else>未知</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width" fixed="right">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-if="scope.row.state === 1 || scope.row.state === 4"
            v-hasPermi="['ota:fota:task:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-finished"
            @click="handleAudit(scope.row)"
            v-if="scope.row.state === 2"
            v-hasPermi="['ota:fota:task:audit']"
          >审核
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-document"
            @click="handleApprovalRecord(scope.row)"
            v-if="scope.row.state === 2 || scope.row.state === 3"
            v-hasPermi="['ota:fota:task:list']"
          >审批记录
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-time"
            @click="handleSchedule(scope.row)"
            v-if="scope.row.state === 3 && isBeforeStartTime(scope.row.startTime)"
            v-hasPermi="['ota:fota:task:schedule']"
          >定时发布
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-time"
            @click="handleUnschedule(scope.row)"
            v-if="scope.row.state === 5"
            v-hasPermi="['ota:fota:task:unschedule']"
          >取消排程
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-s-flag"
            @click="handleRelease(scope.row)"
            v-if="(scope.row.state === 3 && isAfterStartTimeBeforeEndTime(scope.row.startTime, scope.row.endTime)) || scope.row.state === 5"
            v-hasPermi="['ota:fota:task:release']"
          >发布
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-video-pause"
            @click="handlePause(scope.row)"
            v-if="scope.row.state === 6 || scope.row.state === 11"
            v-hasPermi="['ota:fota:task:pause']"
          >暂停
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-video-play"
            @click="handleResume(scope.row)"
            v-if="scope.row.state === 7"
            v-hasPermi="['ota:fota:task:resume']"
          >恢复
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-zoom-out"
            @click="handleCancel(scope.row)"
            v-if="scope.row.state === 6 || scope.row.state === 7 || scope.row.state === 11"
            v-hasPermi="['ota:fota:task:cancel']"
          >取消
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-if="scope.row.state === 1 || scope.row.state === 4"
            v-hasPermi="['ota:fota:task:remove']"
          >删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改升级任务对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="1100px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入任务名称" :disabled="form.state === 2"/>
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="任务阶段" prop="stage">
              <el-select
                v-model="form.phase"
                placeholder="任务阶段"
                clearable
                :disabled="form.state === 2"
                style="width: 100%;"
              >
                <el-option :key="1" label="验证" :value="1"/>
                <el-option :key="2" label="灰度" :value="2"/>
                <el-option :key="3" label="发布" :value="3"/>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="任务车辆" prop="target">
          <div style="width: 100%;">
            <el-radio-group v-model="targetMode" :disabled="form.state === 2" @change="handleTargetModeChange">
              <el-radio label="LIST">手动选择</el-radio>
              <el-radio label="IMPORT">文件导入</el-radio>
              <el-radio label="CONDITION">条件匹配</el-radio>
            </el-radio-group>
            <div style="margin-top: 10px;">
              <!-- LIST模式：手动输入VIN列表 -->
              <div v-if="targetMode === 'LIST'">
                <el-input
                  v-model="targetVins"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入VIN号，多个VIN用逗号或换行分隔"
                  :disabled="form.state === 2"
                  @input="handleVinsChange"
                />
                <div style="margin-top: 5px; color: #909399; font-size: 12px;">
                  已输入 {{ targetVinsList.length }} 个VIN
                </div>
              </div>
              <!-- IMPORT模式：文件导入 -->
              <div v-if="targetMode === 'IMPORT'">
                <el-upload
                  action="#"
                  :auto-upload="false"
                  :on-change="handleFileChange"
                  :file-list="targetFileList"
                  :limit="1"
                  accept=".xlsx,.xls,.csv"
                  :disabled="form.state === 2"
                >
                  <el-button size="small" type="primary" :disabled="form.state === 2">选择文件</el-button>
                  <div slot="tip" class="el-upload__tip">支持xlsx、xls、csv格式文件</div>
                </el-upload>
              </div>
              <!-- CONDITION模式：条件规则 -->
              <div v-if="targetMode === 'CONDITION'">
                <div style="margin-bottom: 10px;">
                  <el-radio-group v-model="targetLogic" :disabled="form.state === 2" @change="handleConditionChange">
                    <el-radio label="AND">满足所有条件</el-radio>
                    <el-radio label="OR">满足任一条件</el-radio>
                  </el-radio-group>
                </div>
                <div v-for="(condition, index) in targetConditions" :key="'target-condition-'+index"
                     style="margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                  <el-select v-model="condition.field" placeholder="选择字段" :disabled="form.state === 2"
                             style="width: 200px;">
                    <el-option label="基线代码" value="baselineCode"/>
                    <el-option label="车型" value="modelCode"/>
                    <el-option label="年款" value="yearCode"/>
                    <el-option label="配置" value="configCode"/>
                  </el-select>
                  <el-select v-model="condition.operator" placeholder="操作符" :disabled="form.state === 2"
                             style="width: 100px;">
                    <el-option label="等于" value="="/>
                    <el-option label="不等于" value="!="/>
                    <el-option label="包含" value="IN"/>
                    <el-option label="不包含" value="NOT_IN"/>
                  </el-select>
                  <el-input v-model="condition.value" placeholder="请输入值" :disabled="form.state === 2"
                            style="flex: 1;"/>
                  <el-button type="danger" icon="el-icon-delete" circle size="mini"
                             v-if="form.state !== 2"
                             @click="targetConditions.splice(index, 1)"/>
                </div>
                <el-button type="primary" plain icon="el-icon-plus" size="mini"
                           v-if="form.state !== 2"
                           @click="targetConditions.push({field: '', operator: '=', value: ''})">
                  添加条件
                </el-button>
              </div>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="升级活动" prop="activityName">
          <div>
            <el-autocomplete
              v-model="form.activityName"
              :fetch-suggestions="queryActivity"
              placeholder="请查询升级活动"
              :trigger-on-focus="false"
              clearable
              @select="handleActivitySelect"
              :disabled="form.state === 2"
              style="width: 100%;"
            >
              <template #default="{ item }">
                <div>{{ item.name }}[{{ item.activityCode }}]</div>
              </template>
            </el-autocomplete>
          </div>
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="任务开始时间" prop="startTime">
              <el-date-picker
                v-model="form.startTime"
                type="datetime"
                placeholder="请选择任务开始时间"
                value-format="timestamp"
                format="yyyy-MM-dd HH:00"
                :picker-options="startTimePickerOptions"
                :disabled="form.state === 2"
                style="width: 100%;"
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务结束时间" prop="endTime">
              <el-date-picker
                v-model="form.endTime"
                type="datetime"
                placeholder="请选择任务结束时间"
                value-format="timestamp"
                format="yyyy-MM-dd HH:00"
                :picker-options="endTimePickerOptions"
                :disabled="form.state === 2"
                style="width: 100%;"
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="升级模式" prop="upgradeMode">
              <el-select
                v-model="form.upgradeMode"
                placeholder="升级模式"
                clearable
                :disabled="form.state === 2"
                style="width: 100%;"
              >
                <el-option :key="1" label="普通" :value="1"/>
                <el-option :key="2" label="强制" :value="2"/>
                <el-option :key="3" label="预约静默" :value="3"/>
                <el-option :key="4" label="远程静默" :value="4"/>
                <el-option :key="5" label="工厂" :value="5"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="通知类型" prop="noticeType">
              <el-input v-model="form.noticeType" placeholder="请输入通知类型" :disabled="form.state === 2"/>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 匹配条件 -->
        <el-divider content-position="left">匹配条件</el-divider>
        <div v-for="(restriction, index) in form.restrictions" :key="'restriction-'+index" class="condition-item">
          <el-row :gutter="10">
            <el-col :span="8">
              <el-form-item :label="index === 0 ? '条件类型' : ''">
                <el-select
                  v-model="restriction.type"
                  placeholder="选择条件类型"
                  :disabled="form.state === 2"
                  style="width: 100%;"
                >
                  <el-option label="过滤排除的基线号" value="BASELINE_EXCLUDE"/>
                  <el-option label="未对齐基线的车辆拉齐基线" value="BASELINE_UNIFICATION"/>
                  <el-option label="适配主体" value="ADAPTATION_SUBJECT"/>
                  <el-option label="比对基准" value="COMPARISON_CRITERIA"/>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="14">
              <el-form-item :label="index === 0 ? '条件值' : ''">
                <el-input
                  v-if="restriction.type === 'BASELINE_EXCLUDE'"
                  v-model="restriction.expression"
                  placeholder="请输入排除的基线号"
                  :disabled="form.state === 2"
                />
                <el-select
                  v-else-if="restriction.type === 'ADAPTATION_SUBJECT'"
                  v-model="restriction.expression"
                  placeholder="选择适配主体"
                  :disabled="form.state === 2"
                  style="width: 100%;"
                >
                  <el-option label="基础软件零件号" value="1"/>
                  <el-option label="基础软件内部版本" value="2"/>
                  <el-option label="两者均要适配" value="3"/>
                  <el-option label="两者均不适配" value="4"/>
                </el-select>
                <el-switch
                  v-else
                  v-model="restriction.expression"
                  active-value="true"
                  inactive-value="false"
                  :disabled="form.state === 2"
                />
              </el-form-item>
            </el-col>
            <el-col :span="2" v-if="form.state !== 2">
              <el-button type="danger" icon="el-icon-delete" circle size="mini"
                         @click="form.restrictions.splice(index, 1)"/>
            </el-col>
          </el-row>
        </div>
        <el-button type="primary" plain icon="el-icon-plus" size="mini"
                   v-if="form.state !== 2"
                   @click="form.restrictions.push({type: '', expression: ''})">
          添加匹配条件
        </el-button>

        <!-- 安装条件 -->
        <el-divider content-position="left">安装条件</el-divider>
        <div v-for="(condition, index) in form.installConditions" :key="'condition-'+index" class="condition-item">
          <el-row :gutter="10">
            <el-col :span="10">
              <el-form-item :label="index === 0 ? '条件类型' : ''">
                <el-select
                  v-model="condition.conditionType"
                  placeholder="选择条件类型"
                  :disabled="form.state === 2"
                  style="width: 100%;"
                  @change="handleConditionTypeChange(condition)"
                >
                  <el-option
                    v-for="item in installConditionTypeList"
                    :key="item.code"
                    :label="item.name"
                    :value="item.code"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="10">
              <el-form-item :label="index === 0 ? '操作符' : ''">
                <el-select
                  v-model="condition.operator"
                  placeholder="操作符"
                  :disabled="form.state === 2"
                  style="width: 100%;"
                >
                  <el-option label="等于" value="EQ"/>
                  <el-option label="不等于" value="NE"/>
                  <el-option label="大于" value="GT"/>
                  <el-option label="大于等于" value="GE"/>
                  <el-option label="小于" value="LT"/>
                  <el-option label="小于等于" value="LE"/>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="4" v-if="form.state !== 2">
              <el-form-item :label="index === 0 ? ' ' : ''">
                <el-button type="danger" icon="el-icon-delete" circle size="mini"
                           @click="form.installConditions.splice(index, 1)"/>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="10" style="margin-top: -10px;">
            <el-col :span="10">
              <el-form-item :label="index === 0 ? '阈值' : ''">
                <el-input
                  v-model="condition.threshold"
                  placeholder="请输入阈值"
                  :disabled="form.state === 2"
                >
                  <template slot="append" v-if="getConditionUnit(condition.conditionType)">
                    {{ getConditionUnit(condition.conditionType) }}
                  </template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="10">
              <el-form-item :label="index === 0 ? '严重级别' : ''">
                <el-select
                  v-model="condition.severity"
                  placeholder="级别"
                  :disabled="form.state === 2"
                  style="width: 100%;"
                >
                  <el-option label="阻断" value="BLOCK"/>
                  <el-option label="警告" value="WARN"/>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="4" v-if="form.state !== 2">
              <el-form-item :label="index === 0 ? ' ' : ''">
                <span></span>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
        <el-button type="primary" plain icon="el-icon-plus" size="mini"
                   v-if="form.state !== 2"
                   @click="form.installConditions.push({conditionType: '', operator: 'EQ', threshold: '', severity: 'BLOCK'})">
          添加安装条件
        </el-button>

        <!-- 策略 -->
        <el-divider content-position="left">策略</el-divider>
        <div v-for="(strategy, index) in form.strategies" :key="'strategy-'+index" class="condition-item">
          <el-row :gutter="10">
            <el-col :span="8">
              <el-form-item :label="index === 0 ? '策略类型' : ''">
                <el-select
                  v-model="strategy.type"
                  placeholder="选择策略类型"
                  :disabled="form.state === 2"
                  style="width: 100%;"
                >
                  <el-option label="是否回滚" value="ROLLBACK"/>
                  <el-option label="刷写次数" value="FLASH_COUNT"/>
                  <el-option label="用车影响" value="IMPACT_VEHICLE_OPERATION"/>
                  <el-option label="保持驻车(P档)" value="KEEP_IN_PARK"/>
                  <el-option label="不在充电" value="NOT_CHARGING"/>
                  <el-option label="不对外供电" value="NO_EXTERNAL_POWER"/>
                  <el-option label="车窗、天窗、车门及尾门关闭" value="ALL_CLOSED"/>
                  <el-option label="高压电量" value="HV_SOC"/>
                  <el-option label="低压电量" value="LV_SOC"/>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="14">
              <el-form-item :label="index === 0 ? '策略值' : ''">
                <el-input-number
                  v-if="strategy.type === 'FLASH_COUNT' || strategy.type === 'HV_SOC' || strategy.type === 'LV_SOC'"
                  v-model="strategy.strategy"
                  :min="strategy.type === 'FLASH_COUNT' ? 0 : 10"
                  :max="strategy.type === 'FLASH_COUNT' ? 3 : 100"
                  controls-position="right"
                  :disabled="form.state === 2"
                />
                <el-switch
                  v-else
                  v-model="strategy.strategy"
                  active-value="true"
                  inactive-value="false"
                  :disabled="form.state === 2"
                />
              </el-form-item>
            </el-col>
            <el-col :span="2" v-if="form.state !== 2">
              <el-button type="danger" icon="el-icon-delete" circle size="mini"
                         @click="form.strategies.splice(index, 1)"/>
            </el-col>
          </el-row>
        </div>
        <el-button type="primary" plain icon="el-icon-plus" size="mini"
                   v-if="form.state !== 2"
                   @click="form.strategies.push({type: '', strategy: ''})">
          添加策略
        </el-button>

        <el-form-item label="审批级别" prop="approvalLevel" v-if="title === '审核升级任务'">
          <el-select v-model="form.approvalLevel" placeholder="请选择审批级别" style="width: 100%">
            <el-option label="质量审批" value="QUALITY"/>
            <el-option label="产品审批" value="PRODUCT"/>
            <el-option label="安全审批" value="SECURITY"/>
          </el-select>
        </el-form-item>
        <el-form-item label="审批结果" prop="result" v-if="title === '审核升级任务'">
          <el-radio-group v-model="form.result">
            <el-radio label="APPROVED">通过</el-radio>
            <el-radio label="REJECTED">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审批意见" prop="comment" v-if="title === '审核升级任务' && form.result === 'REJECTED'">
          <el-input v-model="form.comment" type="textarea" placeholder="请输入审批意见"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm" v-if="title !== '审核升级任务'">确 定</el-button>
        <el-button type="success" @click="handleSubmit" v-if="form.state === 1">提 交</el-button>
        <el-button type="success" @click="submitAuditForm" v-if="title === '审核升级任务' && form.state === 2">审 核
        </el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 审批记录对话框 -->
    <el-dialog title="审批记录" :visible.sync="openApprovalRecord" width="800px" append-to-body>
      <el-table v-loading="loadingApproval" :data="approvalList">
        <el-table-column label="审批级别" prop="level" width="120" align="center">
          <template slot-scope="scope">
            <span v-if="scope.row.level === 'QUALITY'">质量审批</span>
            <span v-else-if="scope.row.level === 'PRODUCT'">产品审批</span>
            <span v-else-if="scope.row.level === 'SECURITY'">安全审批</span>
            <span v-else>{{ scope.row.level }}</span>
          </template>
        </el-table-column>
        <el-table-column label="审批结果" prop="result" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.result === 'APPROVED' ? 'success' : 'danger'" size="small">
              {{ scope.row.result === 'APPROVED' ? '通过' : '拒绝' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审批人" prop="approver" width="120" align="center"/>
        <el-table-column label="审批意见" prop="comment" show-overflow-tooltip/>
        <el-table-column label="审批时间" align="center" prop="decidedAt" width="160">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.decidedAt, '{y}-{m}-{d} {h}:{i}') }}</span>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button @click="openApprovalRecord = false">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- 定时发布对话框 -->
    <el-dialog title="定时发布" :visible.sync="openSchedule" width="500px" append-to-body>
      <el-form ref="scheduleForm" :model="scheduleForm" :rules="scheduleRules" label-width="120px">
        <el-form-item label="计划发布时间" prop="releaseTime">
          <el-date-picker
            v-model="scheduleForm.releaseTime"
            type="datetime"
            placeholder="请选择计划发布时间"
            value-format="yyyy-MM-ddTHH:mm:ss"
            format="yyyy-MM-dd HH:mm"
            :picker-options="scheduleTimePickerOptions"
            style="width: 100%;"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitScheduleForm">确 定</el-button>
        <el-button @click="openSchedule = false">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  addTask,
  delTask,
  getTask,
  listTask,
  listAllTaskState,
  updateTask,
  submitTask,
  auditTask,
  releaseTask,
  scheduleTask,
  unscheduleTask,
  pauseTask,
  resumeTask,
  cancelTask,
  listTaskApproval
} from "@/api/iov/ota/task";
import {
  listActivity,
  getActivity
} from "@/api/iov/ota/activity";
import {
  listInstallConditionType
} from "@/api/iov/ota/installConditionType";

export default {
  name: "Task",
  dicts: [],
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 升级任务表格数据
      taskList: [],
      taskStateList: [],
      installConditionTypeList: [],
      // 任务车辆相关
      targetMode: 'LIST',
      targetVins: '',
      targetVinsList: [],
      targetFileList: [],
      targetLogic: 'AND',
      targetConditions: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 审批记录对话框
      openApprovalRecord: false,
      loadingApproval: false,
      approvalList: [],
      // 定时发布对话框
      openSchedule: false,
      scheduleForm: {
        taskId: undefined,
        releaseTime: undefined,
        startTime: undefined
      },
      scheduleRules: {
        releaseTime: [
          { required: true, message: "计划发布时间不能为空", trigger: "blur" }
        ]
      },
      scheduleTimePickerOptions: {
        disabledDate: (time) => {
          // 不能选择过去的时间
          if (time.getTime() < Date.now() - 86400000) {
            return true;
          }
          // 不能超过任务开始时间
          if (this.scheduleForm.startTime && time.getTime() > this.scheduleForm.startTime) {
            return true;
          }
          return false;
        },
        disabledMinutes: () => {
          return Array.from({ length: 59 }, (_, i) => i + 1);
        },
        disabledSeconds: () => {
          return Array.from({ length: 60 }, (_, i) => i);
        }
      },
      // 日期范围
      dateRange: [],
      // 时间选择器配置 - 开始时间
      startTimePickerOptions: {
        disabledMinutes: () => {
          // 只允许选择0分钟，禁用其他分钟
          return Array.from({ length: 59 }, (_, i) => i + 1);
        },
        disabledSeconds: () => {
          // 禁用所有秒
          return Array.from({ length: 60 }, (_, i) => i);
        }
      },
      // 时间选择器配置 - 结束时间
      endTimePickerOptions: {
        disabledMinutes: () => {
          return Array.from({ length: 59 }, (_, i) => i + 1);
        },
        disabledSeconds: () => {
          return Array.from({ length: 60 }, (_, i) => i);
        }
      },
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        name: [
          {required: true, message: "任务名称不能为空", trigger: "blur"}
        ],
        phase: [
          {required: true, message: "任务阶段不能为空", trigger: "blur"}
        ],
        activityName: [
          {required: true, message: "升级活动不能为空", trigger: "blur"}
        ],
        startTime: [
          {required: true, message: "任务开始时间不能为空", trigger: "blur"}
        ],
        endTime: [
          {required: true, message: "任务结束时间不能为空", trigger: "blur"}
        ],
        upgradeMode: [
          {required: true, message: "升级模式不能为空", trigger: "blur"}
        ],
        approvalLevel: [{
          validator: (rule, value, callback) => {
            if (this.form.state === 2) {
              if (!value) {
                callback(new Error('审批级别不能为空'));
              } else {
                callback();
              }
            } else {
              callback();
            }
          },
          trigger: "change"
        }],
        result: [{
          validator: (rule, value, callback) => {
            if (this.form.state === 2) {
              if (!value) {
                callback(new Error('审批结果不能为空'));
              } else {
                callback();
              }
            } else {
              callback();
            }
          },
          trigger: "change"
        }],
        comment: [{
          validator: (rule, value, callback) => {
            if (this.form.state === 2 && this.form.result === 'REJECTED') {
              if (!value || value.trim() === '') {
                callback(new Error('审批意见不能为空'));
              } else {
                callback();
              }
            } else {
              callback();
            }
          },
          trigger: ["blur", "change"]
        }]
      },
    };
  },
  created() {
    this.getTaskStateList();
    this.getInstallConditionTypeList();
    this.getList();
  },
  methods: {
    /** 查询升级任务列表 */
    getList() {
      this.loading = true;
      listTask(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.taskList = response.data.items;
          this.total = response.data.total;
          this.loading = false;
        }
      );
    },
    getTaskStateList() {
      listAllTaskState().then(response => {
          this.taskStateList = response.data;
        }
      );
    },
    getInstallConditionTypeList() {
      listInstallConditionType().then(response => {
          this.installConditionTypeList = response.data;
        }
      );
    },
    queryActivity(queryString, cb) {
      listActivity({
        name: queryString,
        state: 5
      }).then(response => {
        const items = response.data ? response.data.items : (response.rows || []);
        if (items && items.length > 0) {
          const suggestions = items.map(item => {
            return {
              value: item.name + '[' + (item.baselineCode || '') + ']',
              ...item
            };
          });
          cb(suggestions);
        } else {
          cb([]);
        }
      }).catch(() => {
        cb([]);
      });
    },
    /** 取消按钮 */
    cancel() {
      this.open = false;
      this.reset();
    },
    /** 表单重置 */
    reset() {
      this.form = {
        id: undefined,
        name: undefined,
        phase: undefined,
        activityId: undefined,
        activityName: undefined,
        target: undefined,
        startTime: undefined,
        endTime: undefined,
        noticeType: undefined,
        upgradeMode: undefined,
        upgradeModeArg: undefined,
        restrictions: [],
        installConditions: [],
        strategies: [],
        state: undefined
      };
      this.targetMode = 'LIST';
      this.targetVins = '';
      this.targetVinsList = [];
      this.targetFileList = [];
      this.targetLogic = 'AND';
      this.targetConditions = [];
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.dateRange = [];
      this.resetForm("queryForm");
      this.handleQuery();
    },
    /** 多选框选中数据 */
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length != 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加升级任务";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const taskId = row.id || this.ids
      getTask(taskId).then(response => {
        this.form = response.data;
        this.parseTarget(this.form.target);
        getActivity(this.form.activityId).then(response2 => {
          const activity = response2.data;
          this.form.activityName = activity.name + "[" + (activity.baselineCode || '') + "]";
          this.open = true;
        });
      });
      this.title = "修改升级任务";
    },
    /** 审核按钮操作 */
    handleAudit(row) {
      this.reset();
      const taskId = row.id || this.ids
      getTask(taskId).then(response => {
        this.form = response.data;
        this.parseTarget(this.form.target);
        this.$set(this.form, 'approvalLevel', 'QUALITY');
        this.$set(this.form, 'result', 'APPROVED');
        getActivity(this.form.activityId).then(response2 => {
          const activity = response2.data;
          this.form.activityName = activity.name + "[" + (activity.baselineCode || '') + "]";
          this.open = true;
        });
      });
      this.title = "审核升级任务";
    },
    /** 排程按钮操作 */
    handleSchedule(row) {
      const taskId = row.id || this.ids
      this.scheduleForm = {
        taskId: taskId,
        releaseTime: undefined,
        startTime: row.startTime
      }
      this.openSchedule = true
    },
    /** 取消排程按钮操作 */
    handleUnschedule(row) {
      const taskId = row.id || this.ids
      this.$modal.confirm('是否确认取消排程该升级任务？').then(() => {
        if (taskId !== undefined) {
          unscheduleTask(taskId).then(response => {
            this.$modal.msgSuccess("取消排程成功");
            this.getList();
          });
        }
      }).catch(() => {
      });
    },
    /** 提交定时发布表单 */
    submitScheduleForm() {
      this.$refs["scheduleForm"].validate(valid => {
        if (valid) {
          scheduleTask(this.scheduleForm.taskId, this.scheduleForm.releaseTime).then(response => {
            this.$modal.msgSuccess("排程成功");
            this.openSchedule = false;
            this.getList();
          });
        }
      });
    },
    /** 发布按钮操作 */
    handleRelease(row) {
      const taskId = row.id || this.ids
      this.$modal.confirm('是否确认发布该升级任务？').then(() => {
        if (taskId !== undefined) {
          releaseTask(taskId).then(response => {
            this.$modal.msgSuccess("发布成功");
            this.getList();
          });
        }
      }).catch(() => {
      });
    },
    /** 暂停按钮操作 */
    handlePause(row) {
      const taskId = row.id || this.ids
      this.$modal.confirm('是否确认暂停该升级任务？').then(() => {
        if (taskId !== undefined) {
          pauseTask(taskId).then(response => {
            this.$modal.msgSuccess("暂停成功");
            this.getList();
          });
        }
      }).catch(() => {
      });
    },
    /** 恢复按钮操作 */
    handleResume(row) {
      const taskId = row.id || this.ids
      this.$modal.confirm('是否确认恢复该升级任务？').then(() => {
        if (taskId !== undefined) {
          resumeTask(taskId).then(response => {
            this.$modal.msgSuccess("恢复成功");
            this.getList();
          });
        }
      }).catch(() => {
      });
    },
    /** 取消按钮操作 */
    handleCancel(row) {
      const taskId = row.id || this.ids
      this.$modal.confirm('是否确认取消该升级任务？').then(() => {
        if (taskId !== undefined) {
          cancelTask(taskId).then(response => {
            this.$modal.msgSuccess("取消成功");
            this.getList();
          });
        }
      }).catch(() => {
      });
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateTask(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addTask(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const taskIds = row.id || this.ids;
      this.$modal.confirm('是否确认删除升级任务ID为"' + taskIds + '"的数据项？').then(function () {
        return delTask(taskIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('ota-fota/task/export', {
        ...this.queryParams
      }, `task_${new Date().getTime()}.xlsx`)
    },
    handleActivitySelect(item) {
      this.form.activityName = item.name + "[" + (item.activityCode || '') + "]";
      this.form.activityId = item.id;
    },
    getConditionUnit(conditionType) {
      const condition = this.installConditionTypeList.find(item => item.code === conditionType);
      return condition ? condition.unit : '';
    },
    handleConditionTypeChange(condition) {
      const conditionType = this.installConditionTypeList.find(item => item.code === condition.conditionType);
      if (conditionType) {
        condition.threshold = conditionType.defaultValue || '';
      }
    },
    handleTargetModeChange(mode) {
      this.targetMode = mode;
      this.updateTarget();
    },
    handleVinsChange(value) {
      if (value) {
        this.targetVinsList = value.split(/[,，\n]/).map(v => v.trim()).filter(v => v);
      } else {
        this.targetVinsList = [];
      }
      this.updateTarget();
    },
    handleFileChange(file) {
      this.targetFileList = [file];
      this.updateTarget();
    },
    handleConditionChange() {
      this.updateTarget();
    },
    updateTarget() {
      let target = {};
      switch (this.targetMode) {
        case 'LIST':
          target = {
            mode: 'LIST',
            vins: this.targetVinsList
          };
          break;
        case 'IMPORT':
          target = {
            mode: 'IMPORT',
            vins: this.targetVinsList
          };
          break;
        case 'CONDITION':
          target = {
            mode: 'CONDITION',
            logic: this.targetLogic,
            conditions: this.targetConditions
          };
          break;
      }
      this.form.target = JSON.stringify(target);
    },
    parseTarget(targetStr) {
      if (!targetStr) {
        this.targetMode = 'LIST';
        this.targetVins = '';
        this.targetVinsList = [];
        this.targetLogic = 'AND';
        this.targetConditions = [];
        return;
      }
      try {
        const target = JSON.parse(targetStr);
        this.targetMode = target.mode || 'LIST';
        switch (this.targetMode) {
          case 'LIST':
          case 'IMPORT':
            this.targetVinsList = target.vins || [];
            this.targetVins = this.targetVinsList.join('\n');
            break;
          case 'CONDITION':
            this.targetLogic = target.logic || 'AND';
            this.targetConditions = target.conditions || [];
            break;
        }
      } catch (e) {
        console.error('解析target失败:', e);
        this.targetMode = 'LIST';
        this.targetVins = targetStr;
        this.targetVinsList = [targetStr];
      }
    },
    handleSubmit() {
      this.$modal.confirm('是否确认提交该升级任务？').then(() => {
        this.$refs["form"].validate(valid => {
          if (valid && this.form.id !== undefined) {
            submitTask(this.form.id, this.form).then(response => {
              this.$modal.msgSuccess("提交成功");
              this.open = false;
              this.getList();
            });
          }
        });
      }).catch(() => {
      });
    },
    submitAuditForm() {
      this.$modal.confirm('是否确认提交该升级任务审核结果？').then(() => {
        this.$refs["form"].validate(valid => {
          if (valid && this.form.id !== undefined) {
            auditTask(this.form.id, {
              id: this.form.id,
              approvalLevel: this.form.approvalLevel,
              result: this.form.result,
              comment: this.form.comment
            }).then(response => {
              this.$modal.msgSuccess("提交成功");
              this.open = false;
              this.getList();
            });
          }
        });
      }).catch(() => {
      });
    },
    /** 审批记录按钮操作 */
    handleApprovalRecord(row) {
      this.loadingApproval = true;
      this.openApprovalRecord = true;
      listTaskApproval(row.id).then(response => {
        this.approvalList = response.data;
        this.loadingApproval = false;
      }).catch(() => {
        this.loadingApproval = false;
      });
    },
    getTargetMode(targetStr) {
      if (!targetStr) return 'LIST';
      try {
        const target = JSON.parse(targetStr);
        return target.mode || 'LIST';
      } catch (e) {
        return 'LIST';
      }
    },
    /** 判断当前时间是否在任务开始时间之前 */
    isBeforeStartTime(startTime) {
      if (!startTime) return false;
      return Date.now() < startTime;
    },
    /** 判断当前时间是否在任务开始时间之后且在结束时间之前 */
    isAfterStartTimeBeforeEndTime(startTime, endTime) {
      if (!startTime || !endTime) return false;
      const now = Date.now();
      return now >= startTime && now < endTime;
    },
  }
};
</script>

<style scoped>
.condition-item {
  margin-bottom: 10px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.condition-item .el-form-item {
  margin-bottom: 0;
}

.el-divider {
  margin: 20px 0 15px;
}
</style>
