<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="企业编码" prop="uniqueCode">
        <el-input
          v-model="queryParams.uniqueCode"
          placeholder="请输入企业编码"
          clearable
          style="width: 150px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="服务端平台" prop="serverPlatformCode">
        <el-select
          v-model="queryParams.serverPlatformCode"
          placeholder="服务端平台"
          clearable
          style="width: 140px"
        >
          <el-option
            v-for="serverPlatform in this.serverPlatformList"
            :key="serverPlatform.code"
            :label="serverPlatform.name"
            :value="serverPlatform.code"
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
          v-hasPermi="['edd:rsms:clientPlatform:add']"
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
          v-hasPermi="['edd:rsms:clientPlatform:edit']"
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
          v-hasPermi="['edd:rsms:clientPlatform:remove']"
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
          v-hasPermi="['edd:rsms:clientPlatform:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="clientPlatformList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="服务端平台" prop="serverPlatformCode">
        <template slot-scope="scope">
          <span>{{ getServerPlatformName(scope.row.serverPlatformCode) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="企业编码" prop="uniqueCode" width="170"/>
      <el-table-column label="采集频率" align="center" prop="collectFrequency" width="80"/>
      <el-table-column label="上报频率" align="center" prop="reportFrequency" width="80"/>
      <el-table-column label="数据加密方式" align="center" prop="encryptType" width="100">
        <template slot-scope="scope">
          <span>{{ getDataEncryptType(scope.row.encryptType) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="是否启用" align="center" width="100">
        <template slot-scope="scope">
          <el-switch
            v-model="scope.row.enable"
            :active-value="true"
            :inactive-value="false"
          ></el-switch>
        </template>
      </el-table-column>
      <el-table-column label="连接状态" align="center" prop="connectStat" width="120"/>
      <el-table-column label="登录状态" align="center" prop="loginStat" width="120"/>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="250" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['edd:rsms:clientPlatform:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['edd:rsms:clientPlatform:remove']"
          >删除
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-menu"
            @click="handleAccount(scope.row)"
            v-hasPermi="['edd:rsms:clientPlatform:listAccount']"
          >账号管理
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-menu"
            @click="handleNode(scope.row)"
            v-hasPermi="['edd:rsms:clientPlatform:listNode']"
          >节点管理
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-menu"
            @click="handleVehicle(scope.row)"
            v-hasPermi="['edd:rsms:clientPlatform:listVehicle']"
          >车辆管理
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-info"
            @click="handleLoginHistory(scope.row)"
            v-hasPermi="['edd:rsms:clientPlatform:listLoginHistory']"
          >登录历史
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-s-promotion"
            @click="handleSyncPlatform(scope.row)"
            v-hasPermi="['edd:rsms:clientPlatform:syncPlatform']"
          >同步平台
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

    <!-- 添加或修改客户端平台对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="750px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="130px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="服务端平台" prop="serverPlatformCode">
              <el-select
                v-model="form.serverPlatformCode"
                placeholder="服务端平台"
                clearable
              >
                <el-option
                  v-for="serverPlatform in this.serverPlatformList"
                  :key="serverPlatform.code"
                  :label="serverPlatform.name"
                  :value="serverPlatform.code"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="企业编码" prop="uniqueCode">
              <el-input v-model="form.uniqueCode" :readonly="form.id !== undefined" placeholder="请输入企业编码"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="采集频率" prop="collectFrequency">
              <el-input-number v-model="form.collectFrequency" controls-position="right" :min="1"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="上报频率" prop="reportFrequency">
              <el-input-number v-model="form.reportFrequency" controls-position="right" :min="1"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="数据加密方式" prop="encryptType">
              <el-select
                v-model="form.encryptType"
                placeholder="数据加密方式"
                clearable
              >
                <el-option
                  v-for="dict in dict.type.iov_rsms_data_encrypt_type"
                  :key="dict.value"
                  :label="dict.label"
                  :value="parseInt(dict.value)"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="数据加密KEY" prop="encryptKey">
              <el-input v-model="form.encryptKey" placeholder="请输入数据加密KEY"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="是否启用">
          <el-radio-group v-model="form.enable">
            <el-radio
              :label="true"
            >启用
            </el-radio>
            <el-radio
              :label="false"
            >停用
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="绑定主机名" prop="hostname">
          <el-input v-model="form.hostname" placeholder="请输入绑定主机名"/>
        </el-form-item>
        <el-form-item label="备注" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入内容"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 添加或修改客户端平台账号对话框 -->
    <el-dialog :title="title" :visible.sync="openAccount" width="750px" append-to-body>
      <el-form ref="formAccount" :model="formAccount" :rules="rulesAccount" label-width="130px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="formAccount.username" placeholder="请输入用户名"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="密码" prop="password">
              <el-input v-model="formAccount.password" placeholder="请输入密码"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="使用上限" prop="useLimit">
              <el-input-number v-model="formAccount.useLimit" controls-position="right" :min="0"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="formAccount.sort" controls-position="right" :min="1"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="是否启用">
          <el-radio-group v-model="formAccount.enable">
            <el-radio
              :label="true"
            >启用
            </el-radio>
            <el-radio
              :label="false"
            >停用
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="description">
          <el-input v-model="formAccount.description" type="textarea" placeholder="请输入内容"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitFormAccount">确 定</el-button>
        <el-button @click="cancelAccount">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 添加或修改已注册车辆对话框 -->
    <el-dialog :title="title" :visible.sync="openVehicle" width="750px" append-to-body>
      <el-form ref="formVehicle" :model="formVehicle" :rules="rulesVehicle" label-width="130px">
        <el-form-item label="车架号" prop="vin">
          <el-input v-model="formVehicle.vin" placeholder="请输入车架号"/>
        </el-form-item>
        <el-form-item label="备注" prop="description">
          <el-input v-model="formVehicle.description" type="textarea" placeholder="请输入内容"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitFormVehicle">确 定</el-button>
        <el-button @click="cancelVehicle">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 客户端平台账号列表对话框 -->
    <el-drawer title="账号列表" :visible.sync="openAccountList" direction="rtl" size="40%" :modal="true"
               :append-to-body="true" :before-close="closeAccount">
      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button
            type="primary"
            plain
            icon="el-icon-plus"
            size="mini"
            @click="handleAddAccount"
            v-hasPermi="['edd:rsms:clientPlatform:addAccount']"
          >新增
          </el-button>
        </el-col>
      </el-row>
      <el-table v-loading="loadingAccount" :data="clientPlatformAccountList">
        <el-table-column label="用户名" prop="username"/>
        <el-table-column label="使用上限" align="center" prop="useLimit" width="80"/>
        <el-table-column label="是否启用" align="center" width="80">
          <template slot-scope="scope">
            <el-switch
              v-model="scope.row.enable"
              :active-value="true"
              :inactive-value="false"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="排序" align="center" prop="sort" width="80"/>
        <el-table-column label="创建时间" align="center" prop="createTime" width="160">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="180" class-name="small-padding fixed-width">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="text"
              icon="el-icon-edit"
              @click="handleUpdateAccount(scope.row)"
              v-hasPermi="['edd:rsms:clientPlatform:editAccount']"
            >修改
            </el-button>
            <el-button
              size="mini"
              type="text"
              icon="el-icon-delete"
              @click="handleDeleteAccount(scope.row)"
              v-hasPermi="['edd:rsms:clientPlatform:removeAccount']"
            >删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-drawer>

    <!-- 客户端平台节点 -->
    <el-drawer title="节点列表" :visible.sync="openNode" direction="rtl" size="30%" :modal="true"
               :append-to-body="true" :before-close="closeNode">
      <el-table :data="clientPlatformNodeList">
        <el-table-column label="节点主机名" prop="hostname"/>
        <el-table-column label="是否连接" align="center" width="100">
          <template slot-scope="scope">
            <el-switch
              v-model="scope.row.connect"
              :active-value="true"
              :inactive-value="false"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="是否登录" align="center" width="100">
          <template slot-scope="scope">
            <el-switch
              v-model="scope.row.login"
              :active-value="true"
              :inactive-value="false"
              @change="handleLoginChange(scope.row)"
            ></el-switch>
          </template>
        </el-table-column>
      </el-table>
    </el-drawer>

    <!-- 客户端平台已注册车辆 -->
    <el-drawer title="已注册车辆" :visible.sync="openVehicleList" direction="rtl" size="40%" :modal="true"
               :append-to-body="true">
      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button
            type="primary"
            plain
            icon="el-icon-plus"
            size="mini"
            @click="handleAddVehicle"
            v-hasPermi="['edd:rsms:clientPlatform:addVehicle']"
          >新增
          </el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            type="danger"
            plain
            icon="el-icon-delete"
            size="mini"
            :disabled="multipleVehicle"
            @click="handleDeleteVehicle"
            v-hasPermi="['edd:rsms:clientPlatform:removeVehicle']"
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
            v-hasPermi="['edd:rsms:clientPlatform:exportVehicle']"
          >导出为《车辆静态信息导入表》
          </el-button>
        </el-col>
      </el-row>
      <el-table v-loading="loadingVehicle" :data="clientPlatformVehicleList" @selection-change="handleSelectionChangeVehicle">
        <el-table-column type="selection" width="55" align="center"/>
        <el-table-column label="车架号" prop="vin"/>
        <el-table-column label="创建时间" align="center" prop="createTime" width="160">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="100" class-name="small-padding fixed-width">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="text"
              icon="el-icon-delete"
              @click="handleDeleteVehicle(scope.row)"
              v-hasPermi="['edd:rsms:clientPlatform:removeVehicle']"
            >删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="totalVehicle>0"
        :total="totalVehicle"
        :page.sync="queryParamsVehicle.pageNum"
        :limit.sync="queryParamsVehicle.pageSize"
        @pagination="getVehicleList"
      />
    </el-drawer>

    <!-- 客户端平台登录历史 -->
    <el-drawer title="登录历史" :visible.sync="openLoginHistory" direction="rtl" size="50%" :modal="true"
               :append-to-body="true">
      <el-table v-loading="loadingLoginHistory" :data="clientPlatformLoginHistoryList">
        <el-table-column label="节点主机名" prop="hostname"/>
        <el-table-column label="登录时间" align="center" prop="loginTime" width="180">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.loginTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="登录流水号" prop="loginSn" align="center" width="100"/>
        <el-table-column label="登录结果" prop="loginResult" align="center" width="80">
          <template slot-scope="scope">
            {{ scope.row.loginResult ? '成功' : '失败' }}
          </template>
        </el-table-column>
        <el-table-column label="失败原因" prop="failureReason" align="center" width="80"/>
        <el-table-column label="连续失败次数" prop="failureCount" align="center" width="100"/>
        <el-table-column label="登出时间" align="center" prop="logoutTime" width="180">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.logoutTime) }}</span>
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="totalLoginHistory>0"
        :total="totalLoginHistory"
        :page.sync="queryParamsLoginHistory.pageNum"
        :limit.sync="queryParamsLoginHistory.pageSize"
        @pagination="getLoginHistoryList"
      />
    </el-drawer>
  </div>
</template>

<script>
import {
  addClientPlatform,
  addClientPlatformAccount, addRegisteredVehicle,
  delClientPlatform,
  delClientPlatformAccount, delRegisteredVehicle,
  getClientPlatform,
  getClientPlatformAccount,
  listClientPlatform,
  listClientPlatformAccount,
  listClientPlatformLoginHistory, listRegisteredVehicle,
  login,
  logout,
  syncClientPlatformInfo,
  updateClientPlatform,
  updateClientPlatformAccount
} from "@/api/edd/rsms/clientplatform";
import {listAllServerPlatform} from "@/api/edd/rsms/serverplatform";

export default {
  name: "ClientPlatform",
  dicts: ['iov_rsms_data_encrypt_type'],
  data() {
    return {
      // 遮罩层
      loading: true,
      loadingAccount: true,
      loadingVehicle: true,
      loadingLoginHistory: true,
      // 选中数组
      ids: [],
      idsVehicle: [],
      // 非单个禁用
      single: true,
      singleVehicle: true,
      // 非多个禁用
      multiple: true,
      multipleVehicle: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      totalVehicle: 0,
      totalLoginHistory: 0,
      // 客户端平台表格数据
      clientPlatformList: [],
      clientPlatformAccountList: [],
      clientPlatformNodeList: [],
      clientPlatformVehicleList: [],
      clientPlatformLoginHistoryList: [],
      // 服务端平台表格数据
      serverPlatformList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      openAccount: false,
      openAccountList: false,
      openNode: false,
      openVehicle: false,
      openVehicleList: false,
      openLoginHistory: false,
      // 日期范围
      dateRange: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
      queryParamsVehicle: {
        pageNum: 1,
        pageSize: 10
      },
      queryParamsLoginHistory: {
        pageNum: 1,
        pageSize: 10
      },
      // 表单参数
      form: {},
      formAccount: {},
      formVehicle: {},
      // 表单校验
      rules: {
        serverPlatformCode: [
          {required: true, message: "服务端平台不能为空", trigger: "blur"}
        ],
        uniqueCode: [
          {required: true, message: "企业编码不能为空", trigger: "blur"}
        ],
        collectFrequency: [
          {required: true, message: "采集频率不能为空", trigger: "blur"}
        ],
        reportFrequency: [
          {required: true, message: "上报频率不能为空", trigger: "blur"}
        ],
        encryptType: [
          {required: true, message: "数据加密方式不能为空", trigger: "blur"}
        ]
      },
      rulesAccount: {
        username: [
          {required: true, message: "用户名不能为空", trigger: "blur"}
        ],
        password: [
          {required: true, message: "密码不能为空", trigger: "blur"}
        ],
        useLimit: [
          {required: true, message: "使用上限不能为空", trigger: "blur"}
        ]
      },
      rulesVehicle: {
        vin: [
          {required: true, message: "车架号不能为空", trigger: "blur"}
        ]
      }
    };
  },
  created() {
    this.getAllServerPlatform();
    this.getList();
  },
  methods: {
    /** 查询客户端平台列表 */
    getList() {
      this.loading = true;
      listClientPlatform(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.clientPlatformList = response.rows;
          this.total = response.total;
          this.loading = false;
        }
      );
    },
    /** 查询客户端平台账号列表 */
    getClientPlatformAccountList(clientPlatformId) {
      this.loadingAccount = true;
      listClientPlatformAccount(clientPlatformId).then(response => {
        this.clientPlatformAccountList = response;
        this.loadingAccount = false;
      });
    },
    /** 查询车辆 */
    getVehicleList() {
      this.loadingVehicle = true;
      listRegisteredVehicle(this.queryParamsVehicle.clientPlatformId, this.queryParamsVehicle).then(response => {
          this.clientPlatformVehicleList = response.rows;
          this.totalVehicle = response.total;
          this.loadingVehicle = false;
        }
      );
    },
    /** 查询登录历史 */
    getLoginHistoryList() {
      this.loadingLoginHistory = true;
      listClientPlatformLoginHistory(this.queryParamsLoginHistory.clientPlatformId, this.queryParamsLoginHistory).then(response => {
          this.clientPlatformLoginHistoryList = response.rows;
          this.totalLoginHistory = response.total;
          this.loadingLoginHistory = false;
        }
      );
    },
    /** 获取所有服务端平台列表 */
    getAllServerPlatform() {
      this.loading = true;
      listAllServerPlatform().then(response => {
          this.serverPlatformList = response;
          this.loading = false;
        }
      );
    },
    /** 获取服务端平台名称 */
    getServerPlatformName(serverPlatformCode) {
      const item = this.serverPlatformList.find(
        serverPlatform => serverPlatform.code === serverPlatformCode
      )
      return item ? item.name : serverPlatformCode
    },
    /** 获取数据加密类型 */
    getDataEncryptType(dataEncryptType) {
      if (!this.dict || !this.dict.type || !this.dict.type.iov_rsms_data_encrypt_type) {
        return dataEncryptType;
      }
      const item = this.dict.type.iov_rsms_data_encrypt_type.find(
        dict => parseInt(dict.value) === dataEncryptType
      )
      return item ? item.label : dataEncryptType
    },
    /** 取消按钮 */
    cancel() {
      this.open = false;
      this.reset();
    },
    cancelAccount() {
      this.openAccount = false;
      this.resetAccount();
    },
    cancelVehicle() {
      this.openVehicle = false;
      this.resetVehicle();
    },
    /** 关闭按钮 */
    closeAccount() {
      this.openAccountList = false;
    },
    closeNode() {
      this.openNode = false;
      this.getList();
    },
    /** 表单重置 */
    reset() {
      this.form = {
        serverPlatformCode: undefined,
        uniqueCode: undefined,
        description: undefined
      };
      this.resetForm("form");
    },
    resetAccount() {
      this.formAccount = {
        description: undefined
      };
      this.resetForm("formAccount");
    },
    resetVehicle() {
      this.formVehicle = {
        description: undefined
      };
      this.resetForm("formAccount");
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
    handleSelectionChangeVehicle(selection) {
      this.idsVehicle = selection.map(item => item.id)
      this.singleVehicle = selection.length != 1
      this.multipleVehicle = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加客户端平台";
      this.form = {
        enable: true
      };
    },
    /** 新增账号按钮操作 */
    handleAddAccount() {
      this.resetAccount();
      this.openAccount = true;
      this.title = "添加客户端平台账号";
      this.formAccount = {
        useLimit: 0,
        enable: true,
        sort: 99
      };
    },
    /** 新增车辆按钮操作 */
    handleAddVehicle() {
      this.resetVehicle();
      this.openVehicle = true;
      this.title = "添加已注册车辆";
      this.formVehicle = {};
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const clientPlatformId = row.id || this.ids
      getClientPlatform(clientPlatformId).then(response => {
        this.form = response.data;
        this.open = true;
      });
      this.title = "修改客户端平台";
    },
    /** 修改账号按钮操作 */
    handleUpdateAccount(row) {
      this.resetAccount();
      getClientPlatformAccount(this.form.id, row.id).then(response => {
        this.formAccount = response.data;
        this.openAccount = true;
      });
      this.title = "修改客户端平台账号";
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateClientPlatform(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addClientPlatform(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 账号提交按钮 */
    submitFormAccount: function () {
      this.$refs["formAccount"].validate(valid => {
        if (valid) {
          if (this.formAccount.id !== undefined) {
            updateClientPlatformAccount(this.form.id, this.formAccount).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.openAccount = false;
              this.getClientPlatformAccountList(this.form.id);
            });
          } else {
            addClientPlatformAccount(this.form.id, this.formAccount).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.openAccount = false;
              this.getClientPlatformAccountList(this.form.id);
            });
          }
        }
      });
    },
    /** 车辆提交按钮 */
    submitFormVehicle: function () {
      this.$refs["formVehicle"].validate(valid => {
        if (valid) {
          if (this.formVehicle.id === undefined) {
            addRegisteredVehicle(this.queryParamsVehicle.clientPlatformId, this.formVehicle).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.openVehicle = false;
              this.getVehicleList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const clientPlatformIds = row.id || this.ids;
      this.$modal.confirm('是否确认删除客户端平台ID为"' + clientPlatformIds + '"的数据项？').then(function () {
        return delClientPlatform(clientPlatformIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
        this.$modal.msgError("删除失败");
      });
    },
    /** 删除账号按钮操作 */
    handleDeleteAccount(row) {
      const clientPlatformId = this.form.id;
      this.$modal.confirm('是否确认删除客户端平台账号ID为"' + row.id + '"的数据项？').then(function () {
        return delClientPlatformAccount(clientPlatformId, row.id);
      }).then(() => {
        this.getClientPlatformAccountList(clientPlatformId);
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
        this.$modal.msgError("删除失败");
      });
    },
    /** 删除车辆按钮操作 */
    handleDeleteVehicle(row) {
      const vehicleIds = row.id || this.idsVehicle;
      const clientPlatformId = this.queryParamsVehicle.clientPlatformId;
      this.$modal.confirm('是否确认删除已注册车辆ID为"' + vehicleIds + '"的数据项？').then(function () {
        return delRegisteredVehicle(clientPlatformId, vehicleIds);
      }).then(() => {
        this.getVehicleList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 账号管理按钮操作 */
    handleAccount(row) {
      this.form.id = row.id;
      this.openAccountList = true;
      this.getClientPlatformAccountList(row.id);
    },
    /** 节点管理按钮操作 */
    handleNode(row) {
      this.clientPlatformNodeList = [];
      Object.entries(row.connectState).forEach(([key, value]) => {
        this.clientPlatformNodeList.push({
          "id": row.id,
          "hostname": key,
          "connect": value,
          "login": row.loginState[key]
        })
      });
      this.openNode = true;
    },
    /** 车辆管理按钮操作 */
    handleVehicle(row) {
      this.queryParamsVehicle.clientPlatformId = row.id;
      this.openVehicleList = true;
      this.getVehicleList();
    },
    /** 登录历史按钮操作 */
    handleLoginHistory(row) {
      this.queryParamsLoginHistory.clientPlatformId = row.id;
      this.openLoginHistory = true;
      this.getLoginHistoryList();
    },
    /** 同步平台按钮操作 */
    handleSyncPlatform(row) {
      this.$modal.confirm('是否确认同步客户端平台ID为"' + row.id + '"的信息？').then(function () {
        return syncClientPlatformInfo(row.id);
      }).then(() => {
        this.$modal.msgSuccess("同步成功");
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('tsp-rsms/mpt/clientPlatform/export', {
        ...this.queryParams
      }, `client_platform_${new Date().getTime()}.xlsx`)
    },
    /** 切换登录状态 */
    handleLoginChange(row) {
      let text = row.login ? "登入" : "登出";
      this.$modal.confirm('确认要"' + text + '"当前平台吗？').then(function () {
        if (row.login) {
          return login(row.id, row.hostname);
        } else {
          return logout(row.id, row.hostname);
        }
      }).then(() => {
        this.$modal.msgSuccess(text + "成功");
      }).catch(function () {
        row.login = !row.login;
      });
    }
  }
};
</script>
