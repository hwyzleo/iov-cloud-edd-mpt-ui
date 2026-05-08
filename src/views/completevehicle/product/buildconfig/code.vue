<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="特征族代码" prop="familyCode">
        <el-input
          v-model="queryParams.familyCode"
          placeholder="请输入特征族代码"
          clearable
          style="width: 140px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="特征族名称" prop="familyName">
        <el-input
          v-model="queryParams.familyName"
          placeholder="请输入特征族名称"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
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
          v-hasPermi="['completeVehicle:product:buildConfig:edit']"
        >新增
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
          v-hasPermi="['completeVehicle:product:buildConfig:edit']"
        >删除
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-back"
          size="mini"
          @click="handleBack"
        >返回
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-alert
      :title="'生产配置代码：' + buildConfigCode"
      :description="'生产配置名称：' + buildConfigName"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 15px"
    />

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="特征族代码" prop="familyCode" width="120" align="center"/>
      <el-table-column label="特征族名称" prop="familyName"/>
      <el-table-column label="特征值代码" prop="featureCode" width="200">
        <template slot-scope="scope">
          <span>{{ scope.row.featureCode ? scope.row.featureCode.join(', ') : '' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="特征值名称" prop="featureName">
        <template slot-scope="scope">
          <span>{{ scope.row.featureName ? scope.row.featureName.join(', ') : '' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="特征类型" prop="featureType" width="100" align="center"/>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="120" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['completeVehicle:product:buildConfig:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['completeVehicle:product:buildConfig:edit']"
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

    <el-dialog :title="title" :visible.sync="open" width="650px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="特征族分类" prop="familyType">
          <el-select
            v-model="form.familyType"
            placeholder="请选择特征族分类（可选）"
            clearable
            filterable
            :disabled="form.id !== undefined"
            @change="handleFamilyTypeChange"
          >
            <el-option key="BASIC" label="基础平台" value="BASIC"/>
            <el-option key="POWERTRAIN" label="三电&动力" value="POWERTRAIN"/>
            <el-option key="CHASSIS" label="底盘&制动&转向" value="CHASSIS"/>
            <el-option key="ADAS" label="智驾" value="ADAS"/>
            <el-option key="EE" label="车机&网联&EE" value="EE"/>
            <el-option key="COCKPIT" label="座舱&舒适" value="COCKPIT"/>
            <el-option key="EXTERIOR" label="外饰&功能" value="EXTERIOR"/>
            <el-option key="SAFE" label="法规&安全" value="SAFE"/>
          </el-select>
        </el-form-item>
        <el-form-item label="特征族代码" prop="familyCodeSearch">
          <el-input
            v-model="form.familyCodeSearch"
            placeholder="输入特征族代码快速定位"
            clearable
            :disabled="form.id !== undefined"
            @input="handleFamilyCodeSearch"
            style="width: 300px"
          />
        </el-form-item>
        <el-form-item label="特征族" prop="familyCode">
          <el-select
            v-model="form.familyCode"
            placeholder="请选择特征族"
            clearable
            filterable
            :disabled="form.id !== undefined"
            @change="handleFamilyChange"
          >
            <el-option-group
              v-for="group in filteredFamilyGroups"
              :key="group.label"
              :label="group.label"
            >
              <el-option
                v-for="family in group.options"
                :key="family.code"
                :label="family.name + ' (' + family.code + ')'"
                :value="family.code"
              />
            </el-option-group>
          </el-select>
        </el-form-item>
        <el-form-item label="特征值" prop="featureCode">
          <el-select
            v-model="form.featureCode"
            multiple
            filterable
            placeholder="请选择特征值"
            :disabled="!form.familyCode"
            @change="handleFeatureCodeChange"
          >
            <el-option
              v-for="feature in featureList"
              :key="feature.code"
              :label="feature.name + ' (' + feature.code + ')'"
              :value="feature.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="已选特征值">
          <el-tag
            v-for="code in form.featureCode"
            :key="code"
            closable
            style="margin: 5px"
            @close="handleRemoveFeatureCode(code)"
          >
            {{ getFeatureNameByCode(code) }}
          </el-tag>
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
  listBuildConfigFeatureCode,
  getBuildConfigFeatureCode,
  addBuildConfigFeatureCode,
  updateBuildConfigFeatureCode,
  delBuildConfigFeatureCode
} from "@/api/completevehicle/product/buildconfig";
import {
  listAllFeatureFamily,
  listAllFeatureCode
} from "@/api/completevehicle/product/featurefamily";

export default {
  name: "BuildConfigFeatureCode",
  dicts: [],
  data() {
    return {
      buildConfigCode: this.$route.query.code,
      buildConfigName: this.$route.query.name,
      loading: true,
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      list: [],
      allFamilyList: [],
      familyList: [],
      featureList: [],
      title: "",
      open: false,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        buildConfigCode: this.$route.query.code
      },
      form: {},
      rules: {
        familyCode: [
          {required: true, message: "特征族不能为空", trigger: "blur"}
        ],
        featureCode: [
          {required: true, message: "特征值不能为空", trigger: "blur"}
        ]
      },
      familyTypeMap: {
        'BASIC': '基础平台',
        'POWERTRAIN': '三电&动力',
        'CHASSIS': '底盘&制动&转向',
        'ADAS': '智驾',
        'EE': '车机&网联&EE',
        'COCKPIT': '座舱&舒适',
        'EXTERIOR': '外饰&功能',
        'SAFE': '法规&安全'
      }
    };
  },
  computed: {
    filteredFamilyGroups() {
      const groups = {};
      
      this.familyList.forEach(family => {
        if (this.form.familyType && family.type !== this.form.familyType) {
          return;
        }
        if (this.form.familyCodeSearch && !family.code.toLowerCase().includes(this.form.familyCodeSearch.toLowerCase())) {
          return;
        }
        
        const typeKey = family.type || 'OTHER';
        const typeName = this.familyTypeMap[typeKey] || '其他';
        
        if (!groups[typeKey]) {
          groups[typeKey] = {
            label: typeName,
            options: []
          };
        }
        groups[typeKey].options.push(family);
      });
      
      return Object.values(groups);
    }
  },
  created() {
    this.getList();
    this.getAllFamilyList();
  },
  methods: {
    getList() {
      this.loading = true;
      listBuildConfigFeatureCode(this.buildConfigCode, this.queryParams).then(response => {
        this.list = response.data;
        this.total = response.data.length;
        this.loading = false;
      });
    },
    getAllFamilyList() {
      listAllFeatureFamily().then(response => {
        this.allFamilyList = response.data;
        this.familyList = response.data;
      });
    },
    cancel() {
      this.open = false;
      this.reset();
    },
    reset() {
      this.form = {
        buildConfigCode: this.buildConfigCode,
        familyType: undefined,
        familyCodeSearch: undefined,
        familyCode: undefined,
        familyName: undefined,
        featureCode: [],
        featureName: [],
        featureType: undefined
      };
      this.featureList = [];
      this.familyList = this.allFamilyList;
      this.resetForm("form");
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length != 1
      this.multiple = !selection.length
    },
    handleFamilyTypeChange(value) {
      if (value) {
        this.familyList = this.allFamilyList.filter(f => f.type === value);
      } else {
        this.familyList = this.allFamilyList;
      }
      this.form.familyCode = undefined;
      this.form.familyName = undefined;
      this.form.familyCodeSearch = undefined;
    },
    handleFamilyCodeSearch(value) {
      if (value) {
        const matchedFamily = this.allFamilyList.find(f => 
          f.code.toLowerCase() === value.toLowerCase()
        );
        if (matchedFamily) {
          this.form.familyCode = matchedFamily.code;
          this.form.familyType = matchedFamily.type;
          this.handleFamilyChange(matchedFamily.code);
        }
      }
    },
    handleFamilyChange(value) {
      if (value) {
        const family = this.allFamilyList.find(f => f.code === value);
        if (family) {
          this.form.familyName = family.name;
          this.form.familyType = family.type;
          this.form.featureType = family.type;
        }
        listAllFeatureCode(value).then(response => {
          this.featureList = response.data;
          if (!this.form.id) {
            this.form.featureCode = [];
            this.form.featureName = [];
          }
        });
      } else {
        this.featureList = [];
        this.form.featureCode = [];
        this.form.featureName = [];
      }
    },
    handleFeatureCodeChange(values) {
      this.form.featureName = values.map(code => {
        const feature = this.featureList.find(f => f.code === code);
        return feature ? feature.name : '';
      });
    },
    handleRemoveFeatureCode(code) {
      const index = this.form.featureCode.indexOf(code);
      if (index > -1) {
        this.form.featureCode.splice(index, 1);
        this.form.featureName.splice(index, 1);
      }
    },
    getFeatureNameByCode(code) {
      const feature = this.featureList.find(f => f.code === code);
      return feature ? feature.name + ' (' + code + ')' : code;
    },
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加生产配置特征值";
    },
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getBuildConfigFeatureCode(this.buildConfigCode, id).then(response => {
        this.form = response.data;
        this.form.familyCodeSearch = response.data.familyCode;
        if (response.data.familyType) {
          this.familyList = this.allFamilyList.filter(f => f.type === response.data.familyType);
        }
        listAllFeatureCode(this.form.familyCode).then(response => {
          this.featureList = response.data;
        });
        this.open = true;
        this.title = "修改生产配置特征值";
      });
    },
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateBuildConfigFeatureCode(this.buildConfigCode, this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addBuildConfigFeatureCode(this.buildConfigCode, this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除生产配置特征值ID为"' + ids + '"的数据项？').then(() => {
        return delBuildConfigFeatureCode(this.buildConfigCode, ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    handleBack() {
      this.$router.push({
        path: "/completeVehicle/product/buildConfig"
      });
    }
  }
};
</script>