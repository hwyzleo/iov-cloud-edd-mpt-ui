<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="账号ID" prop="userId">
        <el-input
          v-model="queryParams.userId"
          placeholder="请输入账号ID"
          clearable
          style="width: 220px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="账号类型" prop="identityType">
        <el-select
          v-model="queryParams.identityType"
          placeholder="请选择账号类型"
          clearable
          style="width: 120px"
        >
          <el-option label="手机号" value="mobile" />
          <el-option label="邮箱" value="email" />
          <el-option label="微信" value="wechat" />
          <el-option label="苹果" value="apple" />
          <el-option label="谷歌" value="google" />
        </el-select>
      </el-form-item>
      <el-form-item label="账号" prop="identityValue">
        <el-input
          v-model="queryParams.identityValue"
          placeholder="请输入账号"
          clearable
          style="width: 140px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="昵称" prop="nickname">
        <el-input
          v-model="queryParams.nickname"
          placeholder="请输入昵称"
          clearable
          style="width: 120px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="注册来源" prop="registerSource">
        <el-select
          v-model="queryParams.registerSource"
          placeholder="注册来源"
          clearable
          style="width: 140px"
        >
          <el-option label="手机号注册" value="mobile" />
          <el-option label="邮箱注册" value="email" />
          <el-option label="微信注册" value="wechat" />
          <el-option label="Apple注册" value="apple" />
          <el-option label="Google注册" value="google" />
          <el-option label="微信小程序注册" value="wechat_mini_program" />
          <el-option label="微信H5注册" value="wechat_h5" />
          <el-option label="iOS App注册" value="app_ios" />
          <el-option label="Android App注册" value="app_android" />
          <el-option label="后台手机号创建" value="admin_mobile" />
          <el-option label="后台邮箱创建" value="admin_email" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="userStatus">
        <el-select
          v-model="queryParams.userStatus"
          placeholder="账号状态"
          clearable
          style="width: 120px"
        >
          <el-option key="0" label="待验证" :value="0"/>
          <el-option key="1" label="正常" :value="1"/>
          <el-option key="2" label="已锁定" :value="2"/>
          <el-option key="3" label="已禁用" :value="3"/>
          <el-option key="4" label="注销处理中" :value="4"/>
          <el-option key="5" label="已注销" :value="5"/>
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间">
        <el-date-picker
          v-model="dateRange"
          style="width: 240px"
          value-format="yyyy-MM-dd HH:mm:ss"
          type="datetimerange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="['00:00:00', '23:59:59']"
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
          v-hasPermi="['user:account:account:add']"
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
          v-hasPermi="['user:account:account:edit']"
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
          v-hasPermi="['user:account:account:remove']"
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
          v-hasPermi="['user:account:account:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="accountList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="账号ID" prop="userId" width="180" show-overflow-tooltip>
        <template slot-scope="scope">
          <el-button type="text" icon="el-icon-document" style="padding: 0; margin-right: 5px;" @click="copyText(scope.row.userId)" title="复制"></el-button>
          <span>{{ scope.row.userId }}</span>
        </template>
      </el-table-column>
      <el-table-column label="账号类型" prop="identityType" width="100" align="center">
        <template slot-scope="scope">
          <span>{{ getIdentityTypeLabel(scope.row.identityType) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="账号" prop="identityValue" width="195"/>
      <el-table-column label="昵称" prop="nickname" min-width="120"/>
      <el-table-column label="性别" prop="gender" width="70" align="center">
        <template slot-scope="scope">
          <span>{{ getGenderLabel(scope.row.gender) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="注册来源" prop="registerSource" width="130" align="center">
        <template slot-scope="scope">
          <span>{{ getRegSourceLabel(scope.row.registerSource) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" prop="userStatus" width="90" align="center">
        <template slot-scope="scope">
          <el-tag :type="getUserStatusType(scope.row.userStatus)">{{ getUserStatusLabel(scope.row.userStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="160">
        <template slot-scope="scope">
          <span>{{ formatTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="100">
        <template slot-scope="scope" v-if="scope.row.userId">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['user:account:account:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['user:account:account:remove']"
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

    <!-- 添加或修改账号配置对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="账号类型" prop="identityType">
          <el-select v-model="form.identityType" placeholder="请选择账号类型" style="width: 100%" :disabled="!!form.userId">
            <el-option label="手机号" value="MOBILE" />
            <el-option label="邮箱" value="EMAIL" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.identityType === 'MOBILE'" label="手机号" prop="mobile" :required="form.identityType === 'MOBILE'">
          <el-input v-model="form.mobile" placeholder="请输入手机号" :disabled="!!form.userId"/>
        </el-form-item>
        <el-form-item v-if="form.identityType === 'EMAIL'" label="邮箱" prop="email" :required="form.identityType === 'EMAIL'">
          <el-input v-model="form.email" placeholder="请输入邮箱" :disabled="!!form.userId"/>
        </el-form-item>
        <el-form-item v-if="!form.userId" label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码"/>
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称"/>
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="form.gender" placeholder="请选择性别" style="width: 100%">
            <el-option label="未知" :value="0" />
            <el-option label="男" :value="1" />
            <el-option label="女" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  listAccount,
  getAccount,
  addAccount,
  updateAccount,
  delAccount
} from "@/api/customer/account/info";
import {getBrand} from "@/api/mdm/brand";

export default {
  name: "Account",
  dicts: ['iov_user_gender', 'iov_reg_source'],
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
      // 账号表格数据
      accountList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 日期范围
      dateRange: [],
      // 菜单列表
      menuOptions: [],
      // 部门列表
      deptOptions: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        userId: undefined,
        identityType: undefined,
        identityValue: undefined,
        nickname: undefined,
        registerSource: undefined,
        userStatus: undefined,
        startTime: undefined,
        endTime: undefined
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        identityType: [
          {required: true, message: "请选择账号类型", trigger: "change"}
        ],
        mobile: [
          { validator: (rule, value, callback) => {
              if (this.form.identityType === 'MOBILE') {
                if (!value) {
                  callback(new Error("手机号不能为空"))
                } else if (!/^1[3-9]\d{9}$/.test(value)) {
                  callback(new Error("请输入正确的手机号"))
                } else {
                  callback()
                }
              } else {
                callback()
              }
            }, trigger: "blur" }
        ],
        email: [
          { validator: (rule, value, callback) => {
              if (this.form.identityType === 'EMAIL') {
                if (!value) {
                  callback(new Error("邮箱不能为空"))
                } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
                  callback(new Error("请输入正确的邮箱"))
                } else {
                  callback()
                }
              } else {
                callback()
              }
            }, trigger: "blur" }
        ]
      }
    };
  },
  created() {
    this.queryParams.userId = this.$route.query.userId;
    this.getList();
  },
  watch: {
    'form.identityType'(val) {
      this.$refs.form.validateField(val === 'MOBILE' ? 'mobile' : 'email')
    }
  },
  methods: {
    /** 查询账号列表 */
    getList() {
      this.loading = true;
      const params = { ...this.queryParams }
      if (this.dateRange && this.dateRange.length === 2) {
        params.startTime = this.dateRange[0]
        params.endTime = this.dateRange[1]
      }
      listAccount(params).then(response => {
          const data = response.data || response
          this.accountList = data.items || data.rows || []
          this.total = data.total || 0
          this.loading = false;
        }
      );
    },
    // 获取性别
    getGenderLabel(gender) {
      const genderMap = { 0: '未知', 1: '男', 2: '女' }
      return genderMap[gender] || '未知'
    },
    // 获取账号类型
    getIdentityTypeLabel(identityType) {
      const identityTypeMap = {
        'mobile': '手机号',
        'email': '邮箱',
        'wechat': '微信',
        'apple': '苹果',
        'google': '谷歌'
      }
      return identityTypeMap[identityType] || '-'
    },
    // 格式化时间（处理数组格式）
    formatTime(time) {
      if (!time) return ''
      if (Array.isArray(time)) {
        const [year, month, day, hour, minute, second] = time
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
      }
      return this.parseTime(time)
    },
    // 获取注册来源
    getRegSourceLabel(regSource) {
      const regSourceMap = {
        'mobile': '手机号注册',
        'email': '邮箱注册',
        'wechat': '微信注册',
        'apple': 'Apple注册',
        'google': 'Google注册',
        'wechat_mini_program': '微信小程序注册',
        'wechat_h5': '微信H5注册',
        'app_ios': 'iOS App注册',
        'app_android': 'Android App注册',
        'admin_mobile': '后台手机号创建',
        'admin_email': '后台邮箱创建',
        'ADMIN_MOBILE': '后台手机号创建',
        'ADMIN_EMAIL': '后台邮箱创建'
      }
      return regSourceMap[regSource] || regSource || '-'
    },
    // 获取用户状态
    getUserStatusLabel(userStatus) {
      const statusMap = {
        0: '待验证',
        1: '正常',
        2: '已锁定',
        3: '已禁用',
        4: '注销处理中',
        5: '已注销'
      }
      return statusMap[userStatus] || '未知'
    },
    // 获取用户状态标签类型
    getUserStatusType(userStatus) {
      const typeMap = {
        0: 'info',
        1: 'success',
        2: 'warning',
        3: 'danger',
        4: 'warning',
        5: 'info'
      }
      return typeMap[userStatus] || 'info'
    },
    // 复制文本
    copyText(text) {
      if (!text) return
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          this.$modal.msgSuccess('复制成功')
        }).catch(() => {
          this.$modal.msgError('复制失败')
        })
      } else {
        const input = document.createElement('input')
        input.value = text
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
        this.$modal.msgSuccess('复制成功')
      }
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        userId: undefined,
        identityType: 'MOBILE',
        mobile: undefined,
        nickname: undefined,
        gender: undefined,
        remark: undefined
      };
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
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.userId)
      this.single = selection.length != 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加账号";
      this.$nextTick(() => {
        this.$refs.form.clearValidate()
      })
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      // 如果是点击行，使用row.userId；如果是选中复选框，使用this.ids（但只取第一个）
      const userId = row.userId || (this.ids.length > 0 ? this.ids[0] : undefined)
      if (!userId) {
        this.$modal.msgWarning('请选择要修改的记录')
        return
      }
      getAccount(userId).then(response => {
        const data = response.data
        const identityType = data.identityType || 'MOBILE'
        this.form = {
          userId: data.userId,
          identityType: identityType,
          mobile: identityType === 'MOBILE' ? data.identityValue : undefined,
          email: identityType === 'EMAIL' ? data.identityValue : undefined,
          nickname: data.nickname,
          gender: data.gender,
          remark: data.description
        };
        this.open = true;
      });
      this.title = "修改账号";
    },
    /** 提交按钮 */
    submitForm: function () {
      const form = this.form
      this.$refs["form"].validate(valid => {
        if (valid) {
          // 根据身份类型清理不需要的字段
          const submitData = { ...form }
          if (submitData.identityType === 'MOBILE') {
            submitData.email = undefined
          } else if (submitData.identityType === 'EMAIL') {
            submitData.mobile = undefined
          }

          if (submitData.userId != undefined) {
            updateAccount(submitData).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addAccount(submitData).then(response => {
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
      const userIds = row.userId ? [row.userId] : this.ids;
      this.$modal.confirm('是否确认删除选中的数据项？').then(function () {
        return delAccount(userIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('sec-ciam/api/mp/account/v1/accounts/export', {
        ...this.queryParams
      }, `account_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
