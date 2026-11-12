<template>
  <div class="app-container">
    <!-- 查询条件 -->
    <el-form v-show="showSearch" ref="queryForm" :model="queryParams" size="small" :inline="true">
      <el-form-item label="调用方服务" prop="serviceName">
        <el-input
          v-model="queryParams.serviceName"
          placeholder="精确匹配，如 edd-oss"
          clearable
          style="width: 190px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="默认待上传+已上传" clearable style="width: 180px">
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="图片类型" prop="contentType">
        <el-select v-model="queryParams.contentType" placeholder="实际/声明 MIME" clearable style="width: 180px">
          <el-option
            v-for="item in contentTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="原始文件名" prop="originalFilename">
        <el-input
          v-model="queryParams.originalFilename"
          placeholder="前缀匹配"
          clearable
          style="width: 180px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="对象键" prop="objectKey">
        <el-input
          v-model="queryParams.objectKey"
          placeholder="精确匹配"
          clearable
          style="width: 220px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="上传时间">
        <el-date-picker
          v-model="dateRange"
          style="width: 240px"
          value-format="timestamp"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
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
          v-hasPermi="['oss:image:upload']"
          type="primary"
          plain
          icon="el-icon-upload2"
          size="mini"
          @click="handleUploadOpen"
        >上传素材</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-refresh"
          size="mini"
          :loading="loading"
          @click="getList"
        >刷新</el-button>
      </el-col>
      <right-toolbar :show-search.sync="showSearch" @queryTable="getList" />
    </el-row>

    <el-alert
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 12px"
      title="默认展示「待上传 + 已上传」记录，显式筛选状态为「已删除」可查询历史记录；业务图片与后台上传（edd-oss）素材混合展示。仅已上传对象可预览、编辑、替换与删除，替换成功后对象标识与公开 URL 保持不变。"
    />

    <el-table v-loading="loading" :data="imageList">
      <el-table-column label="素材名称" min-width="150" show-overflow-tooltip>
        <template slot-scope="scope">
          {{ scope.row.assetName || scope.row.originalFilename || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="原始文件名" prop="originalFilename" min-width="170" show-overflow-tooltip />
      <el-table-column label="状态" width="110" align="center">
        <template slot-scope="scope">
          <el-tag :type="imageStatusTagType(scope.row.status)" size="mini">{{ imageStatusLabel(scope.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="调用方服务" min-width="140" show-overflow-tooltip>
        <template slot-scope="scope">
          {{ serviceNameLabel(scope.row.serviceName) }}
        </template>
      </el-table-column>
      <el-table-column label="图片类型" width="110" align="center">
        <template slot-scope="scope">
          {{ imageContentTypeLabel(scope.row.actualContentType || scope.row.declaredContentType) }}
        </template>
      </el-table-column>
      <el-table-column label="大小" width="100" align="center">
        <template slot-scope="scope">
          {{ formatFileSize(scope.row.actualSize != null ? scope.row.actualSize : scope.row.declaredSize) }}
        </template>
      </el-table-column>
      <el-table-column label="对象键" prop="objectKey" min-width="260" show-overflow-tooltip />
      <el-table-column label="上传时间" width="160" align="center">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.uploadTime) || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="公开访问 URL" min-width="220" show-overflow-tooltip>
        <template slot-scope="scope">
          <template v-if="scope.row.status === 'UPLOADED' && scope.row.accessUrl">
            <span>{{ scope.row.accessUrl }}</span>
          </template>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" fixed="right" width="330" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            v-hasPermi="['oss:image:query']"
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="handleDetail(scope.row)"
          >详情</el-button>
          <el-button
            v-hasPermi="['oss:image:preview']"
            size="mini"
            type="text"
            icon="el-icon-picture-outline"
            :disabled="scope.row.status !== 'UPLOADED'"
            @click="handlePreview(scope.row)"
          >预览</el-button>
          <el-button
            v-hasPermi="['oss:image:query']"
            size="mini"
            type="text"
            icon="el-icon-document-copy"
            :disabled="scope.row.status !== 'UPLOADED' || !scope.row.accessUrl"
            @click="copyText(scope.row.accessUrl)"
          >复制 URL</el-button>
          <el-button
            v-if="isDefaultAsset(scope.row)"
            v-hasPermi="['oss:image:edit']"
            size="mini"
            type="text"
            icon="el-icon-edit"
            :disabled="scope.row.status !== 'UPLOADED'"
            @click="handleEditOpen(scope.row)"
          >编辑</el-button>
          <el-button
            v-if="isDefaultAsset(scope.row)"
            v-hasPermi="['oss:image:replace']"
            size="mini"
            type="text"
            icon="el-icon-refresh-left"
            :disabled="scope.row.status !== 'UPLOADED'"
            @click="handleReplaceOpen(scope.row)"
          >替换</el-button>
          <el-button
            v-hasPermi="['oss:image:remove']"
            size="mini"
            type="text"
            icon="el-icon-delete"
            :disabled="scope.row.status === 'DELETED'"
            @click="handleDelete(scope.row)"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 上传默认素材 -->
    <el-dialog title="上传默认素材" :visible.sync="uploadOpen" width="620px" append-to-body :close-on-click-modal="false">
      <el-form ref="uploadForm" :model="uploadForm" :rules="assetRules" label-width="90px">
        <el-form-item label="素材名称" prop="assetName">
          <el-input v-model="uploadForm.assetName" maxlength="100" show-word-limit placeholder="1～100 个字符" />
        </el-form-item>
        <el-form-item label="备注" prop="description">
          <el-input
            v-model="uploadForm.description"
            type="textarea"
            :rows="2"
            maxlength="255"
            show-word-limit
            placeholder="选填，最长 255 个字符"
          />
        </el-form-item>
        <el-form-item label="图片文件" required>
          <el-upload
            ref="uploadFile"
            action="#"
            :auto-upload="false"
            :limit="1"
            :file-list="uploadFileList"
            accept=".jpg,.jpeg,.png,.webp"
            :on-change="handleUploadFileChange"
            :on-remove="handleUploadFileRemove"
            :on-exceed="handleFileExceed"
          >
            <el-button size="small" icon="el-icon-folder-opened">选择图片</el-button>
            <div slot="tip" class="upload-tip">仅支持单张 JPEG / PNG / WebP，最大 10 MiB；浏览器将直传 COS，不携带后台凭证。</div>
          </el-upload>
        </el-form-item>
        <el-form-item v-if="uploadResultUrl" label="公开 URL">
          <el-input :value="uploadResultUrl" readonly>
            <el-button slot="append" icon="el-icon-document-copy" @click="copyText(uploadResultUrl)">复制</el-button>
          </el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="uploadOpen = false">取 消</el-button>
        <el-button type="primary" :loading="uploading" :disabled="!!uploadResultUrl" @click="submitUpload">上 传</el-button>
      </div>
    </el-dialog>

    <!-- 编辑默认素材 -->
    <el-dialog title="编辑素材信息" :visible.sync="editOpen" width="520px" append-to-body>
      <el-form ref="editForm" :model="editForm" :rules="assetRules" label-width="90px">
        <el-form-item label="素材名称" prop="assetName">
          <el-input v-model="editForm.assetName" maxlength="100" show-word-limit placeholder="1～100 个字符" />
        </el-form-item>
        <el-form-item label="备注" prop="description">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="2"
            maxlength="255"
            show-word-limit
            placeholder="选填，最长 255 个字符"
          />
        </el-form-item>
        <el-alert
          type="warning"
          :closable="false"
          show-icon
          title="编辑仅修改素材名称与备注，不改变对象键、图片内容或公开访问 URL。"
        />
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="editOpen = false">取 消</el-button>
        <el-button type="primary" :loading="editing" @click="submitEdit">保 存</el-button>
      </div>
    </el-dialog>

    <!-- 替换默认素材图片 -->
    <el-dialog title="替换素材图片" :visible.sync="replaceOpen" width="640px" append-to-body :close-on-click-modal="false">
      <el-descriptions :column="1" border size="small" style="margin-bottom: 12px;">
        <el-descriptions-item label="当前图片">
          <el-image
            v-if="replaceTarget.accessUrl"
            :src="replaceTarget.accessUrl"
            :preview-src-list="[replaceTarget.accessUrl]"
            fit="contain"
            style="max-height: 120px;"
          />
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="素材名称">
          {{ replaceTarget.assetName || replaceTarget.originalFilename || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="对象标识">{{ replaceTarget.objectId }}</el-descriptions-item>
        <el-descriptions-item label="稳定 URL">
          <template v-if="replaceTarget.accessUrl">
            <span>{{ replaceTarget.accessUrl }}</span>
            <el-button size="mini" type="text" icon="el-icon-document-copy" @click="copyText(replaceTarget.accessUrl)">复制</el-button>
          </template>
          <span v-else>-</span>
        </el-descriptions-item>
      </el-descriptions>
      <el-upload
        ref="replaceFile"
        action="#"
        :auto-upload="false"
        :limit="1"
        :file-list="replaceFileList"
        accept=".jpg,.jpeg,.png,.webp"
        :on-change="handleReplaceFileChange"
        :on-remove="handleReplaceFileRemove"
        :on-exceed="handleFileExceed"
      >
        <el-button size="small" icon="el-icon-folder-opened">选择新图片</el-button>
        <div slot="tip" class="upload-tip">
          仅支持与原图片相同的格式（{{ imageContentTypeLabel(replaceTarget.actualContentType || replaceTarget.declaredContentType) }}），最大 10 MiB；替换成功后对象标识与公开 URL 不变。
        </div>
      </el-upload>
      <div slot="footer" class="dialog-footer">
        <el-button @click="replaceOpen = false">取 消</el-button>
        <el-button type="primary" :loading="replacing" @click="submitReplace">开始替换</el-button>
      </div>
    </el-dialog>

    <!-- 图片对象详情 -->
    <el-dialog title="图片对象详情" :visible.sync="openDetail" width="900px" append-to-body>
      <div v-loading="loadingDetail" style="max-height: 60vh; overflow-y: auto;">
        <el-descriptions title="上传任务" :column="2" border size="small">
          <el-descriptions-item label="对象标识">{{ detail.objectId }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="imageStatusTagType(detail.status)" size="mini">{{ imageStatusLabel(detail.status) }}</el-tag>
            <el-tag v-if="isPendingExpired(detail)" type="danger" size="mini" style="margin-left: 4px">已过期</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="素材名称">{{ detail.assetName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ detail.description || '-' }}</el-descriptions-item>
          <el-descriptions-item label="调用方服务">{{ serviceNameLabel(detail.serviceName) }}</el-descriptions-item>
          <el-descriptions-item label="原始文件名">{{ detail.originalFilename }}</el-descriptions-item>
        </el-descriptions>

        <div style="margin: 16px 0 8px; font-weight: bold;">存储信息</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="存储提供方">{{ storageProviderLabel(detail.provider) }}</el-descriptions-item>
          <el-descriptions-item label="地域">{{ detail.region }}</el-descriptions-item>
          <el-descriptions-item label="存储桶">{{ detail.bucketName }}</el-descriptions-item>
          <el-descriptions-item label="访问权限">{{ accessPermissionLabel(detail.permission) }}</el-descriptions-item>
          <el-descriptions-item label="对象键" :span="2">{{ detail.objectKey }}</el-descriptions-item>
          <el-descriptions-item label="访问地址" :span="2">
            <template v-if="detail.accessUrl">
              <el-link :href="detail.accessUrl" type="primary" target="_blank" rel="noopener noreferrer">{{ detail.accessUrl }}</el-link>
              <el-button size="mini" type="text" icon="el-icon-document-copy" @click="copyText(detail.accessUrl)">复制</el-button>
            </template>
            <span v-else>-</span>
          </el-descriptions-item>
        </el-descriptions>

        <div style="margin: 16px 0 8px; font-weight: bold;">声明与核验信息</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="声明类型">{{ imageContentTypeLabel(detail.declaredContentType) }}</el-descriptions-item>
          <el-descriptions-item label="声明大小">{{ formatFileSize(detail.declaredSize) }}</el-descriptions-item>
          <el-descriptions-item label="实际类型">{{ imageContentTypeLabel(detail.actualContentType) }}</el-descriptions-item>
          <el-descriptions-item label="实际大小">{{ formatFileSize(detail.actualSize) }}</el-descriptions-item>
          <el-descriptions-item label="ETag" :span="2">{{ detail.etag || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div style="margin: 16px 0 8px; font-weight: bold;">时间与审计</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="凭证过期时间">{{ parseTime(detail.expireTime) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="上传完成时间">{{ parseTime(detail.uploadTime) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="删除时间">{{ parseTime(detail.deleteTime) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="删除人">{{ detail.deleteBy || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建方">{{ detail.createBy || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ parseTime(detail.createTime) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="修改方">{{ detail.modifyBy || '-' }}</el-descriptions-item>
          <el-descriptions-item label="修改时间">{{ parseTime(detail.modifyTime) || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="openDetail = false">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- 图片预览 -->
    <el-dialog title="图片预览" :visible.sync="openPreview" width="760px" append-to-body>
      <div v-loading="loadingPreview" style="text-align: center; min-height: 120px;">
        <el-image
          v-if="preview.previewUrl"
          :src="preview.previewUrl"
          :preview-src-list="[preview.previewUrl]"
          fit="contain"
          style="max-height: 60vh;"
        >
          <div slot="error" class="image-slot">
            <i class="el-icon-picture-outline" style="font-size: 24px; color: #c0c4cc" />
            <p style="color: #909399; margin: 8px 0 0;">图片加载失败或已被删除</p>
          </div>
        </el-image>
        <el-empty v-else description="当前状态不可预览" :image-size="80" />
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="openPreview = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  listImageObject,
  getImageObject,
  previewImageObject,
  delImageObject,
  generateDefaultAsset,
  completeDefaultAsset,
  updateImageAsset,
  generateImageReplacement,
  completeImageReplacement
} from '@/api/edd/oss/image'
import {
  IMAGE_STATUS_OPTIONS,
  IMAGE_CONTENT_TYPE_OPTIONS,
  imageStatusLabel,
  imageStatusTagType,
  imageContentTypeLabel,
  storageProviderLabel,
  accessPermissionLabel,
  formatFileSize
} from '@/views/edd/oss/oss-options'

// 默认素材归属服务名（EDD-OSS-DSN-CR-002 §5.4）
const DEFAULT_ASSET_SERVICE = 'edd-oss'
// 单张图片最大字节数（10 MiB）
const MAX_FILE_SIZE = 10 * 1024 * 1024
// 允许的扩展名与 MIME 映射（与后端 ImageMimeType 白名单一致）
const ALLOWED_EXTENSIONS = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp']
}

export default {
  name: 'OssImage',
  data() {
    return {
      // 状态选项（后端缺省为 PENDING + UPLOADED）
      statusOptions: IMAGE_STATUS_OPTIONS,
      // 图片 MIME 白名单
      contentTypeOptions: IMAGE_CONTENT_TYPE_OPTIONS,
      // 遮罩层
      loading: false,
      // 详情遮罩层
      loadingDetail: false,
      // 预览遮罩层
      loadingPreview: false,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 图片对象列表
      imageList: [],
      // 详情数据
      detail: {},
      // 预览数据
      preview: {},
      // 上传时间范围（epoch 毫秒，value-format=timestamp）
      dateRange: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        serviceName: undefined,
        status: undefined,
        contentType: undefined,
        objectKey: undefined,
        originalFilename: undefined
      },
      // 上传素材
      uploadOpen: false,
      uploading: false,
      uploadForm: {
        assetName: undefined,
        description: undefined
      },
      uploadFile: null,
      uploadFileList: [],
      uploadResultUrl: null,
      // 进行中的上传任务：失败后复用同一 objectId/预签名地址重试，避免产生多余 PENDING 记录
      uploadTask: null,
      // 编辑素材
      editOpen: false,
      editing: false,
      editForm: {
        objectId: undefined,
        assetName: undefined,
        description: undefined
      },
      // 替换素材
      replaceOpen: false,
      replacing: false,
      replaceTarget: {},
      replaceFile: null,
      replaceFileList: [],
      // 进行中的替换任务：失败后使用同一 replacementId 重试
      replaceTask: null,
      // 素材名称与备注校验规则（前端校验不能替代后端校验）
      assetRules: {
        assetName: [
          { required: true, message: '素材名称不能为空', trigger: 'blur' },
          { max: 100, message: '素材名称不能超过 100 个字符', trigger: 'blur' }
        ],
        description: [
          { max: 255, message: '备注不能超过 255 个字符', trigger: 'blur' }
        ]
      },
      // 对话框显示控制
      openDetail: false,
      openPreview: false
    }
  },
  created() {
    this.getList()
  },
  methods: {
    imageStatusLabel,
    imageStatusTagType,
    imageContentTypeLabel,
    storageProviderLabel,
    accessPermissionLabel,
    formatFileSize,
    /** 查询图片对象列表 */
    getList() {
      this.loading = true
      listImageObject(this.buildQueryParams()).then(response => {
        const data = response.data || {}
        this.imageList = Array.isArray(data.items) ? data.items : []
        this.total = data.total || 0
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    /** 组装查询参数：日期范围转换为后端要求的 epoch 毫秒上下界 */
    buildQueryParams() {
      const params = Object.assign({}, this.queryParams)
      if (Array.isArray(this.dateRange) && this.dateRange.length === 2 && this.dateRange[0] && this.dateRange[1]) {
        params.uploadBeginTime = Number(this.dateRange[0])
        // 结束日期按当日 23:59:59.999 处理
        params.uploadEndTime = Number(this.dateRange[1]) + 24 * 60 * 60 * 1000 - 1
      }
      return params
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.dateRange = []
      this.resetForm('queryForm')
      this.handleQuery()
    },
    /** 调用方服务展示：统一按后端落库值小写展示（含后台上传的 edd-oss） */
    serviceNameLabel(serviceName) {
      return serviceName || '-'
    },
    /** 是否后台上传的默认素材 */
    isDefaultAsset(row) {
      return !!row && row.serviceName === DEFAULT_ASSET_SERVICE
    },
    /** 待上传任务是否已过期（过期不产生 EXPIRED 状态，仅由时间体现） */
    isPendingExpired(row) {
      if (!row || row.status !== 'PENDING' || !row.expireTime) return false
      return Number(row.expireTime) < Date.now()
    },
    /** 详情按钮操作 */
    handleDetail(row) {
      this.openDetail = true
      this.loadingDetail = true
      this.detail = {}
      getImageObject(row.objectId).then(response => {
        this.detail = response.data || {}
        this.loadingDetail = false
      }).catch(() => {
        this.loadingDetail = false
        this.openDetail = false
      })
    },
    /** 预览按钮操作 */
    handlePreview(row) {
      this.openPreview = true
      this.loadingPreview = true
      this.preview = {}
      previewImageObject(row.objectId).then(response => {
        this.preview = response.data || {}
        this.loadingPreview = false
        if (!this.preview.previewable) {
          this.$modal.msgWarning('当前状态不可预览（仅已上传对象提供预览地址）')
        }
      }).catch(() => {
        this.loadingPreview = false
        this.openPreview = false
      })
    },
    /** 上传素材对话框 */
    handleUploadOpen() {
      this.uploadForm = { assetName: undefined, description: undefined }
      this.uploadFile = null
      this.uploadFileList = []
      this.uploadResultUrl = null
      this.uploadTask = null
      this.uploadOpen = true
      this.$nextTick(() => {
        if (this.$refs.uploadForm) this.$refs.uploadForm.clearValidate()
        if (this.$refs.uploadFile) this.$refs.uploadFile.clearFiles()
      })
    },
    /** 选择上传文件（单张，格式与大小前置校验） */
    handleUploadFileChange(file, fileList) {
      const validated = this.validateSelectedFile(file.raw)
      if (!validated) {
        this.uploadFile = null
        this.uploadFileList = []
        this.$refs.uploadFile.clearFiles()
        return
      }
      this.uploadFile = file.raw
      this.uploadFileList = fileList.slice(-1)
    },
    handleUploadFileRemove() {
      this.uploadFile = null
      this.uploadFileList = []
    },
    handleFileExceed() {
      this.$modal.msgWarning('仅支持单张图片，请先移除已选文件')
    },
    /** 前端文件校验：单张、格式、大小；后端与 COS HEAD 仍会再次校验 */
    validateSelectedFile(file) {
      if (!file) {
        this.$modal.msgError('请选择图片文件')
        return false
      }
      const meta = this.resolveContentType(file)
      if (!meta) {
        this.$modal.msgError('仅支持 JPEG / PNG / WebP 图片')
        return false
      }
      if (file.size > MAX_FILE_SIZE) {
        this.$modal.msgError('图片大小不能超过 10 MiB')
        return false
      }
      return true
    },
    /** 解析并校验文件 MIME 与扩展名一致性 */
    resolveContentType(file) {
      const name = file.name || ''
      const ext = (name.indexOf('.') >= 0 ? name.split('.').pop() : '').toLowerCase()
      let contentType = (file.type || '').toLowerCase()
      if (!ALLOWED_EXTENSIONS[contentType]) {
        contentType = Object.keys(ALLOWED_EXTENSIONS).find(mime => ALLOWED_EXTENSIONS[mime].indexOf(ext) >= 0)
      }
      if (!contentType) return null
      if (ALLOWED_EXTENSIONS[contentType].indexOf(ext) < 0) return null
      return contentType
    },
    /** 提交默认素材上传：申请 → 浏览器直传 COS → 完成确认 */
    submitUpload() {
      if (this.uploading || this.uploadResultUrl) return
      this.$refs.uploadForm.validate(valid => {
        if (!valid) return
        if (!this.validateSelectedFile(this.uploadFile)) return
        const file = this.uploadFile
        const contentType = this.resolveContentType(file)
        this.uploading = true
        let stage = '申请上传'
        const prepare = this.uploadTask && this.uploadTask.file === file
          ? Promise.resolve(this.uploadTask)
          : generateDefaultAsset({
            assetName: this.uploadForm.assetName,
            description: this.uploadForm.description,
            originalFilename: file.name,
            contentType: contentType,
            size: file.size
          }).then(response => {
            const data = response.data || {}
            const task = {
              objectId: data.objectId,
              uploadUrl: data.uploadUrl,
              contentType: data.contentType || contentType,
              uploaded: false,
              file: file
            }
            this.uploadTask = task
            return task
          })
        prepare.then(task => {
          if (!task.uploaded) {
            stage = '图片直传 COS'
          }
          const upload = task.uploaded
            ? Promise.resolve()
            : this.putObjectToCos(task.uploadUrl, file, task.contentType).then(() => {
              task.uploaded = true
            })
          return upload.then(() => {
            stage = '完成确认'
            return completeDefaultAsset(task.objectId)
          })
        }).then(response => {
          const data = response.data || {}
          this.uploadResultUrl = data.accessUrl || null
          this.uploading = false
          this.uploadTask = null
          this.uploadFile = null
          this.uploadFileList = []
          if (this.$refs.uploadFile) this.$refs.uploadFile.clearFiles()
          this.$modal.msgSuccess('素材上传成功')
          this.getList()
        }).catch(error => {
          // 申请、直传或完成确认失败：不伪造成功状态，保留任务与文件允许重试
          this.uploading = false
          this.notifyStageFailure(stage, error)
        })
      })
    },
    /**
     * 分阶段提示失败原因：浏览器直传 COS 使用 fetch，不经平台 axios 拦截器，
     * 必须在此显式提示，否则用户只会看到无响应。
     */
    notifyStageFailure(stage, error) {
      console.error('[OSS] ' + stage + ' 失败', error)
      if (stage === '图片直传 COS') {
        const detail = error && error.message ? error.message : '未知错误'
        this.$modal.msgError('图片直传 COS 失败（' + detail + '）。请用浏览器开发者工具 Network 查看 OPTIONS/PUT 请求：多为 Bucket CORS 未允许当前站点执行 PUT 或未允许 Content-Type 请求头，也可能是预签名地址已过期或图片超出限制。')
        return
      }
      // 申请与完成确认走平台 axios 拦截器，HTTP 错误已由拦截器提示，避免重复弹框
      if (!(error && error.response)) {
        this.$modal.msgError(stage + '失败：' + (error && error.message ? error.message : '网络或未知错误'))
      }
    },
    /** 浏览器直传 COS：独立 fetch，仅携带 Content-Type，不携带后台凭证或 Cookie */
    putObjectToCos(uploadUrl, file, contentType) {
      return fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: file,
        credentials: 'omit'
      }).then(response => {
        if (!response.ok) {
          throw new Error('COS 返回 HTTP ' + response.status)
        }
        return response
      })
    },
    /** 编辑素材对话框 */
    handleEditOpen(row) {
      this.editForm = {
        objectId: row.objectId,
        assetName: row.assetName,
        description: row.description
      }
      this.editOpen = true
      this.$nextTick(() => {
        if (this.$refs.editForm) this.$refs.editForm.clearValidate()
      })
    },
    /** 保存素材名称与备注 */
    submitEdit() {
      if (this.editing) return
      this.$refs.editForm.validate(valid => {
        if (!valid) return
        this.editing = true
        updateImageAsset(this.editForm.objectId, {
          assetName: this.editForm.assetName,
          description: this.editForm.description
        }).then(() => {
          this.$modal.msgSuccess('保存成功')
          this.editing = false
          this.editOpen = false
          this.getList()
        }).catch(() => {
          this.editing = false
        })
      })
    },
    /** 替换素材对话框 */
    handleReplaceOpen(row) {
      this.replaceTarget = Object.assign({}, row)
      this.replaceFile = null
      this.replaceFileList = []
      this.replaceTask = null
      this.replaceOpen = true
      this.$nextTick(() => {
        if (this.$refs.replaceFile) this.$refs.replaceFile.clearFiles()
      })
    },
    handleReplaceFileChange(file, fileList) {
      const validated = this.validateSelectedFile(file.raw)
      if (!validated) {
        this.replaceFile = null
        this.replaceFileList = []
        this.$refs.replaceFile.clearFiles()
        return
      }
      this.replaceFile = file.raw
      this.replaceFileList = fileList.slice(-1)
    },
    handleReplaceFileRemove() {
      this.replaceFile = null
      this.replaceFileList = []
    },
    /** 提交替换：申请替换任务 → 直传临时对象 → 完成替换；失败后复用同一 replacementId 重试 */
    submitReplace() {
      if (this.replacing) return
      if (!this.validateSelectedFile(this.replaceFile)) return
      const file = this.replaceFile
      const contentType = this.resolveContentType(file)
      const target = this.replaceTarget
      this.replacing = true
      let stage = '申请替换任务'
      let task = this.replaceTask
      const prepare = task && task.objectId === target.objectId && task.file === file
        ? Promise.resolve(task)
        : generateImageReplacement(target.objectId, {
          originalFilename: file.name,
          contentType: contentType,
          size: file.size
        }).then(response => {
          const data = response.data || {}
          task = {
            objectId: data.objectId || target.objectId,
            replacementId: data.replacementId,
            uploadUrl: data.uploadUrl,
            contentType: data.contentType || contentType,
            uploaded: false,
            file: file
          }
          this.replaceTask = task
          return task
        })
      prepare.then(current => {
        if (!current.uploaded) {
          stage = '图片直传 COS'
        }
        const upload = current.uploaded
          ? Promise.resolve()
          : this.putObjectToCos(current.uploadUrl, file, current.contentType).then(() => {
            current.uploaded = true
          })
        return upload.then(() => {
          stage = '完成替换'
          return completeImageReplacement(current.objectId, current.replacementId)
        })
      }).then(() => {
        this.$modal.msgSuccess('替换成功，公开 URL 保持不变')
        this.replacing = false
        this.replaceOpen = false
        this.replaceTask = null
        this.getList()
      }).catch(error => {
        // 失败时保留任务与文件，允许使用同一 replacementId 重试
        this.replacing = false
        this.notifyStageFailure(stage, error)
      })
    },
    /** 删除按钮操作：UPLOADED 删除 COS 对象；PENDING 清理未完成确认的记录（BUGFIX-001） */
    handleDelete(row) {
      const label = row.assetName || row.originalFilename
      const message = row.status === 'PENDING'
        ? '确认清理「' + label + '」？该记录尚未完成上传，将尝试删除 COS 对象并把记录置为已删除且不可恢复；之后可重新上传。'
        : '确认删除素材「' + label + '」？该操作将先删除 COS 对象，再把记录置为已删除且不可恢复；替换进行中的素材不允许删除。'
      this.$modal.confirm(message)
        .then(() => {
          return delImageObject(row.objectId)
        })
        .then(() => {
          this.$modal.msgSuccess('删除成功')
          this.getList()
        })
        .catch(() => {})
    },
    /** 复制文本到剪贴板 */
    copyText(text) {
      if (!text) return
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          this.$modal.msgSuccess('复制成功')
        }).catch(() => {
          this.$modal.msgError('复制失败')
        })
      } else {
        const input = document.createElement('textarea')
        input.value = text
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
        this.$modal.msgSuccess('复制成功')
      }
    }
  }
}
</script>

<style scoped>
.upload-tip {
  color: #909399;
  font-size: 12px;
  line-height: 1.6;
  margin-top: 4px;
}
</style>
