<template>
  <div class="app-container">
    <el-row :gutter="20">
      <splitpanes :horizontal="this.$store.getters.device === 'mobile'" class="default-theme">
        <!--组织架构数据-->
        <pane size="16">
          <el-col>
            <div class="head-container">
              <el-input v-model="orgKey" placeholder="请输入组织名称" clearable size="small" prefix-icon="el-icon-search" style="margin-bottom: 20px" />
            </div>
            <div class="head-container">
              <el-tree :data="orgOptions" :props="defaultProps" :expand-on-click-node="false" :filter-node-method="filterNode" ref="tree" node-key="id" default-expand-all highlight-current @node-click="handleNodeClick" />
            </div>
          </el-col>
        </pane>
        <!--用户数据-->
        <pane size="84">
          <el-col>
            <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
              <el-form-item label="门店代码" prop="code">
                <el-input
                  v-model="queryParams.code"
                  placeholder="请输入门店代码"
                  clearable
                  style="width: 150px"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
              <el-form-item label="门店全称" prop="name">
                <el-input
                  v-model="queryParams.name"
                  placeholder="请输入门店全称"
                  clearable
                  style="width: 200px"
                  @keyup.enter.native="handleQuery"
                />
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
                  v-hasPermi="['org:dealership:info:add']"
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
                  v-hasPermi="['org:dealership:info:edit']"
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
                  v-hasPermi="['org:dealership:info:remove']"
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
                  v-hasPermi="['org:dealership:info:export']"
                >导出
                </el-button>
              </el-col>
              <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
            </el-row>

            <el-table v-loading="loading" :data="dealershipList" @selection-change="handleSelectionChange">
              <el-table-column type="selection" width="55" align="center"/>
              <el-table-column label="门店代码" prop="code" width="120"/>
              <el-table-column label="门店全称" prop="name" width="200"/>
              <el-table-column label="门店地址" prop="address" width="300"/>
              <el-table-column label="排序" prop="sort" align="center"/>
              <el-table-column label="创建时间" align="center" prop="createTime" width="180">
                <template slot-scope="scope">
                  <span>{{ parseTime(scope.row.createTime) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" align="center" width="150" fixed="right" class-name="small-padding fixed-width">
                <template slot-scope="scope">
                  <el-button
                    size="mini"
                    type="text"
                    icon="el-icon-edit"
                    @click="handleUpdate(scope.row)"
                    v-hasPermi="['org:dealership:info:edit']"
                  >修改
                  </el-button>
                  <el-button
                    size="mini"
                    type="text"
                    icon="el-icon-delete"
                    @click="handleDelete(scope.row)"
                    v-hasPermi="['org:dealership:info:remove']"
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
          </el-col>
        </pane>
      </splitpanes>
    </el-row>

    <!-- 添加或修改门店配置对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="门店代码" prop="code">
              <el-input v-model="form.code" placeholder="请输入门店代码"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="门店简称" prop="shortName">
              <el-input v-model="form.shortName" placeholder="请输入门店简称"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-form-item label="门店全称" prop="name">
            <el-input v-model="form.name" placeholder="请输入门店全称"/>
          </el-form-item>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="英文名称" prop="engName">
              <el-input v-model="form.engName" placeholder="请输入英文名称"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="曾用名称" prop="formerName">
              <el-input v-model="form.formerName" placeholder="请输入曾用名称"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-form-item label="门店地址" prop="address">
            <el-input v-model="form.address" placeholder="请输入门店地址"/>
          </el-form-item>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="大区" prop="regionCode">
              <el-select
                v-model="form.regionCode"
                placeholder="大区"
                clearable
                @change="getAreaList"
              >
                <el-option
                  v-for="region in regionList"
                  :key="region.id"
                  :label="region.label"
                  :value="region.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="小区" prop="areaCode">
              <el-select
                v-model="form.areaCode"
                placeholder="小区"
                clearable
              >
                <el-option
                  v-for="area in areaList"
                  :key="area.id"
                  :label="area.label"
                  :value="area.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" controls-position="right" :min="0"/>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.description" type="textarea" placeholder="请输入内容"></el-input>
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
  listDealership,
  getDealership,
  addDealership,
  updateDealership,
  delDealership,
  orgTreeSelect
} from "@/api/org/dealership/info";
import Treeselect from "@riophae/vue-treeselect";
import "@riophae/vue-treeselect/dist/vue-treeselect.css";
import {Pane, Splitpanes} from "splitpanes";
import "splitpanes/dist/splitpanes.css";

export default {
  name: "Dealership",
  dicts: [],
  components: { Treeselect, Splitpanes, Pane },
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
      // 表格数据
      dealershipList: [],
      // 大区列表
      regionList: [],
      // 小区列表
      areaList: [],
      // 弹出层标题
      title: "",
      // 组织树选项
      orgOptions: undefined,
      // 是否显示弹出层
      open: false,
      // 组织关键词
      orgKey: undefined,
      // 日期范围
      dateRange: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
      // 查询参数
      queryOrgParams: {
      },
      // 表单参数
      form: {},
      defaultProps: {
        children: "children",
        label: "label"
      },
      // 表单校验
      rules: {
        code: [
          {required: true, message: "门店代码不能为空", trigger: "blur"}
        ],
        name: [
          {required: true, message: "门店全称不能为空", trigger: "blur"}
        ],
        sort: [
          {required: true, message: "排序不能为空", trigger: "blur"}
        ]
      },
    };
  },
  created() {
    this.getList();
    this.getOrgTree();
  },
  methods: {
    /** 查询门店列表 */
    getList() {
      this.loading = true;
      listDealership(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.dealershipList = response.rows;
          this.total = response.total;
          this.loading = false;
        }
      );
    },
    /** 查询组织下拉树结构 */
    getOrgTree() {
      orgTreeSelect(this.queryOrgParams).then(response => {
        this.orgOptions = response.data;
      });
    },
    // 查询大区列表
    getRegionList() {
      this.queryOrgParams.orgType = 'REGION';
      orgTreeSelect(this.queryOrgParams).then(response => {
        this.regionList = response.data;
      });
    },
    // 查询小区列表
    getAreaList(regionCode) {
      this.queryOrgParams.orgType = 'AREA';
      this.queryOrgParams.regionCode = regionCode;
      orgTreeSelect(this.queryOrgParams).then(response => {
        this.areaList = response.data;
      });
    },
    // 筛选节点
    filterNode(value, data) {
      if (!value) return true;
      return data.label.indexOf(value) !== -1;
    },
    // 节点单击事件
    handleNodeClick(data) {
      this.queryParams = {
        pageNum: 1,
        pageSize: 10,
        regionCode: undefined,
        areaCode: undefined
      };
      if(data.type === 'REGION') {
        this.queryParams.regionCode = data.id;
      }
      if(data.type === 'AREA') {
        this.queryParams.areaCode = data.id;
      }
      this.handleQuery();
    },
    /** 取消按钮 */
    cancel() {
      this.open = false;
      this.reset();
    },
    /** 表单重置 */
    reset() {
      this.form = {
        code: undefined,
        name: undefined,
        shortName: undefined,
        engName: undefined,
        formerName: undefined,
        address: undefined,
        sort: 99
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
      this.queryParams = {
        pageNum: 1,
        pageSize: 10,
        regionCode: undefined,
        areaCode: undefined
      };
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
      this.title = "添加门店";
      this.form = {};
      this.getRegionList();
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const dealershipId = row.id || this.ids
      getDealership(dealershipId).then(response => {
        this.form = response.data;
        this.open = true;
      });
      this.getRegionList();
      if(row.regionCode !== undefined) {
        this.getAreaList(row.regionCode);
      }
      this.title = "修改门店";
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateDealership(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addDealership(this.form).then(response => {
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
      const dealershipIds = row.id || this.ids;
      this.$modal.confirm('是否确认删除门店ID为"' + dealershipIds + '"的数据项？').then(function () {
        return delDealership(dealershipIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('edd-org/dealership/export', {
        ...this.queryParams
      }, `dealership_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
